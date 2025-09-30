/**
 * Order Batch Manager - Handles large order quantities by splitting into manageable chunks
 * Addresses 422 Unprocessable Entity errors for large order payloads (>120 items)
 */

import { CreateOrderRequest, Order } from '@/types';
import { modernApiClient } from './modernApiClient';
import { API_ENDPOINTS } from './constants';

interface BatchConfig {
  maxTotalQuantityPerBatch: number;
}

interface BatchResult {
  success: boolean;
  orders: Order[];
  errors: Array<{ batch: number; error: string }>;
  totalQuantity: number;
  totalAmount: number;
}

export class OrderBatchManager {
  private static defaultConfig: BatchConfig = {
    maxTotalQuantityPerBatch: 120, // Max 120 total units per batch (backend limit)
  };

  /**
   * Determines if an order needs to be split into batches
   */
  static needsBatching(orderRequest: CreateOrderRequest, config?: Partial<BatchConfig>): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    const totalQuantity = orderRequest.items.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity > finalConfig.maxTotalQuantityPerBatch;
  }

  /**
   * Splits order items into manageable batches based on total quantity
   * Ensures each individual item also fits within limits
   */
  static createBatches(orderRequest: CreateOrderRequest, config?: Partial<BatchConfig>): CreateOrderRequest[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const batches: CreateOrderRequest[] = [];
    
    // First, handle items that individually exceed the batch limit
    const processedItems: typeof orderRequest.items = [];
    
    for (const item of orderRequest.items) {
      if (item.quantity <= finalConfig.maxTotalQuantityPerBatch) {
        // Item fits within batch limit
        processedItems.push(item);
      } else {
        // Split large individual items into smaller chunks
        const chunks = Math.ceil(item.quantity / finalConfig.maxTotalQuantityPerBatch);
        const baseQuantity = Math.floor(item.quantity / chunks);
        const remainder = item.quantity % chunks;
        
        for (let i = 0; i < chunks; i++) {
          const chunkQuantity = i < remainder ? baseQuantity + 1 : baseQuantity;
          processedItems.push({
            ...item,
            quantity: chunkQuantity,
          });
        }
      }
    }
    
    // Now group processed items into batches
    let currentBatch: typeof orderRequest.items = [];
    let currentBatchQuantity = 0;

    for (const item of processedItems) {
      // If adding this item would exceed the batch limit
      if (currentBatchQuantity + item.quantity > finalConfig.maxTotalQuantityPerBatch && currentBatch.length > 0) {
        // Create a batch from current items
        batches.push({
          ...orderRequest,
          items: [...currentBatch],
          notes: `${orderRequest.notes || ''} (Batch ${batches.length + 1})`.trim(),
        });
        
        // Start new batch
        currentBatch = [item];
        currentBatchQuantity = item.quantity;
      } else {
        // Add to current batch
        currentBatch.push(item);
        currentBatchQuantity += item.quantity;
      }
    }

    // Add final batch if there are remaining items
    if (currentBatch.length > 0) {
      batches.push({
        ...orderRequest,
        items: currentBatch,
        notes: `${orderRequest.notes || ''} (Batch ${batches.length + 1})`.trim(),
      });
    }

    return batches;
  }

  /**
   * Processes order with automatic batching if needed
   */
  static async processOrder(
    orderRequest: CreateOrderRequest,
    config?: Partial<BatchConfig>,
    onProgress?: (current: number, total: number, batch: CreateOrderRequest) => void
  ): Promise<BatchResult> {
    const finalConfig = this.validateBatchConfig(config || {});
    
    const result: BatchResult = {
      success: true,
      orders: [],
      errors: [],
      totalQuantity: orderRequest.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: orderRequest.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
    };

    try {
      // Check if batching is needed
      if (!this.needsBatching(orderRequest, finalConfig)) {
        // Single order - no batching needed
        console.log('Processing single order:', orderRequest);
        
        if (onProgress) {
          onProgress(1, 1, orderRequest);
        }

        const order = await this.createSingleOrder(orderRequest);
        result.orders.push(order);
        return result;
      }

      // Multiple batches needed
      const batches = this.createBatches(orderRequest, finalConfig);
      console.log(`Order requires ${batches.length} batches:`, batches);

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        if (onProgress) {
          onProgress(i + 1, batches.length, batch);
        }

        try {
          const order = await this.createSingleOrder(batch);
          result.orders.push(order);
          
          // Add delay between batches to avoid overwhelming the server
          // Longer delay for more batches
          const delay = batches.length > 5 ? 2000 : 1000;
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          console.error(`Error processing batch ${i + 1}:`, error);
          result.errors.push({
            batch: i + 1,
            error: error instanceof Error ? error.message : String(error),
          });
          
          // Don't mark as complete failure if some batches succeeded
          if (result.orders.length === 0) {
            result.success = false;
          }
        }
      }

      // Consider it successful if at least one batch succeeded
      result.success = result.orders.length > 0;
      
      return result;
    } catch (error) {
      console.error('Error in order processing:', error);
      result.success = false;
      result.errors.push({
        batch: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      return result;
    }
  }

  /**
   * Creates a single order via API with retry logic
   */
  private static async createSingleOrder(orderRequest: CreateOrderRequest, retries = 3): Promise<Order> {
    console.log('Creating single order:', orderRequest);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await modernApiClient.post(API_ENDPOINTS.ORDERS, orderRequest);
        console.log('Order API response:', response);
        
        // Handle both envelope and direct response formats
        interface ApiEnvelope<T> { data?: T; items?: T; }
        const env = response as ApiEnvelope<Order> | Order;
        const rawOrder = (env as ApiEnvelope<Order>).data || (env as Order);
        
        // Transform the API response to match our Order interface
        interface ApiOrderResponse {
          id?: number;
          order_id?: string;
          user_id?: number;
          status?: string;
          total_amount?: number;
          notes?: string;
          payment_method?: string;
          items?: unknown[];
          created_at?: string;
          updated_at?: string;
        }
        
        const apiOrder = rawOrder as ApiOrderResponse;
        const transformedOrder: Order = {
          ...apiOrder,
          id: apiOrder.id || parseInt(apiOrder.order_id || '0', 10),
          order_id: apiOrder.order_id,
          user_id: apiOrder.user_id || 0,
          items: apiOrder.items || [],
          created_at: apiOrder.created_at || new Date().toISOString(),
          updated_at: apiOrder.updated_at || apiOrder.created_at || new Date().toISOString(),
        } as Order;

        if (!transformedOrder.id && !transformedOrder.order_id) {
          throw new Error('Invalid order response: missing order ID');
        }

        return transformedOrder;
      } catch (error) {
        console.error(`Order creation attempt ${attempt}/${retries} failed:`, error);
        
        if (attempt === retries) {
          throw error; // Last attempt failed
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  /**
   * Validates that batch configuration is safe
   */
  static validateBatchConfig(config: Partial<BatchConfig>): BatchConfig {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Ensure minimum safety limits
    if (finalConfig.maxTotalQuantityPerBatch > 200) {
      console.warn('Batch size too large, reducing to 200');
      finalConfig.maxTotalQuantityPerBatch = 200;
    }
    
    if (finalConfig.maxTotalQuantityPerBatch < 10) {
      console.warn('Batch size too small, increasing to 10');
      finalConfig.maxTotalQuantityPerBatch = 10;
    }
    
    return finalConfig;
  }
}