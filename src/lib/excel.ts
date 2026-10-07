import * as XLSX from 'xlsx';
import { CustomFieldDef, ReceiptData } from '@/types/receipt';

type Row = Record<string, string | number>;

export function buildReceiptRows(receipts: ReceiptData[], customFieldDefs: CustomFieldDef[] = []): Row[] {
  // One column per custom field that is defined in Settings or has a value on any
  // exported receipt (so values of since-deleted fields aren't silently dropped).
  const labels = new Map(customFieldDefs.filter(cf => cf.label.trim()).map(cf => [cf.id, cf.label.trim()]));
  for (const r of receipts) {
    for (const [id, value] of Object.entries(r.customFields || {})) {
      if (value && !labels.has(id)) labels.set(id, id);
    }
  }
  const customColumns = [...labels];

  return receipts.map(r => {
    const row: Row = {
      'Serial No': r.serialNumber,
      'Account Holder': r.accountHolder,
      'Account Number': r.accountNumber,
      'Bank Name': r.bankName || '',
      'IFSC Code': r.ifscCode,
      // Numeric so the column can be summed in Excel.
      'Amount (₹)': Number(r.amount) || 0,
      'Date': r.date,
      'Transaction ID': r.transactionId,
      'Reference No': r.referenceNumber,
      'Customer Mobile': r.customerMobile || '',
      'Status': r.status === 'success' ? 'Success' : 'Pending',
    };
    for (const [id, label] of customColumns) row[label] = r.customFields?.[id] || '';
    row['Notes'] = r.notes || '';
    row['Created At'] = r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '';
    return row;
  });
}

export function exportToExcel(
  receipts: ReceiptData[],
  filename: string,
  customFieldDefs: CustomFieldDef[] = [],
) {
  const data = buildReceiptRows(receipts, customFieldDefs);
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  // Size each column to its longest value (header included), capped for long notes.
  const headers = Object.keys(data[0] || {});
  ws['!cols'] = headers.map(h => ({
    wch: Math.min(40, Math.max(h.length, ...data.map(row => String(row[h] ?? '').length)) + 2),
  }));

  XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
