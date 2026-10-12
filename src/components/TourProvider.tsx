import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FilePlus, Home, MousePointerClick, PartyPopper, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { TourContext } from '@/hooks/use-tour';
import { isUnlocked } from '@/lib/appLock';
import { receiptsApi } from '@/lib/api';
import {
  DEMO_TRANSACTION, TOUR_DEMO_PASTE_EVENT, TOUR_DEMO_SAVED_EVENT, TOUR_ENDED_EVENT, TOUR_PRINTED_EVENT, markTourDone,
  tourSteps, type TourStep,
} from '@/lib/tour';
import { cn } from '@/lib/utils';

const HOLE_PAD = 8;
const EDGE = 16;
// How long to wait for a step's element to appear before showing the card centred instead.
const FIND_TIMEOUT_MS = 900;

// Follows the step's element on screen (it may render late, move, or scroll).
function useTargetRect(step: TourStep) {
  const [state, setState] = useState<{ rect: DOMRect | null; waiting: boolean }>({ rect: null, waiting: !!step.target });

  useEffect(() => {
    const startedAt = performance.now();
    let scrolled = false;
    let frame = 0;
    const tick = () => {
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      const r = el?.getBoundingClientRect();
      const visible = !!r && r.width > 0 && r.height > 0;
      if (el && visible && !scrolled) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        scrolled = true;
      }
      const waiting = !!step.target && !visible && performance.now() - startedAt < FIND_TIMEOUT_MS;
      setState(prev => {
        const same = prev.waiting === waiting && (prev.rect === r || (prev.rect && r && visible
          && prev.rect.top === r.top && prev.rect.left === r.left && prev.rect.width === r.width && prev.rect.height === r.height));
        return same ? prev : { rect: visible ? r! : null, waiting };
      });
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  return state;
}

// Where the card goes: beside, below or above the element, or docked at the bottom.
// Null means centred on screen.
function cardStyle(rect: DOMRect | null, placement: TourStep['placement']): CSSProperties | null {
  if (!rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(360, vw - EDGE * 2);

  if (placement === 'right' && vw - rect.right > width + EDGE * 2) {
    return { width, left: rect.right + HOLE_PAD + EDGE, top: Math.min(Math.max(rect.top, EDGE), vh - 300) };
  }
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, EDGE), vw - width - EDGE);
  const below = vh - rect.bottom;
  const above = rect.top;
  if (below >= 260) return { width, left, top: rect.bottom + HOLE_PAD + 12 };
  if (above >= 260) return { width, left, bottom: vh - rect.top + HOLE_PAD + 12 };
  return { width, left, bottom: EDGE };
}

function TourOverlay({ step, index, onNext, onBack, onClose, onFinish }: {
  step: TourStep;
  index: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onFinish: (to?: string) => void;
}) {
  const { rect, waiting } = useTargetRect(step);
  // Only the print step lets the user click the highlighted element.
  const interactive = step.kind === 'print';

  // Escape skips the tour, except on the print step where it closes the Confirm Print popup.
  useEffect(() => {
    if (interactive) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, interactive]);

  // Dim the page while the step's element is still appearing.
  if (waiting) return <div className="no-print fixed inset-0 z-40 bg-slate-950/55" />;

  const hole = rect && {
    top: rect.top - HOLE_PAD,
    left: rect.left - HOLE_PAD,
    width: rect.width + HOLE_PAD * 2,
    height: rect.height + HOLE_PAD * 2,
  };
  // Pointer blockers: everywhere except the hole on the interactive step.
  const blockers: CSSProperties[] = hole && interactive
    ? [
      { top: 0, left: 0, right: 0, height: Math.max(hole.top, 0) },
      { top: hole.top + hole.height, left: 0, right: 0, bottom: 0 },
      { top: hole.top, left: 0, width: Math.max(hole.left, 0), height: hole.height },
      { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
    ]
    : [{ inset: 0 }];
  const steps = tourSteps.length - 2; // progress counts the steps between welcome and done
  const progress = Math.min(Math.max(index, 0), steps);
  const centred = step.kind === 'welcome' || step.kind === 'done';
  const position = cardStyle(rect, step.placement);

  return (
    <div className="no-print" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {blockers.map((style, i) => <div key={i} className="fixed z-40" style={style} />)}
      {hole ? (
        <div
          className={cn(
            'pointer-events-none fixed z-40 rounded-2xl ring-2 ring-primary transition-all duration-300 ease-out',
            interactive && 'animate-pulse-ring',
          )}
          style={{ ...hole, boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)' }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] animate-in fade-in-0" />
      )}

      <div className={position ? undefined : 'pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4 [&>*]:pointer-events-auto'}>
      <div
        className={cn('card-soft animate-fade-in-up z-40 p-5 shadow-2xl ring-1 ring-primary/10', position ? 'fixed' : 'relative w-full max-w-sm')}
        style={position ?? undefined}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-navy"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {centred && (
          <div className="icon-tile icon-tile-pop mb-3 h-12 w-12 rounded-2xl">
            {step.kind === 'done' ? <PartyPopper className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </div>
        )}
        {!centred && (
          <div className="mb-3 flex items-center gap-2 pr-8">
            <span className="text-xs font-semibold text-primary">Step {progress} of {steps}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
              <span className="block h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(progress / steps) * 100}%` }} />
            </span>
          </div>
        )}

        <h2 id="tour-title" className="pr-6 text-lg font-bold text-navy">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        {step.kind === 'demo-paste' && (
          <pre className="mt-3 max-h-40 overflow-auto rounded-xl border bg-accent/50 p-3 font-mono text-xs leading-relaxed text-navy">
            {DEMO_TRANSACTION}
          </pre>
        )}
        {step.kind === 'print' && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            <MousePointerClick className="h-4 w-4 shrink-0" /> Click the highlighted button to continue.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          {step.kind === 'welcome' ? (
            <Button variant="ghost" size="sm" onClick={onClose}>Skip tour</Button>
          ) : step.kind === 'done' ? (
            <Button variant="outline" size="sm" onClick={() => onFinish('/')}><Home /> Dashboard</Button>
          ) : index > 1 ? (
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft /> Back</Button>
          ) : <span />}

          {step.kind === 'welcome' && <Button size="sm" onClick={onNext}>Start tour <ArrowRight /></Button>}
          {step.kind === 'demo-paste' && (
            <Button
              size="sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent(TOUR_DEMO_PASTE_EVENT, { detail: DEMO_TRANSACTION }));
                onNext();
              }}
            >
              <Sparkles /> Paste demo text
            </Button>
          )}
          {step.kind === 'print' && <Button variant="ghost" size="sm" onClick={onClose}>Skip tour</Button>}
          {step.kind === 'done' && <Button size="sm" onClick={() => onFinish()}><FilePlus /> Create a receipt</Button>}
          {!step.kind && <Button size="sm" onClick={onNext}>Next <ArrowRight /></Button>}
        </div>
      </div>
      </div>
    </div>
  );
}

// Holds the guided tour's state and draws it above every app page.
export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [index, setIndex] = useState<number | null>(null);
  // Never over the passcode lock or the login page.
  const step = index !== null && user && (!user.hasPasscode || isUnlocked(user.id)) ? tourSteps[index] : null;

  const queryClient = useQueryClient();
  // The receipt saved from the demo text; deleted once printed or when the tour ends.
  const demoId = useRef<string | null>(null);
  const removeDemo = useCallback(async () => {
    const id = demoId.current;
    if (!id) return;
    demoId.current = null;
    try {
      await receiptsApi.remove(id);
    } catch (err) {
      console.warn('Could not remove the tour demo receipt', err);
    }
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const start = useCallback(() => setIndex(0), []);
  const close = useCallback(() => {
    if (user) markTourDone(user.id);
    setIndex(null);
    removeDemo();
    window.dispatchEvent(new Event(TOUR_ENDED_EVENT));
  }, [user, removeDemo]);
  const finish = useCallback((to?: string) => {
    close();
    if (to) navigate(to);
  }, [close, navigate]);
  const next = useCallback(() => setIndex(i => (i === null ? null : Math.min(i + 1, tourSteps.length - 1))), []);
  const back = useCallback(() => setIndex(i => (i === null ? null : Math.max(i - 1, 0))), []);

  // Each step lives on a page: open it.
  useEffect(() => {
    if (step && pathname !== step.route) navigate(step.route);
  }, [step, pathname, navigate]);

  const active = step !== null;
  useEffect(() => {
    if (!active) return;
    const onDemoSaved = (e: Event) => { demoId.current = (e as CustomEvent<string>).detail; };
    window.addEventListener(TOUR_DEMO_SAVED_EVENT, onDemoSaved);
    return () => window.removeEventListener(TOUR_DEMO_SAVED_EVENT, onDemoSaved);
  }, [active]);

  // The print step finishes when the receipt has been printed. The demo receipt is then
  // deleted straight away (printing only reads the page, which keeps showing it).
  useEffect(() => {
    if (step?.kind !== 'print') return;
    const onPrinted = () => {
      next();
      removeDemo();
    };
    window.addEventListener(TOUR_PRINTED_EVENT, onPrinted);
    return () => window.removeEventListener(TOUR_PRINTED_EVENT, onPrinted);
  }, [step, next, removeDemo]);

  const value = useMemo(() => ({ active, start }), [active, start]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {step && pathname === step.route && (
        <TourOverlay key={step.id} step={step} index={index!} onNext={next} onBack={back} onClose={close} onFinish={finish} />
      )}
    </TourContext.Provider>
  );
}
