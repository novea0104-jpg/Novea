export const NOVOIN_TO_RUPIAH = 1000;

export function rupiahToNovoin(rupiah: number): number {
  return Math.ceil(rupiah / NOVOIN_TO_RUPIAH);
}

export function novoinToRupiah(novoin: number): number {
  return novoin * NOVOIN_TO_RUPIAH;
}

export function formatRupiah(rupiah: number): string {
  return `Rp ${rupiah.toLocaleString("id-ID")}`;
}

export function formatNovoin(novoin: number): string {
  return `${novoin.toLocaleString("id-ID")} Novoin`;
}

export const COIN_PACKAGES = [
  { id: "package-1", coins: 10, priceRupiah: 10000, bonus: 0 },
  { id: "package-2", coins: 25, priceRupiah: 25000, bonus: 2, isPopular: true },
  { id: "package-3", coins: 50, priceRupiah: 50000, bonus: 5 },
  { id: "package-4", coins: 100, priceRupiah: 100000, bonus: 15 },
  { id: "package-5", coins: 250, priceRupiah: 250000, bonus: 50 },
  { id: "package-6", coins: 500, priceRupiah: 500000, bonus: 125 },
];
