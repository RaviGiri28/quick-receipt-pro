import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PublicNav } from '@/components/PublicNav';
import { PrinterHero } from '@/components/PrinterHero';
import { SiteFooter } from '@/components/SiteFooter';
import { ContactSection } from '@/components/ContactSection';
import { PricingSection } from '@/components/PricingSection';
import {
  Printer, History, FileSpreadsheet, Copy, Zap, ArrowRight, ShieldCheck, Clock, Users, Star, MonitorCheck, BadgeCheck,
} from 'lucide-react';

const features = [
  { icon: Zap, title: 'Instant Generation', desc: 'Create professional receipts in seconds with smart auto-fill.' },
  { icon: Printer, title: 'Thermal Printing', desc: 'Optimized for 58mm & 80mm thermal printers.' },
  { icon: History, title: 'Transaction History', desc: 'Track and search all past transactions easily.' },
  { icon: FileSpreadsheet, title: 'Excel Export', desc: 'Export your records to Excel with one click.' },
  { icon: Copy, title: 'Dual Printing', desc: 'Print customer & retailer copies simultaneously.' },
  { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Your receipts are tied to your account and protected by login.' },
];

const steps = [
  { num: '01', title: 'Enter Details', desc: 'Paste or type transaction details — fields auto-fill instantly.' },
  { num: '02', title: 'Generate Receipt', desc: 'Preview your professional receipt in real-time.' },
  { num: '03', title: 'Print or Save', desc: 'Print on thermal paper or save for later use.' },
  { num: '04', title: 'Track History', desc: 'All transactions are saved and exportable to Excel.' },
];

const benefits = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Generate receipts in under 10 seconds' },
  { icon: Users, title: 'Built for Retailers', desc: 'Designed specifically for Indian mobile retailers' },
  { icon: Clock, title: 'Save Time', desc: 'Smart parsing eliminates manual data entry' },
  { icon: Star, title: 'Professional Look', desc: 'Clean, branded receipts that build trust' },
];

const faqs = [
  { q: 'Which printers does Quick Receipt Pro support?', a: 'Receipts are laid out for 58mm and 80mm thermal printers, and print from any browser with your normal print dialog.' },
  { q: 'Can I print a copy for the customer and one for my shop?', a: 'Yes. Turn on dual receipts while creating a receipt (or make it the default in Settings) and both copies print side by side.' },
  { q: 'How does Smart Paste work?', a: 'Paste the raw transaction message you received and Quick Receipt Pro detects the account number, name, IFSC, amount and other details for you.' },
  { q: 'Can I add my shop logo and details?', a: 'Yes. Add your business name, address, phone and logo in your profile. You can also add your own custom fields in Settings.' },
  { q: 'Can I export my receipts?', a: 'Yes. Filter your history by date or status and export every matching receipt to an Excel file in one click.' },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function SectionTitle({ lead, accent, sub }: { lead: string; accent: string; sub: string }) {
  return (
    <div className="reveal mb-12 text-center">
      <div className="flex items-center justify-center gap-5">
        <span className="hidden h-0.5 w-12 rounded-full bg-primary/60 sm:block" />
        <h2 className="text-3xl font-extrabold text-navy sm:text-4xl">
          {lead} <span className="text-primary">{accent}</span>
        </h2>
        <span className="hidden h-0.5 w-12 rounded-full bg-primary/60 sm:block" />
      </div>
      <p className="mt-3 text-muted-foreground sm:text-lg">{sub}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas text-foreground">
      <PublicNav active="Home" />

      {/* Hero */}
      <section id="home" className="relative scroll-mt-20 px-4 pb-16 pt-8 sm:px-6 lg:pb-24 lg:pt-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-full bg-gradient-to-b from-accent/70 via-accent/30 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="stagger space-y-6 text-center lg:text-left">
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
            <div className="chip w-fit text-primary">
              <span className="flex h-4 w-6 flex-col overflow-hidden rounded-[3px] shadow-sm" aria-hidden>
                <span className="flex-1 bg-[#FF9933]" />
                <span className="relative flex-1 bg-white"><span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#000080]" /></span>
                <span className="flex-1 bg-[#138808]" />
              </span>
              Built for Indian Retailers
            </div>
            {/* Registration only: no government logo or "certified/approved" wording. */}
            <div className="chip w-fit text-primary">
              <BadgeCheck className="h-4 w-4" /> Udyam Registered MSME
            </div>
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-navy sm:text-5xl xl:text-6xl">
              Quick Receipt Pro
              <span className="mt-1 block text-gradient">Receipt Generator <br className="hidden sm:block" />for Mobile Retailers</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground sm:text-xl lg:mx-0">
              Generate professional transaction receipts instantly. Paste details, auto-fill fields, print on thermal paper — all in seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <span className="chip"><Zap className="h-4 w-4 fill-primary text-primary" /> Fast & Easy</span>
              <span className="chip"><ShieldCheck className="h-4 w-4 text-primary" /> Secure & Reliable</span>
              <span className="chip"><MonitorCheck className="h-4 w-4 text-primary" /> Print Ready</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2 lg:justify-start">
              <Button size="lg" onClick={() => navigate('/signup')} className="group h-14 px-8 text-lg">
                Get Started Free <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="h-14 px-10 text-lg">
                Login
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[600px] animate-fade-in-up [animation-delay:0.2s]">
            <PrinterHero business={{ name: 'Mobile Shop', address: 'Makkar Colony, Ludhiana', phone: '6239979480' }} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle lead="Powerful" accent="Features" sub="Everything you need to manage receipts efficiently" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="reveal card-soft card-hover group flex items-start gap-5 p-6"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="icon-tile icon-tile-pop h-14 w-14 rounded-2xl"><f.icon className="h-7 w-7" /></div>
                <div>
                  <h3 className="text-lg font-bold text-navy">{f.title}</h3>
                  <p className="mt-1 text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle lead="How It" accent="Works" sub="Four simple steps to generate receipts" />
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-10 hidden h-0.5 border-t-2 border-dashed border-primary/25 lg:block" />
            {steps.map((s, i) => (
              <div key={s.num} className="reveal relative text-center" style={{ transitionDelay: `${i * 110}ms` }}>
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card text-2xl font-extrabold text-primary shadow-[0_14px_30px_-14px_hsl(var(--primary)/0.6)] ring-8 ring-accent">
                  {s.num}
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">{s.title}</h3>
                <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle lead="Why Choose" accent="Quick Receipt Pro?" sub="Made for busy counters and fast-moving queues" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <div key={b.title} className="reveal card-soft card-hover group p-6 text-center" style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="icon-tile icon-tile-pop mx-auto mb-4 h-14 w-14 rounded-full"><b.icon className="h-6 w-6" /></div>
                <h3 className="font-bold text-navy">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <SectionTitle lead="Simple" accent="Pricing" sub="Try it free, then pick the plan that suits your shop" />
          <PricingSection />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SectionTitle lead="Frequently Asked" accent="Questions" sub="Everything you need to know before you start" />
          <Accordion type="single" collapsible className="reveal space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="card-soft border px-5">
                <AccordionTrigger className="text-left font-semibold text-navy hover:text-primary hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle lead="Get in" accent="Touch" sub="Questions, feedback or a demo? Send us a message and we will get back to you." />
          <ContactSection />
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 pt-8 sm:px-6">
        <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[hsl(221_83%_50%)] to-[hsl(224_85%_33%)] px-6 py-14 text-center text-white shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.8)]">
          <div className="absolute -left-20 -top-20 h-64 w-64 animate-blob bg-white/10" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 animate-blob bg-white/10 [animation-delay:-5s]" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Get Started?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80 sm:text-lg">
              Create professional receipts for your daily transactions in seconds. Free to get started.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="group h-14 bg-white px-8 text-lg text-primary shadow-xl hover:bg-white/90">
                Get Started Free <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="h-14 border-white/40 bg-transparent px-10 text-lg text-white hover:bg-white/10 hover:text-white">
                Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
