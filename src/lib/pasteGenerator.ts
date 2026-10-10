// Generates realistic pasted transaction texts with their expected fields, for testing
// receiptParser. Deterministic for a given seed.

export interface Expected {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  amount: string; // numeric string, e.g. "1000" or "1000.5"
  customerMobile?: string;
}

export interface Sample {
  text: string;
  expected: Expected;
  template: string;
  // True when even a careful human could not tell the fields apart from this text
  // alone (e.g. an unlabelled shuffled row whose account number looks like a mobile).
  ambiguous: boolean;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Ravi', 'Reena', 'Anurag', 'Sunita', 'Amit', 'Pooja', 'Rahul', 'Priya', 'Suresh', 'Anita', 'Mohan', 'Geeta',
  'Rajesh', 'Kavita', 'Vikas', 'Neha', 'Sanjay', 'Meena', 'Arjun', 'Lakshmi', 'Imran', 'Salma', 'Mohd', 'Ayesha',
  'Gurpreet', 'Harjeet', 'Venkatesh', 'Srinivas', 'Muthu', 'Kiran', 'Deepak', 'Manoj', 'Rekha', 'Sita', 'Ramesh',
  'Pankaj', 'Sachin', 'Nisha', 'Abdul', 'Farhan', 'Joseph', 'Mary', 'Thomas', 'Bablu', 'Pappu', 'Chandan', 'Sagar',
  'Lalita', 'Raju', 'Shyam', 'Ganesh', 'Kamala', 'Ashok', 'Dinesh', 'Jyoti', 'Anil', 'Sushila', 'Om', 'Ishaan', 'Zoya'];
const LAST = ['Singh', 'Kumar', 'Sharma', 'Verma', 'Yadav', 'Gupta', 'Patel', 'Shah', 'Khan', 'Ali', 'Das', 'Reddy', 'Rao',
  'Nair', 'Iyer', 'Pillai', 'Mishra', 'Pandey', 'Tiwari', 'Chauhan', 'Rathore', 'Joshi', 'Mehta', 'Jain', 'Agarwal',
  'Bansal', 'Saini', 'Meena', 'Prajapati', 'Kushwaha', 'Maurya', 'Paswan', 'Ansari', 'Qureshi', 'Shaikh', 'Devi',
  'Kumari', 'Begum', 'Bano', 'Thakur', 'Chaudhary', 'Rajput', 'Naik', 'Gowda', 'Menon', 'Bhat', 'Sinha', 'Ghosh',
  "D'Souza", 'Fernandes'];

// Bank code, display names, account number lengths, and leading-digit choices.
const BANKS: { code: string; names: string[]; lengths: number[]; lead: string }[] = [
  { code: 'SBIN', names: ['State Bank of India', 'SBI', 'STATE BANK OF INDIA'], lengths: [11], lead: '1234' },
  { code: 'HDFC', names: ['HDFC Bank', 'HDFC BANK LTD'], lengths: [14], lead: '5' },
  { code: 'ICIC', names: ['ICICI Bank', 'ICICI BANK LIMITED'], lengths: [12], lead: '0123' },
  { code: 'UTIB', names: ['Axis Bank', 'AXIS BANK'], lengths: [15], lead: '9' },
  { code: 'KKBK', names: ['Kotak Mahindra Bank', 'KOTAK MAHINDRA BANK'], lengths: [10, 14], lead: '0123456789' },
  { code: 'PUNB', names: ['Punjab National Bank', 'PNB'], lengths: [16], lead: '0123456789' },
  { code: 'BARB', names: ['Bank of Baroda', 'BANK OF BARODA'], lengths: [14], lead: '0123456789' },
  { code: 'CNRB', names: ['Canara Bank', 'CANARA BANK'], lengths: [13], lead: '0123456789' },
  { code: 'UBIN', names: ['Union Bank of India', 'UNION BANK OF INDIA'], lengths: [15], lead: '0123456789' },
  { code: 'IDIB', names: ['Indian Bank', 'INDIAN BANK'], lengths: [10, 11], lead: '0123456789' },
  { code: 'IOBA', names: ['Indian Overseas Bank'], lengths: [15], lead: '0123456789' },
  { code: 'YESB', names: ['Yes Bank', 'YES BANK'], lengths: [15], lead: '0' },
  { code: 'INDB', names: ['IndusInd Bank'], lengths: [12, 13], lead: '1' },
  { code: 'FDRL', names: ['Federal Bank', 'THE FEDERAL BANK LTD'], lengths: [14], lead: '1' },
  { code: 'BKID', names: ['Bank of India', 'BANK OF INDIA'], lengths: [15], lead: '0123456789' },
  { code: 'CBIN', names: ['Central Bank of India'], lengths: [10], lead: '13' },
  { code: 'UCBA', names: ['UCO Bank', 'UCO BANK'], lengths: [14], lead: '0123' },
  { code: 'MAHB', names: ['Bank of Maharashtra'], lengths: [11], lead: '6' },
  { code: 'IDFB', names: ['IDFC First Bank', 'IDFC FIRST BANK'], lengths: [11], lead: '1' },
  { code: 'AUBL', names: ['AU Small Finance Bank'], lengths: [16], lead: '1' },
  { code: 'BDBL', names: ['Bandhan Bank'], lengths: [14], lead: '5' },
  { code: 'IPOS', names: ['India Post Payments Bank', 'IPPB'], lengths: [12], lead: '0' },
  { code: 'AIRP', names: ['Airtel Payments Bank'], lengths: [10], lead: '6789' }, // account = mobile number
  { code: 'PYTM', names: ['Paytm Payments Bank'], lengths: [10], lead: '6789' },
  { code: 'SRCB', names: ['Saraswat Co-operative Bank Ltd', 'SARASWAT BANK'], lengths: [15], lead: '0' },
  { code: 'PUNB', names: ['Punjab National Bank'], lengths: [16], lead: '0123456789' },
  { code: 'BARB', names: ['Baroda UP Bank'], lengths: [14], lead: '0123456789' },
  { code: 'SBIN', names: ['State Bank of India'], lengths: [11], lead: '34' },
  { code: 'KARB', names: ['Karnataka Bank'], lengths: [16], lead: '0123456789' },
  { code: 'TMBL', names: ['Tamilnad Mercantile Bank'], lengths: [15], lead: '0123456789' },
];

const STATUSES = ['SUCCESS', 'Success', 'success', 'PENDING', 'Pending', 'Processed', 'COMPLETED', 'Credited'];
const MODES = ['IMPS', 'NEFT', 'RTGS', 'UPI', 'imps'];

export function generateSamples(count: number, seed = 1): Sample[] {
  const r = rng(seed);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join('');
  const shuffle = <T,>(xs: T[]) => {
    for (let i = xs.length - 1; i > 0; i--) { const j = int(0, i); [xs[i], xs[j]] = [xs[j], xs[i]]; }
    return xs;
  };

  const casing = (s: string) => {
    const c = r();
    return c < 0.55 ? s.toUpperCase() : c < 0.9 ? s : s.toLowerCase();
  };
  const makeName = () => {
    const parts = [pick(FIRST)];
    const k = r();
    if (k < 0.12) parts.unshift(`${pick('ABCDGHJKMNPRSTV'.split(''))}${chance(0.5) ? '.' : ''}`);
    if (k < 0.75) parts.push(pick(LAST));
    if (k > 0.9) parts.splice(1, 0, pick(FIRST));
    return casing(parts.join(' '));
  };
  const makeMobile = () => `${int(6, 9)}${digits(9)}`;
  const makeIfsc = (code: string) => {
    const branch = chance(0.85) ? digits(6) : Array.from({ length: 6 }, () => pick('ABCDEFGHKLMPRSTUVXY0123456789'.split(''))).join('');
    return `${code}0${branch}`;
  };
  const makeAccount = (bank: (typeof BANKS)[number], mobile?: string) => {
    if ((bank.code === 'AIRP' || bank.code === 'PYTM') && mobile && chance(0.5)) return mobile;
    const len = pick(bank.lengths);
    return pick(bank.lead.split('')) + digits(len - 1);
  };
  const makeAmount = () => {
    const v = r();
    const n = v < 0.4 ? int(1, 50) * 100 : v < 0.7 ? int(100, 49999) : v < 0.9 ? int(1, 200) * 500 : int(50000, 999999);
    const paise = chance(0.15) ? int(1, 99) : 0;
    return { value: paise ? n + paise / 100 : n, n, paise };
  };
  const indian = (n: number) => {
    const s = String(n);
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  };
  const western = (n: number) => n.toLocaleString('en-US');
  const amountText = (a: { n: number; paise: number }, allowPlain: boolean) => {
    const dec = `${a.n}.${String(a.paise).padStart(2, '0')}`;
    const base = a.paise ? dec : pick([String(a.n), `${a.n}.00`]);
    const grouped = (a.paise || chance(0.5) ? (chance(0.5) ? indian(a.n) : western(a.n)) + `.${String(a.paise).padStart(2, '0')}` : indian(a.n));
    const styles = [
      () => base, () => `${a.n}.${String(a.paise).padStart(2, '0')}`, () => grouped, () => `Rs. ${base}`, () => `Rs ${grouped}`,
      () => `Rs.${base}`, () => `₹${base}`, () => `₹ ${grouped}`, () => `INR ${base}`, () => `${base}/-`, () => (a.paise ? `Rs.${dec}/-` : `Rs.${a.n}/-`),
      () => `${grouped} INR`,
    ];
    const text = pick(styles)();
    if (!allowPlain && /^\d+$/.test(text)) return `${text}.00`;
    return text;
  };
  const mobileText = (m: string, labelled: boolean) => {
    const styles = [
      () => m, () => m, () => m, () => `+91 ${m}`, () => `+91${m}`, () => `+91-${m}`, () => `+91 ${m.slice(0, 5)} ${m.slice(5)}`,
      () => `91-${m}`, () => `(+91) ${m}`,
      ...(labelled ? [() => `0${m}`, () => `${m.slice(0, 5)} ${m.slice(5)}`, () => `${m.slice(0, 5)}-${m.slice(5)}`,
        () => `${m.slice(0, 3)}-${m.slice(3, 6)}-${m.slice(6)}`] : []),
    ];
    return pick(styles)();
  };
  const accountText = (acc: string, labelled: boolean) => {
    if (labelled && chance(0.1) && acc.length >= 12) return acc.replace(/(\d{4})(?=\d)/g, '$1 ');
    return acc;
  };
  const dateText = () => pick([
    () => `${int(1, 28)}/${int(1, 12)}/2026`, () => `${String(int(1, 28)).padStart(2, '0')}-${String(int(1, 12)).padStart(2, '0')}-2026`,
    () => `2026-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    () => `${int(1, 28)} ${pick(['Jan', 'Feb', 'Mar', 'Apr', 'Oct', 'Nov'])} 2026`,
    () => `${int(1, 28)}-${pick(['Jan', 'Feb', 'Oct'])}-26 ${int(1, 12)}:${String(int(0, 59)).padStart(2, '0')} ${pick(['AM', 'PM'])}`,
    () => `${String(int(1, 28)).padStart(2, '0')}/${String(int(1, 12)).padStart(2, '0')}/2026 ${int(0, 23)}:${String(int(0, 59)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`,
  ])();
  const rrn = () => `6${String(int(1, 365)).padStart(3, '0')}${digits(8)}`;
  const txnId = () => pick([
    () => `PPINY${digits(9)}W${digits(4)}`, () => `TXN${digits(10)}`, () => `${pick(['SM', 'PN', 'RL', 'EKO'])}${digits(12)}`,
    () => `${pick(['SBIN', 'HDFC', 'N'])}${digits(12)}`, () => `T${digits(16)}`,
  ])();

  const samples: Sample[] = [];
  for (let i = 0; i < count; i++) {
    const bank = pick(BANKS);
    const hasMobile = chance(0.85);
    const mobile = makeMobile();
    const account = makeAccount(bank, mobile);
    const ifsc = makeIfsc(bank.code);
    const name = makeName();
    const amount = makeAmount();
    const expected: Expected = {
      accountHolder: name, accountNumber: account, ifscCode: ifsc, amount: String(amount.value),
      ...(hasMobile ? { customerMobile: mobile } : {}),
    };
    const ifscText = chance(0.1) ? ifsc.toLowerCase() : ifsc;
    const bankName = casing(pick(bank.names));

    const t = r();
    let text: string;
    let template: string;
    let ambiguous = false;

    if (t < 0.4) {
      // ---- Labelled blocks
      template = 'labelled';
      const L = {
        name: ['Name', 'Account Holder Name', 'Beneficiary Name', 'Bene Name', 'A/C Holder', 'Account Name', 'Payee',
          'Beneficiary', 'Holder Name', 'Benf. Name', 'NAME', 'Customer Name', 'Paid To'],
        account: ['Account No', 'A/C No', 'A/c No.', 'Account Number', 'Acc No', 'AC No', 'Beneficiary A/C', 'Bene Account No',
          'ACCOUNT NO.', 'Acct No', 'A/C', 'Account'],
        ifsc: ['IFSC', 'IFSC Code', 'IFS Code', 'Bank IFSC', 'ifsc code'],
        mobile: ['Mobile', 'Mobile No', 'Mob', 'Mob. No.', 'Phone', 'Contact No', 'Customer Mobile', 'Sender Mobile',
          'Remitter Mobile No', 'Mobile Number', 'Cust Mob'],
        amount: ['Amount', 'Amt', 'Txn Amount', 'Transaction Amount', 'Amount (Rs.)', 'Transfer Amount', 'Total Amount',
          'Amount Paid', 'AMOUNT', 'Paid Amount'],
        bank: ['Bank', 'Bank Name', 'Beneficiary Bank'],
        txn: ['Transaction ID', 'Txn ID', 'Order ID', 'Txn No'],
        utr: ['UTR', 'UTR No', 'Bank Ref No', 'RRN', 'Reference No', 'IMPS Ref'],
        date: ['Date', 'Txn Date', 'Transaction Date', 'Date & Time'],
        status: ['Status', 'Txn Status'],
        mode: ['Mode', 'Payment Mode', 'Transfer Mode'],
        charges: ['Charges', 'Service Charge', 'Commission', 'Fee'],
        balance: ['Balance', 'Avl Bal', 'Closing Balance'],
      };
      const pairs: [string, string][] = [
        [pick(L.name), name],
        [pick(L.account), accountText(account, true)],
        [pick(L.ifsc), ifscText],
        [pick(L.amount), amountText(amount, true)],
      ];
      if (hasMobile) pairs.push([pick(L.mobile), mobileText(mobile, true)]);
      if (chance(0.5)) pairs.push([pick(L.bank), bankName]);
      if (chance(0.4)) pairs.push([pick(L.txn), txnId()]);
      if (chance(0.4)) pairs.push([pick(L.utr), rrn()]);
      if (chance(0.4)) pairs.push([pick(L.date), dateText()]);
      if (chance(0.4)) pairs.push([pick(L.status), pick(STATUSES)]);
      if (chance(0.3)) pairs.push([pick(L.mode), pick(MODES)]);
      if (chance(0.3)) pairs.push([pick(L.charges), `${int(5, 50)}.00`]);
      if (chance(0.2)) pairs.push([pick(L.balance), `${int(100, 99999)}.${digits(2)}`]);
      shuffle(pairs);
      const layout = int(0, 6);
      const sep = pick([': ', ' : ', ':', ' - ', ' = ', ':- ']);
      if (layout === 0) text = pairs.map(([k, v]) => `${k}${sep}${v}`).join('\n');
      else if (layout === 1) text = pairs.map(([k, v]) => `${k}\t${v}`).join('\n');
      else if (layout === 2) text = pairs.map(([k, v]) => `${k}${pick([':', ''])}\n${v}`).join('\n');
      else if (layout === 3) text = pairs.map(([k, v]) => `${k}: ${v}`).join(pick([', ', ' | ', '  ', '\t', ' ; ']));
      else if (layout === 4) text = pairs.map(([k, v]) => `${k}: ${v}`).join(' ');
      else if (layout === 5) text = `${pairs.map(([k]) => k).join('\t')}\n${pairs.map(([, v]) => v).join('\t')}`;
      else text = pairs.map(([k, v]) => `${k}${sep}${v}`).join(pick(['\n\n', '\r\n']));
      // "Customer Name" and "Paid To" are only fallbacks; mixing them with another name label is fine.
    } else if (t < 0.75) {
      // ---- Rows copied from money-transfer software (fixed column orders)
      const sep = pick(['\t', '    ', '  ', ' ', ' | ', ', ', '\t\t']);
      const amt = amountText(amount, sep !== ' ' && sep !== ', ');
      const mob = hasMobile ? mobileText(mobile, false) : '';
      const orders: [string, string[]][] = [
        ['acct-name-ifsc-mob-txn-amt', [account, name, ifscText, mob, txnId(), amt]],
        ['mob-name-acct/ifsc', [mob, name, `${account} /${ifscText}`, ...(chance(0.5) ? [amt] : [])]],
        ['name-acct-ifsc-amt-mob', [name, account, ifscText, amt, mob]],
        ['date-txn-name-bank-acct-ifsc-amt-status', [dateText(), txnId(), name, bankName, account, ifscText, amt, pick(STATUSES)]],
        ['name-bank-acct-ifsc-amt-utr-status', [name, bankName, account, ifscText, amt, rrn(), pick(STATUSES)]],
        ['mob-name-acct-ifsc-amt-txn-utr', [mob, name, account, ifscText, amt, txnId(), rrn(), pick(STATUSES), dateText()]],
        ['acct-ifsc-name-amt', [account, ifscText, name, amt, mob]],
        ['ifsc-acct-name-mob-amt', [ifscText, account, name, mob, amt]],
        ['sno-name-acct-ifsc-bank-amt-mode', [String(int(1, 40)), name, account, ifscText, bankName, amt, pick(MODES)]],
        ['name/acct/ifsc', [`${name}/${account}/${ifscText}`, mob, amt]],
      ];
      const [id, cols] = pick(orders);
      template = `row:${id}`;
      if (!hasMobile && id.startsWith('mob')) cols.shift();
      // Only expect what the row actually contains.
      // (A payments-bank account equal to the mobile is not a mobile column.)
      const ownAccountCol = !id.includes('/'); // the "/" layouts put the account inside a combined column
      const mobCols = cols.filter(c => c === mob).length - (mob === account && ownAccountCol ? 1 : 0);
      if (!mob || mobCols <= 0) delete expected.customerMobile;
      if (!cols.includes(amt)) expected.amount = '';
      text = cols.filter(c => c !== '').join(sep);
      // The leading row number of the "sno" layout is an amount look-alike when the amount is a plain integer.
      if (id.startsWith('sno') && /^\d+$/.test(amt)) text = text.replace(new RegExp(`(^|\\D)${amt}(\\D|$)`), `$1${amt}.00$2`);
      if (chance(0.5)) text = text.split(sep).length > 6 && sep.trim() === '' && sep.length > 1 ? text : text;
    } else if (t < 0.85) {
      // ---- Multi-line, one value per line (no labels)
      template = 'lines';
      const amt = amountText(amount, false);
      const rows = [name, accountText(account, false), ifscText, amt];
      if (hasMobile) rows.splice(int(0, 1) ? 0 : 3, 0, mobileText(mobile, false));
      if (chance(0.4)) rows.push(pick(STATUSES));
      if (chance(0.3)) rows.unshift(dateText());
      if (chance(0.3)) rows.splice(2, 0, bankName);
      text = rows.join(pick(['\n', '\r\n', '\n\n']));
    } else if (t < 0.93) {
      // ---- SMS / app share sentences
      template = 'sms';
      const a = amountText(amount, false).replace(/^(?!Rs|₹|INR)/, 'Rs. ');
      const s = [
        () => `IMPS of ${a} to A/c ${account} (${ifscText}) ${name} is successful. UTR ${rrn()}.${hasMobile ? ` Sender Mob ${mobileText(mobile, false)}` : ''}`,
        () => `Dear Customer, ${a} transferred to ${name} A/c No ${account} IFSC ${ifscText} on ${dateText()}.${hasMobile ? ` Mobile: ${mobileText(mobile, false)}` : ''}`,
        () => `Payment successful! ${a} sent to ${name}, ${bankName} A/C ${account}, IFSC: ${ifscText}. Ref ${txnId()}${hasMobile ? `, Contact ${mobileText(mobile, false)}` : ''}`,
        () => `Money transfer ${pick(STATUSES)} | Beneficiary: ${name} | Acc: ${account} | IFSC: ${ifscText} | Amount: ${a}${hasMobile ? ` | Mob: ${mobileText(mobile, false)}` : ''}`,
      ];
      text = pick(s)();
    } else {
      // ---- Unlabelled, shuffled order (only some are decidable)
      template = 'shuffled';
      const sep = pick(['\t', '  ', ' | ', '\n']);
      const parts = [name, account, ifscText, amountText(amount, false)];
      if (hasMobile) parts.push(mobileText(mobile, false));
      if (chance(0.3)) parts.push(pick(STATUSES));
      if (chance(0.3)) parts.push(dateText());
      shuffle(parts);
      text = parts.join(sep);
      const accIdx = parts.indexOf(account);
      const ifscIdx = parts.indexOf(ifscText);
      const mobileShapedAcct = /^[6-9]\d{9}$/.test(account);
      const nearIfsc = Math.abs(accIdx - ifscIdx) <= 1;
      // Two mobile-looking numbers with no labels, or a lone mobile-looking account far from
      // the IFSC, cannot be told apart reliably.
      ambiguous = mobileShapedAcct && (hasMobile || !nearIfsc);
    }

    // Some pastes carry stray whitespace / trailing junk.
    if (chance(0.1)) text = `  ${text}  \n`;
    samples.push({ text, expected, template, ambiguous });
  }
  return samples;
}
