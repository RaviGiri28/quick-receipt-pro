import { useState } from 'react';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconInput } from '@/components/IconInput';
import { maskAccountNumber } from '@/lib/utils';

// Account number field that, while masked, shows only the last 5 digits.
// The full number appears while the field has focus so it can still be typed or corrected.
export function AccountNumberInput({ value, masked, onChange, maxLength }: {
  value: string;
  masked: boolean;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const hide = masked && !focused;
  return (
    <IconInput
      id="accountNumber"
      icon={CreditCard}
      value={hide ? maskAccountNumber(value) : value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Enter account number"
      inputMode="numeric"
      maxLength={maxLength}
    />
  );
}

// Eye button for the Transaction Details header: open eye = full number, closed eye = masked.
export function AccountMaskToggle({ masked, onChange }: { masked: boolean; onChange: (masked: boolean) => void }) {
  const label = masked ? 'Account number masked: show full number' : 'Account number shown: mask it';
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0 rounded-full"
      title={label}
      aria-label={label}
      aria-pressed={!masked}
      onClick={() => onChange(!masked)}
    >
      {masked ? <EyeOff /> : <Eye />}
    </Button>
  );
}
