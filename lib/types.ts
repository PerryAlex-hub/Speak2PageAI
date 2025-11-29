export interface PaystackCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone?: string;
  risk_action?: string;
  international_format_phone?: string | null;
}

export interface PaystackPlan {
  id: number;
  name: string;
  plan_code: string;
  description?: string;
  amount: number;
  interval: string;
  send_invoices?: number;
  send_sms?: number;
  currency: string;
}