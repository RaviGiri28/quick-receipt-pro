import { useEffect } from 'react';
import { formatInr } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi, localIsoDate } from '@/lib/api';
import { useBusinessInfo } from '@/hooks/use-business-info';
import { useCountUp } from '@/hooks/use-count-up';
import { useTour } from '@/hooks/use-tour';
import { useAuth } from '@/contexts/AuthContext';
import { isTourDone } from '@/lib/tour';
import { PrinterHero } from '@/components/PrinterHero';
import { AnnouncementsPanel } from '@/components/AnnouncementsPanel';
import { Button } from '@/components/ui/button';
import {
  FilePlus, History, Star, IndianRupee, Clock, FileText, CalendarDays, CheckCircle2,
  ClipboardPaste, Printer, FileSpreadsheet, ArrowRight, type LucideIcon,
} from 'lucide-react';

const keyFeatures = [
  { icon: ClipboardPaste, title: 'Smart Paste Detection', desc: 'Paste raw transaction text and watch fields auto-fill intelligently.' },
  { icon: Printer, title: 'Professional Printing', desc: 'Thermal & A4 prints with dual receipt support for customer & retailer.' },
  { icon: FileSpreadsheet, title: 'Excel Integration', desc: 'Export receipts as structured Excel files with auto serial numbers.' },
];

const quickActions = [
  { icon: FilePlus, title: 'Create Receipt', desc: 'Generate a new transaction receipt.', url: '/create' },
  { icon: Star, title: 'Saved Receipts', desc: 'View and manage saved receipts.', url: '/saved' },
  { icon: History, title: 'View History', desc: 'Search and filter past receipts.', url: '/history' },
];

const steps = [
  { num: '01', title: 'Enter Details', desc: 'Paste or type the transaction details.' },
  { num: '02', title: 'Generate Receipt', desc: 'Check the live preview instantly.' },
  { num: '03', title: 'Print or Save', desc: 'Print on thermal paper or save for later.' },
];

function StatCard({ title, value, icon: Icon, onClick }: {
  title: string; value: React.ReactNode; icon: LucideIcon; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`card-soft card-hover group relative overflow-hidden p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/[0.05] transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-start gap-4">
        <div className="icon-tile icon-tile-pop h-12 w-12">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-extrabold tabular-nums text-navy">{value}</p>
          {onClick && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Click to view <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const business = useBusinessInfo();
  const today = localIsoDate();
  const { data: stats, isError } = useQuery({ queryKey: ['dashboard', today], queryFn: () => receiptsApi.dashboard(today) });

  const total = useCountUp(stats?.total_receipts);
  const todays = useCountUp(stats?.todays_receipt);
  const todaysAmount = useCountUp(stats?.todays_amount);
  const pending = useCountUp(stats?.pending_receipts);

  // New accounts (no receipts yet) get the guided tour once, after accepting the terms.
  const { user } = useAuth();
  const tour = useTour();
  const isNewAccount = stats?.total_receipts === 0;
  useEffect(() => {
    if (user && user.termsAccepted && isNewAccount && !tour.active && !isTourDone(user.id)) tour.start();
  }, [user, isNewAccount, tour]);
  const show = (value: number | undefined, format: (n: number) => string = n => String(Math.round(n))) =>
    value !== undefined ? format(value) : isError ? '—' : <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-muted" />;

  return (
    <div className="space-y-10">

      {/* Hero */}
      <section className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="stagger space-y-5">
          <p className="font-semibold text-primary">Welcome to Quick Receipt</p>
          <h1 className="text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl">
            Your Smart Receipt <span className="text-gradient">Generator</span>
          </h1>
          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Create professional transaction receipts instantly. Save, manage and print receipts with ease.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Fast & Easy', 'Secure & Reliable', 'Print Ready'].map(label => (
              <span key={label} className="chip">
                <CheckCircle2 className="h-4 w-4 fill-primary text-primary-foreground" /> {label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button size="lg" onClick={() => navigate('/create')} className="group">
              <FilePlus /> New Receipt
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/history')}>
              <History /> View History
            </Button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[600px] animate-fade-in-up [animation-delay:0.15s]">
          <PrinterHero business={business} note="Print on 58mm/80mm Thermal Printer" />
        </div>
      </section>
      <AnnouncementsPanel />
      {/* Stats */}
      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-tour="dashboard-stats">
        <StatCard title="Total Receipts" value={show(total)} icon={FileText} />
        <StatCard title="Today's Receipts" value={show(todays)} icon={CalendarDays} />
        <StatCard title="Today's Amount" value={show(todaysAmount, n => formatInr(Math.round(n)))} icon={IndianRupee} />
        <StatCard title="Pending Receipts" value={show(pending)} icon={Clock} onClick={() => navigate('/saved?status=pending')} />
      </section>

      {/* Key features and quick actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-navy">Key Features</h2>
        <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-3">
          {keyFeatures.map(f => (
            <div key={f.title} className="card-soft card-hover group flex items-start gap-4 p-5">
              <div className="icon-tile icon-tile-pop h-12 w-12"><f.icon className="h-6 w-6" /></div>
              <div>
                <h3 className="font-bold text-navy">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
          {quickActions.map(a => (
            <button
              key={a.title}
              onClick={() => navigate(a.url)}
              className="card-soft card-hover group flex items-center gap-4 p-5 text-left"
            >
              <div className="icon-tile icon-tile-pop h-12 w-12"><a.icon className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-navy">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-accent via-accent/60 to-card px-5 py-8 sm:px-10">
        <div className="dot-grid absolute -right-6 -top-6 h-32 w-32 opacity-60" />
        <div className="relative text-center">
          <h2 className="text-xl font-extrabold text-primary sm:text-2xl">Simple Steps to Generate Receipt</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get started in just a few clicks and manage your receipts effortlessly.</p>
        </div>
        <div className="stagger relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.num} className="card-soft card-hover flex items-center gap-4 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-primary">
                {s.num}
              </span>
              <div>
                <h3 className="font-bold text-navy">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
