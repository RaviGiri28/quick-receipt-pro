import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTour } from '@/hooks/use-tour';
import {
  HelpCircle, Search, ClipboardPaste, Eye, Printer, History, Store, Rocket, FileText, ShieldCheck, Settings2,
  LifeBuoy, ArrowRight, SearchX, PlayCircle, Clapperboard, type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DELETION_GRACE_DAYS } from '@/lib/legal';
import { cn } from '@/lib/utils';

// Hinglish demo video (create & print a receipt), hosted on Cloudinary. so_3 = poster frame at 3s.
const DEMO_VIDEO_URL = 'https://res.cloudinary.com/lgn4wnq1/video/upload/v1792094531/receiptor/demo/quickreceipt-demo-hinglish.mp4';
const DEMO_POSTER_URL = 'https://res.cloudinary.com/lgn4wnq1/video/upload/so_3,w_1280,q_auto/v1792094531/receiptor/demo/quickreceipt-demo-hinglish.jpg';

const scrollToDemoVideo = () =>
  document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

type Category = 'Getting started' | 'Receipts' | 'Printing' | 'Security' | 'Account';

interface Faq {
  id: string;
  category: Category;
  icon: LucideIcon;
  question: string;
  answer: React.ReactNode;
  // Plain text used for searching (the answer may contain links and lists).
  keywords: string;
}

const categories: { name: Category | 'All'; icon: LucideIcon }[] = [
  { name: 'All', icon: HelpCircle },
  { name: 'Getting started', icon: Rocket },
  { name: 'Receipts', icon: FileText },
  { name: 'Printing', icon: Printer },
  { name: 'Security', icon: ShieldCheck },
  { name: 'Account', icon: Settings2 },
];

const guideSteps: { icon: LucideIcon; title: string; text: string; to: string; cta: string }[] = [
  { icon: Store, title: 'Set up your business', text: 'Add your business name, address, phone and logo. They appear at the top of every receipt.', to: '/profile', cta: 'Open Profile' },
  { icon: ClipboardPaste, title: 'Paste the details', text: 'On Create Receipt, paste the transaction text into Smart Paste. Account number, name, IFSC and amount are filled in for you.', to: '/create', cta: 'Create Receipt' },
  { icon: Eye, title: 'Check the preview', text: 'Review the fields and the live preview. Fix anything that was not detected and add the customer mobile.', to: '/create', cta: 'Try it' },
  { icon: Printer, title: 'Print or save', text: 'Click Generate & Print for your thermal printer, or Save Receipt to finish it later from Saved Receipts.', to: '/saved', cta: 'Saved Receipts' },
  { icon: History, title: 'Find it any time', text: 'Every printed receipt is in History. Search, change its status, reprint, or export to Excel.', to: '/history', cta: 'Open History' },
];

const A = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="font-semibold text-primary hover:underline">{children}</Link>
);

const faqs: Faq[] = [
  {
    id: 'how-to-use',
    category: 'Getting started',
    icon: Rocket,
    question: 'How do I use this portal?',
    keywords: 'how to use start begin guide steps profile smart paste print save history video demo tutorial watch',
    answer: (
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Prefer to watch?{' '}
          <button type="button" onClick={scrollToDemoVideo} className="font-semibold text-primary hover:underline">
            Watch the demo video
          </button>{' '}
          (Hinglish, about 1.5 minutes).
        </li>
        <li>Fill in your business details and logo in <A to="/profile">Profile</A>.</li>
        <li>Go to <A to="/create">Create Receipt</A> and paste the transaction details into <b>Smart Paste</b>.</li>
        <li>Check the auto-filled fields and the live preview, and add the customer mobile number.</li>
        <li>Click <b>Generate &amp; Print</b> to print, or <b>Save Receipt</b> to keep it for later.</li>
        <li>Find all printed receipts in <A to="/history">History</A> and saved ones in <A to="/saved">Saved Receipts</A>.</li>
        <li>Prefer to be shown? Click <b>Take the guided tour</b> at the top of this page.</li>
      </ol>
    ),
  },
  {
    id: 'smart-paste',
    category: 'Getting started',
    icon: ClipboardPaste,
    question: 'What is Smart Paste and what can I paste into it?',
    keywords: 'smart paste auto detect fill message sms text account ifsc amount name reset',
    answer: (
      <p>
        Smart Paste reads raw transaction text, like a bank SMS or a message from your customer, and fills in the
        account number, account holder name, IFSC, bank and amount for you. Anything it misses can be typed in by hand.
        Use the <b>Reset</b> button at the top of the card to clear everything and start a new receipt.
      </p>
    ),
  },
  {
    id: 'saved-vs-history',
    category: 'Receipts',
    icon: FileText,
    question: 'What is the difference between Saved Receipts and History?',
    keywords: 'saved history difference list printed pending later',
    answer: (
      <p>
        <A to="/saved">Saved Receipts</A> holds receipts you saved without printing, so you can finish or print them
        later. <A to="/history">History</A> holds every receipt that has been printed. A receipt saved as Pending and
        then printed can appear in both.
      </p>
    ),
  },
  {
    id: 'find-receipt',
    category: 'Receipts',
    icon: Search,
    question: 'How do I find an old receipt?',
    keywords: 'find search old receipt mobile number account name serial filter export excel view data',
    answer: (
      <p>
        Use the search box in <A to="/history">History</A> or <A to="/saved">Saved Receipts</A>. You can search by
        account number, account holder name, customer mobile number or serial number. In History you can also
        <b> Export</b> the results to Excel or open <b>View Data</b> to see them as a table.
      </p>
    ),
  },
  {
    id: 'edit-status-delete',
    category: 'Receipts',
    icon: Settings2,
    question: 'How do I change the status, edit or delete a receipt?',
    keywords: 'status pending success change edit delete remove update',
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><b>Status:</b> click the status badge in the list and pick Success or Pending. It saves at once.</li>
        <li><b>Edit:</b> click the edit icon in the Actions column. You can print again from the edit page.</li>
        <li><b>Delete:</b> click the red bin icon and confirm. A deleted receipt cannot be recovered.</li>
      </ul>
    ),
  },
  {
    id: 'printing',
    category: 'Printing',
    icon: Printer,
    question: 'Which printer do I need, and can I print two copies?',
    keywords: 'printer thermal 58mm 80mm print copies dual two copy',
    answer: (
      <p>
        Receipts are designed for <b>58mm and 80mm thermal printers</b>, and you can also print to a normal printer.
        Turn on <b>Print dual receipts</b> on Create Receipt to print two copies, one for you and one for the customer.
        To make it the default, switch it on in <A to="/settings">Settings</A>.
      </p>
    ),
  },
  {
    id: 'masking',
    category: 'Security',
    icon: Eye,
    question: 'How do I hide the full account number on a receipt?',
    keywords: 'mask hide account number eye last 5 digits privacy',
    answer: (
      <p>
        Click the <b>eye icon</b> at the top right of Transaction Details. When it is off, only the last 5 digits of the
        account number are shown and printed (for example XXXXXXX12345). Masked receipts stay masked in the lists, and
        you can reveal the number in the preview with the eye icon.
      </p>
    ),
  },
  {
    id: 'passcode',
    category: 'Security',
    icon: ShieldCheck,
    question: 'What is the passcode and what if I forget it?',
    keywords: 'passcode pin lock 4 digit forgot security delete edit',
    answer: (
      <p>
        A 4-digit passcode you can set in <A to="/settings">Settings</A>. Once it is on, it is asked after you log in,
        when you open the portal in a new tab, before editing a receipt and before deleting one. If you forget it, click
        <b> Forgot passcode?</b> on the lock screen and enter your account password to remove it.
      </p>
    ),
  },
  {
    id: 'customize',
    category: 'Account',
    icon: Store,
    question: 'How do I add my logo and change how receipts look?',
    keywords: 'logo business name color theme custom fields branch look design',
    answer: (
      <p>
        Upload your logo and business details in <A to="/profile">Profile</A>. In <A to="/settings">Settings</A> you can
        show or hide the logo and name, choose the receipt colour, and add <b>custom fields</b> such as Branch Name. The
        preview on the right shows your changes as you make them.
      </p>
    ),
  },
  {
    id: 'data-safety',
    category: 'Account',
    icon: LifeBuoy,
    question: 'Is my data safe, and what happens if I delete my account?',
    keywords: 'data safe secure delete account restore recover privacy',
    answer: (
      <p>
        Your receipts are stored in your account and are only visible after you log in. If you delete your account, you
        can restore everything within {DELETION_GRACE_DAYS} days by logging in again. After that, the account and all
        receipts are erased permanently.
      </p>
    ),
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const tour = useTour();

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return faqs.filter(f =>
      (category === 'All' || f.category === category)
      && words.every(w => `${f.question} ${f.keywords}`.toLowerCase().includes(w)),
    );
  }, [query, category]);

  return (
    <div className="space-y-6">
      <PageHeader
        className="animate-fade-in-up"
        icon={HelpCircle}
        title="FAQs"
        description="Quick answers about creating, printing and managing your receipts."
      />

      {/* Demo video */}
      <section id="demo-video" className="card-soft animate-fade-in-up scroll-mt-20 overflow-hidden p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="icon-tile h-11 w-11"><Clapperboard className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-bold text-navy">Watch the demo</h2>
            <p className="text-sm text-muted-foreground">See how to create and print a receipt in about 1.5 minutes (Hinglish).</p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border bg-black shadow-sm">
          <video
            className="aspect-video w-full"
            src={DEMO_VIDEO_URL}
            poster={DEMO_POSTER_URL}
            controls
            playsInline
            preload="none"
          >
            Your browser cannot play this video.
          </video>
        </div>
      </section>

      {/* How to use: step-by-step guide */}
      <section className="card-soft animate-fade-in-up overflow-hidden p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">How to use this portal</h2>
            <p className="text-sm text-muted-foreground">From your first receipt to finding it later, in five steps.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={tour.start}><PlayCircle /> Take the guided tour</Button>
            <Button asChild variant="outline">
              <Link to="/create"><Rocket /> Create a receipt</Link>
            </Button>
          </div>
        </div>
        <ol className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {guideSteps.map((s, i) => (
            <li key={s.title} className="group card-hover relative flex flex-col rounded-2xl border bg-accent/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="icon-tile icon-tile-pop h-11 w-11"><s.icon className="h-5 w-5" /></span>
                <span className="text-3xl font-extrabold text-primary/20">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-bold text-navy">{s.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.text}</p>
              <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {s.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Search and categories */}
      <section className="card-soft animate-fade-in-up space-y-4 p-5 sm:p-6 [animation-delay:0.1s]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search questions, e.g. passcode, print, mobile..."
            className="h-11 pl-10"
            aria-label="Search FAQs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(c.name)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                category === c.name
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-navy',
              )}
            >
              <c.icon className="h-3.5 w-3.5" /> {c.name}
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <Accordion type="single" collapsible defaultValue={query || category !== 'All' ? undefined : 'how-to-use'} className="space-y-3">
            {visible.map(f => (
              <AccordionItem key={f.id} value={f.id} className="rounded-2xl border bg-card px-4 transition-shadow data-[state=open]:border-primary/30 data-[state=open]:shadow-sm">
                <AccordionTrigger className="gap-3 text-left hover:no-underline [&[data-state=open]_.faq-q]:text-primary">
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="icon-tile h-9 w-9 shrink-0 rounded-xl"><f.icon className="h-4 w-4" /></span>
                    <span className="faq-q font-semibold text-navy transition-colors">{f.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-12 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/60" />
            <p className="font-semibold text-navy">No questions match "{query}"</p>
            <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCategory('All'); }}>Clear search</Button>
          </div>
        )}
      </section>

      {/* Still need help */}
      <section className="card-soft animate-fade-in-up flex flex-wrap items-center gap-4 p-5 sm:p-6 [animation-delay:0.2s]">
        <span className="icon-tile icon-tile-pop h-12 w-12"><LifeBuoy className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-navy">Still need help?</h2>
          <p className="text-sm text-muted-foreground">Send us a message and we usually reply within one working day.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/support">Contact Support <ArrowRight /></Link>
        </Button>
      </section>
    </div>
  );
}
