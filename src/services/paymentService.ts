import modernApiClient from '@/lib/modernApiClient';

export interface PaymentCreateRequest {
  amount: number;
  order_id: string;
  return_url?: string;
  cancel_url?: string;
  description?: string;
}

export interface PaymentCreateResponse {
  transfer_id: string;
  payment_url: string;
  status: string;
}

export interface PaymentStatusResponse {
  transfer_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  order_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCancelResponse {
  transfer_id: string;
  status: string;
  cancelled_at: string;
}

class PaymentService {
  private baseUrl = 'https://oyoqkiyim.duckdns.org';

  async createPayment(data: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Payment creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(transferId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${transferId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  async cancelPayment(transferId: string): Promise<PaymentCancelResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${transferId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  // Utility method to poll payment status
  async pollPaymentStatus(
    transferId: string, 
    intervalMs: number = 3000, 
    maxAttempts: number = 20
  ): Promise<PaymentStatusResponse> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.getPaymentStatus(transferId);
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            resolve(status);
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Payment status polling timeout'));
            return;
          }
          
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService;