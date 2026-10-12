import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from 'input-otp';
import { cn } from '@/lib/utils';

export const PASSCODE_LENGTH = 4;

function Slot({ char, hasFakeCaret, isActive, invalid }: SlotProps & { invalid?: boolean }) {
  return (
    <div
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-xl border border-input bg-card text-2xl font-bold text-navy transition-all',
        isActive && 'z-10 border-primary ring-4 ring-primary/15',
        invalid && 'border-destructive ring-destructive/15',
      )}
    >
      {char && <span className="h-3 w-3 rounded-full bg-current" />}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-5 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

// 4-digit passcode boxes; digits show as dots.
export function PasscodeInput({ value, onChange, onComplete, invalid, autoFocus, disabled, id }: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <OTPInput
      id={id}
      maxLength={PASSCODE_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-invalid={invalid}
      containerClassName="flex items-center justify-center gap-3 has-[:disabled]:opacity-50"
      render={({ slots }) => (
        <>
          {slots.map((slot, i) => <Slot key={i} {...slot} invalid={invalid} />)}
        </>
      )}
    />
  );
}
