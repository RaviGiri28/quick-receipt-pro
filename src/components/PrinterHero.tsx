import { FileText, Printer } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

interface PrinterHeroProps {
  className?: string;
  business?: { name?: string; address?: string; phone?: string };
  /** Handwritten annotation shown at the top right. */
  note?: string;
}

const sampleRows: [string, string][] = [
  ['Date', '15/04/2026'],
  ['Account Holder', 'Amit Sharma'],
  ['Account Number', '987654321045'],
  ['IFSC Code', 'HDFC0005678'],
  ['Amount (₹)', '₹ 12,000'],
  ['Transaction ID', 'TXN1002'],
];

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="16" y="8" width="26" height="32" rx="3" fill="#21A366" />
      <path d="M29 8h10a3 3 0 0 1 3 3v8H29z" fill="#33C481" />
      <path d="M29 19h13v10H29z" fill="#107C41" />
      <path d="M16 29h26v8a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3z" fill="#185C37" />
      <rect x="6" y="14" width="22" height="20" rx="3" fill="#107C41" />
      <path d="m11.5 19 3.6 5-3.8 5h2.9l2.3-3.3 2.3 3.3h2.9l-3.8-5 3.6-5h-2.8l-2.2 3.2-2.2-3.2z" fill="#fff" />
    </svg>
  );
}

function FloatingTile({ className, delay, children }: { className: string; delay: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'absolute z-20 flex aspect-square w-[13%] items-center justify-center rounded-[22%] border border-white/70 bg-white shadow-[0_14px_30px_-12px_rgba(26,86,219,0.45)] animate-float',
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

/**
 * Animated thermal printer that prints a sample receipt — the hero artwork used on
 * the landing, auth and dashboard screens. Sizes scale with the container width.
 */
export function PrinterHero({ className, business, note }: PrinterHeroProps) {
  const name = business?.name || 'Sharma Digital Services';
  const address = business?.address || 'Shop No.5, Main Road, Jaipur';
  const phone = business?.phone || '9876543210';

  return (
    <div
      className={cn('relative w-full select-none', className)}
      style={{ containerType: 'inline-size' }}
      aria-hidden
    >
      {note && (
        <div className="absolute right-0 top-[14%] z-30 w-[22%] rotate-[-8deg] text-right">
          <p className="font-hand text-[3.6cqw] font-bold leading-[1.05] text-primary">{note}</p>
          <svg viewBox="0 0 80 50" className="ml-auto mr-[45%] mt-1 w-[50%] text-primary">
            <path
              d="M70 4 C 72 30, 50 44, 12 40 M12 40 l10 -9 M12 40 l12 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="300"
              className="animate-draw-line"
            />
          </svg>
        </div>
      )}
      <div className={cn('relative aspect-[6/5]', note ? 'w-[80%]' : 'w-full')} style={{ containerType: 'inline-size' }}>
      {/* Soft morphing glow */}
      <div className="absolute left-[10%] top-[8%] h-[80%] w-[82%] animate-blob bg-gradient-to-br from-[hsl(var(--brand-glow))] via-[hsl(var(--brand-glow)/0.6)] to-transparent opacity-90 blur-[2px]" />
      <div className="absolute left-[38%] top-[30%] h-[50%] w-[50%] rounded-full bg-primary/25 blur-3xl" />

      {/* Dashed connectors between the floating tiles */}
      <svg viewBox="0 0 600 500" className="absolute inset-0 z-10 h-full w-full overflow-visible">
        <path
          d="M128 118 C 175 112, 205 150, 214 190 M84 240 C 60 285, 75 320, 110 336"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.55"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
          className="animate-dash-flow"
        />
      </svg>

      <FloatingTile className="left-[9%] top-[13%]" delay="0s">
        <Printer className="h-[48%] w-[48%] text-primary" strokeWidth={2.2} />
      </FloatingTile>
      <FloatingTile className="left-[3%] top-[38%]" delay="-1.6s">
        <ExcelIcon className="h-[62%] w-[62%]" />
      </FloatingTile>
      <FloatingTile className="left-[12%] top-[63%]" delay="-3.2s">
        <FileText className="h-[48%] w-[48%] text-primary" strokeWidth={2.2} />
      </FloatingTile>

      {/* Sparkle strokes */}
      <svg viewBox="0 0 40 40" className="absolute right-[7%] top-[10%] z-20 w-[7%] animate-sparkle text-primary">
        <path d="M6 22 12 8M18 26 30 14M20 34 34 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>

      {/* Printer: rear lid sits behind the paper */}
      <div className="absolute left-[33%] top-[53%] z-10 h-[14%] w-[54%] rounded-t-[4cqw] bg-gradient-to-b from-[#3a4560] to-[#1c2335] shadow-[inset_0_2px_0_rgba(255,255,255,0.12)]" />

      {/* Paper coming out of the slot */}
      <div className="absolute left-[38%] top-[0%] z-20 h-[61%] w-[44%] overflow-hidden drop-shadow-[0_10px_18px_rgba(15,40,100,0.25)]">
        <div className="absolute inset-0 animate-print-out">
          <div className="paper-edge-y flex h-[112%] flex-col [&>*]:shrink-0 bg-gradient-to-b from-white to-[#f4f7fd] px-[7%] pt-[7%] text-[#0f1b3d]">
            <LogoMark className="mx-auto h-[8cqw] w-[8cqw] drop-shadow-none" />
            <p className="mt-[1.4cqw] truncate text-center text-[2.5cqw] font-bold leading-tight">{name}</p>
            <p className="truncate text-center text-[1.6cqw] leading-snug text-slate-500">{address}</p>
            <p className="text-center text-[1.6cqw] leading-snug text-slate-500">Mob: {phone}</p>
            <p className="mt-[1.6cqw] text-center text-[1.65cqw] font-bold tracking-[0.18em]">TRANSACTION RECEIPT</p>
            <div className="mx-auto mt-[0.8cqw] h-[0.45cqw] w-[9cqw] rounded-full bg-primary" />
            <div className="mt-[1.6cqw] space-y-[0.9cqw]">
              {sampleRows.map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-dashed border-slate-200 pb-[0.5cqw] text-[1.6cqw]">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-[1.8cqw] text-center text-[1.35cqw] text-slate-400">Generated by Quick Receipt</p>
          </div>
        </div>
      </div>

      {/* Printer front body */}
      <div className="absolute left-[29%] top-[59%] z-30 h-[28%] w-[62%] rounded-[4cqw] bg-gradient-to-b from-[#2c364f] via-[#1f2740] to-[#141a2b] shadow-[0_30px_50px_-20px_rgba(15,30,80,0.6),inset_0_2px_0_rgba(255,255,255,0.14)] ring-1 ring-white/10">
        <div className="absolute left-[6%] right-[6%] top-[3%] h-[7%] rounded-full bg-[#0b0f1a] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)]" />
        <div className="absolute bottom-[14%] left-[7%] h-[2.2cqw] w-[2.2cqw] rounded-full bg-emerald-400 animate-led-pulse [animation-duration:2.4s]" />
        <div className="absolute right-[8%] top-[34%] h-[3cqw] w-[3cqw] rounded-full bg-[hsl(217_100%_62%)] animate-led-pulse" />
        <div className="absolute bottom-[14%] right-[8%] h-[4cqw] w-[4cqw] rounded-[1cqw] border border-white/10 bg-white/5" />
        <div className="absolute inset-x-[10%] bottom-[44%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      {/* Ground shadow */}
      <div className="absolute bottom-[7%] left-[27%] z-0 h-[7%] w-[66%] rounded-[50%] bg-primary/30 blur-xl" />
      </div>
    </div>
  );
}
