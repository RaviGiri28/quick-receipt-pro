import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Save, Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TextField = 'accountHolder' | 'accountNumber' | 'ifscCode' | 'amount' | 'date'
  | 'transactionId' | 'referenceNumber' | 'bankName' | 'notes';

// Every field shown on the printed receipt is editable (customer mobile has its own input below).
const editableFields: { key: TextField; label: string; maxLength?: number }[] = [
  { key: 'accountHolder', label: 'Account Holder *', maxLength: 150 },
  { key: 'accountNumber', label: 'Account Number *', maxLength: 50 },
  { key: 'ifscCode', label: 'IFSC Code', maxLength: 20 },
  { key: 'amount', label: 'Amount (₹) *' },
  { key: 'date', label: 'Date (DD/MM/YYYY) *' },
  { key: 'transactionId', label: 'Transaction ID *', maxLength: 100 },
  { key: 'referenceNumber', label: 'Reference No', maxLength: 100 },
  { key: 'bankName', label: 'Bank Name *', maxLength: 100 },
  { key: 'notes', label: 'Notes', maxLength: 1000 },
];

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
    setDualReceipt(loaded.saveType === 'printed' ? !!loaded.isDualPrint : getSettings().dualReceipt);
  }, [loaded]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Receipt not available', description: errorMessage(error), variant: 'destructive' });
      navigate('/history');
    }
  }, [error, navigate, toast]);

  if (!receipt) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
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

  // Saves the edits; printing also marks the receipt as printed (it leaves Saved Receipts).
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
        print ? { ...receipt, saveType: 'printed', isDualPrint: dualReceipt } : receipt,
      );
      setReceipt(updated);
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: print ? 'Receipt saved & printing' : 'Receipt updated', description: 'Changes saved successfully.' });
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
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Receipt #{receipt.serialNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="no-print">
          <CardHeader>
            <CardTitle className="text-base">Edit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editableFields.map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    value={receipt[f.key] || ''}
                    onChange={e => updateField(f.key, e.target.value)}
                    maxLength={f.maxLength}
                    inputMode={f.key === 'amount' ? 'decimal' : undefined}
                  />
                </div>
              ))}
              <div>
                <Label>Customer Mobile *</Label>
                <Input
                  value={receipt.customerMobile || ''}
                  onChange={e => updateMobile(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  maxLength={14}
                  aria-invalid={!!mobileError}
                />
                {mobileError && <p className="text-xs text-destructive mt-1">{mobileError}</p>}
              </div>
              <div>
                <Label>Status</Label>
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
              </div>
            </div>

            {customFieldDefs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                {customFieldDefs.map(cf => (
                  <div key={cf.id}>
                    <Label>{cf.label}</Label>
                    <Input
                      value={receipt.customFields?.[cf.id] || ''}
                      onChange={e => updateCustomField(cf.id, e.target.value)}
                      placeholder={cf.label}
                      maxLength={500}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox checked={dualReceipt} onCheckedChange={(v) => setDualReceipt(!!v)} id="dual" />
              <Label htmlFor="dual" className="text-sm cursor-pointer">Print dual receipts (customer + retailer copy)</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => save(false)} className="gap-2" disabled={saving}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
              <Button onClick={handlePrint} variant="secondary" className="gap-2" disabled={saving}>
                <Printer className="h-4 w-4" /> Save & Print
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 no-print">Preview</h3>
          <div className="print-area">
            <div className={dualReceipt ? 'grid grid-cols-2 gap-2' : ''}>
              <ReceiptPreview data={receipt} business={business} compact={dualReceipt} />
              {dualReceipt && <ReceiptPreview data={receipt} business={business} compact />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
