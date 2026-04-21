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

export interface UserProfile {
  email: string;
  name: string;
  phone: string;
  business: BusinessInfo;
}

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
  customFields?: CustomFieldDef[];
}

export const defaultBusinessInfo: BusinessInfo = {
  name: 'Quick Receipt',
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
