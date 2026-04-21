import { ReceiptData } from '@/types/receipt';

// ===== Helpers =====
function isAccountNumber(token: string): boolean {
  return /^\d{12,16}$/.test(token);
}

function isIfscCode(token: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(token);
}

// Amount: integer or decimal (e.g. 5000 or 5000.00), with optional commas
function isAmountToken(token: string): boolean {
  if (!/^\d{1,3}(,\d{2,3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(token)) return false;
  const clean = token.replace(/,/g, '');
  if (/^\d{12,16}$/.test(clean)) return false; // avoid account numbers
  const num = parseFloat(clean);
  return num >= 1 && num <= 10000000;
}

function isTransactionId(token: string): boolean {
  return /^[A-Z]{2,5}\d{3,}$/i.test(token);
}

function isReferenceNumber(token: string): boolean {
  return /^(REF|UTR)[A-Z0-9]+$/i.test(token);
}

function isNameToken(token: string): boolean {
  return /^[A-Za-z.]+$/.test(token) && token.length > 1;
}

// Indian mobile: starts with 6/7/8/9, 10 digits; supports +91 / 91 / 0 prefixes
function extractIndianMobile(text: string): string | null {
  const match = text.match(/(?:\+?91[\s-]?|0)?([6-9]\d{9})\b/);
  return match ? match[1] : null;
}

// ===== Keyword extraction =====
function extractWithKeywords(text: string): Partial<ReceiptData> {
  const result: Partial<ReceiptData> = {};

  const nameMatch = text.match(/(?:account\s*holder\s*name|holder\s*name|name|beneficiary|payee)\s*[:\-]?\s*([A-Za-z\s.]+?)(?=\s*(?:account\s*(?:no|number|num)?|acc\s*no|a\/c|ifsc|bank|amount|transaction|reference|mobile|phone|$))/i);
  if (nameMatch) result.accountHolder = nameMatch[1].trim();

  // Account number — supports "Account Number", "Acc No", "A/C No", "A/c"
  const accMatch = text.match(/(?:account\s*(?:no|number|num)?|acc(?:ount)?\s*no\.?|a\s*\/\s*c\s*(?:no\.?)?)\s*[:\-]?\s*(\d{11,16})/i);
  if (accMatch) result.accountNumber = accMatch[1];

  const ifscMatch = text.match(/(?:ifsc\s*(?:code)?)\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
  if (ifscMatch) result.ifscCode = ifscMatch[1].toUpperCase();

  // Amount — support decimals
  const amtMatch = text.match(/(?:amount|amt|₹|inr|rs\.?)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amtMatch) result.amount = amtMatch[1].replace(/,/g, '');

  const txnMatch = text.match(/(?:transaction\s*(?:id|no|number)?|txn\s*(?:id|no)?)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (txnMatch) result.transactionId = txnMatch[1];

  const refMatch = text.match(/(?:reference\s*(?:no|number)?|ref\s*(?:no|number)?|utr)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (refMatch) result.referenceNumber = refMatch[1];

  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
  if (dateMatch) result.date = dateMatch[1];

  // Bank name
  const bankMatch = text.match(/(?:bank\s*(?:name)?)\s*[:\-]?\s*([A-Za-z][A-Za-z\s&.]+?)(?=\s*(?:account|acc|a\/c|ifsc|amount|transaction|reference|mobile|phone|$))/i);
  if (bankMatch) result.bankName = bankMatch[1].trim();

  // Mobile (labeled)
  const mobLabel = text.match(/(?:mobile|mob|phone|contact)\s*(?:no\.?|number)?\s*[:\-]?\s*((?:\+?91[\s-]?|0)?[6-9]\d{9})/i);
  if (mobLabel) {
    const m = extractIndianMobile(mobLabel[1]);
    if (m) result.customerMobile = m;
  }

  return result;
}

// ===== Token-based fallback =====
function extractWithTokens(text: string): Partial<ReceiptData> {
  const result: Partial<ReceiptData> = {};
  const tokens = text.split(/\s+/).filter(Boolean);
  const usedIndices = new Set<number>();

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

  tokens.forEach((token, i) => {
    if (!usedIndices.has(i) && isAmountToken(token) && !result.amount) {
      result.amount = token.replace(/,/g, '');
      usedIndices.add(i);
    }
  });

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

  const hasLabels = /(?:account|acc\s*no|a\/c|name|ifsc|bank|amount|transaction|reference|holder|mobile|phone)\s*[:\-]/i.test(text);

  let result: Partial<ReceiptData>;
  if (hasLabels) {
    const keywordResult = extractWithKeywords(text);
    const tokenResult = extractWithTokens(text);
    result = {
      ...tokenResult,
      ...Object.fromEntries(Object.entries(keywordResult).filter(([, v]) => v)),
    };
  } else {
    result = extractWithTokens(text);
  }

  // Always try to extract Indian mobile from raw text if not already set
  if (!result.customerMobile) {
    const mob = extractIndianMobile(text);
    if (mob) result.customerMobile = mob;
  }

  return result;
}
