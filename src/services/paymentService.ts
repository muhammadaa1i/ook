"use client";

import { modernApiClient } from "@/lib/modernApiClient" ;

export interface PaymentRequest {
  order_id: string;
  amount: number;
  description: string;
  success_url: string;
  fail_url: string;
  expires_in_minutes?: number;
  card_systems?: string[];
}

export interface PaymentResponse {
  transfer_id: string;
  status: string;
  amount: number;
  order_id: string;
  description: string;
  expires_at: string;
  payment_url?: string;
}

export interface PaymentStatus {
  transfer_id: string;
  status: string;
  amount: number;
  order_id: string;
  description: string;
  expires_at: string;
  cancelled?: boolean;
}

export class PaymentService {
  // Use shared modernApiClient (direct backend) for consistency with auth and other services
  private static readonly ENDPOINTS = {
    create: ['/payments/create', '/payments/create/'],
    status: (id: string) => [`/payments/${id}/status`, `/payments/${id}/status/`],
    cancel: (id: string) => [`/payments/${id}/cancel`, `/payments/${id}/cancel/`],
  } as const;

  private static trackedPayments = new Map<string, {
    transferId: string;
    orderId: string;
    amount: number;
    description: string;
    intervalId?: NodeJS.Timeout;
    startTime: number;
    maxCheckDuration: number; // in milliseconds
  }>();

  static async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      for (const ep of this.ENDPOINTS.create) {
        try {
          const data = (await modernApiClient.post(ep, paymentData)) as PaymentResponse;
          
          // Start tracking this payment
          this.startTrackingPayment(data.transfer_id, {
            orderId: data.order_id,
            amount: data.amount,
            description: data.description,
            expiresAt: data.expires_at,
          });
          
          return data;
        } catch (err) {
          const e = err as { status?: number };
          // Retry only on 404/405/403 which often indicate path/permission nuances
          if (![404, 405, 403].includes(e.status ?? 0)) throw err;
          // otherwise loop to try next variant
        }
      }
      throw new Error('Payment creation failed');
    } catch (error) {
      console.error('Payment creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create payment');
    }
  }

  static async getPaymentStatus(transferId: string): Promise<PaymentStatus> {
    try {
      const { modernApiClient } = await import('@/lib/modernApiClient');
      for (const ep of this.ENDPOINTS.status(transferId)) {
        try {
          const data = (await modernApiClient.get(ep)) as PaymentStatus;
          return data;
        } catch (err) {
          const e = err as { status?: number };
          if (![404, 405].includes(e.status ?? 0)) throw err;
        }
      }
      throw new Error('Payment status check failed');
    } catch (error) {
      console.error('Payment status check error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to check payment status');
    }
  }

  static async cancelPayment(transferId: string): Promise<PaymentStatus> {
    try {
      const { modernApiClient } = await import('@/lib/modernApiClient');
      for (const ep of this.ENDPOINTS.cancel(transferId)) {
        try {
          const data = (await modernApiClient.post(ep)) as PaymentStatus;
          return data;
        } catch (err) {
          const e = err as { status?: number };
          if (![404, 405, 403].includes(e.status ?? 0)) throw err;
        }
      }
      throw new Error('Payment cancellation failed');
    } catch (error) {
      console.error('Payment cancellation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel payment');
    }
  }

  static generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORDER_${timestamp}_${random}`;
  }

  static formatAmount(amount: number): number {
    // Ensure amount is in correct format (typically in cents/kopeks)
    return Math.round(amount * 100) / 100;
  }

  static getReturnUrls() {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    return {
      success_url: `${baseUrl}/payment/success`,
      fail_url: `${baseUrl}/payment/failure`
    };
  }

  /**
   * Start tracking a payment for status updates
   */
  static startTrackingPayment(transferId: string, paymentInfo: {
    orderId: string;
    amount: number;
    description: string;
    expiresAt: string;
  }) {
    // Add to admin panel if available
    if (typeof window !== 'undefined' && (window as any).addPaymentRecord) {
      (window as any).addPaymentRecord(transferId, {
        transfer_id: transferId,
        status: 'pending',
        amount: paymentInfo.amount,
        order_id: paymentInfo.orderId,
        description: paymentInfo.description,
        expires_at: paymentInfo.expiresAt,
      });
    }

    // Setup tracking data
    const trackingData = {
      transferId,
      orderId: paymentInfo.orderId,
      amount: paymentInfo.amount,
      description: paymentInfo.description,
      startTime: Date.now(),
      maxCheckDuration: 30 * 60 * 1000, // 30 minutes
    };

    this.trackedPayments.set(transferId, trackingData);

    // Start periodic status checking
    this.startPeriodicStatusCheck(transferId);
  }

  /**
   * Start periodic status checking for a payment
   */
  private static startPeriodicStatusCheck(transferId: string) {
    const trackingData = this.trackedPayments.get(transferId);
    if (!trackingData) return;

    // Check status every 10 seconds initially, then less frequently
    let checkInterval = 10000; // 10 seconds
    let checkCount = 0;

    const checkStatus = async () => {
      const currentTrackingData = this.trackedPayments.get(transferId);
      if (!currentTrackingData) return;

      // Stop if we've been checking for too long
      if (Date.now() - currentTrackingData.startTime > currentTrackingData.maxCheckDuration) {
        this.stopTrackingPayment(transferId);
        return;
      }

      try {
        const status = await this.getPaymentStatus(transferId);
        
        // Update admin panel if available
        if (typeof window !== 'undefined' && (window as any).updatePaymentRecord) {
          (window as any).updatePaymentRecord(transferId, status);
        }

        // Stop tracking if payment is completed (success, failed, cancelled)
        if (['success', 'failed', 'cancelled'].includes(status.status)) {
          this.stopTrackingPayment(transferId);
          
          // Log the final status
          console.log(`Payment ${transferId} completed with status: ${status.status}`);
          
          return;
        }

        // Adjust check interval based on time elapsed
        checkCount++;
        if (checkCount > 12) { // After 2 minutes, check every 30 seconds
          checkInterval = 30000;
        } else if (checkCount > 6) { // After 1 minute, check every 15 seconds
          checkInterval = 15000;
        }

        // Schedule next check
        const newIntervalId = setTimeout(checkStatus, checkInterval);
        const updatedTrackingData = this.trackedPayments.get(transferId);
        if (updatedTrackingData) {
          updatedTrackingData.intervalId = newIntervalId;
          this.trackedPayments.set(transferId, updatedTrackingData);
        }

      } catch (error) {
        console.error(`Error checking status for payment ${transferId}:`, error);
        
        // Continue checking unless it's a persistent error
        const newIntervalId = setTimeout(checkStatus, checkInterval * 2); // Back off on error
        const currentData = this.trackedPayments.get(transferId);
        if (currentData) {
          currentData.intervalId = newIntervalId;
          this.trackedPayments.set(transferId, currentData);
        }
      }
    };

    // Start the checking process
    const initialIntervalId = setTimeout(checkStatus, checkInterval);
    trackingData.intervalId = initialIntervalId;
    this.trackedPayments.set(transferId, trackingData);
  }

  /**
   * Stop tracking a payment
   */
  static stopTrackingPayment(transferId: string) {
    const trackingData = this.trackedPayments.get(transferId);
    if (trackingData && trackingData.intervalId) {
      clearTimeout(trackingData.intervalId);
    }
    this.trackedPayments.delete(transferId);
  }

  /**
   * Stop all payment tracking (useful for cleanup)
   */
  static stopAllTracking() {
    for (const [transferId] of this.trackedPayments) {
      this.stopTrackingPayment(transferId);
    }
  }

  /**
   * Get currently tracked payments
   */
  static getTrackedPayments() {
    return Array.from(this.trackedPayments.keys());
  }

  /**
   * Check if a payment is being tracked
   */
  static isPaymentTracked(transferId: string): boolean {
    return this.trackedPayments.has(transferId);
  }
}
