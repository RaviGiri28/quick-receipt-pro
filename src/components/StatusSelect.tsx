import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { receiptsApi, errorMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { ReceiptData } from '@/types/receipt';

type Status = ReceiptData['status'];

// A status badge that opens a menu to change the receipt's status in place.
// The badge switches immediately and reverts if the server rejects the change.
export function StatusSelect({ receipt }: { receipt: ReceiptData }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>(receipt.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => setStatus(receipt.status), [receipt.status]);

  const change = async (next: Status) => {
    if (next === status) return;
    const previous = status;
    setStatus(next);
    setSaving(true);
    try {
      // saveType is left out so the receipt stays in the lists it is already in.
      await receiptsApi.update(receipt.id, { ...receipt, status: next, saveType: undefined });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Status updated', description: `Receipt #${receipt.serialNumber} marked ${next === 'success' ? 'Success' : 'Pending'}.` });
      trackEvent('receipt_status_changed', { status: next });
    } catch (err) {
      setStatus(previous);
      toast({ title: 'Could not update status', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={saving}
        title="Change status"
        className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-60"
      >
        <StatusBadge status={status}>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </StatusBadge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={status} onValueChange={v => change(v as Status)}>
          <DropdownMenuRadioItem value="success">✅ Success</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="pending">⏳ Pending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
