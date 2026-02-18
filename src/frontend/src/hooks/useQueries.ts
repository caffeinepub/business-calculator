import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { BusinessRecord, CustomColumnDefinition } from '../types/businessRecord';

// Mock data store since backend doesn't support BusinessRecord yet
let mockRecords: BusinessRecord[] = [
  {
    id: '1',
    srNo: 1,
    sorDate: '2024-01-15',
    sorNo: 'SOR-001',
    item: 'Steel Rods',
    quantity: 100,
    rate: 50,
    status: 'Pending',
    orderDate: '2024-01-20',
    orderNo: 'ORD-001',
    orderQuantity: 100,
    orderRate: 52,
    orderGst: 18,
    supplier: 'SUP-001',
    supplierName: 'ABC Steel Ltd',
    finalStatus: 'Draft',
    customFields: {},
  },
  {
    id: '2',
    srNo: 2,
    sorDate: '2024-01-18',
    sorNo: 'SOR-002',
    item: 'Cement Bags',
    quantity: 200,
    rate: 350,
    status: 'In Progress',
    orderDate: '2024-01-25',
    orderNo: 'ORD-002',
    orderQuantity: 200,
    orderRate: 360,
    orderGst: 18,
    supplier: 'SUP-002',
    supplierName: 'XYZ Cement Co',
    finalStatus: 'Approved',
    customFields: {},
  },
];

// Custom columns storage
const CUSTOM_COLUMNS_KEY = 'businessCalculator_customColumns';

function loadCustomColumns(): CustomColumnDefinition[] {
  try {
    const stored = localStorage.getItem(CUSTOM_COLUMNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomColumns(columns: CustomColumnDefinition[]): void {
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
}

export function useBusinessRecords() {
  const { actor, isFetching: isActorFetching } = useActor();

  return useQuery<BusinessRecord[]>({
    queryKey: ['businessRecords'],
    queryFn: async () => {
      // Since backend doesn't support BusinessRecord, use mock data
      // In production, this would call: return actor.getAllBusinessRecords();
      return [...mockRecords];
    },
    enabled: !!actor && !isActorFetching,
  });
}

export function useCreateBusinessRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<BusinessRecord, 'id'>) => {
      // Mock implementation
      const newRecord: BusinessRecord = {
        ...record,
        id: Date.now().toString(),
        customFields: record.customFields || {},
      };
      mockRecords.push(newRecord);
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessRecords'] });
    },
  });
}

export function useUpdateBusinessRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: BusinessRecord) => {
      // Mock implementation
      const index = mockRecords.findIndex((r) => r.id === record.id);
      if (index !== -1) {
        mockRecords[index] = record;
      }
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessRecords'] });
    },
  });
}

export function useDeleteBusinessRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      mockRecords = mockRecords.filter((r) => r.id !== id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessRecords'] });
    },
  });
}

// Custom Column Hooks
export function useCustomColumns() {
  return useQuery<CustomColumnDefinition[]>({
    queryKey: ['customColumns'],
    queryFn: async () => {
      return loadCustomColumns();
    },
  });
}

export function useCreateCustomColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: Omit<CustomColumnDefinition, 'id' | 'order'>) => {
      const columns = loadCustomColumns();
      const maxOrder = columns.reduce((max, col) => Math.max(max, col.order), -1);
      const newColumn: CustomColumnDefinition = {
        ...column,
        id: `col_${Date.now()}`,
        order: maxOrder + 1,
      };
      columns.push(newColumn);
      saveCustomColumns(columns);
      return newColumn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customColumns'] });
    },
  });
}

export function useUpdateCustomColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: CustomColumnDefinition) => {
      const columns = loadCustomColumns();
      const index = columns.findIndex((c) => c.id === column.id);
      if (index !== -1) {
        columns[index] = column;
        saveCustomColumns(columns);
      }
      return column;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customColumns'] });
    },
  });
}

export function useReorderCustomColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columns: CustomColumnDefinition[]) => {
      const reordered = columns.map((col, index) => ({ ...col, order: index }));
      saveCustomColumns(reordered);
      return reordered;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customColumns'] });
    },
  });
}

export function useDeleteCustomColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const columns = loadCustomColumns().filter((c) => c.id !== id);
      saveCustomColumns(columns);
      
      // Remove custom field values from all records
      mockRecords = mockRecords.map((record) => {
        const { [id]: removed, ...remainingFields } = record.customFields || {};
        return { ...record, customFields: remainingFields };
      });
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customColumns'] });
      queryClient.invalidateQueries({ queryKey: ['businessRecords'] });
    },
  });
}
