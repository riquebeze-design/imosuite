export function formatEUR(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactEUR(value: number) {
  // Ex.: 420.000 € / 1.350 € (arrendamento)
  return formatEUR(value);
}
