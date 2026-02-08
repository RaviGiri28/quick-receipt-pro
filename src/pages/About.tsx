import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Shield, Printer, Globe } from 'lucide-react';

const features = [
  { icon: Receipt, title: 'Professional Receipts', desc: 'Generate clean, customizable transaction receipts instantly.' },
  { icon: Printer, title: 'A4 Print Ready', desc: 'Optimized for standard A4 printing with dual-copy support.' },
  { icon: Shield, title: 'Secure & Local', desc: 'All data stored locally on your device. No cloud dependency.' },
  { icon: Globe, title: 'Made for India', desc: 'Built specifically for Indian money transfer retailers.' },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 animate-fade-in-up max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">About Quick Receipt</h1>
        <p className="text-muted-foreground mt-2">
          Quick Receipt is a modern receipt management tool designed for money transfer retailers across India.
          It simplifies the process of generating, printing, and managing professional transaction receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(f => (
          <Card key={f.title} className="hover-scale">
            <CardContent className="p-6 flex gap-4">
              <f.icon className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">Version 1.0 · Built with ❤️ for Indian retailers</p>
    </div>
  );
}
