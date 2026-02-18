import { useBusinessRecords } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react';
import { SiCoffeescript } from 'react-icons/si';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateOrderAmount, formatCurrency } from '@/utils/calculations';
import { exportSupplierReportCsv } from '@/utils/exportSupplierReportCsv';
import type { BusinessRecord } from '@/types/businessRecord';

interface SupplierWiseReportPageProps {
  onNavigateBack: () => void;
}

interface SupplierGroup {
  supplierName: string;
  records: BusinessRecord[];
  subtotal: number;
}

export function SupplierWiseReportPage({ onNavigateBack }: SupplierWiseReportPageProps) {
  const { data: records = [], isLoading, error } = useBusinessRecords();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">
            Failed to load business records. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Group records by supplier name
  const supplierGroups: SupplierGroup[] = [];
  const groupMap = new Map<string, BusinessRecord[]>();

  records.forEach((record) => {
    const supplierName = record.supplierName?.trim() || '(No supplier name)';
    if (!groupMap.has(supplierName)) {
      groupMap.set(supplierName, []);
    }
    groupMap.get(supplierName)!.push(record);
  });

  // Convert to array and calculate subtotals based on Order Amount
  groupMap.forEach((records, supplierName) => {
    const subtotal = records.reduce((sum, record) => {
      return sum + calculateOrderAmount(record.orderQuantity, record.orderRate, record.orderGst);
    }, 0);
    supplierGroups.push({ supplierName, records, subtotal });
  });

  // Sort by supplier name
  supplierGroups.sort((a, b) => {
    if (a.supplierName === '(No supplier name)') return 1;
    if (b.supplierName === '(No supplier name)') return -1;
    return a.supplierName.localeCompare(b.supplierName);
  });

  // Calculate grand total from Order Amount
  const grandTotal = supplierGroups.reduce((sum, group) => sum + group.subtotal, 0);

  const handleExportCsv = () => {
    exportSupplierReportCsv(supplierGroups, grandTotal);
  };

  const handlePrint = () => {
    window.print();
  };

  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'business-calculator'
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm print:shadow-none">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <SiCoffeescript className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Supplier-Wise Report
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Grouped by supplier with order details and calculated amounts
                </p>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button onClick={handleExportCsv} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={onNavigateBack} variant="default" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Table
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {supplierGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No records found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {supplierGroups.map((group) => (
              <div key={group.supplierName} className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
                  {group.supplierName}
                </h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Sr No</TableHead>
                        <TableHead className="w-32">SOR No</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right w-28">Order Qty</TableHead>
                        <TableHead className="text-right w-28">Order Rate</TableHead>
                        <TableHead className="text-right w-24">GST (%)</TableHead>
                        <TableHead className="text-right w-32">Order Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.records.map((record) => {
                        const orderAmount = calculateOrderAmount(
                          record.orderQuantity,
                          record.orderRate,
                          record.orderGst
                        );
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{record.srNo}</TableCell>
                            <TableCell className="font-mono text-sm">{record.sorNo}</TableCell>
                            <TableCell>{record.item}</TableCell>
                            <TableCell className="text-right">{record.orderQuantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(record.orderRate)}</TableCell>
                            <TableCell className="text-right">{record.orderGst}%</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(orderAmount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={6} className="text-right">
                          Subtotal:
                        </TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(group.subtotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Grand Total:</h2>
                <p className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-16 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Business Calculator. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
