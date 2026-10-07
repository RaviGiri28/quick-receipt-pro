import { CustomFieldDef, ReceiptData, UserProfile } from '@/types/receipt';

// Empty in dev: Vite proxies /api to the backend (see vite.config.ts).
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'qr_token';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Token storage: localStorage when "remember me", otherwise this tab only.
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, remember: boolean) {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

// Swaps in a new token, keeping the "remember me" choice of the current one.
function replaceToken(token: string) {
  let remembered = false;
  try {
    remembered = !!localStorage.getItem(TOKEN_KEY);
  } catch {
    // Storage unavailable: fall through to setToken, which will throw the real error.
  }
  setToken(token, remembered);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong';

// ---------------------------------------------------------------------------
// Dates: the UI shows en-IN dates (d/m/yyyy); the API uses YYYY-MM-DD.
// ---------------------------------------------------------------------------

export function displayDateToIso(display: string): string | null {
  const value = display.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmy = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  let y: number, m: number, d: number;
  if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]];
  else if (dmy) [d, m, y] = [+dmy[1], +dmy[2], +dmy[3]];
  else return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// The browser's local date as YYYY-MM-DD (not toISOString, which is UTC).
export function localIsoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isoToDisplayDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]}/${+m[2]}/${m[1]}` : iso;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_logo?: string | null;
  custom_field_defs?: CustomFieldDef[] | null;
}

export const assetUrl = (path?: string | null) =>
  path ? (/^(https?:|data:)/.test(path) ? path : `${API_BASE}${path}`) : null;

export function userFromApi(u: ApiUser): UserProfile {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone_number || '',
    business: {
      name: u.business_name,
      address: u.business_address || '',
      phone: u.business_phone || '',
      logo: assetUrl(u.business_logo),
    },
    customFields: u.custom_field_defs ?? null,
  };
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  logo?: File | null;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  logo?: File;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('POST', '/api/auth/login', { email, password }),

  register: (data: SignupData) => {
    const form = new FormData();
    form.append('name', data.name);
    form.append('email', data.email);
    form.append('password', data.password);
    form.append('phone_number', data.phone);
    form.append('business_name', data.businessName);
    form.append('business_address', data.businessAddress);
    form.append('business_phone', data.businessPhone);
    if (data.logo) form.append('business_logo', data.logo);
    return request<{ userId: number }>('POST', '/api/auth/register', form);
  },

  profile: async () => userFromApi((await request<{ user: ApiUser }>('GET', '/api/auth/profile')).user),

  updateProfile: async (data: ProfileUpdate) => {
    const form = new FormData();
    const fields: [string, string | undefined][] = [
      ['name', data.name],
      ['phone_number', data.phone],
      ['business_name', data.businessName],
      ['business_address', data.businessAddress],
      ['business_phone', data.businessPhone],
    ];
    for (const [key, value] of fields) if (value !== undefined) form.append(key, value);
    if (data.logo) form.append('business_logo', data.logo);
    return userFromApi((await request<{ user: ApiUser }>('PUT', '/api/auth/update-profile', form)).user);
  },

  // The server ends all other sessions and returns a new token for this one.
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const { token } = await request<{ token: string }>('PUT', '/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    replaceToken(token);
  },

  updateCustomFields: async (defs: CustomFieldDef[]) =>
    (await request<{ custom_fields: CustomFieldDef[] }>('PUT', '/api/auth/custom-fields', { custom_fields: defs })).custom_fields,
};

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export interface SupportMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const supportApi = {
  send: (data: SupportMessage) => request<{ ticketId: number }>('POST', '/api/support', data),
};

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

interface ApiReceipt {
  id: number;
  account_holder: string;
  account_number: string;
  ifsc_code: string | null;
  amount: string | number;
  date: string;
  transaction_id: string;
  reference_number: string | null;
  status: 'Success' | 'Pending';
  bank_name: string;
  customer_mobile: string;
  notes: string | null;
  custom_fields: Record<string, string> | null;
  is_dual_print: boolean;
  serial_number: number | null;
  save_type: 'printed' | 'saved';
  created_at: string;
}

export function receiptFromApi(r: ApiReceipt): ReceiptData {
  return {
    id: String(r.id),
    accountHolder: r.account_holder,
    accountNumber: r.account_number,
    ifscCode: r.ifsc_code || '',
    amount: String(Number(r.amount)),
    date: isoToDisplayDate(String(r.date)),
    transactionId: r.transaction_id,
    referenceNumber: r.reference_number || '',
    status: r.status === 'Pending' ? 'pending' : 'success',
    bankName: r.bank_name,
    customerMobile: r.customer_mobile,
    notes: r.notes || '',
    customFields: r.custom_fields || {},
    isDualPrint: !!r.is_dual_print,
    serialNumber: r.serial_number || 0,
    saveType: r.save_type,
    createdAt: r.created_at,
  };
}

export function receiptToApi(r: Partial<ReceiptData>) {
  const date = displayDateToIso(r.date || '');
  if (!date) throw new ApiError('Enter a valid date (DD/MM/YYYY).', 400);

  const customFields = Object.fromEntries(
    Object.entries(r.customFields || {}).filter(([, v]) => v && v.trim()),
  );
  return {
    account_holder: (r.accountHolder || '').trim(),
    account_number: (r.accountNumber || '').trim(),
    ifsc_code: (r.ifscCode || '').trim(),
    amount: Number(r.amount),
    date,
    transaction_id: (r.transactionId || '').trim(),
    reference_number: (r.referenceNumber || '').trim(),
    status: r.status === 'pending' ? 'Pending' : 'Success',
    bank_name: (r.bankName || '').trim(),
    customer_mobile: (r.customerMobile || '').trim(),
    notes: r.notes || '',
    custom_fields: Object.keys(customFields).length ? customFields : null,
    ...(r.saveType && { save_type: r.saveType }),
    ...(r.isDualPrint !== undefined && { is_dual_print: r.isDualPrint }),
  };
}

export interface ReceiptFilters {
  type?: 'printed' | 'saved';
  search?: string;
  status?: 'success' | 'pending';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
}

export interface ReceiptPage {
  receipts: ReceiptData[];
  total: number;
  page: number;
  totalPages: number;
}

function filterParams(filters: ReceiptFilters, page: number, limit: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.type) params.set('type', filters.type);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status === 'pending' ? 'Pending' : 'Success');
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  return params;
}

export interface DashboardStats {
  total_receipts: number;
  todays_receipt: number;
  total_amount: number;
  pending_receipts: number;
}

export const receiptsApi = {
  list: async (filters: ReceiptFilters, page = 1, limit = 20): Promise<ReceiptPage> => {
    const data = await request<{
      receipts: ApiReceipt[];
      pagination: { total: number; page: number; totalPages: number };
    }>('GET', `/api/receipts?${filterParams(filters, page, limit)}`);
    return {
      receipts: data.receipts.map(receiptFromApi),
      total: data.pagination.total,
      page: data.pagination.page,
      totalPages: data.pagination.totalPages,
    };
  },

  // Every receipt matching the filters (for export), fetched page by page.
  listAll: async (filters: ReceiptFilters): Promise<ReceiptData[]> => {
    const all: ReceiptData[] = [];
    for (let page = 1; ; page++) {
      const res = await receiptsApi.list(filters, page, 100);
      all.push(...res.receipts);
      if (page >= res.totalPages) return all;
    }
  },

  get: async (id: string) =>
    receiptFromApi((await request<{ receipt: ApiReceipt }>('GET', `/api/receipts/${id}`)).receipt),

  create: async (r: Partial<ReceiptData>) =>
    receiptFromApi((await request<{ receipt: ApiReceipt }>('POST', '/api/receipts/create', receiptToApi(r))).receipt),

  update: async (id: string, r: Partial<ReceiptData>) =>
    receiptFromApi((await request<{ receipt: ApiReceipt }>('PUT', `/api/receipts/${id}`, receiptToApi(r))).receipt),

  remove: (id: string) => request<unknown>('DELETE', `/api/receipts/${id}`),

  // "Today" is the browser's date, so the count matches the user's day whatever the server's timezone.
  dashboard: async (today = localIsoDate()) =>
    (await request<{ stats: DashboardStats }>('GET', `/api/receipts/dashboard?today=${today}`)).stats,
};
