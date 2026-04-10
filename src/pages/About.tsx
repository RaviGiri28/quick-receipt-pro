import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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
    <div className="space-y-10 animate-fade-in-up max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <Receipt className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">About Quick Receipt</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Quick Receipt is a modern, professional receipt management platform designed specifically
          for money transfer retailers across India. Generate, customize, print, and manage
          transaction receipts with ease.
        </p>
      </div>

      {/* Key Features */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" /> Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keyFeatures.map(feature => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <Card key={section.title} className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{section.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join thousands of Indian retailers who trust Quick Receipt for professional transaction management.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/create')} className="gap-2">
              <Receipt className="h-4 w-4" /> Create Your First Receipt <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/support')} variant="outline" className="gap-2">
              <Users className="h-4 w-4" /> Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">Version 2.0 · Built with ❤️ for Indian retailers</p>
    </div>
  );
}
