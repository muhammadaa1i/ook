import modernApiClient from '@/lib/modernApiClient';
import { API_ENDPOINTS } from '@/lib/constants';
import { RefundRequest, CreateRefundRequest } from '@/types';

interface RefundProcessResponse {
  data?: unknown;
  success?: boolean;
  status?: string;
  [k: string]: unknown;
}

export class RefundService {
  static async createRefundRequest(data: CreateRefundRequest): Promise<RefundRequest> {
    // Create refund request for admin review
    const refundRequest: RefundRequest = {
      id: Date.now(),
      order_id: data.order_id,
      user_id: 0, // Will be set from auth context
      amount: data.amount,
      payment_uuid: data.payment_uuid,
      reason: data.reason || 'Customer requested refund',
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    // Save to localStorage for admin to see
    await this.saveRefundRequest(refundRequest);
    
    return refundRequest;
  }

  static async getRefundRequests(): Promise<RefundRequest[]> {
    // Get refund requests from localStorage (temporary solution)
    try {
      const stored = localStorage.getItem('refundRequests');
      if (stored) {
        const requests = JSON.parse(stored) as RefundRequest[];
        return requests.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
      }
    } catch (error) {
      console.error('Error loading refund requests:', error);
    }
    return [];
  }

  static async saveRefundRequest(refundRequest: RefundRequest): Promise<void> {
    try {
      const existing = await this.getRefundRequests();
      const updated = [refundRequest, ...existing];
      localStorage.setItem('refundRequests', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving refund request:', error);
    }
  }

  static async updateRefundStatus(id: number, status: 'approved' | 'rejected'): Promise<void> {
    try {
      const existing = await this.getRefundRequests();
      const updated = existing.map(req => 
        req.id === id ? { ...req, status, updated_at: new Date().toISOString() } : req
      );
      localStorage.setItem('refundRequests', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating refund status:', error);
    }
  }

  static async approveRefund(id: number): Promise<void> {
    // Update status in localStorage
    await this.updateRefundStatus(id, 'approved');
    
    // Try to process the actual OCTO refund
    try {
      const requests = await this.getRefundRequests();
      const request = requests.find(r => r.id === id);
      
      if (request) {
        await this.processOctoRefund({
          amount: request.amount,
          payment_uuid: request.payment_uuid
        });
      }
    } catch (error) {
      console.error('OCTO refund failed during approval:', error);
      // Status is still marked as approved, admin can handle manually
    }
  }

  static async rejectRefund(id: number): Promise<void> {
    await this.updateRefundStatus(id, 'rejected');
  }

  static async processOctoRefund(data: { amount: number; payment_uuid: string }): Promise<RefundProcessResponse | unknown> {
    const response = await modernApiClient.post(API_ENDPOINTS.PAYMENT_REFUND, data) as RefundProcessResponse | unknown;
    if (response && typeof response === 'object' && 'data' in response) {
      const r = response as RefundProcessResponse;
      return r.data ?? r;
    }
    return response;
  }
}
