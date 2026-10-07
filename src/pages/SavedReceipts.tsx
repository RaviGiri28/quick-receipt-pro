import { formatInr } from '@/lib/utils';
import { useState, useEffect } from 'react';
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
import { Pager } from '@/components/Pager';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { receiptsApi, errorMessage } from '@/lib/api';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useToast } from '@/hooks/use-toast';
import { getSettings } from '@/lib/storage';
import { useDebounce } from '@/hooks/use-debounce';
import { ReceiptData } from '@/types/receipt';
import { Search, Eye, Pencil, Printer, FileX } from 'lucide-react';

export default function SavedReceipts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const business = useBusinessInfo();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [printDual, setPrintDual] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => setPage(1), [debouncedSearch]);

  const filters = { type: 'saved' as const, search: debouncedSearch };
  const { data, isLoading, error } = useQuery({
    queryKey: ['receipts', 'list', filters, page],
    queryFn: () => receiptsApi.list(filters, page),
    placeholderData: keepPreviousData,
  });
  const receipts = data?.receipts ?? [];

  const openPreview = (r: ReceiptData) => {
    setPrintDual(false);
    setPreviewReceipt(r);
  };

  // Prints with this device's dual-receipt setting and marks the receipt as printed,
  // which moves it from Saved Receipts to History only.
  const handlePrint = async (r: ReceiptData) => {
    const dual = getSettings().dualReceipt;
    setPrintingId(r.id);
    setPrintDual(dual);
    setPreviewReceipt(r);
    try {
      await receiptsApi.update(r.id, { ...r, saveType: 'printed', isDualPrint: dual });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    } catch (err) {
      // Still print: the paper copy is what the customer is waiting for.
      toast({ title: 'Printed, but not marked as printed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setPrintingId(null);
    }
    setTimeout(() => window.print(), 300);
  };

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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileX className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">Could not load receipts</p>
              <p className="text-sm">{errorMessage(error)}</p>
            </div>
          ) : receipts.length === 0 ? (
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
                {receipts.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">#{r.serialNumber}</TableCell>
                    <TableCell>{r.accountHolder}</TableCell>
                    <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                    <TableCell className="text-right font-medium">{formatInr(r.amount)}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'success' ? 'default' : 'secondary'}>
                        {r.status === 'success' ? 'Success' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openPreview(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/edit/${r.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handlePrint(r)} disabled={printingId !== null}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewReceipt} onOpenChange={() => setPreviewReceipt(null)}>
        <DialogContent className={printDual ? 'max-w-3xl' : 'max-w-lg'}>
          <DialogHeader><DialogTitle>Receipt Preview</DialogTitle></DialogHeader>
          {previewReceipt && (
            <div className="print-area">
              <div className={printDual ? 'grid grid-cols-2 gap-2' : ''}>
                <ReceiptPreview data={previewReceipt} business={business} compact={printDual} />
                {printDual && <ReceiptPreview data={previewReceipt} business={business} compact />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
