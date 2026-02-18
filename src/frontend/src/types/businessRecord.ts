export interface CustomColumnDefinition {
  id: string;
  name: string;
  dataType: 'text' | 'number';
  order: number;
}

export interface BusinessRecord {
  id: string;
  srNo: number;
  sorDate: string;
  sorNo: string;
  item: string;
  quantity: number;
  rate: number;
  status: string;
  orderDate: string;
  orderNo: string;
  orderQuantity: number;
  orderRate: number;
  orderGst: number;
  supplier: string;
  supplierName: string;
  finalStatus: string;
  customFields?: Record<string, string | number>;
}

export type BusinessRecordInput = Omit<BusinessRecord, 'id'>;

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'On Hold'] as const;
export const FINAL_STATUS_OPTIONS = ['Draft', 'Approved', 'Rejected', 'Archived'] as const;
