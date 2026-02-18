import { useState } from 'react';
import { BusinessCalculationsTablePage } from './pages/BusinessCalculationsTablePage';
import { SupplierWiseReportPage } from './pages/SupplierWiseReportPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [currentView, setCurrentView] = useState<'table' | 'report'>('table');

  return (
    <>
      {currentView === 'table' ? (
        <BusinessCalculationsTablePage onNavigateToReport={() => setCurrentView('report')} />
      ) : (
        <SupplierWiseReportPage onNavigateBack={() => setCurrentView('table')} />
      )}
      <Toaster />
    </>
  );
}

export default App;
