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
  { id: "novoin_10", coins: 10, priceRupiah: 10000, bonus: 0 },
  { id: "novoin_25", coins: 25, priceRupiah: 25000, bonus: 2, isPopular: true },
  { id: "novoin_50", coins: 50, priceRupiah: 50000, bonus: 5 },
  { id: "novoin_100", coins: 100, priceRupiah: 100000, bonus: 15 },
  { id: "novoin_250", coins: 250, priceRupiah: 250000, bonus: 50 },
  { id: "novoin_500", coins: 500, priceRupiah: 500000, bonus: 125 },
];

export type CoinPackageId = typeof COIN_PACKAGES[number]['id'];
