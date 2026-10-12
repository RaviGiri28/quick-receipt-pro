// Guided tour shown to new users: it points at the main parts of the portal, pastes a
// demo transaction into Smart Paste and ends once that receipt has been printed.

// Sample message for Smart Paste; every required receipt field is detected from it.
export const DEMO_TRANSACTION = `Beneficiary Name: Rahul Sharma
A/C No: 50100234567891
IFSC: HDFC0001234
Bank: HDFC Bank
Amount: Rs. 2,500.00
Mobile: 98765 43210`;

// Window events between the tour and the Create Receipt page.
export const TOUR_DEMO_PASTE_EVENT = 'qr-tour:demo-paste';
export const TOUR_PRINTED_EVENT = 'qr-tour:printed';
// detail: id of the receipt saved from the demo text, which the tour deletes when it ends.
export const TOUR_DEMO_SAVED_EVENT = 'qr-tour:demo-saved';
// The tour has ended: Create Receipt clears the demo form.
export const TOUR_ENDED_EVENT = 'qr-tour:ended';

export interface TourStep {
  id: string;
  // Page the step is on; the tour opens it first.
  route: string;
  // `data-tour` value of the element to point at; none shows a centred card.
  target?: string;
  // Preferred side for the card; it falls back to below/above when there is no room.
  placement?: 'right';
  title: string;
  body: string;
  // demo-paste: offers to paste DEMO_TRANSACTION. print: waits for the user to print.
  kind?: 'welcome' | 'demo-paste' | 'print' | 'done';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    route: '/',
    kind: 'welcome',
    title: 'Welcome to Quick Receipt 👋',
    body: 'Take a one-minute tour. We will show you around and print your first receipt together using a demo transaction.',
  },
  {
    id: 'menu',
    route: '/',
    target: 'nav-main',
    placement: 'right',
    title: 'Your main menu',
    body: 'Dashboard, Create Receipt, Saved Receipts and History are always here. On a phone, tap ☰ at the top left to open it.',
  },
  {
    id: 'stats',
    route: '/',
    target: 'dashboard-stats',
    title: 'Your day at a glance',
    body: 'See how many receipts you have made, today\'s count and amount, and pending receipts. Click Pending Receipts to follow them up.',
  },
  {
    id: 'create-link',
    route: '/',
    target: 'nav-create',
    placement: 'right',
    title: 'Create a receipt',
    body: 'Every receipt starts here. Click Next and we will open it for you.',
  },
  {
    id: 'smart-paste',
    route: '/create',
    target: 'smart-paste',
    kind: 'demo-paste',
    title: 'Smart Paste',
    body: 'Paste a bank SMS or a customer\'s message here and the fields fill in by themselves. Try it with this demo text:',
  },
  {
    id: 'details',
    route: '/create',
    target: 'transaction-details',
    title: 'Filled in automatically',
    body: 'Name, account number, IFSC, bank and amount were detected from the text. Check them and fix anything by typing.',
  },
  {
    id: 'mask',
    route: '/create',
    target: 'mask-toggle',
    title: 'Hide the account number',
    body: 'With the eye off, only the last 5 digits are shown and printed. Click it to show the full number.',
  },
  {
    id: 'customer',
    route: '/create',
    target: 'customer-details',
    title: 'Customer details',
    body: 'The customer\'s mobile number is required, so you can search for the receipt by it later. Turn on dual receipts to print a customer and a shop copy.',
  },
  {
    id: 'preview',
    route: '/create',
    target: 'live-preview',
    title: 'Live preview',
    body: 'This is exactly how the receipt will print on your 58mm or 80mm thermal printer. It updates as you type.',
  },
  {
    id: 'print',
    route: '/create',
    target: 'print-actions',
    kind: 'print',
    title: 'Print your first receipt',
    body: 'Click Generate & Print, then Confirm & Print. Save Receipt keeps it in Saved Receipts to print later.',
  },
  {
    id: 'done',
    route: '/create',
    kind: 'done',
    title: 'Your first receipt is done! 🎉',
    body: 'That is all it takes. The demo receipt has been removed so your History stays clean. Your real receipts are kept in History, where you can search, reprint or change their status. Replay this tour any time from FAQs.',
  },
];

const doneKey = (userId: number) => `qr_tour_done_${userId}`;

export function isTourDone(userId: number): boolean {
  try {
    return localStorage.getItem(doneKey(userId)) === '1';
  } catch {
    // Storage blocked: don't keep showing the tour.
    return true;
  }
}

export function markTourDone(userId: number): void {
  try {
    localStorage.setItem(doneKey(userId), '1');
  } catch {
    // Nothing to remember it in.
  }
}
