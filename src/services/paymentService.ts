"use client";

import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";

export interface PaymentRequest {
  amount: number;
  description: string;
  order_id: number; // Backend order ID for auto-confirmation (snake_case as expected by backend)
}

export interface PaymentResponse {
  success: boolean;
  octo_payment_UUID?: string;
  octo_pay_url?: string;
  errMessage?: string;
  // Legacy support
  payment_url?: string;
  pay_url?: string;
}

export interface PaymentRefundRequest {
  octo_payment_UUID: string;
  amount?: number;
  reason?: string;
}

export interface PaymentStatus {
  status: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  octo_payment_UUID?: string;
  order_id: number;
  amount: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}



export class PaymentService {
  // OCTO Payment endpoints - standardized to match API documentation
  private readonly ENDPOINTS = {
    create: API_ENDPOINTS.PAYMENT_CREATE,
    refund: API_ENDPOINTS.PAYMENT_REFUND,
    notify: API_ENDPOINTS.PAYMENT_NOTIFY,
  } as const;

  constructor(private apiClient = modernApiClient) {}

  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Sending payment request:', paymentData);
      const rawData = await this.apiClient.post(this.ENDPOINTS.create, paymentData) as Record<string, unknown>;
      console.log('Raw payment response:', rawData);
      
      // Helper function to safely extract string values
      const getString = (key: string): string | undefined => {
        const value = rawData[key];
        return typeof value === 'string' ? value : undefined;
      };
      
      const getBool = (key: string): boolean => {
        const value = rawData[key];
        return typeof value === 'boolean' ? value : true;
      };
      
      // Check for various success indicators
      const isSuccess = getBool('success') || 
                       rawData['status'] === 'success' ||
                       rawData['success'] === true ||
                       !!getString('octo_pay_url') ||
                       !!getString('payment_url') ||
                       !!getString('pay_url') ||
                       !!getString('url');
      
      // Normalize the response to match OCTO format
      const data: PaymentResponse = {
        success: isSuccess,
        octo_payment_UUID: getString('octo_payment_UUID') || getString('payment_id') || getString('id'),
        octo_pay_url: getString('octo_pay_url') || getString('payment_url') || getString('pay_url') || getString('url') || getString('redirect_url'),
        errMessage: getString('errMessage') || getString('error') || getString('message'),
        // Legacy support
        payment_url: getString('octo_pay_url') || getString('payment_url') || getString('pay_url') || getString('url'),
        pay_url: getString('octo_pay_url') || getString('pay_url') || getString('url'),
      };

      console.log('Normalized payment response:', data);

      if (data.success && (data.octo_pay_url || data.payment_url)) {
        return data;
      }
      
      console.error('Payment response validation failed:', {
        success: data.success,
        hasUrl: !!(data.octo_pay_url || data.payment_url),
        rawResponse: rawData
      });
      
      throw new Error(data.errMessage || `Payment failed: Success=${data.success}, URL=${!!(data.octo_pay_url || data.payment_url)}`);
    } catch (error) {
      console.error('Payment creation error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create payment');
    }
  }

  async refundPayment(refundData: PaymentRefundRequest): Promise<PaymentStatus> {
    try {
      const data = await this.apiClient.post(this.ENDPOINTS.refund, refundData) as PaymentStatus;
      return data;
    } catch (error) {
      console.error('Payment refund error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to refund payment');
    }
  }

  // Utility methods can remain static as they don't need instance state
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

  // Singleton pattern for backward compatibility
  private static instance?: PaymentService;
  
  static getInstance(): PaymentService {
    if (!this.instance) {
      this.instance = new PaymentService();
    }
    return this.instance;
  }

  // Static methods for backward compatibility - delegate to singleton
  static async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    return this.getInstance().createPayment(paymentData);
  }

  static async refundPayment(refundData: PaymentRefundRequest): Promise<PaymentStatus> {
    return this.getInstance().refundPayment(refundData);
  }
}

// Export default instance for easy usage
export const paymentService = new PaymentService();
