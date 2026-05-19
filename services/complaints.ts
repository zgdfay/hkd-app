import { supabase } from '@/utils/supabase';
import { Complaint, ComplaintListItem, ComplaintStatus, ComplaintCategory } from '@/types';
import { notifyAdmins, notifyLurah, notifyWargaByComplaintId } from '@/services/notifications';

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  reporterName: string;
  reporterPhone: string;
  images?: string[];
  reporterPushToken?: string;
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
      reporter_push_token: payload.reporterPushToken || null,
      status: 'Pending',
      images: payload.images || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify ADMINS only — Lurah gets notified when admin forwards
  try {
    await notifyAdmins(
      'Pengaduan Baru',
      `Laporan baru telah diterima dari ${payload.reporterName}: "${payload.title}"`,
      { complaintId: data.id, type: 'new_complaint' }
    );
  } catch (notifyError) {
    console.error('Failed to send notifications:', notifyError);
  }

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

  if (status && (status as string) !== 'Semua') {
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
  console.log(`[updateComplaintStatus] Updating complaint ${id} to status: ${status}`);

  const { error } = await supabase
    .from('complaints')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
  console.log(`[updateComplaintStatus] DB update successful for ${id}`);

  // Notify warga when complaint status is updated
  try {
    const { data: complaint, error: fetchErr } = await supabase
      .from('complaints')
      .select('title, reporter_push_token')
      .eq('id', id)
      .single();

    console.log(`[updateComplaintStatus] Complaint data:`, {
      title: complaint?.title,
      hasToken: !!complaint?.reporter_push_token,
      tokenPreview: complaint?.reporter_push_token?.substring(0, 30) || 'NULL',
    });

    if (fetchErr) {
      console.error('[updateComplaintStatus] Failed to fetch complaint:', fetchErr);
      return;
    }

    if (complaint) {
      if (status === 'Proses') {
        console.log('[updateComplaintStatus] Triggering Proses notification to warga...');
        await notifyWargaByComplaintId(
          id,
          'Pengaduan Diproses',
          `Laporan pengaduan "${complaint.title}" sedang ditindak lanjuti oleh petugas.`
        );
        console.log('[updateComplaintStatus] Proses notification sent!');
      } else if (status === 'Selesai') {
        console.log('[updateComplaintStatus] Triggering Selesai notification to warga...');
        await notifyWargaByComplaintId(
          id,
          'Pengaduan Selesai',
          `Laporan pengaduan "${complaint.title}" telah selesai ditangani dengan baik. Terima kasih atas partisipasi Anda.`
        );
        console.log('[updateComplaintStatus] Selesai notification sent!');
      }
    }
  } catch (e) {
    console.error('[updateComplaintStatus] Failed to notify warga:', e);
  }
}

export async function forwardComplaint(id: string): Promise<void> {
  // Admin forwards to Lurah - sets is_forwarded=true, lurah_status stays 'pending'
  const { error } = await supabase
    .from('complaints')
    .update({ is_forwarded: true })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Notify Lurah about new task
  try {
    const { data: complaint } = await supabase
      .from('complaints')
      .select('title, reporter_name')
      .eq('id', id)
      .single();

    if (complaint) {
      await notifyLurah(
        'Tugas Baru',
        `Tugas baru "${complaint.title}" dari ${complaint.reporter_name} telah diteruskan untuk ditindaklanjuti.`,
        { complaintId: id, type: 'new_task' }
      );
    }
  } catch (e) {
    console.error('Failed to notify lurah on forward:', e);
  }
}

export async function setLurahStatusProcessing(id: string): Promise<void> {
  // Lurah starts processing - sets lurah_status='processing', status stays Pending for citizen
  const { error } = await supabase
    .from('complaints')
    .update({ lurah_status: 'processing' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Notify Admin that Lurah is processing
  try {
    const { data: complaint } = await supabase
      .from('complaints')
      .select('title')
      .eq('id', id)
      .single();

    if (complaint) {
      await notifyAdmins(
        'Laporan Sedang Diproses',
        `Lurah telah memulai pemrosesan untuk pengaduan "${complaint.title}".`,
        { complaintId: id, type: 'lurah_processing' }
      );
    }
  } catch (e) {
    console.error('Failed to notify admins on lurah processing:', e);
  }
}

export async function setLurahStatusDone(id: string): Promise<void> {
  // Lurah marks as done - sets lurah_status='done' ONLY, status stays for admin to confirm final
  const { error } = await supabase
    .from('complaints')
    .update({ lurah_status: 'done' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Notify Admin that Lurah has finished
  try {
    const { data: complaint } = await supabase
      .from('complaints')
      .select('title')
      .eq('id', id)
      .single();

    if (complaint) {
      await notifyAdmins(
        'Tugas Selesai Dikerjakan',
        `Lurah telah menyelesaikan pengaduan "${complaint.title}". Mohon lakukan konfirmasi penyelesaian akhir.`,
        { complaintId: id, type: 'lurah_done' }
      );
    }
  } catch (e) {
    console.error('Failed to notify admins on lurah done:', e);
  }
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