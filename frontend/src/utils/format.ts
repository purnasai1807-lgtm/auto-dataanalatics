export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value));
}
export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "--";
  }
  return new Date(value).toLocaleString();
}
