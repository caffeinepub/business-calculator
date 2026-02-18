import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomColumnDefinition } from '@/types/businessRecord';
import {
  useCustomColumns,
  useCreateCustomColumn,
  useUpdateCustomColumn,
  useReorderCustomColumns,
  useDeleteCustomColumn,
} from '@/hooks/useQueries';

interface ManageColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageColumnsDialog({ open, onOpenChange }: ManageColumnsDialogProps) {
  const { data: columns = [] } = useCustomColumns();
  const createMutation = useCreateCustomColumn();
  const updateMutation = useUpdateCustomColumn();
  const reorderMutation = useReorderCustomColumns();
  const deleteMutation = useDeleteCustomColumn();

  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number'>('text');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<CustomColumnDefinition | null>(null);

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast.error('Column name is required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: newColumnName.trim(),
        dataType: newColumnType,
      });
      setNewColumnName('');
      setNewColumnType('text');
      toast.success('Column added successfully');
    } catch (error) {
      toast.error('Failed to add column');
      console.error(error);
    }
  };

  const handleStartEdit = (column: CustomColumnDefinition) => {
    setEditingId(column.id);
    setEditingName(column.name);
  };

  const handleSaveEdit = async (column: CustomColumnDefinition) => {
    if (!editingName.trim()) {
      toast.error('Column name cannot be empty');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        ...column,
        name: editingName.trim(),
      });
      setEditingId(null);
      setEditingName('');
      toast.success('Column renamed successfully');
    } catch (error) {
      toast.error('Failed to rename column');
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...sortedColumns];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    try {
      await reorderMutation.mutateAsync(newOrder);
    } catch (error) {
      toast.error('Failed to reorder columns');
      console.error(error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sortedColumns.length - 1) return;
    const newOrder = [...sortedColumns];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    try {
      await reorderMutation.mutateAsync(newOrder);
    } catch (error) {
      toast.error('Failed to reorder columns');
      console.error(error);
    }
  };

  const handleDeleteClick = (column: CustomColumnDefinition) => {
    setColumnToDelete(column);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!columnToDelete) return;

    try {
      await deleteMutation.mutateAsync(columnToDelete.id);
      toast.success('Column deleted successfully');
      setDeleteDialogOpen(false);
      setColumnToDelete(null);
    } catch (error) {
      toast.error('Failed to delete column');
      console.error(error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Custom Columns</DialogTitle>
            <DialogDescription>
              Add, rename, reorder, or delete custom columns for your table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Column */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Add New Column</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label htmlFor="columnName">Column Name</Label>
                  <Input
                    id="columnName"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="e.g., Notes"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="columnType">Data Type</Label>
                  <Select value={newColumnType} onValueChange={(v) => setNewColumnType(v as 'text' | 'number')}>
                    <SelectTrigger id="columnType" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddColumn}
                    disabled={createMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Columns */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Existing Columns ({sortedColumns.length})</h3>
              {sortedColumns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No custom columns yet. Add one above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedColumns.map((column, index) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isPending}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === sortedColumns.length - 1 || reorderMutation.isPending}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Column info */}
                      <div className="flex-1 min-w-0">
                        {editingId === column.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleSaveEdit(column)}
                              disabled={updateMutation.isPending}
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{column.name}</span>
                            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                              {column.dataType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {editingId !== column.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(column)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(column)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the column "{columnToDelete?.name}"? This will remove
              all data in this column from all records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
