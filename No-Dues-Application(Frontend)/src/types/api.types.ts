// ─── Due Requests ───
export interface CreateDueRequest {
  studentId: string;
  description?: string;
  amount: number;
  departmentId?: string;
}

export interface UpdateDueRequest {
  description?: string;
  amount?: number;
  status?: string;
}

export interface ClearStudentDuesRequest {
  paymentAmount: number;
}

// ─── Student Requests / Responses ───
export interface UpdateStudentPendingAmountRequest {
  studentId: string;
  additionalAmount: number;
}

export interface StudentPendingDuesSummaryResponse {
  totalPendingAmount: number;
  noDueStatus: string;
}

// ─── Payment Requests / Responses ───
export interface CreatePaymentRequest {
  amountPaid: number;
  transactionReference?: string;
  paymentTime?: string;
  paymentStatus?: string;
}

export interface PaymentInitiateRequest {
  amount: number;
}

export interface PaymentInitiateResponse {
  key: string;
  gatewayOrderId: string;
  amount: number;
  internalOrderId: string;
}

export interface PaymentStatusResponse {
  status: string;
}

// ─── Department Requests ───
export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ─── Auth Requests ───
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
}

export interface UserResource {
  resourceName: string;
  authMap: {
    email: string;
    userName: string;
    firstName: string;
    lastName: string;
    password?: string;
  };
  resourceMap: Record<string, any>;
}

export interface AssignRoleRequest {
  userName: string;
  roleName: string;
}

// ─── Bulk Upload (frontend-only) ───
export interface BulkUploadRow {
  rollNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  status?: 'success' | 'failed';
  error?: string;
}
