import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/PageHeader';
import { IconInput } from '@/components/IconInput';
import { FormSection, Field } from '@/components/FormSection';
import { LivePreviewPanel } from '@/components/LivePreviewPanel';
import { Spinner } from '@/components/EmptyState';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { receiptsApi, errorMessage } from '@/lib/api';
import { getSettings } from '@/lib/storage';
import { MOBILE_ERROR, isValidIndianMobile, normalizeIndianMobile, validateReceipt } from '@/lib/receiptValidation';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData } from '@/types/receipt';
import {
  Save, Printer, ArrowLeft, Pencil, User, CreditCard, Landmark, IndianRupee, CalendarDays, Hash, Search,
  Building2, StickyNote, Smartphone, Tag, Copy, type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

type TextField = 'accountHolder' | 'accountNumber' | 'ifscCode' | 'amount' | 'date'
  | 'transactionId' | 'referenceNumber' | 'bankName' | 'notes';

// Every field shown on the printed receipt is editable (customer mobile has its own input below).
const editableFields: { key: TextField; label: string; maxLength?: number }[] = [
  { key: 'accountHolder', label: 'Account Holder *', maxLength: 150 },
  { key: 'accountNumber', label: 'Account Number *', maxLength: 50 },
  { key: 'ifscCode', label: 'IFSC Code', maxLength: 20 },
  { key: 'amount', label: 'Amount (₹) *' },
  { key: 'date', label: 'Date (DD/MM/YYYY) *' },
  { key: 'transactionId', label: 'Transaction ID', maxLength: 100 },
  { key: 'referenceNumber', label: 'Reference No', maxLength: 100 },
  { key: 'bankName', label: 'Bank Name *', maxLength: 100 },
  { key: 'notes', label: 'Notes', maxLength: 1000 },
];

const fieldIcons: Record<TextField, LucideIcon> = {
  accountHolder: User, accountNumber: CreditCard, ifscCode: Landmark, amount: IndianRupee, date: CalendarDays,
  transactionId: Hash, referenceNumber: Search, bankName: Building2, notes: StickyNote,
};

export default function EditReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const business = useBusinessInfo();
  const customFieldDefs = useAuth().user?.customFields || [];

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
          <FormSection icon={Pencil} title="Edit Details">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {editableFields.map(f => (
                <Field key={f.key} label={f.label} htmlFor={f.key}>
                  <IconInput
                    id={f.key}
                    icon={fieldIcons[f.key]}
                    value={receipt[f.key] || ''}
                    onChange={e => updateField(f.key, e.target.value)}
                    maxLength={f.maxLength}
                    inputMode={f.key === 'amount' ? 'decimal' : undefined}
                  />
                </Field>
              ))}
              <Field label="Customer Mobile *" htmlFor="customerMobile" error={mobileError}>
                <IconInput
                  id="customerMobile"
                  icon={Smartphone}
                  value={receipt.customerMobile || ''}
                  onChange={e => updateMobile(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  maxLength={14}
                  aria-invalid={!!mobileError}
                />
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
            </div>

            {customFieldDefs.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 border-t pt-5 sm:grid-cols-2">
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
            )}

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

        <LivePreviewPanel title="Preview" className="animate-fade-in-up [animation-delay:0.15s]">
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
