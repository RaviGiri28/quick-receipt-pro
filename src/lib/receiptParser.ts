import { ReceiptData } from '@/types/receipt';

// =========================================================================
// Low-level validators
// =========================================================================

function isIfscCode(token: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(token);
}

function isDateLike(segment: string): boolean {
  return (
    /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(segment) ||
    /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/.test(segment) // e.g. "18 Apr 2026 21:10"
  );
}

// Indian mobile: starts with 6/7/8/9, 10 digits; supports +91 / 91 / 0 prefixes
function extractIndianMobile(text: string): string | null {
  const match = text.match(/(?:\+?91[\s-]?|0)?([6-9]\d{9})\b/);
  return match ? match[1] : null;
}

// Words that must NEVER be treated as an account holder name, because they
// are transaction metadata (status, payment mode, month names, stray label
// fragments) rather than a person's name.
const STATUS_WORDS = /^(success|failed|failure|pending|processed|completed|declined)$/i;
const MODE_WORDS = /^(imps|neft|rtgs|upi|cash|cheque|card|gpay|phonepe|paytm|amazonpay|bhim|neft\/rtgs)$/i;
const MONTH_WORDS = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)$/i;
// Leftover fragments of labels (e.g. "Status", "Txn Date", "Total Success")
// that shouldn't be captured as a value once stripped of trailing ':'/'-'.
const STRAY_LABEL_WORDS =
  /^(status|txn\s*date|transaction\s*date|date|txn\s*mode|payment\s*mode|mode|total\s*success|total|of|and|the|ltd\.?|limited|pvt\.?|private)$/i;

const BANK_HINT = /\bbank(?:ing)?\b/i;
const KNOWN_BANK_NAMES = [
  'state bank of india', 'hdfc bank', 'icici bank', 'axis bank', 'kotak mahindra bank',
  'punjab national bank', 'bank of baroda', 'canara bank', 'union bank of india',
  'indian bank', 'indian overseas bank', 'idbi bank', 'yes bank', 'indusind bank',
  'federal bank', 'bank of india', 'central bank of india', 'uco bank',
  'bank of maharashtra', 'punjab and sind bank', 'south indian bank',
  'karur vysya bank', 'karnataka bank', 'city union bank', 'rbl bank',
  'idfc first bank', 'au small finance bank', 'equitas small finance bank',
  'ujjivan small finance bank', 'bandhan bank', 'dcb bank', 'csb bank',
  'jammu and kashmir bank', 'tamilnad mercantile bank',
];

function isBankNameSegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  if (KNOWN_BANK_NAMES.some(name => lower.includes(name))) return true;
  return BANK_HINT.test(segment);
}

function isDiscardableWord(segment: string): boolean {
  const clean = segment.replace(/[:\-]+$/, '').trim();
  return (
    STATUS_WORDS.test(clean) ||
    MODE_WORDS.test(clean) ||
    MONTH_WORDS.test(clean) ||
    STRAY_LABEL_WORDS.test(clean)
  );
}

// =========================================================================
// Field assignment (validates + normalizes before writing into the result)
// =========================================================================

type Field =
  | 'accountHolder'
  | 'accountNumber'
  | 'ifscCode'
  | 'amount'
  | 'transactionId'
  | 'referenceNumber'
  | 'bankName'
  | 'customerMobile';

function assignField(result: Partial<ReceiptData>, field: Field, raw: string): boolean {
  if ((result as any)[field]) return false; // first valid value wins, no overwrites
  const value = raw.trim();
  if (!value) return false;

  switch (field) {
    case 'accountNumber': {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 6 && digits.length <= 18) {
        result.accountNumber = digits;
        return true;
      }
      return false;
    }
    case 'ifscCode': {
      const clean = value.replace(/\s/g, '').toUpperCase();
      if (isIfscCode(clean)) {
        result.ifscCode = clean;
        return true;
      }
      return false;
    }
    case 'amount': {
      const m = value.match(/([\d,]+(?:\.\d{1,2})?)/);
      if (m) {
        const clean = m[1].replace(/,/g, '');
        const num = parseFloat(clean);
        if (num >= 1 && num <= 10000000) {
          result.amount = clean;
          return true;
        }
      }
      return false;
    }
    case 'transactionId': {
      const clean = value.replace(/\s/g, '');
      if (clean && !isDiscardableWord(clean)) {
        result.transactionId = clean;
        return true;
      }
      return false;
    }
    case 'referenceNumber': {
      const clean = value.replace(/\s/g, '');
      if (clean && !isDiscardableWord(clean)) {
        result.referenceNumber = clean;
        return true;
      }
      return false;
    }
    case 'bankName': {
      const clean = value.replace(/[:\-]+$/, '').trim();
      if (clean && !isDiscardableWord(clean)) {
        result.bankName = clean;
        return true;
      }
      return false;
    }
    case 'customerMobile': {
      const m = extractIndianMobile(value);
      if (m) {
        result.customerMobile = m;
        return true;
      }
      return false;
    }
    case 'accountHolder': {
      const clean = value.replace(/[:\-]+$/, '').trim();
      if (
        /^[A-Za-z.\s]+$/.test(clean) &&
        clean.length > 1 &&
        !isDiscardableWord(clean) &&
        !isBankNameSegment(clean)
      ) {
        result.accountHolder = clean;
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

// =========================================================================
// Phase 1: explicit "Label: Value" / "Label:" + next-line-value detection
// =========================================================================

const LABELS: { field: Field; regex: RegExp }[] = [
  // First, so "Transaction Amount" / "Txn Amount" isn't taken by the transaction ID label.
  { field: 'amount', regex: /^(?:(?:total|txn|transaction|paid)\s*)?(?:amount|amt)(?:\s*paid)?(?:\s*\((?:rs\.?|inr|₹)\))?(?![a-z])/i },
  { field: 'ifscCode', regex: /^ifsc(?:\s*code)?\b/i },
  { field: 'accountNumber', regex: /^(account\s*(?:no\.?|number|num)|acc(?:ount)?\s*no\.?|a\s*\/?\s*c\s*(?:no\.?)?)\b/i },
  { field: 'referenceNumber', regex: /^(reference\s*(?:no\.?|number)?|ref\s*(?:no\.?|number)?|utr\s*(?:no\.?)?)\b/i },
  { field: 'transactionId', regex: /^(transaction\s*(?:id|no\.?|number)?|txn\s*(?:id|no\.?)?)\b/i },
  { field: 'customerMobile', regex: /^(mobile\s*(?:no\.?|number)?|mob\s*(?:no\.?)?|phone\s*(?:no\.?|number)?|contact\s*(?:no\.?|number)?)\b/i },
  { field: 'bankName', regex: /^bank\s*(?:name)?\b/i },
  { field: 'accountHolder', regex: /^(account\s*holder\s*name|holder\s*name|beneficiary\s*name|payee\s*name|customer\s*name|acc(?:ount)?\s*holder|beneficiary|payee|name)\b/i },
];

// Lines that are themselves a label (used so we don't accidentally swallow
// the NEXT label as if it were the current label's value, e.g. when a field
// like "Bank Name:" is left blank in the source data).
function isLabelLine(line: string): boolean {
  const clean = line.replace(/[:\-]+$/, '').trim();
  if (!clean) return false;
  if (LABELS.some(l => l.regex.test(clean))) return true;
  return /^(status|txn\s*date|transaction\s*date|date|txn\s*mode|payment\s*mode|mode|total\s*success|total)\b/i.test(clean);
}

function runLabelPhase(lines: string[]): { result: Partial<ReceiptData>; claimed: boolean[] } {
  const result: Partial<ReceiptData> = {};
  const claimed = new Array(lines.length).fill(false);

  for (let i = 0; i < lines.length; i++) {
    if (claimed[i] || !lines[i]) continue;
    const line = lines[i];

    for (const { field, regex } of LABELS) {
      const m = line.match(regex);
      if (!m) continue;

      let rest = line.slice(m[0].length).replace(/^\s*[:\-]\s*/, '').trim();

      if (!rest) {
        // Look ahead for the value on a following line, skipping already
        // claimed lines but never stealing another label's line.
        let j = i + 1;
        while (j < lines.length && claimed[j]) j++;
        if (j < lines.length && lines[j] && !isLabelLine(lines[j])) {
          rest = lines[j];
          claimed[j] = true;
        }
      }

      if (rest) assignField(result, field, rest);
      claimed[i] = true;
      break;
    }
  }

  return { result, claimed };
}

// =========================================================================
// Phase 2: pattern-based fallback for whatever wasn't claimed by labels
// =========================================================================

function runPatternPhase(lines: string[], claimed: boolean[], result: Partial<ReceiptData>): void {
  const segments: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (claimed[i] || !lines[i]) continue;
    const parts = lines[i]
      .split(/\t+|\s{2,}/)
      .map(s => s.trim())
      .filter(Boolean);
    segments.push(...(parts.length > 0 ? parts : [lines[i]]));
  }

  for (const segment of segments) {
    if (!segment) continue;

    // 1. Bank name — check before anything else so bank text never leaks
    //    into the account holder name.
    if (!result.bankName && isBankNameSegment(segment)) {
      assignField(result, 'bankName', segment);
      continue;
    }

    // 2. Known noise: status / payment mode / month names / stray labels.
    if (isDiscardableWord(segment)) continue;

    // 3. IFSC (strict, unambiguous format).
    if (!result.ifscCode && isIfscCode(segment.replace(/\s/g, ''))) {
      assignField(result, 'ifscCode', segment);
      continue;
    }

    // 4. Dates — discard, the UI always uses today's date for the receipt.
    if (isDateLike(segment)) continue;

    // 5. Letter-prefixed transaction/UTR IDs, e.g. TXN3097631247.
    if (!result.transactionId && /^[A-Za-z]{2,6}\d{3,}$/.test(segment)) {
      assignField(result, 'transactionId', segment);
      continue;
    }

    // 6. Pure digit sequences — assign to whichever numeric field is still
    //    empty, in priority order (account number is usually the most
    //    important and tends to appear first in these pastes).
    const digitsOnly = segment.replace(/[\s]/g, '');
    if (/^\d{6,18}$/.test(digitsOnly)) {
      if (assignField(result, 'accountNumber', digitsOnly)) continue;
      if (assignField(result, 'referenceNumber', digitsOnly)) continue;
      if (assignField(result, 'transactionId', digitsOnly)) continue;
      continue; // all numeric slots full — discard rather than misassign
    }

    // 7. Decimal amounts, e.g. 2400.00.
    if (!result.amount && /^\d+(?:,\d{2,3})*\.\d{1,2}$/.test(segment)) {
      assignField(result, 'amount', segment);
      continue;
    }

    // 8. Whatever alphabetic text is left over is the best remaining
    //    candidate for the account holder's name — but only the FIRST
    //    such segment; later ones are ignored instead of being appended.
    if (!result.accountHolder && /^[A-Za-z][A-Za-z.\s]*$/.test(segment)) {
      assignField(result, 'accountHolder', segment);
      continue;
    }
  }
}

// =========================================================================
// Public entry point
// =========================================================================

export function parseTransactionText(text: string): Partial<ReceiptData> {
  if (!text.trim()) return {};

  const lines = text.split(/\r?\n/).map(l => l.trim());

  const { result, claimed } = runLabelPhase(lines);
  runPatternPhase(lines, claimed, result);

  // Last-resort mobile number detection, only among content that wasn't
  // already claimed as some other field, to avoid mistaking an account/
  // reference number for a mobile number.
  if (!result.customerMobile) {
    for (let i = 0; i < lines.length; i++) {
      if (claimed[i] || !lines[i]) continue;
      const mob = extractIndianMobile(lines[i]);
      if (
        mob &&
        mob !== result.accountNumber &&
        mob !== result.referenceNumber &&
        mob !== result.transactionId
      ) {
        result.customerMobile = mob;
        break;
      }
    }
  }

  return result;
}