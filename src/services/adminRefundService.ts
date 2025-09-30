import modernApiClient from '@/lib/modernApiClient';

export interface AdminRefundRequest {
  order_id: number;
}

export interface AdminRefundResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export class AdminRefundService {
  static async processRefund(data: AdminRefundRequest): Promise<AdminRefundResponse> {
    try {
      console.log('Processing refund for order ID:', data.order_id);
      
      const response = await modernApiClient.post(
        'https://oyoqkiyim.duckdns.org/payments/octo/refund',
        { order_id: data.order_id }
      );

      console.log('Refund API response:', response);
      
      return {
        success: true,
        message: `Refund processed successfully for Order #${data.order_id}`,
        data: response
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Refund processing failed:', errorMsg);
      
      return {
        success: false,
        message: `Failed to process refund for Order #${data.order_id}: ${errorMsg}`
      };
    }
  }

  static canOrderBeRefunded(orderStatus: string): boolean {
    const refundableStatuses = ['confirmed', 'CONFIRMED', 'paid', 'PAID'];
    return refundableStatuses.includes(orderStatus);
  }
}