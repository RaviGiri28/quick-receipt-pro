import * as XLSX from 'xlsx';
import { ReceiptData } from '@/types/receipt';

export function exportToExcel(receipts: ReceiptData[], filename: string) {
  const data = receipts.map(r => ({
    'Serial No': r.serialNumber,
    'Account Holder': r.accountHolder,
    'Account Number': r.accountNumber,
    'IFSC Code': r.ifscCode,
    'Amount (₹)': r.amount,
    'Date': r.date,
    'Transaction ID': r.transactionId,
    'Reference No': r.referenceNumber,
    'Status': r.status === 'success' ? 'Success' : 'Pending',
    'Created At': r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    { wch: 10 }, { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Receipts');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
