import { useState } from 'react';
import { BusinessCalculationsTable } from '@/components/business/BusinessCalculationsTable';
import { ManageColumnsDialog } from '@/components/business/ManageColumnsDialog';
import {
  useBusinessRecords,
  useCreateBusinessRecord,
  useUpdateBusinessRecord,
  useDeleteBusinessRecord,
  useCustomColumns,
} from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Loader2, Settings2, FileText } from 'lucide-react';
import { SiCoffeescript } from 'react-icons/si';
import type { BusinessRecord } from '@/types/businessRecord';

interface BusinessCalculationsTablePageProps {
  onNavigateToReport: () => void;
}

export function BusinessCalculationsTablePage({ onNavigateToReport }: BusinessCalculationsTablePageProps) {
  const { data: records = [], isLoading, error } = useBusinessRecords();
  const { data: customColumns = [] } = useCustomColumns();
  const createMutation = useCreateBusinessRecord();
  const updateMutation = useUpdateBusinessRecord();
  const deleteMutation = useDeleteBusinessRecord();
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);

  const isAnyMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreateRecord = async (record: Omit<BusinessRecord, 'id'>): Promise<void> => {
    await createMutation.mutateAsync(record);
  };

  const handleUpdateRecord = async (record: BusinessRecord): Promise<void> => {
    await updateMutation.mutateAsync(record);
  };

  const handleDeleteRecord = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading records...</p>
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

  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'business-calculator'
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <SiCoffeescript className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Business Calculator
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your business calculations, orders, and supplier information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onNavigateToReport}
                variant="default"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Supplier Report
              </Button>
              <Button
                onClick={() => setManageColumnsOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Manage Columns
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BusinessCalculationsTable
          records={records}
          customColumns={customColumns}
          onCreateRecord={handleCreateRecord}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          isLoading={isAnyMutating}
        />
      </main>

      <footer className="border-t border-border bg-card mt-16">
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

      <ManageColumnsDialog open={manageColumnsOpen} onOpenChange={setManageColumnsOpen} />
    </div>
  );
}
