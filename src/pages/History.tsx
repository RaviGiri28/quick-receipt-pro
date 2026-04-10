import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { getReceipts, getSettings } from '@/lib/storage';
import { exportToExcel } from '@/lib/excel';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData } from '@/types/receipt';
import { Search, Download, Eye, FileSpreadsheet, Calendar, Pencil, FileX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const settings = getSettings();
  const allReceipts = getReceipts();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [showExcelView, setShowExcelView] = useState(false);

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

  const filtered = useMemo(() => {
    let results = allReceipts;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        r =>
          r.accountNumber.toLowerCase().includes(q) ||
          r.accountHolder.toLowerCase().includes(q) ||
          String(r.serialNumber).includes(q)
      );
    }
    if (dateFrom) results = results.filter(r => new Date(r.createdAt) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      results = results.filter(r => new Date(r.createdAt) <= to);
    }
    return results;
  }, [allReceipts, search, dateFrom, dateTo]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: 'No data', description: 'No receipts to export.', variant: 'destructive' });
      return;
    }
    exportToExcel(filtered, `receipts-${dateFrom || 'all'}-to-${dateTo || 'now'}`);
    toast({ title: 'Exported', description: `${filtered.length} receipts exported.` });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold">Receipt History</h1>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search by account, name, or serial no..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>
            <Button onClick={handleExport} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setShowExcelView(true)} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> View Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No Records Available</p>
              <p className="text-sm">Create your first receipt to see it here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead>IFSC</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Txn ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">#{r.serialNumber}</TableCell>
                    <TableCell>{r.accountHolder}</TableCell>
                    <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{r.ifscCode}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(r.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.transactionId}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'success' ? 'default' : 'secondary'}>
                        {r.status === 'success' ? 'Success' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewReceipt(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/edit/${r.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog - consistent with SavedReceipts */}
      <Dialog open={!!previewReceipt} onOpenChange={() => setPreviewReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Receipt Preview</DialogTitle></DialogHeader>
          {previewReceipt && (
            <div className="print-area">
              <ReceiptPreview data={previewReceipt} business={business} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Excel View Dialog */}
      <Dialog open={showExcelView} onOpenChange={setShowExcelView}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Receipt Data View</DialogTitle></DialogHeader>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No Records Available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold w-16">S.No</TableHead>
                    <TableHead className="font-bold">Account Holder</TableHead>
                    <TableHead className="font-bold">Account No</TableHead>
                    <TableHead className="font-bold">IFSC Code</TableHead>
                    <TableHead className="font-bold text-right">Amount (₹)</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Transaction ID</TableHead>
                    <TableHead className="font-bold">Reference No</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="font-medium">#{r.serialNumber}</TableCell>
                      <TableCell>{r.accountHolder}</TableCell>
                      <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ifscCode}</TableCell>
                      <TableCell className="text-right font-medium">₹{Number(r.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="font-mono text-xs">{r.transactionId}</TableCell>
                      <TableCell className="font-mono text-xs">{r.referenceNumber}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'success' ? 'default' : 'secondary'}>
                          {r.status === 'success' ? 'Success' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
