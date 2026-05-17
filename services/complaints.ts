import { supabase } from '@/utils/supabase';
import { Complaint, ComplaintListItem, ComplaintStatus, ComplaintCategory } from '@/types';

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  reporterName: string;
  reporterPhone: string;
  images?: string[];
}

export async function searchComplaintByCode(code: string): Promise<Complaint | null> {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) return null;
  return mapToComplaint(data);
}

export async function searchComplaintById(id: string): Promise<Complaint | null> {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapToComplaint(data);
}

export async function createComplaint(
  payload: CreateComplaintPayload,
  reporterId?: string
): Promise<Complaint> {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      location: payload.location,
      reporter_name: payload.reporterName,
      reporter_phone: payload.reporterPhone,
      reporter_id: reporterId || null,
      status: 'Pending',
      images: payload.images || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapToComplaint(data);
}

export async function getAllComplaints(options?: {
  status?: ComplaintStatus;
  page?: number;
  perPage?: number;
  search?: string;
}): Promise<{ data: ComplaintListItem[]; total: number }> {
  const { status, page = 1, perPage = 10, search } = options || {};

  let query = supabase
    .from('complaints')
    .select('*', { count: 'exact' });

  if (status && status !== 'Semua') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,reporter_name.ilike.%${search}%`);
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw new Error(error.message);

  return {
    data: (data || []).map(mapToComplaintListItem),
    total: count || 0,
  };
}

export async function getComplaintsForLurah(options?: {
  page?: number;
  perPage?: number;
}): Promise<{ data: ComplaintListItem[]; total: number }> {
  const { page = 1, perPage = 10 } = options || {};

  // Show all forwarded complaints - lurah can see their completed tasks (muted)
  // Hide only when status='Selesai' AND lurah_status='done' (admin confirmed complete)
  const { data, error, count } = await supabase
    .from('complaints')
    .select('*', { count: 'exact' })
    .eq('is_forwarded', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Filter out fully complete items in JS
  const filtered = (data || []).filter(row => {
    // Hide if status=Selesai AND lurah_status=done (admin confirmed)
    if (row.status === 'Selesai' && row.lurah_status === 'done') {
      return false;
    }
    return true;
  });

  // Apply pagination after filtering
  const paginatedData = filtered.slice((page - 1) * perPage, page * perPage);

  return {
    data: paginatedData.map(mapToComplaintListItem),
    total: filtered.length,
  };
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<void> {
  const { error } = await supabase
    .from('complaints')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function forwardComplaint(id: string): Promise<void> {
  // Admin forwards to Lurah - sets is_forwarded=true, lurah_status stays 'pending'
  const { error } = await supabase
    .from('complaints')
    .update({ is_forwarded: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function setLurahStatusProcessing(id: string): Promise<void> {
  // Lurah starts processing - sets lurah_status='processing', status stays Pending for citizen
  const { error } = await supabase
    .from('complaints')
    .update({ lurah_status: 'processing' })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function setLurahStatusDone(id: string): Promise<void> {
  // Lurah marks as done - sets lurah_status='done' ONLY, status stays for admin to confirm final
  const { error } = await supabase
    .from('complaints')
    .update({ lurah_status: 'done' })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function getComplaintStats(): Promise<{
  total: number;
  pending: number;
  proses: number;
  selesai: number;
}> {
  const { data, error } = await supabase
    .from('complaints')
    .select('status');

  if (error) throw new Error(error.message);

  const complaints = data || [];
  return {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    proses: complaints.filter(c => c.status === 'Proses').length,
    selesai: complaints.filter(c => c.status === 'Selesai').length,
  };
}

// Mappers
function mapToComplaint(row: any): Complaint {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    status: row.status,
    images: row.images || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToComplaintListItem(row: any): ComplaintListItem {
  return {
    id: row.id,
    title: row.title,
    citizen: row.reporter_name,
    date: new Date(row.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: row.status,
    category: row.category,
    location: row.location,
    description: row.description,
    images: row.images,
    isForwarded: row.is_forwarded,
    lurahStatus: row.lurah_status,
  };
}