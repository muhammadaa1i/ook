// Alternative refund service with different approaches
import modernApiClient from '@/lib/modernApiClient';

export interface AdminRefundRequest {
  amount: number;
  payment_uuid: string;
}

export interface AdminRefundResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export class AdminRefundServiceV2 {
  /**
   * Try different payload formats that OCTO might expect
   */
  static async processRefundV1(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    // Approach 1: Exact API spec format
    const payload = {
      amount: data.amount,
      payment_uuid: data.payment_uuid
    };
    return this.attemptRefund('/payments/octo/refund', payload, 'V1: Exact spec');
  }

  static async processRefundV2(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    // Approach 2: Snake case with different field names
    const payload = {
      refund_amount: data.amount,
      octo_payment_uuid: data.payment_uuid
    };
    return this.attemptRefund('/payments/octo/refund', payload, 'V2: Snake case');
  }

  static async processRefundV3(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    // Approach 3: Wrapped in data object
    const payload = {
      data: {
        amount: data.amount,
        payment_uuid: data.payment_uuid
      }
    };
    return this.attemptRefund('/payments/octo/refund', payload, 'V3: Wrapped data');
  }

  static async processRefundV4(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    // Approach 4: With additional metadata
    const payload = {
      amount: data.amount,
      payment_uuid: data.payment_uuid,
      action: 'refund',
      type: 'admin_refund'
    };
    return this.attemptRefund('/payments/octo/refund', payload, 'V4: With metadata');
  }

  private static async attemptRefund(
    endpoint: string, 
    payload: unknown, 
    method: string
  ): Promise<AdminRefundResponse> {
    try {
      console.log(`${method} payload:`, payload);
      const response = await modernApiClient.post(endpoint, payload);
      return {
        success: true,
        message: `${method} succeeded`,
        data: response
      };
    } catch (error) {
      console.error(`${method} failed:`, error);
      return {
        success: false,
        message: `${method} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Try all approaches sequentially until one works
   */
  static async processRefundWithFallback(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    const approaches = [
      () => this.processRefundV1(data),
      () => this.processRefundV2(data),
      () => this.processRefundV3(data),
      () => this.processRefundV4(data),
    ];

    for (const approach of approaches) {
      try {
        const result = await approach();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log('Approach failed, trying next:', error);
        continue;
      }
    }

    return {
      success: false,
      message: 'All refund approaches failed'
    };
  }
}