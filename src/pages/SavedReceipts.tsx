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
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptData } from '@/types/receipt';
import { Search, Eye, Pencil, Printer, FileX } from 'lucide-react';

export default function SavedReceipts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();
  const allReceipts = getReceipts();

  const [search, setSearch] = useState('');
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);

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
    if (!search) return allReceipts;
    const q = search.toLowerCase();
    return allReceipts.filter(
      r =>
        r.accountNumber.toLowerCase().includes(q) ||
        r.accountHolder.toLowerCase().includes(q) ||
        String(r.serialNumber).includes(q)
    );
  }, [allReceipts, search]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold">Saved Receipts</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by account, name, or serial no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No Records Available</p>
              <p className="text-sm">Save a receipt to see it here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">#{r.serialNumber}</TableCell>
                    <TableCell>{r.accountHolder}</TableCell>
                    <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(r.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{r.date}</TableCell>
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
                        <Button size="sm" variant="ghost" onClick={() => {
                          setPreviewReceipt(r);
                          setTimeout(() => window.print(), 500);
                        }}>
                          <Printer className="h-4 w-4" />
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

      {/* Preview Dialog */}
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
    </div>
  );
}
