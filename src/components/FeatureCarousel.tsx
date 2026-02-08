import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ClipboardPaste, Printer, FileSpreadsheet, Palette, Shield } from 'lucide-react';

const features = [
  { icon: ClipboardPaste, title: 'Smart Paste Detection', desc: 'Paste raw transaction text and watch fields auto-fill intelligently.' },
  { icon: Printer, title: 'Professional Printing', desc: 'A4-optimized prints with dual receipt support for customer & retailer.' },
  { icon: FileSpreadsheet, title: 'Excel Integration', desc: 'Save receipts as structured Excel files with auto serial numbers.' },
  { icon: Palette, title: 'Fully Customizable', desc: 'Add your logo, adjust colors, toggle watermarks, and customize layout.' },
  { icon: Shield, title: 'Local & Secure', desc: 'All data stored securely on your device. No internet required.' },
];

export function FeatureCarousel() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Key Features</h2>
      <Carousel opts={{ align: 'start', loop: true }} className="w-full">
        <CarouselContent>
          {features.map(f => (
            <CarouselItem key={f.title} className="md:basis-1/2 lg:basis-1/3">
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
