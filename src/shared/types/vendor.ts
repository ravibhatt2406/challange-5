// ===========================================
// Vendor Types
// ===========================================

import type { VendorStatus } from '../constants/statusEnums.js';

export interface Vendor {
  id: string;
  event_id: string;
  category: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: VendorStatus;
  quoted_cost: number | null;
  final_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorPayload {
  category: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  status?: VendorStatus;
  quoted_cost?: number;
  final_cost?: number;
  notes?: string;
}

export interface UpdateVendorPayload {
  category?: string;
  name?: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  status?: VendorStatus;
  quoted_cost?: number | null;
  final_cost?: number | null;
  notes?: string | null;
}
