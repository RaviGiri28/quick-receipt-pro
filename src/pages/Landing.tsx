import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Receipt, Printer, History, FileSpreadsheet, Copy, Zap,
  CheckCircle, ArrowRight, Shield, Clock, Users, Star
} from 'lucide-react';
import { useEffect, useState } from 'react';

const features = [
  { icon: Zap, title: 'Instant Generation', desc: 'Create professional receipts in seconds with smart auto-fill' },
  { icon: Printer, title: 'Thermal Printing', desc: 'Optimized for 58mm & 80mm thermal printers' },
  { icon: History, title: 'Transaction History', desc: 'Track and search all past transactions easily' },
  { icon: FileSpreadsheet, title: 'Excel Export', desc: 'Export your records to Excel with one click' },
  { icon: Copy, title: 'Dual Printing', desc: 'Print customer & retailer copies simultaneously' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Your data stays safe with local-first storage' },
];

const steps = [
  { num: '01', title: 'Enter Details', desc: 'Paste or type transaction details — fields auto-fill instantly' },
  { num: '02', title: 'Generate Receipt', desc: 'Preview your professional receipt in real-time' },
  { num: '03', title: 'Print or Save', desc: 'Print on thermal paper or save for later use' },
  { num: '04', title: 'Track History', desc: 'All transactions are saved and exportable to Excel' },
];

const benefits = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Generate receipts in under 10 seconds' },
  { icon: Users, title: 'Built for Retailers', desc: 'Designed specifically for Indian mobile retailers' },
  { icon: Clock, title: 'Save Time', desc: 'Smart parsing eliminates manual data entry' },
  { icon: Star, title: 'Professional Look', desc: 'Clean, branded receipts that build trust' },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Landing() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Quick Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div
            className={`flex-1 text-center lg:text-left transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              🇮🇳 Built for Indian Retailers
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              Quick Receipt Generator
              <span className="block text-primary mt-1">for Mobile Retailers</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-lg mx-auto lg:mx-0">
              Generate professional transaction receipts instantly. Paste details, auto-fill fields, print on thermal paper — all in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button size="lg" onClick={() => navigate('/signup')} className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Login
              </Button>
            </div>
          </div>

          {/* Sample Receipt Preview */}
          <div
            className={`flex-1 max-w-sm w-full transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-xl" />
              <Card className="relative border-2 border-primary/20 shadow-lg">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-primary text-base">Sharma Digital Services</p>
                    <p className="text-[10px] text-muted-foreground">Shop No. 5, Main Road, Jaipur</p>
                    <p className="text-[10px] text-muted-foreground">Mob:- 9876543210</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-2">Transaction Receipt</p>
                    <div className="w-8 h-0.5 mx-auto mt-1 bg-primary/40 rounded-full" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {[
                      ['Account Holder', 'Amit Sharma'],
                      ['Account Number', '987654321045'],
                      ['IFSC Code', 'HDFC0005678'],
                      ['Amount (₹)', '₹ 12,000'],
                      ['Date', '15/04/2026'],
                      ['Transaction ID', 'TXN1002'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-dashed border-border/50 pb-1">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <span className="font-medium text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[8px] text-muted-foreground/60 pt-2">Generated by Quick Receipt</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-reveal opacity-0 translate-y-6 transition-all duration-600 [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Powerful Features</h2>
            <p className="text-muted-foreground mt-2">Everything you need to manage receipts efficiently</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card
                key={f.title}
                className="scroll-reveal opacity-0 translate-y-6 transition-all duration-500 [&.revealed]:opacity-100 [&.revealed]:translate-y-0 hover:shadow-md hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 scroll-reveal opacity-0 translate-y-6 transition-all duration-600 [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-2">Four simple steps to generate receipts</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="scroll-reveal opacity-0 translate-y-6 transition-all duration-500 [&.revealed]:opacity-100 [&.revealed]:translate-y-0 flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="text-2xl font-bold text-primary/30">{s.num}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 scroll-reveal opacity-0 translate-y-6 transition-all duration-600 [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Why Choose Quick Receipt?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="scroll-reveal opacity-0 translate-y-6 transition-all duration-500 [&.revealed]:opacity-100 [&.revealed]:translate-y-0 text-center p-5 rounded-xl border border-border bg-card"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center scroll-reveal opacity-0 translate-y-6 transition-all duration-600 [&.revealed]:opacity-100 [&.revealed]:translate-y-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="text-muted-foreground mt-3">Join thousands of Indian retailers who trust Quick Receipt for their daily transactions.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')} className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Quick Receipt</span>
          </div>
          <p>© {new Date().getFullYear()} Quick Receipt. Built for Indian retailers.</p>
        </div>
      </footer>
    </div>
  );
}
