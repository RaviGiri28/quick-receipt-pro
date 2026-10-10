import { formatInr } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, Spinner } from '@/components/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { Pager } from '@/components/Pager';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { receiptsApi, errorMessage } from '@/lib/api';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { getSettings } from '@/lib/storage';
import { useDebounce } from '@/hooks/use-debounce';
import { ReceiptData } from '@/types/receipt';
import { Search, Eye, Pencil, Printer, FileX, FilePlus, Bookmark } from 'lucide-react';

export default function SavedReceipts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const business = useBusinessInfo();

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  // The dashboard's Pending Receipts card links here with ?status=pending.
  const [status, setStatus] = useState<'all' | 'success' | 'pending'>(
    searchParams.get('status') === 'pending' ? 'pending' : 'all',
  );
  const [page, setPage] = useState(1);
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [printDual, setPrintDual] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => setPage(1), [debouncedSearch, status]);

  const filters = { type: 'saved' as const, search: debouncedSearch, status: status === 'all' ? undefined : status };
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
  // which moves a Success receipt from Saved Receipts to History only (Pending ones stay saved).
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
    trackEvent('receipt_printed', { source: 'saved', dual });
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="stagger space-y-6">
      <PageHeader
        icon={Bookmark}
        title="Saved Receipts"
        description="Receipts you saved for later. Printing a Success receipt moves it to History."
        actions={<Button onClick={() => navigate('/create')}><FilePlus /> New Receipt</Button>}
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <div className="relative min-w-0 max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by account, name, or serial no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v: 'all' | 'success' | 'pending') => setStatus(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">✅ Success</SelectItem>
              <SelectItem value="pending">⏳ Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-2 sm:p-4">
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <EmptyState icon={FileX} title="Could not load receipts" description={errorMessage(error)} />
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No Saved Receipts"
              description="Save a receipt to see it here."
              action={<Button onClick={() => navigate('/create')}><FilePlus /> Create Receipt</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-accent/60 hover:bg-accent/60 [&>th]:h-11 [&>th]:font-semibold [&>th]:text-navy [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl">
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
                  <TableRow key={r.id} className="group transition-colors hover:bg-accent/50">
                    <TableCell><span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-primary">#{r.serialNumber}</span></TableCell>
                    <TableCell className="font-semibold text-navy">{r.accountHolder}</TableCell>
                    <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-navy">{formatInr(r.amount)}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary" title="Preview" onClick={() => openPreview(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary" title="Edit" onClick={() => navigate(`/edit/${r.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground" title="Print" onClick={() => handlePrint(r)} disabled={printingId !== null}>
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
        <DialogContent className={`bg-gradient-to-b from-accent/60 to-card ${printDual ? 'max-w-3xl' : 'max-w-lg'}`}>
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
