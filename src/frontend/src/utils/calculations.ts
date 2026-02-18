export function calculateAmount(quantity: number, rate: number): number {
  if (isNaN(quantity) || isNaN(rate)) return 0;
  return quantity * rate;
}

export function calculateOrderAmount(
  orderQuantity: number,
  orderRate: number,
  orderGst: number
): number {
  if (isNaN(orderQuantity) || isNaN(orderRate) || isNaN(orderGst)) return 0;
  return orderQuantity * orderRate * (1 + orderGst / 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
