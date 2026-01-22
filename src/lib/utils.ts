import { type ClassValue, clsx } from 'clsx'; // npm install clsx
import { twMerge } from 'tailwind-merge';     // npm install tailwind-merge

/**
 * Merges Tailwind classes intelligently. 
 * Prevents conflicts like "bg-red-500 bg-blue-500" -> keeps the last one.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standardized Currency Formatter (Argentina Locale)
 * Usage: formatCurrency(1500.50) -> "$ 1.500,50"
 */
export function formatCurrency(amount: number | string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0, // No cents for Padel prices usually
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Standardized Time Delay (for smooth loading simulations)
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));