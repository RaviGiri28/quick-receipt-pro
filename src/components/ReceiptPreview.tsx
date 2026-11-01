import { forwardRef } from 'react';
import { ReceiptData, BusinessInfo } from '@/types/receipt';
import { useAuth } from '@/contexts/AuthContext';
import { displayAccountNumber } from '@/lib/utils';

// Printed on every receipt (without "www.": netlify.app sites don't serve it).
const PORTAL_HOST = 'quickreceiptpro.netlify.app';
const PORTAL_URL = `https://${PORTAL_HOST}`;

interface ReceiptPreviewProps {
  data: Partial<ReceiptData>;
  business: BusinessInfo;
  className?: string;
  compact?: boolean;
}

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ data, business, className = '', compact = false }, ref) => {
    const customFieldDefs = useAuth().user?.customFields || [];

    const fields = [
      { label: 'Account Holder', value: data.accountHolder },
      { label: 'Account Number', value: displayAccountNumber(data) },
      { label: 'Bank Name', value: data.bankName },
      { label: 'IFSC Code', value: data.ifscCode },
      { label: 'Amount (₹)', value: data.amount ? `₹ ${Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: String(data.amount).includes('.') ? 2 : 0, maximumFractionDigits: 2 })}` : '' },
      { label: 'Date', value: data.date },
      { label: 'Transaction ID', value: data.transactionId },
      { label: 'Reference No', value: data.referenceNumber },
      { label: 'Customer Mobile', value: data.customerMobile },
      ...customFieldDefs
        .filter(cf => data.customFields?.[cf.id])
        .map(cf => ({ label: cf.label, value: data.customFields![cf.id] })),
    ].filter(f => f.value);

    return (
      <div
        ref={ref}
        className={`receipt-card paper-edge-y relative overflow-hidden bg-white text-slate-900 ${compact ? 'px-3 py-4' : 'px-5 py-6'} max-w-md mx-auto ${className}`}
      >
        {/* Logo */}
        {business.showLogo && business.logo && (
          <div className={`flex justify-center ${compact ? 'mb-0.5' : 'mb-1'}`}>
            <img
              src={business.logo}
              alt="Business Logo"
              className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} object-contain rounded-full border border-slate-200`}
            />
          </div>
        )}

        {/* Business Name */}
        {business.showName && (
          <h2
            className={`text-center font-bold mb-0 leading-tight ${compact ? 'text-sm' : 'text-base'}`}
            style={{ color: `hsl(${business.primaryColor})` }}
          >
            {business.name}
          </h2>
        )}

        {/* Business Address */}
        {business.address && (
          <p className="text-center text-[10px] text-slate-500 mt-0">{business.address}</p>
        )}

        {/* Business Phone */}
        {business.phone && (
          <p className="text-center text-[10px] text-slate-500 mt-0">
            Mob:- {business.phone}
          </p>
        )}

        {/* Title */}
        <div className={`text-center ${compact ? 'mb-1 mt-1' : 'mb-2 mt-1.5'}`}>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
            Transaction Receipt
          </h3>
          <div
            className="w-10 h-0.5 mx-auto mt-1 rounded-full"
            style={{ backgroundColor: `hsl(${business.primaryColor})` }}
          />
        </div>

        {/* Details */}
        <div className={compact ? 'space-y-0' : 'space-y-0.5'}>
          {fields.map(field => (
            <div
              key={field.label}
              className={`flex justify-between items-center ${compact ? 'py-0.5' : 'py-1'} border-b border-dashed border-slate-200`}
            >
              <span className="receipt-field-label text-[10px] text-slate-500">{field.label}</span>
              <span className={`receipt-field-value text-[11px] font-semibold text-slate-900 text-right pl-2`}>{field.value}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {data.notes && (
          <div className={`${compact ? 'mt-1' : 'mt-1.5'} text-[10px] text-slate-500`}>
            <span className="font-medium">Notes: </span>{data.notes}
          </div>
        )}

        {/* Footer */}
        <div className={`${compact ? 'mt-1 pt-1' : 'mt-2 pt-1.5'} border-t border-slate-200 text-center`}>
          {data.serialNumber ? (
            <p className="text-[10px] text-slate-500">Serial No: #{data.serialNumber}</p>
          ) : null}
        </div>

        {/* Disclaimer Note (Hindi only) */}
        <div className="receipt-footer-note mt-1 pt-1 border-t border-dashed border-slate-200 text-center">
          <p className="text-[8px] leading-tight text-slate-500">
            गलत खाता संख्या या नाम होने की स्थिति में ग्राहक स्वयं जिम्मेदार होगा। हमारे साथ लेन-देन करने के लिए धन्यवाद!!
          </p>
          <p className="text-[8px] leading-tight text-slate-500 mt-0.5">
            अगर आपके खाते में पैसे जमा नहीं हुए तो इसकी जानकारी 7 दिनों के अंदर दें। 7 दिनों बाद हमारी कोई जिम्मेदारी नहीं होगी।
          </p>
        </div>

        {/* Branding */}
        <div className="receipt-powered relative mt-1 text-right leading-tight">
          <p className="text-[8px] text-slate-500">Powered by <span className="font-bold text-slate-700">Quick Receipt</span></p>
          <a
            href={PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[8px] font-semibold hover:underline"
            style={{ color: `hsl(${business.primaryColor})` }}
          >
            {PORTAL_HOST}
          </a>
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = 'ReceiptPreview';
