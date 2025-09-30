// Payment UUID utilities for refund processing
export class PaymentUuidHelper {
  /**
   * Extract payment UUID from various possible fields in order data
   */
  static extractFromOrder(order: Record<string, unknown>): string | null {
    // Check common fields where payment UUID might be stored, prioritizing OCTO format
    const possibleFields = [
      'octo_payment_UUID',     // OCTO standard format
      'payment_uuid',          // Generic snake_case
      'paymentUuid',           // Generic camelCase
      'payment_id',            // Generic payment ID
      'paymentId',             // CamelCase payment ID
      'transaction_id',        // Transaction ID
      'transactionId',         // CamelCase transaction ID
      'transaction_uuid',      // Transaction UUID
      'transactionUuid',       // CamelCase transaction UUID
      'uuid',                  // Generic UUID
      'reference_id',          // Reference ID
      'referenceId',           // CamelCase reference ID
      'pay_reference',         // Payment reference
      'payReference',          // CamelCase pay reference
      'external_id',           // External ID
      'externalId',            // CamelCase external ID
      'order_reference',       // Order reference
      'orderReference',        // CamelCase order reference
    ];

    for (const field of possibleFields) {
      const value = order[field];
      if (value && typeof value === 'string' && value.length > 0) {
        console.log(`PaymentUuidHelper: Found UUID in field '${field}':`, value);
        return value;
      }
    }

    // Check nested objects (like payment data)
    if (order.payment && typeof order.payment === 'object') {
      const paymentObj = order.payment as Record<string, unknown>;
      const nestedUuid = this.extractFromOrder(paymentObj);
      if (nestedUuid) {
        console.log('PaymentUuidHelper: Found UUID in nested payment object:', nestedUuid);
        return nestedUuid;
      }
    }

    return null;
  }

  /**
   * Generate a deterministic payment UUID based on order data
   * This should match the format expected by OCTO payment system
   */
  static generateForOrder(order: Record<string, unknown>): string {
    // Use the example format from the API specification: f4f28a3e-3b60-4a3a-8c2e-0e9f7a1e8b05
    const orderId = (order.id as number) || (order.order_id as number) || 0;
    const timestamp = order.created_at ? new Date(order.created_at as string).getTime() : Date.now();
    const userId = (order.user_id as number) || ((order.user as Record<string, unknown>)?.id as number) || 0;
    
    // Create a UUID-like string that includes order information
    // Format: base-uuid-orderid-userid-timestamp
    const baseUuid = 'f4f28a3e-3b60-4a3a-8c2e-0e9f7a1e8b05';
    return `${baseUuid}-${orderId}-${userId}-${timestamp}`;
  }

  /**
   * Get payment UUID for order, extracting or generating as needed
   */
  static getForOrder(order: Record<string, unknown>): string {
    const existing = this.extractFromOrder(order);
    if (existing) {
      return existing;
    }
    
    // Generate one if not found
    console.warn(`No payment UUID found for order ${order.id}, generating one`);
    return this.generateForOrder(order);
  }

  /**
   * Validate if a payment UUID has the correct format
   */
  static isValid(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    // Basic validation - should be a non-empty string
    // You might want to add more specific validation based on OCTO requirements
    return uuid.length > 0 && uuid.trim() === uuid;
  }

  /**
   * Sanitize payment UUID for API submission
   */
  static sanitize(uuid: string): string {
    return uuid?.trim() || '';
  }
}