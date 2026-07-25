/** Format a minor-unit price (e.g. cents/pence) as a currency string. */
export function formatPrice(amountMinor: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

/** Format an ISO timestamp as a readable date + time. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Capitalise the first letter of a status/label string. */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
