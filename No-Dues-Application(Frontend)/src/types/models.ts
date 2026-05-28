// ─── Matches backend entity: Student ───
export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  phone?: string;
  gender?: string;
  totalPendingAmount: number;
  noDueStatus: string; // "PENDING" | "CLEARED"
  emailSent?: boolean;
  lastEmailSentAt?: string;
  dues?: Due[];
  payments?: Payment[];
}

// ─── Matches backend entity: Department ───
export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  users?: User[];
  dues?: Due[];
}

// ─── Matches backend entity: User (replaces DepartmentAdmin) ───
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

// ─── Matches backend entity: Due ───
export interface Due {
  id: string;
  description?: string;
  amount: number;
  paidAmount?: number;
  status: string; // "NO_DUES" | "DUES_PENDING" | "CLEARED" | "PENDING" (legacy)
  createdAt?: string;
  updatedAt?: string;
  clearedAt?: string;
  department?: Department;
  student?: Student;
  user?: User;
}

// ─── Matches backend entity: Payment ───
export interface Payment {
  id: string;
  amountPaid: number;
  paymentStatus: string; // "SUCCESS" | "FAILED" | "PENDING" | "CLEARED" | "MISMATCH" | "NO_DUES"
  paymentTime: string;
  transactionReference?: string;
  status?: string;
  paymentDate?: string;
  responseCode?: string;
  responseMessage?: string;
  referenceNo?: string;
  transactionDate?: string;
  paymentMode?: string;
  paymentGateway?: string;
  transactionId?: string;
  remarks?: string;
  student?: Student;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Matches backend entity: PaymentTransaction ───
export interface PaymentTransaction {
  id: string;
  gatewayOrderId?: string;
  razorpayPaymentId?: string;
  webhookPayload?: string;
  webhookSignature?: string;
  transactionStatus?: string; // "SUCCESS" | "FAILED"
  failureReason?: string;
  createdAt?: string;
}
