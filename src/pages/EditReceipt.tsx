import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/PageHeader';
import { IconInput } from '@/components/IconInput';
import { FormSection, Field } from '@/components/FormSection';
import { LivePreviewPanel } from '@/components/LivePreviewPanel';
import { Spinner } from '@/components/EmptyState';
import { PasscodeDialog } from '@/components/PasscodeDialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { AccountNumberInput, AccountMaskToggle } from '@/components/AccountNumberInput';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptsApi, errorMessage } from '@/lib/api';
import { getSettings } from '@/lib/storage';
import { MOBILE_ERROR, isValidIndianMobile, normalizeIndianMobile, validateReceipt } from '@/lib/receiptValidation';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData } from '@/types/receipt';
import {
  Save, Printer, ArrowLeft, FileText, UserRound, User, Landmark, IndianRupee, CalendarDays,
  Building2, StickyNote, Smartphone, Tag, Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

type TextField = 'accountHolder' | 'accountNumber' | 'ifscCode' | 'amount' | 'date'
  | 'bankName' | 'notes';

export default function EditReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const business = useBusinessInfo();
  const { user } = useAuth();
  const customFieldDefs = user?.customFields || [];
  // Users with an app passcode enter it each time they open a receipt for editing.
  const [passcodeOk, setPasscodeOk] = useState(false);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [dualReceipt, setDualReceipt] = useState(false);

  const { data: loaded, error } = useQuery({
    queryKey: ['receipts', 'detail', id],
    queryFn: () => receiptsApi.get(id!),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (!loaded) return;
    setReceipt(loaded);
    // Reprint the way it was printed before; otherwise use this device's default.
    setDualReceipt(loaded.isPrinted ? !!loaded.isDualPrint : getSettings().dualReceipt);
  }, [loaded]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Receipt not available', description: errorMessage(error), variant: 'destructive' });
      navigate('/history');
    }
  }, [error, navigate, toast]);

  if (user?.hasPasscode && !passcodeOk) {
    return (
      <PasscodeDialog
        open
        title="Enter your passcode to edit"
        description="Your passcode is needed to edit a receipt."
        onVerified={() => setPasscodeOk(true)}
        onCancel={() => navigate(-1)}
      />
    );
  }

  if (!receipt) {
    return (
      <Spinner />
    );
  }

  const updateField = (field: TextField, value: string) => {
    setReceipt(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateMobile = (value: string) => {
    setReceipt(prev => prev ? { ...prev, customerMobile: normalizeIndianMobile(value) } : prev);
    setMobileError(value && !isValidIndianMobile(value) ? MOBILE_ERROR : '');
  };

  // Values of fields deleted from Settings stay on the receipt untouched.
  const updateCustomField = (fieldId: string, value: string) => {
    setReceipt(prev => prev ? { ...prev, customFields: { ...(prev.customFields || {}), [fieldId]: value } } : prev);
  };

  // Saves the edits without moving the receipt between lists. Printing adds it to History;
  // a Success one also leaves Saved Receipts, a Pending one stays in both.
  const save = async (print: boolean): Promise<boolean> => {
    const problem = validateReceipt(receipt);
    if (problem) {
      toast({ title: 'Please check the receipt', description: problem, variant: 'destructive' });
      return false;
    }
    setSaving(true);
    try {
      const updated = await receiptsApi.update(
        receipt.id,
        print ? { ...receipt, saveType: 'printed', isDualPrint: dualReceipt } : { ...receipt, saveType: undefined },
      );
      setReceipt(updated);
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: print ? 'Receipt saved & printing' : 'Receipt updated', description: 'Changes saved successfully.' });
      trackEvent(print ? 'receipt_printed' : 'receipt_saved', print ? { source: 'edit', dual: dualReceipt } : { source: 'edit' });
      return true;
    } catch (err) {
      toast({ title: 'Could not save changes', description: errorMessage(err), variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (await save(true)) setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        eyebrow="Receipts / Edit"
        title={`Edit Receipt #${receipt.serialNumber}`}
        description="Update any detail — the preview refreshes as you type."
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="group">
            <ArrowLeft className="transition-transform group-hover:-translate-x-1" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
        <div className="stagger space-y-6 no-print">
          <FormSection
            icon={FileText}
            title="Transaction Details"
            actions={
              <AccountMaskToggle
                masked={!!receipt.maskAccountNumber}
                onChange={masked => setReceipt(prev => prev ? { ...prev, maskAccountNumber: masked } : prev)}
              />
            }
          >
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Account Holder *" htmlFor="accountHolder">
                <IconInput id="accountHolder" icon={User} value={receipt.accountHolder || ''} onChange={e => updateField('accountHolder', e.target.value)} placeholder="Enter account holder name" maxLength={150} />
              </Field>
              <Field label="Account Number *" htmlFor="accountNumber">
                <AccountNumberInput value={receipt.accountNumber || ''} masked={!!receipt.maskAccountNumber} onChange={v => updateField('accountNumber', v)} maxLength={50} />
              </Field>
              <Field label="IFSC Code" htmlFor="ifscCode">
                <IconInput id="ifscCode" icon={Landmark} value={receipt.ifscCode || ''} onChange={e => updateField('ifscCode', e.target.value)} placeholder="Enter IFSC code" className="uppercase placeholder:normal-case" maxLength={20} />
              </Field>
              <Field label="Amount (₹) *" htmlFor="amount">
                <IconInput id="amount" icon={IndianRupee} value={receipt.amount || ''} onChange={e => updateField('amount', e.target.value)} placeholder="Enter amount" type="number" step="0.01" inputMode="decimal" />
              </Field>
              <Field label="Date (DD/MM/YYYY) *" htmlFor="date">
                <IconInput id="date" icon={CalendarDays} value={receipt.date || ''} onChange={e => updateField('date', e.target.value)} placeholder="DD/MM/YYYY" />
              </Field>
              <Field label="Status">
                <Select
                  value={receipt.status}
                  onValueChange={(v: 'success' | 'pending') => setReceipt(prev => prev ? { ...prev, status: v } : prev)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Success</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Bank Name *" htmlFor="bankName" className="sm:col-span-2">
                <IconInput id="bankName" icon={Building2} value={receipt.bankName || ''} onChange={e => updateField('bankName', e.target.value)} placeholder="State Bank of India" maxLength={100} />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={UserRound} title={<>Customer Details <span className="text-sm font-medium text-primary">(mobile required)</span></>}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Customer Mobile *" htmlFor="customerMobile" error={mobileError}>
                <IconInput
                  id="customerMobile"
                  icon={Smartphone}
                  value={receipt.customerMobile || ''}
                  onChange={e => updateMobile(e.target.value)}
                  placeholder="+91 9876543210"
                  type="tel"
                  inputMode="tel"
                  maxLength={14}
                  aria-invalid={!!mobileError}
                  className={mobileError ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15' : ''}
                />
              </Field>
              <Field label="Notes (optional)" htmlFor="notes">
                <IconInput id="notes" icon={StickyNote} value={receipt.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Additional notes..." maxLength={1000} />
              </Field>
              {customFieldDefs.map(cf => (
                <Field key={cf.id} label={cf.label} htmlFor={cf.id}>
                  <IconInput
                    id={cf.id}
                    icon={Tag}
                    value={receipt.customFields?.[cf.id] || ''}
                    onChange={e => updateCustomField(cf.id, e.target.value)}
                    placeholder={cf.label}
                    maxLength={500}
                  />
                </Field>
              ))}
            </div>

            <label htmlFor="dual" className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-accent/40 p-4 transition-colors hover:border-primary/30">
              <span className="flex items-center gap-3">
                <span className="icon-tile h-10 w-10"><Copy className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-navy">Print dual receipts</span>
                  <span className="block text-xs text-muted-foreground">Customer + retailer copy side by side</span>
                </span>
              </span>
              <Switch id="dual" checked={dualReceipt} onCheckedChange={setDualReceipt} />
            </label>
          </FormSection>

          <div className="card-soft flex flex-wrap items-center justify-end gap-3 p-4">
            <Button onClick={() => save(false)} variant="secondary" disabled={saving}>
              <Save /> Save Changes
            </Button>
            <Button onClick={handlePrint} disabled={saving} className="px-6">
              <Printer /> Save & Print
            </Button>
          </div>
        </div>

        <LivePreviewPanel
          title="Preview"
          className="animate-fade-in-up [animation-delay:0.15s]"
          footer={
            <Button onClick={handlePrint} disabled={saving} className="w-full rounded-full">
              <Printer /> Print Receipt
            </Button>
          }
        >
          <div className="print-area">
            <div className={dualReceipt ? 'grid grid-cols-2 gap-2' : ''}>
              <ReceiptPreview data={receipt} business={business} compact={dualReceipt} />
              {dualReceipt && <ReceiptPreview data={receipt} business={business} compact />}
            </div>
          </div>
        </LivePreviewPanel>
      </div>
    </div>
  );
}
