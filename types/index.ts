export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'lurah' | 'citizen';
  avatar?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface Complaint {
  id: string;
  code: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  reporterName: string;
  reporterPhone: string;
  status: ComplaintStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
  history?: ComplaintHistory[];
}

export type ComplaintStatus = 'Pending' | 'Proses' | 'Selesai';

export type ComplaintCategory =
  | 'infrastruktur'
  | 'lingkungan'
  | 'keamanan'
  | 'sosial'
  | 'kesehatan'
  | 'lainnya';

export interface ComplaintHistory {
  date: string;
  label: string;
  desc: string;
}

export interface ComplaintListItem {
  id: string;
  title: string;
  citizen: string;
  date: string;
  status: ComplaintStatus;
  category: string;
  location?: string;
  description?: string;
  images?: string[];
  isForwarded?: boolean;
  lurahStatus?: 'pending' | 'processing' | 'done';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface ComplaintRequest {
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  reporterName: string;
  reporterPhone: string;
  images?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}