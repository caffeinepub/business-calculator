import type { BusinessRecord } from '@/types/businessRecord';
import { calculateOrderAmount, formatCurrency } from './calculations';

interface SupplierGroup {
  supplierName: string;
  records: BusinessRecord[];
  subtotal: number;
}

export function exportSupplierReportCsv(
  supplierGroups: SupplierGroup[],
  grandTotal: number
): void {
  const rows: string[] = [];

  // Add header with order-related columns
  rows.push('Supplier Name,Sr No,SOR No,Item,Order Qty,Order Rate,GST (%),Order Amount');

  // Add data for each supplier group
  supplierGroups.forEach((group) => {
    group.records.forEach((record) => {
      const orderAmount = calculateOrderAmount(
        record.orderQuantity,
        record.orderRate,
        record.orderGst
      );
      rows.push(
        [
          escapeCsvValue(group.supplierName),
          record.srNo,
          escapeCsvValue(record.sorNo),
          escapeCsvValue(record.item),
          record.orderQuantity,
          record.orderRate,
          record.orderGst,
          orderAmount,
        ].join(',')
      );
    });

    // Add subtotal row
    rows.push(
      [
        escapeCsvValue(group.supplierName),
        '',
        '',
        'Subtotal',
        '',
        '',
        '',
        group.subtotal,
      ].join(',')
    );

    // Add empty row for spacing
    rows.push('');
  });

  // Add grand total row
  rows.push(['', '', '', 'Grand Total', '', '', '', grandTotal].join(','));

  // Create CSV content
  const csvContent = rows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `supplier-report-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
