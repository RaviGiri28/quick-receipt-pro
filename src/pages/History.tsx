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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pager } from '@/components/Pager';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { receiptsApi, errorMessage, ReceiptFilters } from '@/lib/api';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import { exportToExcel } from '@/lib/excel';
import { ReceiptData } from '@/types/receipt';
import { Search, Download, Eye, FileSpreadsheet, Calendar, Pencil, FileX, FilePlus, History as HistoryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HistoryPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const business = useBusinessInfo();
  const customFieldDefs = useAuth().user?.customFields || [];
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState<'all' | 'success' | 'pending'>(
    searchParams.get('status') === 'pending' ? 'pending' : 'all',
  );
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [showExcelView, setShowExcelView] = useState(false);

  const debouncedSearch = useDebounce(search);
  const filters: ReceiptFilters = {
    search: debouncedSearch,
    status: status === 'all' ? undefined : status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  useEffect(() => setPage(1), [debouncedSearch, status, dateFrom, dateTo]);

  // The header search box navigates here with ?q=; follow it while already on this page.
  const queryParam = searchParams.get('q');
  useEffect(() => {
    if (queryParam !== null) setSearch(queryParam);
  }, [queryParam]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['receipts', 'list', filters, page],
    queryFn: () => receiptsApi.list(filters, page),
    placeholderData: keepPreviousData,
  });
  const receipts = data?.receipts ?? [];

  // The data view and export cover every matching receipt, not just this page.
  const { data: allMatching = [], isFetching: loadingAll } = useQuery({
    queryKey: ['receipts', 'all', filters],
    queryFn: () => receiptsApi.listAll(filters),
    enabled: showExcelView,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await receiptsApi.listAll(filters);
      if (rows.length === 0) {
        toast({ title: 'No data', description: 'No receipts to export.', variant: 'destructive' });
        return;
      }
      exportToExcel(rows, `receipts-${dateFrom || 'all'}-to-${dateTo || 'now'}`, customFieldDefs);
      toast({ title: 'Exported', description: `${rows.length} receipts exported.` });
    } catch (err) {
      toast({ title: 'Export failed', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="stagger space-y-6">
      <PageHeader icon={HistoryIcon} title="Receipt History" description="Search, filter and export every receipt you have printed." />

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
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
            <Select value={status} onValueChange={(v: 'all' | 'success' | 'pending') => setStatus(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">✅ Success</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="secondary" className="gap-2" disabled={exporting}>
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
        <CardContent className="overflow-x-auto p-2 sm:p-4">
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <EmptyState icon={FileX} title="Could not load receipts" description={errorMessage(error)} />
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={FileX}
              title="No Records Available"
              description="Create your first receipt to see it here."
              action={<Button onClick={() => navigate('/create')}><FilePlus /> Create Receipt</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-accent/60 hover:bg-accent/60 [&>th]:h-11 [&>th]:font-semibold [&>th]:text-navy [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl">
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
                {receipts.map(r => (
                  <TableRow key={r.id} className="group transition-colors hover:bg-accent/50">
                    <TableCell><span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-primary">#{r.serialNumber}</span></TableCell>
                    <TableCell className="font-semibold text-navy">{r.accountHolder}</TableCell>
                    <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{r.ifscCode}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-navy">{formatInr(r.amount)}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.transactionId}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary" title="Preview" onClick={() => setPreviewReceipt(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary" title="Edit" onClick={() => navigate(`/edit/${r.id}`)}>
                          <Pencil className="h-4 w-4" />
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

      {/* Preview Dialog - consistent with SavedReceipts */}
      <Dialog open={!!previewReceipt} onOpenChange={() => setPreviewReceipt(null)}>
        <DialogContent className="max-w-lg bg-gradient-to-b from-accent/60 to-card">
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
          {loadingAll ? (
            <Spinner />
          ) : allMatching.length === 0 ? (
            <EmptyState icon={FileX} title="No Records Available" />
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
                  {allMatching.map((r, i) => (
                    <TableRow key={r.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell><span className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-primary">#{r.serialNumber}</span></TableCell>
                      <TableCell className="font-semibold text-navy">{r.accountHolder}</TableCell>
                      <TableCell className="font-mono text-sm">{r.accountNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{r.ifscCode}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-navy">{formatInr(r.amount)}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="font-mono text-xs">{r.transactionId}</TableCell>
                      <TableCell className="font-mono text-xs">{r.referenceNumber}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
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
