import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { parseTransactionText } from '@/lib/receiptParser';
import { saveReceipt, getNextSerial, getSettings } from '@/lib/storage';
import { exportToExcel } from '@/lib/excel';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData, defaultReceipt } from '@/types/receipt';
import { Printer, Save, RotateCcw, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateReceipt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = getSettings();

  const business = {
    name: user?.business?.name || 'Quick Receipt',
    logo: user?.business?.logo || null,
    showLogo: user?.business?.showLogo ?? settings.showLogo,
    showName: user?.business?.showName ?? settings.showName,
    showWatermark: user?.business?.showWatermark ?? settings.showWatermark,
    primaryColor: user?.business?.primaryColor || settings.primaryColor,
  };

  const [receipt, setReceipt] = useState<Partial<ReceiptData>>({
    ...defaultReceipt,
    date: new Date().toLocaleDateString('en-IN'),
  });
  const [pasteText, setPasteText] = useState('');
  const [dualReceipt, setDualReceipt] = useState(settings.dualReceipt);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [status, setStatus] = useState<'success' | 'pending'>('success');

  const handlePaste = (text: string) => {
    setPasteText(text);
    if (text.trim()) {
      const parsed = parseTransactionText(text);
      setReceipt(prev => ({ ...prev, ...parsed }));
      toast({ title: 'Fields detected', description: 'Transaction details auto-filled.' });
    }
  };

  const updateField = (field: string, value: string) => {
    setReceipt(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setReceipt({ ...defaultReceipt, date: new Date().toLocaleDateString('en-IN') });
    setPasteText('');
    setStatus('success');
  };

  const doSave = () => {
    const serialNumber = getNextSerial(receipt.accountNumber || 'unknown');
    const saved: ReceiptData = {
      ...defaultReceipt,
      ...receipt,
      id: crypto.randomUUID(),
      serialNumber,
      status,
      createdAt: new Date().toISOString(),
      notes: receipt.notes || '',
    };
    saveReceipt(saved);
    return saved;
  };

  const handleSave = () => {
    const saved = doSave();
    exportToExcel([saved], `receipt-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}`);
    toast({ title: 'Receipt saved', description: `Receipt #${saved.serialNumber} saved and exported.` });
  };

  const confirmPrint = () => {
    setShowPrintDialog(false);
    const saved = doSave();
    setReceipt(prev => ({ ...prev, serialNumber: saved.serialNumber }));
    setTimeout(() => window.print(), 300);
    toast({ title: 'Receipt printed & saved', description: `Receipt #${saved.serialNumber} saved.` });
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6">Create Receipt</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6 no-print">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardPaste className="h-4 w-4" /> Paste Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste raw transaction details here... Account number, name, IFSC, amount, etc. will be auto-detected."
                value={pasteText}
                onChange={e => handlePaste(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Account Holder</Label><Input value={receipt.accountHolder || ''} onChange={e => updateField('accountHolder', e.target.value)} placeholder="John Doe" /></div>
                <div><Label>Account Number</Label><Input value={receipt.accountNumber || ''} onChange={e => updateField('accountNumber', e.target.value)} placeholder="1234567890" /></div>
                <div><Label>IFSC Code</Label><Input value={receipt.ifscCode || ''} onChange={e => updateField('ifscCode', e.target.value)} placeholder="SBIN0001234" /></div>
                <div><Label>Amount (₹)</Label><Input value={receipt.amount || ''} onChange={e => updateField('amount', e.target.value)} placeholder="5000" type="number" /></div>
                <div><Label>Date</Label><Input value={receipt.date || ''} onChange={e => updateField('date', e.target.value)} placeholder="DD/MM/YYYY" /></div>
                <div><Label>Transaction ID</Label><Input value={receipt.transactionId || ''} onChange={e => updateField('transactionId', e.target.value)} placeholder="TXN123456" /></div>
                <div><Label>Reference Number</Label><Input value={receipt.referenceNumber || ''} onChange={e => updateField('referenceNumber', e.target.value)} placeholder="REF789" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: 'success' | 'pending') => setStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">✅ Success</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notes (optional)</Label><Input value={receipt.notes || ''} onChange={e => updateField('notes', e.target.value)} placeholder="Additional notes..." /></div>
              <div className="flex items-center gap-2">
                <Checkbox checked={dualReceipt} onCheckedChange={(v) => setDualReceipt(!!v)} id="dual" />
                <Label htmlFor="dual" className="text-sm cursor-pointer">Print dual receipts (customer + retailer copy)</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowPrintDialog(true)} className="gap-2">
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
            <Button onClick={handleSave} variant="secondary" className="gap-2">
              <Save className="h-4 w-4" /> Save Receipt
            </Button>
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 no-print">Live Preview</h3>
          <div className="print-area">
            <div className={dualReceipt ? 'grid grid-cols-2 gap-4' : ''}>
              <ReceiptPreview data={receipt} business={business} />
              {dualReceipt && <ReceiptPreview data={receipt} business={business} />}
            </div>
          </div>
        </div>
      </div>

      {/* Print Confirmation */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Print</DialogTitle>
            <DialogDescription>Please review all details before printing. The receipt will be saved automatically.</DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2 py-4">
            <p><strong>Account:</strong> {receipt.accountHolder} ({receipt.accountNumber})</p>
            <p><strong>Amount:</strong> ₹ {Number(receipt.amount || 0).toLocaleString('en-IN')}</p>
            <p><strong>IFSC:</strong> {receipt.ifscCode}</p>
            <p><strong>Date:</strong> {receipt.date}</p>
            {dualReceipt && <p className="text-muted-foreground">📄 Dual receipt enabled</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Cancel</Button>
            <Button onClick={confirmPrint}>Confirm & Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
