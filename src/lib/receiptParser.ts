import { ReceiptData } from '@/types/receipt';

export function parseTransactionText(text: string): Partial<ReceiptData> {
  const result: Partial<ReceiptData> = {};

  // Account number
  const accMatch = text.match(/(?:account|a\/c|ac)\s*(?:no|number|num|#)?\s*[:\-]?\s*(\d{9,18})/i);
  if (accMatch) result.accountNumber = accMatch[1];
  else {
    const numMatch = text.match(/\b(\d{9,18})\b/);
    if (numMatch) result.accountNumber = numMatch[1];
  }

  // IFSC
  const ifscMatch = text.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
  if (ifscMatch) result.ifscCode = ifscMatch[1].toUpperCase();

  // Amount
  const amtMatch = text.match(/(?:amount|amt|₹|inr|rs\.?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i);
  if (amtMatch) result.amount = amtMatch[1].replace(/,/g, '');

  // Date
  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  if (dateMatch) result.date = dateMatch[1];

  // Name
  const nameMatch = text.match(/(?:name|holder|beneficiary|payee)\s*[:\-]?\s*([A-Za-z\s.]+)/i);
  if (nameMatch) result.accountHolder = nameMatch[1].trim();

  // UTR/Reference
  const refMatch = text.match(/(?:utr|ref|reference|txn|transaction)\s*(?:no|number|id)?\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (refMatch) {
    if (refMatch[0].toLowerCase().includes('txn') || refMatch[0].toLowerCase().includes('transaction')) {
      result.transactionId = refMatch[1];
    } else {
      result.referenceNumber = refMatch[1];
    }
  }

  return result;
}
