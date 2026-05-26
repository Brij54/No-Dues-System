import api from './axios';
import { API } from './endpoints';
import type { Payment } from '../types/models';
import type {
  CreatePaymentRequest,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentStatusResponse,
} from '../types/api.types';

export const paymentsApi = {
  /** GET /api/payments — all payments */
  getAll: () =>
    api.get<Payment[]>(API.PAYMENTS.BASE),

  /** POST /api/payments — create raw payment (STUDENT) */
  create: (data: Partial<Payment>) =>
    api.post<Payment>(API.PAYMENTS.BASE, data),

  /** GET /api/payments/:id */
  getById: (id: string) =>
    api.get<Payment>(API.PAYMENTS.BY_ID(id)),

  /** PUT /api/payments/:id (SUPERADMIN) */
  update: (id: string, data: Partial<Payment>) =>
    api.put<Payment>(API.PAYMENTS.BY_ID(id), data),

  /** DELETE /api/payments/:id (SUPERADMIN) */
  delete: (id: string) =>
    api.delete(API.PAYMENTS.BY_ID(id)),

  /** POST /api/payments/create — create payment record (STUDENT) */
  createRecord: (data: CreatePaymentRequest) =>
    api.post<Payment>(API.PAYMENTS.CREATE, data),

  /** PUT /api/payments/:paymentId/verify/:studentId (SUPERADMIN / DEPARTMENTADMIN) */
  verifyPayment: (paymentId: string, studentId: string) =>
    api.put<Payment>(API.PAYMENTS.VERIFY(paymentId, studentId)),

  /** GET /api/payments/admin/students/:id/payments (SUPERADMIN) */
  getPaymentsByStudent: (studentId: string) =>
    api.get<Payment[]>(API.PAYMENTS.BY_STUDENT(studentId)),

  /** POST /api/payments/initiate/razorpay — initiate Razorpay payment */
  initiateRazorpay: (data: PaymentInitiateRequest) =>
    api.post<PaymentInitiateResponse>(API.PAYMENTS.INITIATE, data),

  /** GET /api/payments/status/:orderId — check payment status */
  getPaymentStatus: (orderId: string) =>
    api.get<PaymentStatusResponse>(API.PAYMENTS.STATUS(orderId)),
};

// Legacy exports for backward compatibility with existing PaymentStatus page
export const initiatePayment = async (request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> => {
  const response = await paymentsApi.initiateRazorpay(request);
  return response.data;
};

export const getPaymentStatus = async (orderId: string): Promise<PaymentStatusResponse> => {
  const response = await paymentsApi.getPaymentStatus(orderId);
  return response.data;
};
