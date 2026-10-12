import { formatInr, maskAccountNumber } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { IconInput } from '@/components/IconInput';
import { FormSection, Field } from '@/components/FormSection';
import { LivePreviewPanel } from '@/components/LivePreviewPanel';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { AccountNumberInput, AccountMaskToggle } from '@/components/AccountNumberInput';
import { parseTransactionText } from '@/lib/receiptParser';
import { bankNameFromIfsc } from '@/lib/ifsc';
import { getSettings, saveSettings } from '@/lib/storage';
import { receiptsApi, errorMessage } from '@/lib/api';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useAuth } from '@/contexts/AuthContext';
import { MOBILE_ERROR, isValidIndianMobile, normalizeIndianMobile, validateReceipt } from '@/lib/receiptValidation';
import { ReceiptData, defaultReceipt } from '@/types/receipt';
import {
  Printer, Save, RotateCcw, ClipboardPaste, Sparkles, FileText, User, Landmark, IndianRupee,
  CalendarDays, Building2, UserRound, Smartphone, StickyNote, Tag, Copy, ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { TOUR_DEMO_PASTE_EVENT, TOUR_DEMO_SAVED_EVENT, TOUR_ENDED_EVENT, TOUR_PRINTED_EVENT } from '@/lib/tour';

const todayDate = () => new Date().toLocaleDateString('en-IN');

export default function CreateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const settings = getSettings();
  const customFieldDefs = useAuth().user?.customFields || [];
  const business = useBusinessInfo();

  const [receipt, setReceipt] = useState<Partial<ReceiptData>>({
    ...defaultReceipt,
    date: todayDate(),
    customFields: {},
  });
  const [pasteText, setPasteText] = useState('');
  const [dualReceipt, setDualReceipt] = useState(settings.dualReceipt);
  // Print only the last 5 digits of the account number; remembered on this device.
  const [maskAccount, setMaskAccount] = useState(settings.maskAccountNumber ?? true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [status, setStatus] = useState<'success' | 'pending'>('pending');
  const [saving, setSaving] = useState(false);
  // The receipt created from the current form contents. Set after a save so that
  // saving/printing again reuses it instead of creating a duplicate; any edit clears it.
  const [savedReceipt, setSavedReceipt] = useState<ReceiptData | null>(null);
  // The form holds the guided tour's demo transaction: it is saved as a demo receipt,
  // which the tour deletes, and cleared when the tour ends.
  const [isDemo, setIsDemo] = useState(false);

  // Applies a form edit; the edited form is a new receipt, so drop the old serial number.
  const editReceipt = (update: (prev: Partial<ReceiptData>) => Partial<ReceiptData>) => {
    setReceipt(prev => ({ ...update(prev), serialNumber: 0 }));
    setSavedReceipt(null);
  };

  // Whenever the IFSC changes (pasted or typed) and is a known code, fill in its bank name.
  useEffect(() => {
    const code = receipt.ifscCode || '';
    let cancelled = false;
    bankNameFromIfsc(code).then(name => {
      if (cancelled || !name) return;
      setReceipt(prev => (prev.ifscCode === code && prev.bankName !== name ? { ...prev, bankName: name } : prev));
    });
    return () => { cancelled = true; };
  }, [receipt.ifscCode]);

  const handlePaste = (text: string) => {
    setPasteText(text);
    if (text.trim()) {
      const parsed = parseTransactionText(text);
      editReceipt(prev => ({ ...prev, ...parsed, date: todayDate() }));
      toast({ title: 'Fields detected', description: 'Transaction details auto-filled.' });
    } else {
      // Clear all auto-filled fields when paste is cleared
      editReceipt(() => ({ ...defaultReceipt, date: todayDate(), customFields: {} }));
      setStatus('pending');
    }
  };

  // The guided tour pastes its demo transaction through Smart Paste, and the form is
  // cleared again when the tour ends.
  useEffect(() => {
    const onDemoPaste = (e: Event) => {
      handlePaste((e as CustomEvent<string>).detail);
      setIsDemo(true);
    };
    const onTourEnded = () => { if (isDemo) handleReset(); };
    window.addEventListener(TOUR_DEMO_PASTE_EVENT, onDemoPaste);
    window.addEventListener(TOUR_ENDED_EVENT, onTourEnded);
    return () => {
      window.removeEventListener(TOUR_DEMO_PASTE_EVENT, onDemoPaste);
      window.removeEventListener(TOUR_ENDED_EVENT, onTourEnded);
    };
  });

  const [mobileError, setMobileError] = useState('');

  const updateField = (field: string, value: string) => {
    editReceipt(prev => ({ ...prev, [field]: value }));
  };

  const updateMobile = (value: string) => {
    editReceipt(prev => ({ ...prev, customerMobile: normalizeIndianMobile(value) }));
    setMobileError(value && !isValidIndianMobile(value) ? MOBILE_ERROR : '');
  };

  // Shows the first problem with the form; true when it can be saved.
  const checkValid = (): boolean => {
    const problem = validateReceipt(receipt);
    if (problem) toast({ title: 'Please check the receipt', description: problem, variant: 'destructive' });
    return !problem;
  };

  const updateCustomField = (id: string, value: string) => {
    editReceipt(prev => ({
      ...prev,
      customFields: { ...(prev.customFields || {}), [id]: value },
    }));
  };

  const changeMaskAccount = (masked: boolean) => {
    setMaskAccount(masked);
    saveSettings({ ...getSettings(), maskAccountNumber: masked });
  };

  const handleReset = () => {
    editReceipt(() => ({ ...defaultReceipt, date: todayDate(), customFields: {} }));
    setPasteText('');
    setStatus('pending');
    setIsDemo(false);
  };

  // Creates the receipt on the server, or updates it if this form was already saved;
  // returns null (after showing the error) if it was rejected.
  const doSave = async (saveType: 'printed' | 'saved'): Promise<ReceiptData | null> => {
    if (!checkValid()) return null;
    setSaving(true);
    try {
      const payload = {
        ...receipt,
        status,
        maskAccountNumber: maskAccount,
        saveType,
        isDualPrint: saveType === 'printed' && dualReceipt,
      };
      const saved = savedReceipt
        ? await receiptsApi.update(savedReceipt.id, payload)
        : await receiptsApi.create(payload, { demo: isDemo });
      if (isDemo) window.dispatchEvent(new CustomEvent(TOUR_DEMO_SAVED_EVENT, { detail: saved.id }));
      setSavedReceipt(saved);
      setReceipt(prev => ({ ...prev, serialNumber: saved.serialNumber }));
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return saved;
    } catch (err) {
      toast({ title: 'Could not save receipt', description: errorMessage(err), variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await doSave('saved');
    if (!saved) return;
    trackEvent('receipt_saved', { source: 'create' });
    toast({ title: 'Receipt saved', description: `Receipt #${saved.serialNumber} saved successfully.` });
  };

  const confirmPrint = async () => {
    setShowPrintDialog(false);
    const saved = await doSave('printed');
    if (!saved) return;
    trackEvent('receipt_printed', { source: 'create', dual: dualReceipt });
    window.dispatchEvent(new Event(TOUR_PRINTED_EVENT));
    // Give React a moment to render the serial number into the preview before printing.
    setTimeout(() => window.print(), 300);
    toast({ title: 'Receipt printed & saved', description: `Receipt #${saved.serialNumber} saved.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        eyebrow="Receipts / New"
        title="Create Receipt"
        description="Enter the transaction details below to generate a professional receipt."
        actions={
          <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-card px-4 py-2.5 text-sm font-medium text-primary shadow-sm">
            <span className="icon-tile h-9 w-9 rounded-full"><Printer className="h-4 w-4" /></span>
            <span className="leading-tight">Print on 58mm/80mm<br />Thermal Printer</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
        {/* Form */}
        <div className="stagger space-y-6 no-print">
          <section className="card-soft relative overflow-hidden border-dashed border-primary/30 p-5 sm:p-6" data-tour="smart-paste">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative mb-4 flex items-center gap-3">
              <div className="icon-tile h-11 w-11 bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-navy">Smart Paste</h2>
                <p className="text-sm text-muted-foreground">Paste the transaction message — fields fill in automatically.</p>
              </div>
              <Button onClick={handleReset} variant="outline" size="sm" className="group shrink-0 self-start">
                <RotateCcw className="transition-transform duration-500 group-hover:-rotate-180" /> Reset
              </Button>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Paste raw transaction details here... Account number, name, IFSC, amount, etc. will be auto-detected."
                value={pasteText}
                onChange={e => handlePaste(e.target.value)}
                // onChange also fires while typing; count real pastes only.
                onPaste={e => trackEvent('smart_paste', {
                  fields_detected: Object.values(parseTransactionText(e.clipboardData.getData('text'))).filter(Boolean).length,
                })}
                rows={3}
                className="pr-10"
              />
              <ClipboardPaste className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </section>

          <FormSection icon={FileText} title="Transaction Details" tour="transaction-details" actions={<span data-tour="mask-toggle"><AccountMaskToggle masked={maskAccount} onChange={changeMaskAccount} /></span>}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Account Holder *" htmlFor="accountHolder">
                <IconInput id="accountHolder" icon={User} value={receipt.accountHolder || ''} onChange={e => updateField('accountHolder', e.target.value)} placeholder="Enter account holder name" />
              </Field>
              <Field label="Account Number *" htmlFor="accountNumber">
                <AccountNumberInput value={receipt.accountNumber || ''} masked={maskAccount} onChange={v => updateField('accountNumber', v)} />
              </Field>
              <Field label="IFSC Code" htmlFor="ifscCode">
                <IconInput id="ifscCode" icon={Landmark} value={receipt.ifscCode || ''} onChange={e => updateField('ifscCode', e.target.value)} placeholder="Enter IFSC code" className="uppercase placeholder:normal-case" />
              </Field>
              <Field label="Amount (₹) *" htmlFor="amount">
                <IconInput id="amount" icon={IndianRupee} value={receipt.amount || ''} onChange={e => updateField('amount', e.target.value)} placeholder="Enter amount" type="number" step="0.01" inputMode="decimal" />
              </Field>
              <Field label="Date" htmlFor="date">
                <IconInput id="date" icon={CalendarDays} value={receipt.date || todayDate()} readOnly className="cursor-not-allowed bg-muted/60" />
              </Field>
              <Field label="Status">
                <Select value={status} onValueChange={(v: 'success' | 'pending') => { setStatus(v); editReceipt(prev => prev); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">✅ Success</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Bank Name *" htmlFor="bankName" className="sm:col-span-2">
                <IconInput id="bankName" icon={Building2} value={receipt.bankName || ''} onChange={e => updateField('bankName', e.target.value)} placeholder="State Bank of India" />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={UserRound} tour="customer-details" title={<>Customer Details <span className="text-sm font-medium text-primary">(mobile required)</span></>}>
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

          <div className="card-soft flex flex-wrap items-center justify-end gap-3 p-4" data-tour="print-actions">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave} variant="secondary" disabled={saving || !!savedReceipt}>
                <Save /> {savedReceipt ? `Saved #${savedReceipt.serialNumber}` : 'Save Receipt'}
              </Button>
              <Button onClick={() => { if (checkValid()) setShowPrintDialog(true); }} disabled={saving} className="group px-6">
                <Printer /> Generate & Print <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <LivePreviewPanel
          className="animate-fade-in-up [animation-delay:0.15s]"
          tour="live-preview"
          footer={
            <Button onClick={() => { if (checkValid()) setShowPrintDialog(true); }} disabled={saving} className="w-full rounded-full">
              <Printer /> Print Receipt
            </Button>
          }
        >
          <div className="print-area">
            <div className={dualReceipt ? 'grid grid-cols-2 gap-2' : ''}>
              <ReceiptPreview data={{ ...receipt, maskAccountNumber: maskAccount }} business={business} compact />
              {dualReceipt && <ReceiptPreview data={{ ...receipt, maskAccountNumber: maskAccount }} business={business} compact />}
            </div>
          </div>
        </LivePreviewPanel>
      </div>

      {/* Print Confirmation */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="icon-tile mb-2 h-12 w-12"><Printer className="h-6 w-6" /></div>
            <DialogTitle className="text-xl">Confirm Print</DialogTitle>
            <DialogDescription>Please review all details before printing. The receipt will be saved automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl bg-accent/50 p-4 text-sm">
            <p className="flex justify-between gap-4"><span className="text-muted-foreground">Account</span><strong className="text-right">{receipt.accountHolder} ({maskAccount ? maskAccountNumber(receipt.accountNumber || '') : receipt.accountNumber})</strong></p>
            <p className="flex justify-between gap-4"><span className="text-muted-foreground">Amount</span><strong>{formatInr(receipt.amount || 0)}</strong></p>
            <p className="flex justify-between gap-4"><span className="text-muted-foreground">IFSC</span><strong>{receipt.ifscCode}</strong></p>
            <p className="flex justify-between gap-4"><span className="text-muted-foreground">Date</span><strong>{receipt.date}</strong></p>
            {dualReceipt && <p className="pt-1 text-primary">📄 Dual receipt enabled</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Cancel</Button>
            <Button onClick={confirmPrint} disabled={saving}><Printer /> Confirm & Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
