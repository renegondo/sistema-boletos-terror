export type UserRole = 'admin' | 'vendor';
export type CommissionType = 'percentage' | 'fixed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  commission_type: CommissionType;
  commission_rate: number;
  is_active: number;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  location: string;
  event_date: string;
  event_time: string;
  banner_url?: string;
  status: 'active' | 'draft' | 'completed' | 'cancelled';
  created_at: string;
  tiers?: TicketTier[];
  total_sold?: number;
  total_revenue?: number;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  price: number;
  capacity: number;
  sold_count: number;
  description?: string;
}

export interface Order {
  id: string;
  event_id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  payment_method: 'cash' | 'card' | 'transfer';
  total_amount: number;
  vendor_commission_amount: number;
  commission_type_applied: CommissionType;
  commission_rate_applied: number;
  status: 'completed' | 'refunded';
  whatsapp_status: 'pending' | 'sent' | 'failed';
  whatsapp_error?: string;
  created_at: string;
  event_title?: string;
  vendor_name?: string;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  ticket_code: string;
  order_id: string;
  tier_id: string;
  event_id: string;
  attendee_name: string;
  price: number;
  qr_data: string;
  status: 'valid' | 'used' | 'cancelled';
  used_at?: string;
  created_at: string;
  tier_name?: string;
  event_title?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
}

export interface CommissionPayout {
  id: string;
  vendor_id: string;
  amount: number;
  notes?: string;
  paid_at: string;
  created_by: string;
  vendor_name?: string;
}

export interface EvolutionSettings {
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
  currency_symbol: string;
  currency_code: string;
  business_name: string;
  whatsapp_auto_send: string;
}
