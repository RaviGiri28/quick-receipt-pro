import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// "₹2,400" for whole amounts, "₹1,500.50" otherwise.
export function formatInr(amount: number | string): string {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

// Hides all but the last 5 characters of an account number: 123456789012 -> XXXXXXX89012.
export function maskAccountNumber(accountNumber: string): string {
  const visible = 5;
  if (accountNumber.length <= visible) return accountNumber;
  return 'X'.repeat(accountNumber.length - visible) + accountNumber.slice(-visible);
}

// The account number as the receipt shows it: masked if the receipt was saved that way.
export function displayAccountNumber(r: { accountNumber?: string; maskAccountNumber?: boolean }): string {
  const number = r.accountNumber || '';
  return r.maskAccountNumber ? maskAccountNumber(number) : number;
}
