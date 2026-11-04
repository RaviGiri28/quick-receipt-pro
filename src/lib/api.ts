import { CustomFieldDef, ReceiptData, Subscription, SubscriptionStatus, UserProfile } from '@/types/receipt';

// Empty in dev: Vite proxies /api to the backend (see vite.config.ts).
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'qr_token';

export class ApiError extends Error {
  // `data` is the full error response body (some errors carry a `code` and details).
  constructor(message: string, public status: number, public data: Record<string, unknown> | null = null) {
    super(message);
  }
  get code(): string | undefined {
    return typeof this.data?.code === 'string' ? this.data.code : undefined;
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

// Called when the server refuses a request because an admin deactivated the account,
// so the app can reload the profile and show the deactivation notice.
let onDeactivated: (() => void) | null = null;
export const ACCOUNT_DEACTIVATED_EVENT = 'qr:account-deactivated';
export function setDeactivatedHandler(handler: (() => void) | null) {
  onDeactivated = handler;
}

// Called when the server refuses a receipt because the trial or plan has ended,
// so the app can reload the subscription and show the upgrade screen.
let onSubscriptionRequired: (() => void) | null = null;
export function setSubscriptionRequiredHandler(handler: (() => void) | null) {
  onSubscriptionRequired = handler;
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
    if (res.status === 403 && data?.code === 'ACCOUNT_DEACTIVATED') {
      onDeactivated?.();
      // Shows the deactivated-account popup again, even if it was already closed.
      window.dispatchEvent(new Event(ACCOUNT_DEACTIVATED_EVENT));
    }
    if (res.status === 402 && data?.code === 'SUBSCRIPTION_REQUIRED') onSubscriptionRequired?.();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
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
  is_admin?: boolean;
  terms_version?: string | null;
  terms_current?: string;
  has_passcode?: boolean;
  deactivated_at?: string | null;
  subscription?: ApiSubscription;
}

export interface ApiSubscription {
  status: SubscriptionStatus;
  plan: 'trial' | 'paid' | null;
  plan_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  can_create: boolean;
}

export function subscriptionFromApi(s?: ApiSubscription): Subscription {
  // Endpoints that don't report it (login, profile update) leave the account usable;
  // the server still enforces the plan.
  if (!s) return { status: 'trial', plan: null, planId: null, startedAt: null, expiresAt: null, canCreate: true };
  return {
    status: s.status,
    plan: s.plan,
    planId: s.plan_id,
    startedAt: s.started_at,
    expiresAt: s.expires_at,
    canCreate: s.can_create,
  };
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
    isAdmin: !!u.is_admin,
    // Only the profile endpoint reports these; elsewhere the user counts as up to date.
    termsAccepted: u.terms_current === undefined || u.terms_version === u.terms_current,
    hasPasscode: !!u.has_passcode,
    deactivatedAt: u.deactivated_at ?? null,
    subscription: subscriptionFromApi(u.subscription),
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
  acceptedTermsVersion: string;
  // Optional: gives the coupon's trial days instead of the default free trial.
  couponCode?: string;
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
    form.append('accept_terms', 'true');
    form.append('terms_version', data.acceptedTermsVersion);
    if (data.couponCode?.trim()) form.append('coupon_code', data.couponCode.trim());
    // trial_days: the free trial that starts on the first login.
    return request<{ userId: number; trial_days: number }>('POST', '/api/auth/register', form);
  },

  acceptTerms: (version: string) =>
    request<{ terms_version: string }>('POST', '/api/auth/accept-terms', { terms_version: version }),

  // Starts the recovery period and ends every session; returns when it will be erased.
  deleteAccount: async (password: string) =>
    (await request<{ delete_on: string }>('DELETE', '/api/auth/account', { password })).delete_on,

  restoreAccount: (email: string, password: string) =>
    request<{ token: string }>('POST', '/api/auth/restore-account', { email, password }),

  // Emails a one-time reset link; the reply is the same whether or not the email has an account.
  forgotPassword: (email: string) => request<{ message: string }>('POST', '/api/auth/forgot-password', { email }),

  // token: from the emailed link. Fails with code RESET_LINK_INVALID when used or expired.
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('POST', '/api/auth/reset-password', { token, password }),

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

  // Sets the app passcode; changing an existing one needs the current passcode.
  setPasscode: (passcode: string, currentPasscode?: string) =>
    request<unknown>('PUT', '/api/auth/passcode', { passcode, ...(currentPasscode && { current_passcode: currentPasscode }) }),

  // Takes the account password, so it also works when the passcode is forgotten.
  removePasscode: (password: string) => request<unknown>('DELETE', '/api/auth/passcode', { password }),

  verifyPasscode: (passcode: string) => request<unknown>('POST', '/api/auth/passcode/verify', { passcode }),
};

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export interface Plan {
  id: string;
  name: string;
  price: number;
  days: number;
  months: number;
  best_value?: boolean;
}

export interface SubscriptionDetails {
  subscription: Subscription;
  plans: Plan[];
  // Accounts that never had a trial: the coupon offered to them.
  offer: { code: string; trial_days: number } | null;
}

export const subscriptionApi = {
  publicPlans: () => request<{ plans: Plan[]; trial_days: number }>('GET', '/api/subscription/plans'),
  get: async (): Promise<SubscriptionDetails> => {
    const data = await request<{ subscription: ApiSubscription; plans: Plan[]; offer: SubscriptionDetails['offer'] }>(
      'GET', '/api/subscription',
    );
    return { ...data, subscription: subscriptionFromApi(data.subscription) };
  },
  redeem: async (code: string) => {
    const data = await request<{ message: string; subscription: ApiSubscription }>('POST', '/api/subscription/redeem', { code });
    return { message: data.message, subscription: subscriptionFromApi(data.subscription) };
  },
  createOrder: (planId: string) =>
    request<{ key_id: string; order_id: string; amount: number; currency: string }>(
      'POST', '/api/subscription/order', { plan_id: planId },
    ),
  verifyPayment: async (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const data = await request<{ message: string; subscription: ApiSubscription }>('POST', '/api/subscription/verify', body);
    return { message: data.message, subscription: subscriptionFromApi(data.subscription) };
  },
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

// From the landing page's Contact form: no account needed. `website` is a honeypot
// field that stays empty for people.
export interface ContactMessage extends SupportMessage {
  phone: string;
  website: string;
}

export const supportApi = {
  send: (data: SupportMessage) => request<{ ticketId: number }>('POST', '/api/support', data),
  contact: (data: ContactMessage) => request<{ ticketId?: number }>('POST', '/api/support/contact', data),
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
  mask_account_number: boolean;
  serial_number: number | null;
  save_type: 'printed' | 'saved';
  is_printed: boolean;
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
    maskAccountNumber: !!r.mask_account_number,
    serialNumber: r.serial_number || 0,
    saveType: r.save_type,
    isPrinted: !!r.is_printed,
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
    ...(r.maskAccountNumber !== undefined && { mask_account_number: r.maskAccountNumber }),
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
  todays_amount: number;
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

  // demo: the guided tour's receipt, which the tour deletes again without the passcode.
  create: async (r: Partial<ReceiptData>, { demo = false } = {}) =>
    receiptFromApi((await request<{ receipt: ApiReceipt }>('POST', '/api/receipts/create', {
      ...receiptToApi(r),
      ...(demo && { is_demo: true }),
    })).receipt),

  update: async (id: string, r: Partial<ReceiptData>) =>
    receiptFromApi((await request<{ receipt: ApiReceipt }>('PUT', `/api/receipts/${id}`, receiptToApi(r))).receipt),

  // passcode: required by the server when the user has an app passcode.
  remove: (id: string, passcode?: string) =>
    request<unknown>('DELETE', `/api/receipts/${id}`, passcode ? { passcode } : undefined),

  // "Today" is the browser's date, so the count matches the user's day whatever the server's timezone.
  dashboard: async (today = localIsoDate()) =>
    (await request<{ stats: DashboardStats }>('GET', `/api/receipts/dashboard?today=${today}`)).stats,
};

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export type BlogTag = 'feature' | 'update' | 'fix' | 'announcement' | 'guide';
// public = website visitors only, users = logged-in users only, both = everyone.
export type BlogVisibility = 'public' | 'users' | 'both';
export type PublishStatus = 'draft' | 'published';

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  tag: BlogTag;
  cover_image: string | null;
  published_at: string | null;
  updated_at: string;
  author_name: string | null;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
}

export interface AdminBlogPost extends BlogPostSummary {
  content?: string;
  visibility: BlogVisibility;
  status: PublishStatus;
  created_at: string;
}

export interface BlogPage {
  posts: BlogPostSummary[];
  total: number;
  page: number;
  totalPages: number;
}

// 'public' = what visitors see (no login); 'users' = the in-app blog.
export type BlogAudience = 'public' | 'users';

const blogBase = (audience: BlogAudience) => (audience === 'public' ? '/api/blog/public' : '/api/blog');

export const blogApi = {
  list: async (audience: BlogAudience, page = 1, tag?: BlogTag): Promise<BlogPage> => {
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (tag) params.set('tag', tag);
    const data = await request<{ posts: BlogPostSummary[]; pagination: { total: number; page: number; totalPages: number } }>(
      'GET', `${blogBase(audience)}?${params}`,
    );
    return { posts: data.posts, ...data.pagination };
  },

  get: async (audience: BlogAudience, slug: string) =>
    (await request<{ post: BlogPost }>('GET', `${blogBase(audience)}/${encodeURIComponent(slug)}`)).post,
};

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export type AnnouncementType = 'info' | 'update' | 'warning';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  type: AnnouncementType;
  link_url: string | null;
  link_label: string | null;
  pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
}

export interface AdminAnnouncement extends Announcement {
  status: PublishStatus;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  type: AnnouncementType;
  link_url: string;
  link_label: string;
  pinned: boolean;
  status: PublishStatus;
  expires_at: string | null; // YYYY-MM-DD or null
}

export const announcementsApi = {
  active: async () => (await request<{ announcements: Announcement[] }>('GET', '/api/announcements')).announcements,
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  // 'account': the latest admin action on the user's own account (deactivated/reactivated).
  type: 'blog' | 'announcement' | 'account';
  id: number;
  title: string;
  body: string;
  slug?: string;
  tag: string;
  published_at: string;
  read: boolean;
  // Announcements and account notices only.
  link_url?: string | null;
  link_label?: string | null;
}

export const notificationsApi = {
  list: async () => (await request<{ notifications: AppNotification[] }>('GET', '/api/notifications')).notifications,
  unreadCount: async () => (await request<{ count: number }>('GET', '/api/notifications/unread-count')).count,
  markRead: (type: AppNotification['type'], id: number) => request<unknown>('POST', '/api/notifications/read', { type, id }),
  markAllRead: () => request<unknown>('POST', '/api/notifications/read-all'),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface BlogPostInput {
  title: string;
  summary: string;
  content: string;
  tag: BlogTag;
  visibility: BlogVisibility;
  status: PublishStatus;
  cover?: File | null;
  removeCover?: boolean;
}

function blogForm(data: BlogPostInput) {
  const form = new FormData();
  form.append('title', data.title);
  form.append('summary', data.summary);
  form.append('content', data.content);
  form.append('tag', data.tag);
  form.append('visibility', data.visibility);
  form.append('status', data.status);
  if (data.cover) form.append('cover', data.cover);
  else if (data.removeCover) form.append('remove_cover', 'true');
  return form;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  business_name: string;
  business_logo: string | null;
  created_at: string;
  last_active_at: string | null;
  deactivated_at: string | null;
  deletion_requested_at: string | null;
  receipt_count: number;
  is_admin: boolean;
  subscription: ApiSubscription;
  // Signed up but never logged in: this many trial days start on the first login.
  trial_days_pending: number | null;
}

export type AdminUserStatusFilter = 'all' | 'active' | 'deactivated';
export type AdminPlanFilter = 'all' | 'trial' | 'paid' | 'expired' | 'none';

export interface AdminUserList {
  users: AdminUser[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: {
    total: number; active: number; deactivated: number; new_this_week: number;
    on_trial: number; paid: number; expired: number;
  };
  plans: Plan[];
}

export type AdminPlanAction =
  | { action: 'grant_paid'; plan_id: string }
  | { action: 'add_trial'; days: number }
  | { action: 'expire' };

export type CouponAudience = 'signup' | 'existing' | 'expired' | 'personal' | 'all';

export interface Coupon {
  id: number;
  code: string;
  trial_days: number;
  audience: CouponAudience;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  converted_count: number;
  // Personal coupons: the one account that can use it, and whether it has.
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  redeemed: boolean;
}

export interface CouponInput {
  code: string;
  trial_days: number;
  audience: CouponAudience;
  max_uses: number | null;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  // Personal coupons only, when creating.
  user_id?: number | null;
}

export const adminApi = {
  listUsers: (params: { search?: string; status?: AdminUserStatusFilter; plan?: AdminPlanFilter; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return request<AdminUserList>('GET', `/api/admin/users?${query}`);
  },
  setUserDeactivated: async (id: number, deactivated: boolean) =>
    (await request<{ user: AdminUser }>('PUT', `/api/admin/users/${id}/status`, { deactivated })).user,
  setUserPlan: (id: number, change: AdminPlanAction) =>
    request<{ message: string; user: AdminUser }>('PUT', `/api/admin/users/${id}/plan`, change),
  resetUserPassword: (id: number, password: string) =>
    request<{ message: string }>('PUT', `/api/admin/users/${id}/password`, { password }),

  listPlans: async () => (await request<{ plans: Plan[] }>('GET', '/api/admin/plans')).plans,
  updatePlan: async (id: string, data: { name: string; price: number; days: number }) =>
    (await request<{ plan: Plan }>('PUT', `/api/admin/plans/${id}`, data)).plan,

  listCoupons: async () => (await request<{ coupons: Coupon[] }>('GET', '/api/admin/coupons')).coupons,
  createCoupon: async (data: CouponInput) =>
    (await request<{ coupon: Coupon }>('POST', '/api/admin/coupons', data)).coupon,
  updateCoupon: async (id: number, data: CouponInput) =>
    (await request<{ coupon: Coupon }>('PUT', `/api/admin/coupons/${id}`, data)).coupon,
  deleteCoupon: (id: number) => request<unknown>('DELETE', `/api/admin/coupons/${id}`),

  listPosts: async () => (await request<{ posts: AdminBlogPost[] }>('GET', '/api/admin/blog')).posts,
  getPost: async (id: number) => (await request<{ post: AdminBlogPost }>('GET', `/api/admin/blog/${id}`)).post,
  createPost: async (data: BlogPostInput) =>
    (await request<{ post: AdminBlogPost }>('POST', '/api/admin/blog', blogForm(data))).post,
  updatePost: async (id: number, data: BlogPostInput) =>
    (await request<{ post: AdminBlogPost }>('PUT', `/api/admin/blog/${id}`, blogForm(data))).post,
  deletePost: (id: number) => request<unknown>('DELETE', `/api/admin/blog/${id}`),
  // Uploads an image for use inside a post's body; returns its URL.
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return (await request<{ url: string }>('POST', '/api/admin/blog/images', form)).url;
  },

  listAnnouncements: async () =>
    (await request<{ announcements: AdminAnnouncement[] }>('GET', '/api/admin/announcements')).announcements,
  createAnnouncement: async (data: AnnouncementInput) =>
    (await request<{ announcement: AdminAnnouncement }>('POST', '/api/admin/announcements', data)).announcement,
  updateAnnouncement: async (id: number, data: AnnouncementInput) =>
    (await request<{ announcement: AdminAnnouncement }>('PUT', `/api/admin/announcements/${id}`, data)).announcement,
  deleteAnnouncement: (id: number) => request<unknown>('DELETE', `/api/admin/announcements/${id}`),
};
