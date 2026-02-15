import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { getReceiptById, saveReceipt, getSettings } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData, defaultReceipt } from '@/types/receipt';
import { Save, Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const editableFields = [
  { key: 'accountHolder', label: 'Account Holder' },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'ifscCode', label: 'IFSC Code' },
  { key: 'amount', label: 'Amount (₹)' },
  { key: 'date', label: 'Date' },
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'referenceNumber', label: 'Reference No' },
  { key: 'notes', label: 'Notes' },
];

export default function EditReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();

  const business = {
    name: user?.business?.name || 'Quick Receipt',
    logo: user?.business?.logo || null,
    showLogo: user?.business?.showLogo ?? settings.showLogo,
    showName: user?.business?.showName ?? settings.showName,
    showWatermark: user?.business?.showWatermark ?? settings.showWatermark,
    primaryColor: user?.business?.primaryColor || settings.primaryColor,
    address: user?.business?.address || '',
    phone: user?.business?.phone || '',
  };

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (id) {
      const found = getReceiptById(id);
      if (found) setReceipt(found);
      else navigate('/history');
    }
  }, [id, navigate]);

  if (!receipt) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const updateField = (field: string, value: string) => {
    setReceipt(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = () => {
    if (receipt) {
      saveReceipt(receipt);
      toast({ title: 'Receipt updated', description: 'Changes saved successfully.' });
    }
  };

  const handlePrint = () => {
    handleSave();
    setTimeout(() => window.print(), 300);
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
                    value={(receipt as any)[f.key] || ''}
                    onChange={e => updateField(f.key, e.target.value)}
                  />
                </div>
              ))}
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
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
              <Button onClick={handlePrint} variant="secondary" className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 no-print">Preview</h3>
          <div className="print-area">
            <ReceiptPreview data={receipt} business={business} />
          </div>
        </div>
      </div>
    </div>
  );
}
