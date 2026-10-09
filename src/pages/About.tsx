import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FormSection } from '@/components/FormSection';
import { LogoMark } from '@/components/brand/Logo';
import {
  Receipt, Shield, Printer, Globe, CheckCircle, Target, Heart, Eye, Sparkles, Users, ArrowRight,
} from 'lucide-react';

const keyFeatures = [
  'Auto-generated serial numbers that never duplicate',
  'Intelligent text parsing for instant receipt creation',
  'A4-optimized printing with dual-copy support',
  'Real-time receipt status management (Success / Pending)',
  'Editable receipts with full customization',
  'Excel export and structured data viewing',
  'Custom receipt fields from Settings',
  'Business branding with logo, address & phone',
];

const sections = [
  {
    icon: Target,
    title: 'Our Mission',
    content: 'To empower Indian retailers with a simple, fast, and professional receipt management solution that eliminates manual errors and saves valuable time every single day.',
  },
  {
    icon: Shield,
    title: 'Why Choose Quick Receipt',
    content: 'Quick Receipt combines intelligent automation, beautiful design, and rock-solid reliability. Our smart parsing auto-fills transaction details, and our print engine delivers pixel-perfect A4 receipts every time.',
  },
  {
    icon: Globe,
    title: 'Built for Indian Retailers',
    content: 'Designed with INR formatting, Indian banking standards (IFSC, UPI, NEFT), and workflows tailored for money transfer businesses across India. From Tier-1 cities to small towns.',
  },
  {
    icon: Heart,
    title: 'Our Values',
    content: 'Simplicity, reliability, and trust. We believe technology should make your job easier, not harder. Every feature is built with real retailer feedback in mind.',
  },
  {
    icon: Eye,
    title: 'Our Commitment',
    content: 'We are committed to maintaining the highest standards of data security, user privacy, and platform performance. Your business data stays on your device, always.',
  },
  {
    icon: Sparkles,
    title: 'Our Vision',
    content: 'To become the go-to receipt management platform for every money transfer retailer in India, enabling millions of small businesses to operate more professionally and efficiently.',
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <div className="card-soft relative overflow-hidden px-6 py-10 text-center animate-fade-in-up sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-4">
          <LogoMark className="mx-auto h-16 w-16 animate-float" />
          <h1 className="text-3xl font-extrabold text-navy sm:text-4xl">
            About Quick <span className="text-primary">Receipt</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground sm:text-lg">
            Quick Receipt is a modern, professional receipt management platform designed specifically
            for money transfer retailers across India. Generate, customize, print, and manage
            transaction receipts with ease.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <FormSection icon={Printer} title="Key Features" description="Everything you need at the counter" className="animate-fade-in-up [animation-delay:0.08s]">
        <div className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2">
          {keyFeatures.map(feature => (
            <div key={feature} className="flex items-start gap-3 rounded-xl bg-accent/50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Sections */}
      <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map(section => (
          <div key={section.title} className="group card-soft card-hover p-6">
            <div className="icon-tile icon-tile-pop mb-4 h-12 w-12"><section.icon className="h-6 w-6" /></div>
            <h3 className="mb-2 text-lg font-bold text-navy">{section.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.7)] animate-fade-in-up">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative space-y-4">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to Get Started?</h2>
          <p className="mx-auto max-w-md text-primary-foreground/80">
            Join thousands of Indian retailers who trust Quick Receipt for professional transaction management.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/create')} variant="secondary" size="lg">
              <Receipt /> Create Your First Receipt <ArrowRight />
            </Button>
            <Button
              onClick={() => navigate('/support')}
              variant="outline"
              size="lg"
              className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Users /> Contact Support
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">Version 2.0 · Built with ❤️ for Indian retailers</p>
    </div>
  );
}
