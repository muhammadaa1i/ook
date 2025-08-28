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

  static async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      for (const ep of this.ENDPOINTS.create) {
        try {
          const data = (await modernApiClient.post(ep, paymentData)) as PaymentResponse;
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
}
