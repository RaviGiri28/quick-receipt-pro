export interface ReceiptData {
  id: string;
  accountNumber: string;
  accountHolder: string;
  ifscCode: string;
  amount: string;
  date: string;
  transactionId: string;
  referenceNumber: string;
  status: 'success' | 'pending';
  serialNumber: number;
  createdAt: string;
  saveType?: 'printed' | 'saved';
  isPrinted?: boolean; // printed at least once (listed in History)
  isDualPrint?: boolean;
  maskAccountNumber?: boolean; // print/show only the last 5 digits of the account number
  notes: string;
  bankName?: string;
  customerMobile?: string;
  customFields?: Record<string, string>;
}

export interface BusinessInfo {
  name: string;
  logo: string | null;
  showLogo: boolean;
  showName: boolean;
  showWatermark: boolean;
  primaryColor: string;
  address?: string;
  phone?: string;
}

// Business details stored on the server; display preferences live in AppSettings.
export type BusinessProfile = Pick<BusinessInfo, 'name' | 'logo' | 'address' | 'phone'>;

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  business: BusinessProfile;
  // Extra receipt fields, shared across devices; null = never saved to the account.
  customFields: CustomFieldDef[] | null;
  // Can publish blog posts and announcements (set by the server from ADMIN_EMAILS).
  isAdmin: boolean;
  // Has accepted the current Terms and Privacy Policy.
  termsAccepted: boolean;
  // Has a 4-digit app passcode (asked when the app opens and before deleting a receipt).
  hasPasscode: boolean;
  // When an admin deactivated the account (read-only: no new or edited receipts); null = active.
  deactivatedAt: string | null;
  subscription: Subscription;
}

// 'admin': never needs a plan. 'none': never had a trial or plan (accounts made before
// subscriptions). 'expired': the trial or plan has ended.
export type SubscriptionStatus = 'admin' | 'trial' | 'paid' | 'expired' | 'none';

export interface Subscription {
  status: SubscriptionStatus;
  plan: 'trial' | 'paid' | null;
  planId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  // Can create and edit receipts.
  canCreate: boolean;
}

export type PrintAlign = 'left' | 'center' | 'right';

export interface CustomFieldDef {
  id: string;
  label: string;
}

export interface AppSettings {
  dualReceipt: boolean;
  showLogo: boolean;
  showName: boolean;
  showWatermark: boolean;
  primaryColor: string;
  // Last choice of the account-number eye toggle on Create Receipt; masked when unset.
  maskAccountNumber?: boolean;
  // Where a single (not dual) receipt sits on the printed page; left when unset.
  printAlign?: PrintAlign;
  // Legacy: custom field definitions used to live here (per device). They now belong to
  // the account (UserProfile.customFields); AuthContext uploads any left here once.
  customFields?: CustomFieldDef[];
}

export const defaultBusinessInfo: BusinessInfo = {
  name: 'Quick Receipt Pro',
  logo: null,
  showLogo: true,
  showName: true,
  showWatermark: true,
  primaryColor: '217 91% 30%',
  address: '',
  phone: '',
};

export const defaultReceipt: ReceiptData = {
  id: '',
  accountNumber: '',
  accountHolder: '',
  ifscCode: '',
  amount: '',
  date: new Date().toLocaleDateString('en-IN'),
  transactionId: '',
  referenceNumber: '',
  status: 'success',
  serialNumber: 0,
  createdAt: '',
  notes: '',
  bankName: '',
  customerMobile: '',
};
