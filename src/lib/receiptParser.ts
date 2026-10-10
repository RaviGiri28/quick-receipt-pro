import { ReceiptData } from '@/types/receipt';

// Turns a pasted transaction message (bank SMS, payment app share, a row copied from
// money-transfer software, a "Label: value" block, ...) into receipt fields.
//
// Phase 1 reads labelled values ("A/C No: 123", "Mobile 98765 43210", a header row
// followed by a value row). Phase 2 classifies everything else by shape and position:
// the IFSC is unambiguous, the account number is the long number closest to it, a
// 10-digit number starting 6-9 (or one written with +91) is the mobile, and so on.

type Field =
  | 'accountHolder'
  | 'accountNumber'
  | 'ifscCode'
  | 'amount'
  | 'transactionId'
  | 'referenceNumber'
  | 'bankName'
  | 'customerMobile';

type Parsed = Partial<Pick<ReceiptData, Field>>;

// =========================================================================
// Value shapes
// =========================================================================

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// "SBIN0001234"; also accepts a letter O typed for the mandatory 0 ("SBINO001234").
function asIfsc(token: string): string | null {
  const t = token.toUpperCase();
  if (IFSC_RE.test(t)) return t;
  if (/^[A-Z]{4}O[A-Z0-9]{6}$/.test(t) && /\d/.test(t.slice(5))) return `${t.slice(0, 4)}0${t.slice(5)}`;
  return null;
}

const isMobileShaped = (digits: string) => /^[6-9]\d{9}$/.test(digits);

// A mobile number at the start of `text`, in any common spelling:
// 9876543210, +91 98765 43210, +91-9876543210, (+91) 98765-43210, 09876543210, 987-654-3210.
const MOBILE_AT_START =
  /^(?:\(?\+\s?91\)?|\(?0091\)?|91(?=[\s-])|0(?=[6-9]))?[\s-]*([6-9]\d{4})[\s-]?(\d{5})(?!\d)|^([6-9]\d{2})[\s-](\d{3})[\s-](\d{4})(?!\d)/;

function mobileAtStart(text: string): string | null {
  const m = text.match(MOBILE_AT_START);
  if (!m) return null;
  return m[1] ? m[1] + m[2] : m[3] + m[4] + m[5];
}

// Amount text such as "2,400.00", "Rs. 1500", "₹750.50", "INR 12,000", "1000/-".
const AMOUNT_AT_START = /^(?:₹|rs\.?|inr|rupees)?\s*(\d[\d,]*(?:\.\d{1,2})?)(?!\d)/i;

function cleanAmount(raw: string): string | null {
  const clean = raw.replace(/,/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) return null;
  const num = parseFloat(clean);
  return num > 0 && num <= 10000000 ? clean : null;
}

// Dates and times are never receipt fields (the receipt uses today's date), but their
// digits look like amounts and account numbers, so they are removed before parsing.
const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const DATE_TIME_PATTERNS = [
  /\b\d{4}[/.-]\d{1,2}[/.-]\d{1,2}(?:T\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?/g, // 2026-10-05
  /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, // 05/10/2026, 5-10-26
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?[\\s\\/.-]*(?:${MONTHS})[\\s\\/.,-]*(?:\\d{2,4})?\\b`, 'gi'), // 05 Oct 2026, 5-Oct-26
  new RegExp(`\\b(?:${MONTHS})[\\s.-]+\\d{1,2}(?:st|nd|rd|th)?,?(?:\\s+\\d{4})?\\b`, 'gi'), // Oct 5, 2026
  /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?(?![\d])/gi, // 21:10, 9:05:33 PM
];

function stripDates(text: string): string {
  return DATE_TIME_PATTERNS.reduce((t, re) => t.replace(re, ' | '), text);
}

// =========================================================================
// Words that are never part of a person's name
// =========================================================================

const STATUS_WORDS = ['success', 'successful', 'successfully', 'failed', 'failure', 'pending', 'processed', 'completed',
  'declined', 'refunded', 'reversed', 'initiated', 'credited', 'debited', 'transferred', 'received', 'sent', 'done',
  'approved', 'rejected', 'hold', 'cancelled', 'canceled', 'ok', 'true', 'false'];
const MODE_WORDS = ['imps', 'neft', 'rtgs', 'upi', 'cash', 'cheque', 'card', 'gpay', 'phonepe', 'paytm', 'amazonpay',
  'bhim', 'dmt', 'aeps', 'ppi', 'online', 'offline', 'wallet', 'transfer', 'payout', 'remittance', 'money', 'fund', 'funds'];
const MONTH_WORDS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'january',
  'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const FILLER_WORDS = ['to', 'from', 'via', 'for', 'and', 'with', 'your', 'you', 'is', 'has', 'have', 'been', 'was', 'on', 'at',
  'by', 'of', 'the', 'in', 'a', 'an', 'dear', 'sir', 'madam', 'thanks', 'thank', 'regards', 'ltd', 'pvt', 'private', 'limited',
  'am', 'pm', 'ist', 'hrs', 'rs', 'inr', 'only', 'rupees', 'rupee', 'paise', 'hundred', 'thousand', 'lakh', 'lakhs', 'crore',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'twenty', 'fifty', 'na', 'nil', 'null',
  'none', 'xx', 'xxxx', 'yes', 'no', 'txn', 'tx', 'trxn', 'ref', 'id', 'utr', 'rrn', 'ifsc', 'mob', 'mobile', 'phone', 'amount',
  'amt', 'acc', 'acct', 'account', 'ac', 'a/c', 'bank', 'name', 'holder', 'beneficiary', 'bene', 'payee', 'sender',
  'remitter', 'customer', 'number', 'details', 'detail', 'receipt', 'payment', 'paid', 'status', 'date', 'time', 'mode',
  'type', 'charges', 'charge', 'fee', 'fees', 'commission', 'balance', 'total', 'remarks', 'remark', 'branch', 'code',
  'transaction', 'reference', 'saving', 'savings', 'current', 'sb', 'ca', 'dr', 'cr', 'self', 'agent', 'retailer',
  'service', 'please', 'note', 'avl', 'bal', 'available', 'info', 'alert', 'message', 'msg', 'otp', 'not', 'share',
  'anyone', 'call', 'if', 'this', 'that', 'it', 'we', 'our', 'us', 'will', 'be', 'are', 'can', 'kindly', 'order', 'client'];
const NON_NAME_WORDS = new Set([...STATUS_WORDS, ...MODE_WORDS, ...MONTH_WORDS, ...FILLER_WORDS]);

// =========================================================================
// Bank names
// =========================================================================

const KNOWN_BANK_NAMES = [
  'state bank of india', 'hdfc bank', 'icici bank', 'axis bank', 'kotak mahindra bank', 'kotak bank',
  'punjab national bank', 'bank of baroda', 'canara bank', 'union bank of india', 'union bank',
  'indian bank', 'indian overseas bank', 'idbi bank', 'yes bank', 'indusind bank',
  'federal bank', 'bank of india', 'central bank of india', 'uco bank',
  'bank of maharashtra', 'punjab and sind bank', 'punjab & sind bank', 'south indian bank',
  'karur vysya bank', 'karnataka bank', 'city union bank', 'rbl bank',
  'idfc first bank', 'idfc bank', 'au small finance bank', 'equitas small finance bank',
  'ujjivan small finance bank', 'jana small finance bank', 'suryoday small finance bank', 'utkarsh small finance bank',
  'esaf small finance bank', 'fincare small finance bank', 'capital small finance bank', 'north east small finance bank',
  'bandhan bank', 'dcb bank', 'csb bank', 'catholic syrian bank', 'dhanlaxmi bank', 'lakshmi vilas bank',
  'jammu and kashmir bank', 'j&k bank', 'jammu & kashmir bank', 'tamilnad mercantile bank', 'nainital bank',
  'airtel payments bank', 'paytm payments bank', 'india post payments bank', 'fino payments bank', 'jio payments bank',
  'nsdl payments bank', 'saraswat bank', 'cosmos bank', 'svc bank', 'abhyudaya bank', 'tjsb bank', 'apna sahakari bank',
  'bharat co-operative bank', 'kalupur bank', 'dbs bank', 'standard chartered bank', 'citibank', 'citi bank', 'hsbc bank',
  'deutsche bank', 'barclays bank', 'bank of america', 'sbi', 'pnb', 'bob', 'hdfc', 'icici', 'axis', 'kotak', 'ubi',
  'boi', 'cbi', 'iob', 'idbi', 'canara', 'indusind', 'ippb', 'baroda up bank', 'baroda uttar pradesh gramin bank',
  'prathama up gramin bank', 'aryavart bank', 'sarva haryana gramin bank', 'punjab gramin bank',
  'madhya pradesh gramin bank', 'chhattisgarh rajya gramin bank', 'rajasthan marudhara gramin bank',
  'dakshin bihar gramin bank', 'uttar bihar gramin bank', 'andhra pradesh grameena vikas bank', 'kerala gramin bank',
  'karnataka gramin bank', 'maharashtra gramin bank', 'tamil nadu grama bank', 'paschim banga gramin bank',
  'assam gramin vikash bank', 'jharkhand rajya gramin bank', 'odisha gramya bank', 'utkal grameen bank',
  'himachal pradesh gramin bank', 'ellaquai dehati bank', 'baroda rajasthan kshetriya gramin bank',
  'baroda gujarat gramin bank', 'saurashtra gramin bank', 'telangana grameena bank', 'vidharbha konkan gramin bank',
].sort((a, b) => b.length - a.length);
const SHORT_BANK_NAMES = new Set(['sbi', 'pnb', 'bob', 'hdfc', 'icici', 'axis', 'kotak', 'ubi', 'boi', 'cbi', 'iob', 'idbi',
  'canara', 'indusind', 'ippb']);
// Words that, before the word "bank", belong to the bank's name ("Nagrik Sahakari Bank").
const BANK_NAME_WORDS = new Set(['co-operative', 'cooperative', 'co-op', 'coop', 'co', 'op', 'operative', 'urban',
  'sahakari', 'nagrik', 'nagari', 'gramin', 'grameen', 'grameena', 'gramya', 'kshetriya', 'small', 'finance', 'payments',
  'payment', 'mercantile', 'district', 'central', 'state', 'national', 'mahila', 'peoples', "people's", 'citizen',
  'citizens', 'merchants', 'commercial', 'vikas', 'vikash', 'rajya', 'dehati', 'janata', 'mandal', 'and', '&', 'of',
  'the', 'up', 'mp']);

// Marks which words of an alphabetic run form a bank name; returns one flag per word.
function bankWordFlags(words: string[]): boolean[] {
  const lower = words.map(w => w.toLowerCase().replace(/[.,]+$/, ''));
  const flags = new Array(words.length).fill(false);
  for (let i = 0; i < words.length; i++) {
    if (flags[i]) continue;
    for (const name of KNOWN_BANK_NAMES) {
      const parts = name.split(' ');
      if (parts.every((p, k) => lower[i + k] === p)) {
        for (let k = 0; k < parts.length; k++) flags[i + k] = true;
        break;
      }
    }
  }
  // Unknown banks: "<Name> Bank", "<Name> Co-operative Bank Ltd", "Bank of <Name>".
  for (let i = 0; i < words.length; i++) {
    if (lower[i] !== 'bank' || flags[i]) continue;
    flags[i] = true;
    let j = i - 1;
    while (j >= 0 && BANK_NAME_WORDS.has(lower[j])) flags[j--] = true;
    if (j >= 0 && !NON_NAME_WORDS.has(lower[j])) flags[j] = true; // the bank's own name word
    let k = i + 1;
    if (lower[k] === 'of' && k + 1 < words.length) { flags[k] = flags[k + 1] = true; k += 2; }
    while (k < words.length && /^(ltd|limited|ltd\.)$/.test(lower[k])) flags[k++] = true;
  }
  return flags;
}

function looksLikeBankName(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > 0 && bankWordFlags(words).some(Boolean) && /\bbank\b|^[A-Z&]{2,8}$/i.test(text) &&
    (/\bbank\b/i.test(text) || SHORT_BANK_NAMES.has(text.toLowerCase()));
}

// =========================================================================
// Labels
// =========================================================================

type LabelKind = { field: Field | 'ignore'; prio: number };

const LABEL_VOCAB = new Set([
  'ifsc', 'ifs', 'code', 'date', 'time', 'status', 'mode', 'type', 'charge', 'charges', 'fee', 'fees', 'commission', 'comm',
  'balance', 'bal', 'remark', 'remarks', 'narration', 'purpose', 'branch', 'address', 'city', 'state', 'district', 'pin',
  'pincode', 'email', 'e-mail', 'gst', 'tax', 'tds', 'service', 'agent', 'retailer', 'distributor', 'operator', 'kyc',
  'limit', 'available', 'avl', 'opening', 'closing', 'surcharge', 'cashback', 'discount', 'serial', 'sr', 'sl', 's', 'batch',
  'device', 'location', 'ip', 'user', 'wallet', 'message', 'msg', 'otp', 'debit', 'credit', 'dr', 'cr', 'reason',
  'response', 'sender', 'remitter', 'customer', 'cust', 'depositor', 'payer', 'from', 'by', 'client', 'beneficiary',
  'bene', 'benf', 'ben', 'benef', 'payee', 'recipient', 'receiver', 'mobile', 'mob', 'phone', 'ph', 'contact', 'cell',
  'whatsapp', 'mo', 'mobileno', 'amount', 'amt', 'rs', 'inr', 'rupees', 'value', 'utr', 'rrn', 'reference', 'ref', 'refno',
  'utrno', 'bankref', 'transaction', 'txn', 'trans', 'tran', 'trxn', 'order', 'txnid', 'tid', 'name', 'holder', 'a/c',
  'ac', 'acc', 'acct', 'account', 'accno', 'acno', 'bank', 'paid', 'to', 'sent', 'transferred', 'total', 'no', 'number',
  'num', 'nbr', 'id', 'of', 'the', 'details', 'detail', 'info', 'payment', 'transfer', 'imps', 'neft', 'rtgs', 'upi',
  'money', 'a', 'c', 'n', 'nos', '(rs)', '₹', 'in', 'full', 'holders', "holder's", 'beneficiary\'s', 'registered',
  'linked', 'reg', 'regd', 'contactno', 'phoneno', 'mobno', 'person', '&', 'and',
]);

function labelWords(text: string): string[] {
  return text.toLowerCase().replace(/[.#*()[\]{}"'`]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

function classifyLabel(words: string[]): LabelKind | null {
  if (!words.length || words.length > 5 || !words.every(w => LABEL_VOCAB.has(w))) return null;
  const s = ` ${words.join(' ')} `;
  const has = (re: RegExp) => re.test(s);
  if (has(/ (ifsc|ifs) /)) return { field: 'ifscCode', prio: 1 };
  if (has(/ (date|time|status|mode|type|charges?|fees?|commission|comm|balance|bal|avl|available|remarks?|narration|purpose|branch|address|city|state|district|pin|pincode|e-?mail|gst|tax|tds|service|agent|retailer|distributor|operator|kyc|limit|opening|closing|surcharge|cashback|discount|serial|sr|sl|batch|device|location|ip|user|wallet|message|msg|otp|debit|credit|dr|cr|reason|response) /)) {
    return { field: 'ignore', prio: 9 };
  }
  const sender = has(/ (sender|remitter|customer|cust|depositor|payer|from|by|client|registered|reg|regd|linked) /);
  const bene = has(/ (beneficiary|beneficiary's|bene|benf|ben|benef|payee|recipient|receiver) /);
  const accountWord = has(/ (a\/c|ac|acc|acct|account|accno|acno|a c) /);
  if (has(/ (mobile|mob|mobno|mobileno|phone|phoneno|ph|contact|contactno|cell|whatsapp|mo) /)) {
    return { field: 'customerMobile', prio: sender ? 1 : bene ? 3 : 2 };
  }
  if (has(/ (amount|amt|rupees|value|₹|\(rs\)) /) || s.trim() === 'rs' || s.trim() === 'inr') return { field: 'amount', prio: 1 };
  if (has(/ (utr|rrn|reference|ref|refno|utrno|bankref) /)) return { field: 'referenceNumber', prio: 1 };
  if (has(/ (transaction|txn|trans|tran|trxn|order|txnid|tid) /)) return { field: 'transactionId', prio: 1 };
  if (has(/ id /)) return { field: 'ignore', prio: 9 }; // customer id, bene id, upi id, ...
  if (has(/ (name|holder|holders|holder's) /) && !has(/ bank /)) return { field: 'accountHolder', prio: sender ? 3 : 1 };
  if (accountWord) return { field: 'accountNumber', prio: 1 };
  if (has(/ bank /)) return has(/ (name|bank) /) ? { field: 'bankName', prio: 1 } : null;
  if (bene) return { field: 'accountHolder', prio: 1 };
  if (has(/ to /) && words.length <= 3) return { field: 'accountHolder', prio: 2 }; // "Paid To", "To"
  if (has(/ (total|paid) /)) return { field: 'amount', prio: 2 };
  if (sender) return { field: 'accountHolder', prio: 3 };
  return null;
}

// =========================================================================
// Field values: take the field's value from the start of `text`, return the rest
// =========================================================================

type Taken = { value: string | null; rest: string };

function takeName(text: string): Taken {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  const flags = bankWordFlags(words);
  let i = 0;
  for (; i < words.length; i++) {
    const w = words[i].replace(/[,;]+$/, '');
    if (!/^[\p{L}][\p{L}.'-]*$/u.test(w) || flags[i]) break;
    if (NON_NAME_WORDS.has(w.toLowerCase().replace(/\.$/, '')) && kept.length && !/^(mr|mrs|ms|md|mohd|smt|shri|sri|dr)\.?$/i.test(w)) break;
    kept.push(w);
    if (words[i] !== w) { i++; break; } // a trailing comma ends the name
  }
  const name = kept.join(' ').replace(/[.'-]+$/, '').replace(/^\W+/, '');
  const valid = name.replace(/[^\p{L}]/gu, '').length >= 2 && !kept.every(w => NON_NAME_WORDS.has(w.toLowerCase()));
  return { value: valid ? name : null, rest: valid ? words.slice(i).join(' ') : text };
}

function takeValue(field: Field, raw: string): Taken {
  const text = raw.replace(/^[\s:=#.\-–>]+/, '').trim();
  if (!text) return { value: null, rest: '' };
  switch (field) {
    case 'ifscCode': {
      const m = text.match(/^([A-Za-z]{4}[0Oo][A-Za-z0-9]{6})(?![A-Za-z0-9])/);
      const ifsc = m && asIfsc(m[1]);
      return ifsc ? { value: ifsc, rest: text.slice(m![0].length) } : { value: null, rest: text };
    }
    case 'accountNumber': {
      const m = text.match(/^(\d{4}(?:[ -]\d{4}){1,3}(?:[ -]\d{1,4})?|\d[\d-]*\d)(?![\dA-Za-z])/);
      const digits = m ? m[1].replace(/\D/g, '') : '';
      return digits.length >= 6 && digits.length <= 20
        ? { value: digits, rest: text.slice(m![0].length) }
        : { value: null, rest: text };
    }
    case 'customerMobile': {
      const m = text.match(MOBILE_AT_START);
      return m ? { value: mobileAtStart(text), rest: text.slice(m[0].length) } : { value: null, rest: text };
    }
    case 'amount': {
      const m = text.match(AMOUNT_AT_START);
      const amount = m && cleanAmount(m[1]);
      if (!amount) return { value: null, rest: text };
      const rest = text.slice(m![0].length).replace(/^\s*(?:\/-|\/|rs\.?|inr|rupees|only)(?![a-z])/i, '');
      return { value: amount, rest };
    }
    case 'transactionId':
    case 'referenceNumber': {
      const m = text.match(/^([A-Za-z0-9][A-Za-z0-9_\-/]*)/);
      const value = m && m[1].length >= 4 && /\d/.test(m[1]) && !NON_NAME_WORDS.has(m[1].toLowerCase()) ? m[1] : null;
      return value ? { value, rest: text.slice(m![0].length) } : { value: null, rest: text };
    }
    case 'bankName': {
      const m = text.match(/^([\p{L}&][\p{L}&.'()\- ]*?)(?=\s*(?:[,|;/]|\d|$|\s{2}))/u);
      const value = m ? m[1].trim().replace(/[.,]+$/, '') : '';
      return value.length >= 2 && !NON_NAME_WORDS.has(value.toLowerCase())
        ? { value, rest: text.slice(m![0].length) }
        : { value: null, rest: text };
    }
    case 'accountHolder':
      return takeName(text);
  }
}

// =========================================================================
// Phase 1: labelled values
// =========================================================================

type Candidate = { value: string; prio: number; order: number };

class Collector {
  private best = new Map<Field, Candidate>();
  private order = 0;
  offer(field: Field, value: string, prio: number) {
    const cur = this.best.get(field);
    const order = this.order++;
    if (!cur || prio < cur.prio) this.best.set(field, { value, prio, order });
  }
  has(field: Field) { return this.best.has(field); }
  get(field: Field) { return this.best.get(field)?.value; }
  result(): Parsed {
    const out: Parsed = {};
    for (const [field, c] of this.best) out[field] = c.value;
    return out;
  }
}

// Splits a line into cells: tabs, runs of 2+ spaces and pipes separate columns.
const splitCells = (line: string) => line.split(/\t|\s{2,}|\s*\|\s*|\s*;\s*/).map(s => s.trim()).filter(Boolean);

type LabelHit = { start: number; valueStart: number; kind: LabelKind; delimited: boolean };

// Words that commonly END a value ("SARASWAT BANK", "Mode: IMPS"), so a label found
// right after them should not swallow them ("BANK Payee:" is the label "Payee").
const VALUE_TAIL_WORDS = new Set(['bank', 'imps', 'neft', 'rtgs', 'upi', 'money', 'transfer', 'payment', 'cash']);

// Labels inside a cell: "Label: value" / "Label = value" anywhere, or "Label value" /
// "Label - value" at the very start of the cell.
function findLabels(cell: string): LabelHit[] {
  const hits: LabelHit[] = [];
  const delim = /\s*[:=]\s*|\s+-\s*|-\s+/g;
  let lastCut = 0;
  for (let m = delim.exec(cell); m; m = delim.exec(cell)) {
    const isDash = m[0].includes('-');
    const before = cell.slice(lastCut, m.index);
    const words = [...before.matchAll(/\S+/g)];
    if (!words.length) continue;
    for (let k = Math.min(5, words.length); k >= 1; k--) {
      const startIdx = words[words.length - k].index!;
      const labelText = labelWords(before.slice(startIdx));
      const kind = classifyLabel(labelText);
      if (!kind) continue;
      // A dash only separates a label at the start of the cell ("Mob - 98765...").
      if (isDash && lastCut + startIdx !== 0) break;
      const hasValueBefore = before.slice(0, startIdx).trim() !== '';
      // Leave the previous label at least one word of value ("Bank: STATE BANK Account: 1").
      if (hits.length && !hasValueBefore && k > 1) continue;
      if (k > 1 && VALUE_TAIL_WORDS.has(labelText[0])) {
        const shorter = classifyLabel(labelText.slice(1));
        // "SARASWAT BANK Payee:" is "Payee"; "Bank Name:" stays whole, unless it follows a
        // bank label whose value it would end ("Bank: KOTAK BANK Name: RAVI").
        const prevField = hits.length ? hits[hits.length - 1].kind.field : null;
        const isBankName = labelText.slice(1).join(' ') === 'name';
        if (shorter && shorter.field !== kind.field && (!isBankName || prevField === kind.field)) continue;
      }
      hits.push({ start: lastCut + startIdx, valueStart: m.index + m[0].length, kind, delimited: true });
      lastCut = m.index + m[0].length;
      break;
    }
  }
  if (!hits.length || hits[0].start > 0) {
    // "A/C No 1234567890", "IFSC SBIN0001234", "Name RAVI KUMAR" (no delimiter).
    const words = [...cell.matchAll(/\S+/g)];
    const limit = hits.length ? hits[0].start : cell.length;
    for (let k = Math.min(5, words.length); k >= 1; k--) {
      const end = words[k - 1].index! + words[k - 1][0].length;
      if (end > limit) continue;
      const kind = classifyLabel(labelWords(cell.slice(0, end)));
      if (!kind || /^(of|the|a|c|to)$/i.test(words[k - 1][0])) continue;
      const rest = cell.slice(end, limit);
      if (rest.trim()) {
        if (kind.field === 'ignore') continue; // "Fee" alone is a label, "STATE BANK" is not
        if (!takeValue(kind.field, rest).value) continue;
      }
      hits.unshift({ start: 0, valueStart: end, kind, delimited: false });
      break;
    }
  }
  return hits;
}

function isLabelOnly(cell: string): LabelKind | null {
  const hits = findLabels(cell);
  if (hits.length === 1 && hits[0].start === 0 && !cell.slice(hits[0].valueStart).trim()) return hits[0].kind;
  const kind = classifyLabel(labelWords(cell.replace(/[:=-]+\s*$/, '')));
  return kind;
}

// Ignored labels ("Date: ...", "Status: SUCCESS") swallow only their own short value,
// so data that follows on the same line is not lost.
function takeIgnoredValue(text: string): string {
  const t = text.trimStart();
  const dateLike = stripDates(t);
  if (dateLike !== t && dateLike.trimStart().startsWith('|')) {
    return dateLike.replace(/^\s*(\|\s*)+/, '');
  }
  return t.replace(/^\S+\s*/, '');
}

type PoolItem = { text: string; line: number };

function runLabelPhase(lines: string[], found: Collector): PoolItem[] {
  const pool: PoolItem[] = [];
  const cellsByLine = lines.map(splitCells);

  // A header row of labels followed by a row of values: map them column by column.
  const usedLine = new Array(lines.length).fill(false);
  for (let i = 0; i + 1 < lines.length; i++) {
    const header = cellsByLine[i];
    if (header.length < 3) continue;
    const kinds = header.map(isLabelOnly);
    if (kinds.some(k => !k)) continue;
    let j = i + 1;
    while (j < lines.length && !cellsByLine[j].length) j++;
    const values = cellsByLine[j] || [];
    if (values.length !== header.length || values.every(v => isLabelOnly(v))) continue;
    values.forEach((v, c) => {
      const kind = kinds[c]!;
      if (kind.field === 'ignore') return;
      const taken = takeValue(kind.field, v);
      if (taken.value) found.offer(kind.field, taken.value, kind.prio);
      if (!taken.value || taken.rest.trim()) pool.push({ text: taken.value ? taken.rest : v, line: j });
    });
    usedLine[i] = usedLine[j] = true;
  }

  // The label still waiting for its value ("Name\tRAVI", "Account No:\n1234").
  let pending: { kind: LabelKind; line: number } | null = null;
  const consume = (kind: LabelKind, text: string, line: number) => {
    // A labelled IFSC stays in the pool as a position anchor for the account number.
    if (kind.field === 'ifscCode') pool.push({ text, line });
    if (kind.field === 'ignore') {
      const rest = takeIgnoredValue(text);
      if (rest.trim()) pool.push({ text: rest, line });
      return;
    }
    const taken = takeValue(kind.field, text);
    if (taken.value) found.offer(kind.field, taken.value, kind.prio);
    const rest = kind.field === 'ifscCode' ? '' : taken.value ? taken.rest : text;
    if (rest.trim()) pool.push({ text: rest, line });
  };

  for (let i = 0; i < lines.length; i++) {
    if (usedLine[i]) continue;
    for (const cell of cellsByLine[i]) {
      const hits = findLabels(cell);
      // While a label waits, a cell without a "Label:" is its value, even if it starts
      // with a label-like word ("Bank\tBANK OF BARODA", "Amount\tRs. 500").
      const hasValueAfterLabel = hits.length && cell.slice(hits[0].valueStart).trim() !== '';
      if (pending && (!hits.length || (!hits[0].delimited && hasValueAfterLabel && hits[0].start === 0 && hits.length === 1))) {
        if (!hits.length && isLabelOnly(cell)) {
          pool.push({ text: cell, line: i });
        } else {
          consume(pending.kind, cell, i);
        }
        pending = null;
        continue;
      }
      if (!hits.length) {
        pool.push({ text: cell, line: i });
        continue;
      }
      pending = null;
      if (hits[0].start > 0) pool.push({ text: cell.slice(0, hits[0].start), line: i });
      hits.forEach((hit, h) => {
        const value = cell.slice(hit.valueStart, h + 1 < hits.length ? hits[h + 1].start : cell.length);
        if (!value.trim()) pending = { kind: hit.kind, line: i };
        else consume(hit.kind, value, i);
      });
    }
    // A label waits at most until the end of the next non-empty line.
    if (pending && cellsByLine[i].length && pending.line < i) pending = null;
  }
  return pool;
}

// =========================================================================
// Phase 2: unlabelled text, classified by shape and position
// =========================================================================

type TokenKind = 'ifsc' | 'num' | 'mob' | 'amt' | 'dec' | 'alnum' | 'run';
type Token = { kind: TokenKind; value: string; pos: number; words?: string[] };

const MARK = '\uE000'; // private-use character marking pre-classified values

function tokenize(pool: PoolItem[]): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  for (const item of pool) {
    let text = ` ${stripDates(item.text)} `;
    // Values whose spelling would otherwise be split apart or misread.
    text = text
      .replace(/(?<![\w.])(?:\(?\+\s?91\)?|\(?0091\)?|91(?=[\s-]))[\s-]*([6-9]\d{4})[\s-]?(\d{5})(?!\d)/g, ` | ${MARK}M$1$2 | `)
      .replace(/(?<![\d.,])([6-9]\d{4})[\s-](\d{5})(?![\d.,])/g, '$1$2')
      .replace(/(?<![\d.,])([6-9]\d{2})[\s-](\d{3})[\s-](\d{4})(?![\d.,])/g, '$1$2$3')
      // "1,000.00 INR" before "INR 1000", so "500 INR 9876543210" keeps its mobile number.
      .replace(/(?<![\w.,])(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{1,8}(?:\.\d{1,2})?)\s*(?:\/-|rs\.?\b|inr\b|rupees\b|only\b)/gi, (_, a) => ` | ${MARK}A${a.replace(/,/g, '')} | `)
      .replace(/(?:₹|\brs\.?|\binr|\brupees)\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{1,8}(?:\.\d{1,2})?)(?!\d|[.,]\d)(?:\s*\/-)?/gi, (_, a) => ` | ${MARK}A${a.replace(/,/g, '')} | `)
      .replace(/\ba\s?\/\s?c\b\.?(?:\s*(?:no|number)\b\.?)?/gi, ' | ')
      .replace(/(?<![\w,.])(\d{1,3}(?:,\d{2})*,\d{3}(?:\.\d{1,2})?)(?!\d|[.,]\d)/g, (_, a) => ` | ${MARK}D${a.replace(/,/g, '')} | `)
      .replace(/(?<![\d-])(\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,4})?)(?![\d-])/g, m => m.replace(/[ -]/g, ''));
    const chunks = text.split(/\t|\s{2,}|[|;,/\\()[\]{}<>"!?]|\s-\s|(?<=\d)-|-(?=\d)|:/);
    for (const chunk of chunks) {
      let run: string[] = [];
      const flush = () => {
        if (run.length) tokens.push({ kind: 'run', value: run.join(' '), words: run, pos: pos++ });
        run = [];
      };
      for (const rawWord of chunk.split(/\s+/)) {
        const word = rawWord.replace(/^[#*'.]+|[*'.,:]+$/g, '');
        if (!word) continue;
        if (word.startsWith(MARK)) {
          flush();
          const kind = word[1] === 'M' ? 'mob' : word[1] === 'A' ? 'amt' : 'dec';
          tokens.push({ kind, value: word.slice(2), pos: pos++ });
          continue;
        }
        const ifsc = asIfsc(word);
        if (ifsc && word.length === 11) {
          flush();
          tokens.push({ kind: 'ifsc', value: ifsc, pos: pos++ });
        } else if (/^\d+$/.test(word)) {
          flush();
          tokens.push({ kind: 'num', value: word, pos: pos++ });
        } else if (/^\d+\.\d{1,2}$/.test(word)) {
          flush();
          tokens.push({ kind: 'dec', value: word, pos: pos++ });
        } else if (/^[A-Za-z0-9_-]+$/.test(word) && /\d/.test(word) && /[A-Za-z]/.test(word)) {
          flush();
          if (word.length >= 6) tokens.push({ kind: 'alnum', value: word, pos: pos++ });
        } else if (/^[\p{L}][\p{L}.'&-]*$/u.test(word)) {
          run.push(word);
        } else {
          flush();
        }
      }
      flush();
    }
  }
  return tokens;
}

// 12-digit IMPS reference numbers start with the year's last digit (2023-29: 3-9) and
// the day of the year.
const isRrnLike = (d: string) => /^[3-9]\d{11}$/.test(d) && +d.slice(1, 4) >= 1 && +d.slice(1, 4) <= 366;

function runPatternPhase(pool: PoolItem[], found: Collector): void {
  const tokens = tokenize(pool);
  const used = new Set<Token>();
  const take = (t: Token) => { used.add(t); return t.value; };

  // Names and bank names from the alphabetic runs.
  for (const t of tokens) {
    if (t.kind !== 'run') continue;
    const words = t.words!;
    const flags = bankWordFlags(words);
    if (!found.has('bankName') && flags.some(Boolean)) {
      const start = flags.indexOf(true);
      let end = start;
      while (end + 1 < words.length && flags[end + 1]) end++;
      const bank = words.slice(start, end + 1).join(' ');
      if (looksLikeBankName(bank)) found.offer('bankName', bank, 5);
    }
    if (found.has('accountHolder')) continue;
    let part: string[] = [];
    const tryName = () => {
      if (!found.has('accountHolder') && part.length) {
        const name = takeName(part.join(' ')).value;
        if (name) found.offer('accountHolder', name, 5);
      }
      part = [];
    };
    words.forEach((w, i) => {
      const lower = w.toLowerCase().replace(/\.$/, '');
      // Single letters are initials ("A. RAHUL SHAH"), not filler words.
      if (flags[i] || (NON_NAME_WORDS.has(lower) && lower.length > 1 && !/^(mr|mrs|ms|md|mohd|smt|shri|sri|dr)$/.test(lower))) tryName();
      else part.push(w);
    });
    tryName();
  }

  const ifsc = tokens.find(t => t.kind === 'ifsc');
  if (ifsc && !found.has('ifscCode')) found.offer('ifscCode', take(ifsc), 5);
  const ifscPos = ifsc?.pos;

  // Mobile numbers written with +91 / 0091 are certain.
  if (!found.has('customerMobile')) {
    const mob = tokens.find(t => t.kind === 'mob');
    if (mob) found.offer('customerMobile', take(mob), 5);
  }

  const nums = () => tokens.filter(t => t.kind === 'num' && !used.has(t) && t.value.length >= 9 && t.value.length <= 18);
  const knownMobile = found.get('customerMobile');

  if (!found.has('accountNumber')) {
    // (A payments-bank account can equal the mobile number, so equal values are not excluded.)
    const candidates = nums();
    const mobileShaped = candidates.filter(t => isMobileShaped(t.value));
    const others = candidates.filter(t => !isMobileShaped(t.value));
    const nearIfsc = (t: Token) => ifscPos !== undefined && Math.abs(t.pos - ifscPos) <= 2;
    // How strongly a mobile-looking number is held back from being the account:
    //  - mobile already known, or 2+ mobile-looking numbers: one of them may be the account;
    //  - exactly one, right before the IFSC (where accounts sit), and the only alternatives
    //    are reference numbers after the IFSC (where references sit): it is the account;
    //  - exactly one otherwise: it is the mobile.
    const refsOnly = others.length > 0 && ifscPos !== undefined && mobileShaped.length === 1 &&
      mobileShaped[0].pos === ifscPos - 1 && others.every(t => isRrnLike(t.value) && t.pos > ifscPos);
    const mobilePenalty = knownMobile ? 0 : mobileShaped.length >= 2 || refsOnly ? 2 : 20;
    const score = (t: Token) => {
      let s = 0;
      if (ifscPos !== undefined) {
        const d = t.pos - ifscPos;
        s += d < 0 ? 10 + d : 8.5 - d; // closest to the IFSC, and before it rather than after
      } else {
        s += 10 - t.pos * 0.01; // earliest
      }
      if (isMobileShaped(t.value)) s -= mobilePenalty;
      if (isRrnLike(t.value)) s -= 1.5;
      if (/^91[6-9]\d{9}$/.test(t.value) || /^0[6-9]\d{9}$/.test(t.value)) s -= 3;
      return s;
    };
    let best = candidates.slice().sort((a, b) => score(b) - score(a))[0];
    // A lone mobile-looking number is the account only when it sits next to the IFSC;
    // otherwise it is the customer's mobile.
    if (best && candidates.length === 1 && isMobileShaped(best.value) && !knownMobile && !nearIfsc(best)) {
      best = undefined;
    }
    if (best) found.offer('accountNumber', take(best), 5);
  }

  if (!found.has('customerMobile')) {
    const left = nums();
    const mob = left.find(t => isMobileShaped(t.value)) ||
      left.find(t => /^0[6-9]\d{9}$/.test(t.value) || /^91[6-9]\d{9}$/.test(t.value));
    if (mob) found.offer('customerMobile', take(mob).slice(-10), 5);
  }

  if (!found.has('amount')) {
    const amountToken =
      tokens.find(t => t.kind === 'amt' && cleanAmount(t.value)) ||
      tokens.find(t => t.kind === 'dec' && !used.has(t) && cleanAmount(t.value)) ||
      tokens.find(t => t.kind === 'num' && !used.has(t) && /^[1-9]\d{2,7}$/.test(t.value)) ||
      tokens.find(t => t.kind === 'num' && !used.has(t) && /^[1-9]\d?$/.test(t.value));
    if (amountToken) found.offer('amount', cleanAmount(take(amountToken))!, 5);
  }

  // Leftover IDs: bank UTR/RRN numbers are references, other IDs are transaction IDs.
  for (const t of tokens) {
    if (used.has(t) || (t.kind !== 'alnum' && !(t.kind === 'num' && t.value.length >= 9))) continue;
    const isRef = t.kind === 'num' ? t.value.length === 12 : /^[A-Z]{4}[A-Z0-9]?\d{9,}$/i.test(t.value);
    const field: Field = isRef && !found.has('referenceNumber') ? 'referenceNumber'
      : !found.has('transactionId') ? 'transactionId'
        : !found.has('referenceNumber') ? 'referenceNumber' : (null as never);
    if (!field) break;
    found.offer(field, take(t), 5);
  }
}

// =========================================================================
// Public entry point
// =========================================================================

function normalize(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\uFF1A/g, ':')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\p{Extended_Pictographic}\u2714\u2705\u274C]/gu, ' ');
}

export function parseTransactionText(text: string): Partial<ReceiptData> {
  if (!text.trim()) return {};
  const lines = normalize(text).split(/\r?\n|\r/).map(l => l.trim());
  const found = new Collector();
  const pool = runLabelPhase(lines, found);
  runPatternPhase(pool, found);
  return found.result();
}
