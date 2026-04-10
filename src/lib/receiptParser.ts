import { ReceiptData } from '@/types/receipt';

// Helper: detect account number (12-16 digits)
function isAccountNumber(token: string): boolean {
  return /^\d{12,16}$/.test(token);
}

// Helper: detect IFSC code
function isIfscCode(token: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(token);
}

// Helper: detect amount (numeric, not 12-16 digits, range 1–10000000)
function isAmount(token: string): boolean {
  if (!/^\d+$/.test(token)) return false;
  const num = parseInt(token, 10);
  return num >= 1 && num <= 10000000 && !isAccountNumber(token);
}

// Helper: detect transaction ID (2-5 uppercase letters + 3+ digits)
function isTransactionId(token: string): boolean {
  return /^[A-Z]{2,5}\d{3,}$/i.test(token);
}

// Helper: detect reference number (REF or UTR prefix)
function isReferenceNumber(token: string): boolean {
  return /^(REF|UTR)[A-Z0-9]+$/i.test(token);
}

// Helper: detect name token (only alphabets and dots)
function isNameToken(token: string): boolean {
  return /^[A-Za-z.]+$/.test(token) && token.length > 1;
}

// Keyword-based extraction (higher priority)
function extractWithKeywords(text: string): Partial<ReceiptData> {
  const result: Partial<ReceiptData> = {};

  // Account holder name
  const nameMatch = text.match(/(?:account\s*holder\s*name|holder\s*name|name|beneficiary|payee)\s*[:\-]?\s*([A-Za-z\s.]+?)(?=\s*(?:account\s*number|a\/c|ifsc|amount|transaction|reference|$))/i);
  if (nameMatch) result.accountHolder = nameMatch[1].trim();

  // Account number
  const accMatch = text.match(/(?:account\s*(?:no|number|num)?|a\/c)\s*[:\-]?\s*(\d{9,18})/i);
  if (accMatch) result.accountNumber = accMatch[1];

  // IFSC
  const ifscMatch = text.match(/(?:ifsc\s*(?:code)?)\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
  if (ifscMatch) result.ifscCode = ifscMatch[1].toUpperCase();

  // Amount
  const amtMatch = text.match(/(?:amount|amt|₹|inr|rs\.?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i);
  if (amtMatch) result.amount = amtMatch[1].replace(/,/g, '');

  // Transaction ID
  const txnMatch = text.match(/(?:transaction\s*(?:id|no|number)?|txn\s*(?:id|no)?)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (txnMatch) result.transactionId = txnMatch[1];

  // Reference Number
  const refMatch = text.match(/(?:reference\s*(?:no|number)?|ref\s*(?:no|number)?|utr)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (refMatch) result.referenceNumber = refMatch[1];

  // Date
  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  if (dateMatch) result.date = dateMatch[1];

  return result;
}

// Token-based extraction (fallback for unlabeled input)
function extractWithTokens(text: string): Partial<ReceiptData> {
  const result: Partial<ReceiptData> = {};
  const tokens = text.split(/\s+/).filter(Boolean);
  const usedIndices = new Set<number>();

  // Pass 1: detect structured fields
  tokens.forEach((token, i) => {
    if (isAccountNumber(token) && !result.accountNumber) {
      result.accountNumber = token;
      usedIndices.add(i);
    } else if (isIfscCode(token) && !result.ifscCode) {
      result.ifscCode = token.toUpperCase();
      usedIndices.add(i);
    } else if (isReferenceNumber(token) && !result.referenceNumber) {
      result.referenceNumber = token;
      usedIndices.add(i);
    } else if (isTransactionId(token) && !result.transactionId) {
      result.transactionId = token;
      usedIndices.add(i);
    }
  });

  // Pass 2: detect amount (after account number is found to avoid confusion)
  tokens.forEach((token, i) => {
    if (!usedIndices.has(i) && isAmount(token) && !result.amount) {
      result.amount = token;
      usedIndices.add(i);
    }
  });

  // Pass 3: remaining alpha tokens = name
  const nameTokens: string[] = [];
  tokens.forEach((token, i) => {
    if (!usedIndices.has(i) && isNameToken(token)) {
      nameTokens.push(token);
      usedIndices.add(i);
    }
  });
  if (nameTokens.length > 0) {
    result.accountHolder = nameTokens.join(' ');
  }

  return result;
}

export function parseTransactionText(text: string): Partial<ReceiptData> {
  if (!text.trim()) return {};

  // Check if input has keyword labels
  const hasLabels = /(?:account|name|ifsc|amount|transaction|reference|holder)\s*[:\-]/i.test(text);

  if (hasLabels) {
    const keywordResult = extractWithKeywords(text);
    // Fill gaps with token-based
    const tokenResult = extractWithTokens(text);
    return {
      ...tokenResult,
      ...Object.fromEntries(Object.entries(keywordResult).filter(([, v]) => v)),
    };
  }

  return extractWithTokens(text);
}
