import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Menghitung ongkir berdasarkan jumlah beras yang dibeli
 * 1 beras = Rp 7.000
 * 2 beras = Rp 10.000
 * 3 beras = Rp 15.000
 * @param totalQuantity Total jumlah beras (quantity) dalam cart
 * @returns Ongkir dalam rupiah (bukan cents)
 */
export function calculateShippingCost(totalQuantity: number): number {
  if (totalQuantity <= 0) return 0
  if (totalQuantity === 1) return 7000
  if (totalQuantity === 2) return 15000
  if (totalQuantity >= 3) return 10000
  return 0
}