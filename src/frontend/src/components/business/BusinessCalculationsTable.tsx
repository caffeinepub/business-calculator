import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Save, X, Pencil, Trash2 } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { DeleteRecordDialog } from './DeleteRecordDialog';
import type { BusinessRecord, CustomColumnDefinition } from '@/types/businessRecord';
import { STATUS_OPTIONS, FINAL_STATUS_OPTIONS } from '@/types/businessRecord';
import { calculateAmount, calculateOrderAmount, formatCurrency } from '@/utils/calculations';
import { toast } from 'sonner';

interface BusinessCalculationsTableProps {
  records: BusinessRecord[];
  customColumns: CustomColumnDefinition[];
  onCreateRecord: (record: Omit<BusinessRecord, 'id'>) => Promise<void>;
  onUpdateRecord: (record: BusinessRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  isLoading?: boolean;
}

type EditingRecord = BusinessRecord | Omit<BusinessRecord, 'id'>;

export function BusinessCalculationsTable({
  records,
  customColumns,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  isLoading = false,
}: BusinessCalculationsTableProps) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditingRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<BusinessRecord | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const sortedCustomColumns = [...customColumns].sort((a, b) => a.order - b.order);

  const handleStartEdit = (record: BusinessRecord) => {
    setEditingId(record.id);
    setEditingRecord({ ...record });
    setValidationErrors({});
  };

  const handleStartNew = () => {
    const maxSrNo = records.reduce((max, r) => Math.max(max, r.srNo), 0);
    const initialCustomFields: Record<string, string | number> = {};
    sortedCustomColumns.forEach((col) => {
      initialCustomFields[col.id] = col.dataType === 'number' ? 0 : '';
    });

    setEditingId('new');
    setEditingRecord({
      srNo: maxSrNo + 1,
      sorDate: '',
      sorNo: '',
      item: '',
      quantity: 0,
      rate: 0,
      status: 'Pending',
      orderDate: '',
      orderNo: '',
      orderQuantity: 0,
      orderRate: 0,
      orderGst: 0,
      supplier: '',
      supplierName: '',
      finalStatus: 'Draft',
      customFields: initialCustomFields,
    });
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingRecord(null);
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (!editingRecord) return;

    const hasErrors = Object.values(validationErrors).some((error) => error === false);
    if (hasErrors) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      if (editingId === 'new') {
        await onCreateRecord(editingRecord as Omit<BusinessRecord, 'id'>);
        toast.success('Record created successfully');
      } else {
        await onUpdateRecord(editingRecord as BusinessRecord);
        toast.success('Record updated successfully');
      }
      handleCancelEdit();
    } catch (error) {
      toast.error('Failed to save record');
      console.error(error);
    }
  };

  const handleDeleteClick = (record: BusinessRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await onDeleteRecord(recordToDelete.id);
      toast.success('Record deleted successfully');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      toast.error('Failed to delete record');
      console.error(error);
    }
  };

  const updateField = <K extends keyof EditingRecord>(field: K, value: EditingRecord[K]) => {
    if (!editingRecord) return;
    setEditingRecord({ ...editingRecord, [field]: value });
  };

  const updateCustomField = (columnId: string, value: string | number) => {
    if (!editingRecord) return;
    setEditingRecord({
      ...editingRecord,
      customFields: {
        ...(editingRecord.customFields || {}),
        [columnId]: value,
      },
    });
  };

  const handleValidationChange = (field: string, isValid: boolean) => {
    setValidationErrors((prev) => ({ ...prev, [field]: isValid }));
  };

  const renderRow = (record: BusinessRecord, isEditing: boolean) => {
    const workingRecord = isEditing && editingRecord ? editingRecord : record;
    const amount = calculateAmount(
      Number(workingRecord.quantity),
      Number(workingRecord.rate)
    );
    const orderAmount = calculateOrderAmount(
      Number(workingRecord.orderQuantity),
      Number(workingRecord.orderRate),
      Number(workingRecord.orderGst)
    );

    return (
      <TableRow key={record.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{record.srNo}</TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.sorDate}
            type="date"
            isEditing={isEditing}
            onChange={(v) => updateField('sorDate', String(v))}
            fieldName="SOR Date"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.sorNo}
            type="text"
            isEditing={isEditing}
            onChange={(v) => updateField('sorNo', String(v))}
            fieldName="SOR No"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.item}
            type="text"
            isEditing={isEditing}
            onChange={(v) => updateField('item', String(v))}
            fieldName="Item"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.quantity}
            type="number"
            isEditing={isEditing}
            onChange={(v) => updateField('quantity', Number(v))}
            onValidationChange={(valid) => handleValidationChange('quantity', valid)}
            fieldName="Quantity"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.rate}
            type="number"
            isEditing={isEditing}
            onChange={(v) => updateField('rate', Number(v))}
            onValidationChange={(valid) => handleValidationChange('rate', valid)}
            fieldName="Rate"
          />
        </TableCell>
        <TableCell className="font-semibold text-primary">
          {formatCurrency(amount)}
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.status}
            type="select"
            options={STATUS_OPTIONS}
            isEditing={isEditing}
            onChange={(v) => updateField('status', String(v))}
            fieldName="Status"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.orderDate}
            type="date"
            isEditing={isEditing}
            onChange={(v) => updateField('orderDate', String(v))}
            fieldName="Order Date"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.orderNo}
            type="text"
            isEditing={isEditing}
            onChange={(v) => updateField('orderNo', String(v))}
            fieldName="Order No"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.orderQuantity}
            type="number"
            isEditing={isEditing}
            onChange={(v) => updateField('orderQuantity', Number(v))}
            onValidationChange={(valid) => handleValidationChange('orderQuantity', valid)}
            fieldName="Order Quantity"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.orderRate}
            type="number"
            isEditing={isEditing}
            onChange={(v) => updateField('orderRate', Number(v))}
            onValidationChange={(valid) => handleValidationChange('orderRate', valid)}
            fieldName="Order Rate"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.orderGst}
            type="number"
            isEditing={isEditing}
            onChange={(v) => updateField('orderGst', Number(v))}
            onValidationChange={(valid) => handleValidationChange('orderGst', valid)}
            fieldName="Order GST"
          />
        </TableCell>
        <TableCell className="font-semibold text-primary">
          {formatCurrency(orderAmount)}
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.supplier}
            type="text"
            isEditing={isEditing}
            onChange={(v) => updateField('supplier', String(v))}
            fieldName="Supplier"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.supplierName}
            type="text"
            isEditing={isEditing}
            onChange={(v) => updateField('supplierName', String(v))}
            fieldName="Supplier Name"
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={workingRecord.finalStatus}
            type="select"
            options={FINAL_STATUS_OPTIONS}
            isEditing={isEditing}
            onChange={(v) => updateField('finalStatus', String(v))}
            fieldName="Final Status"
          />
        </TableCell>

        {/* Custom columns */}
        {sortedCustomColumns.map((column) => {
          const customValue = (workingRecord.customFields || {})[column.id] ?? (column.dataType === 'number' ? 0 : '');
          return (
            <TableCell key={column.id}>
              <EditableCell
                value={customValue}
                type={column.dataType}
                isEditing={isEditing}
                onChange={(v) => updateCustomField(column.id, v)}
                onValidationChange={
                  column.dataType === 'number'
                    ? (valid) => handleValidationChange(`custom_${column.id}`, valid)
                    : undefined
                }
                fieldName={column.name}
              />
            </TableCell>
          );
        })}

        <TableCell>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="h-8"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartEdit(record)}
                disabled={isLoading}
                className="h-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteClick(record)}
                disabled={isLoading}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const totalColumns = 17 + sortedCustomColumns.length + 1; // Fixed columns (including 2 new date columns) + custom columns + actions

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleStartNew}
          disabled={editingId !== null || isLoading}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Record
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Sr No</TableHead>
                <TableHead className="font-semibold">SOR Date</TableHead>
                <TableHead className="font-semibold">SOR No</TableHead>
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold">Rate</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Order Date</TableHead>
                <TableHead className="font-semibold">Order No</TableHead>
                <TableHead className="font-semibold">Order Qty</TableHead>
                <TableHead className="font-semibold">Order Rate</TableHead>
                <TableHead className="font-semibold">Order GST %</TableHead>
                <TableHead className="font-semibold">Order Amount</TableHead>
                <TableHead className="font-semibold">Supplier</TableHead>
                <TableHead className="font-semibold">Supplier Name</TableHead>
                <TableHead className="font-semibold">Final Status</TableHead>
                {sortedCustomColumns.map((column) => (
                  <TableHead key={column.id} className="font-semibold">
                    {column.name}
                  </TableHead>
                ))}
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingId === 'new' && editingRecord && (
                <TableRow className="bg-accent/20">
                  <TableCell className="font-medium">{editingRecord.srNo}</TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.sorDate}
                      type="date"
                      isEditing={true}
                      onChange={(v) => updateField('sorDate', String(v))}
                      fieldName="SOR Date"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.sorNo}
                      type="text"
                      isEditing={true}
                      onChange={(v) => updateField('sorNo', String(v))}
                      fieldName="SOR No"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.item}
                      type="text"
                      isEditing={true}
                      onChange={(v) => updateField('item', String(v))}
                      fieldName="Item"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.quantity}
                      type="number"
                      isEditing={true}
                      onChange={(v) => updateField('quantity', Number(v))}
                      onValidationChange={(valid) => handleValidationChange('quantity', valid)}
                      fieldName="Quantity"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.rate}
                      type="number"
                      isEditing={true}
                      onChange={(v) => updateField('rate', Number(v))}
                      onValidationChange={(valid) => handleValidationChange('rate', valid)}
                      fieldName="Rate"
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(
                      calculateAmount(
                        Number(editingRecord.quantity),
                        Number(editingRecord.rate)
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.status}
                      type="select"
                      options={STATUS_OPTIONS}
                      isEditing={true}
                      onChange={(v) => updateField('status', String(v))}
                      fieldName="Status"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.orderDate}
                      type="date"
                      isEditing={true}
                      onChange={(v) => updateField('orderDate', String(v))}
                      fieldName="Order Date"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.orderNo}
                      type="text"
                      isEditing={true}
                      onChange={(v) => updateField('orderNo', String(v))}
                      fieldName="Order No"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.orderQuantity}
                      type="number"
                      isEditing={true}
                      onChange={(v) => updateField('orderQuantity', Number(v))}
                      onValidationChange={(valid) => handleValidationChange('orderQuantity', valid)}
                      fieldName="Order Quantity"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.orderRate}
                      type="number"
                      isEditing={true}
                      onChange={(v) => updateField('orderRate', Number(v))}
                      onValidationChange={(valid) => handleValidationChange('orderRate', valid)}
                      fieldName="Order Rate"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.orderGst}
                      type="number"
                      isEditing={true}
                      onChange={(v) => updateField('orderGst', Number(v))}
                      onValidationChange={(valid) => handleValidationChange('orderGst', valid)}
                      fieldName="Order GST"
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(
                      calculateOrderAmount(
                        Number(editingRecord.orderQuantity),
                        Number(editingRecord.orderRate),
                        Number(editingRecord.orderGst)
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.supplier}
                      type="text"
                      isEditing={true}
                      onChange={(v) => updateField('supplier', String(v))}
                      fieldName="Supplier"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.supplierName}
                      type="text"
                      isEditing={true}
                      onChange={(v) => updateField('supplierName', String(v))}
                      fieldName="Supplier Name"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={editingRecord.finalStatus}
                      type="select"
                      options={FINAL_STATUS_OPTIONS}
                      isEditing={true}
                      onChange={(v) => updateField('finalStatus', String(v))}
                      fieldName="Final Status"
                    />
                  </TableCell>

                  {/* Custom columns for new record */}
                  {sortedCustomColumns.map((column) => {
                    const customValue = (editingRecord.customFields || {})[column.id] ?? (column.dataType === 'number' ? 0 : '');
                    return (
                      <TableCell key={column.id}>
                        <EditableCell
                          value={customValue}
                          type={column.dataType}
                          isEditing={true}
                          onChange={(v) => updateCustomField(column.id, v)}
                          onValidationChange={
                            column.dataType === 'number'
                              ? (valid) => handleValidationChange(`custom_${column.id}`, valid)
                              : undefined
                          }
                          fieldName={column.name}
                        />
                      </TableCell>
                    );
                  })}

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-8"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="h-8"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {records.length === 0 && editingId !== 'new' ? (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="text-center py-8 text-muted-foreground">
                    No records found. Click "Add New Record" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => renderRow(record, editingId === record.id))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteRecordDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        recordName={recordToDelete ? `${recordToDelete.item} (${recordToDelete.sorNo})` : ''}
      />
    </div>
  );
}
