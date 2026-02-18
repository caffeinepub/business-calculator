import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateNumber, type ValidationResult } from '@/utils/validation';

interface EditableCellProps {
  value: string | number;
  type: 'text' | 'number' | 'select' | 'date';
  options?: readonly string[];
  isEditing: boolean;
  onChange: (value: string | number) => void;
  onValidationChange?: (isValid: boolean) => void;
  fieldName?: string;
  className?: string;
}

export function EditableCell({
  value,
  type,
  options = [],
  isEditing,
  onChange,
  onValidationChange,
  fieldName = 'Field',
  className = '',
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);

    if (type === 'number') {
      const validationResult = validateNumber(newValue, fieldName);
      setValidation(validationResult);
      onValidationChange?.(validationResult.isValid);

      if (validationResult.isValid) {
        onChange(newValue === '' ? 0 : parseFloat(newValue));
      }
    } else {
      onChange(newValue);
    }
  };

  if (!isEditing) {
    return (
      <div className={`px-3 py-2 ${className}`}>
        {type === 'number' && typeof value === 'number'
          ? value.toFixed(2)
          : String(value)}
      </div>
    );
  }

  if (type === 'select' && options.length > 0) {
    return (
      <Select value={String(value)} onValueChange={handleChange}>
        <SelectTrigger className={`h-9 ${className}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-1">
      <Input
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`h-9 ${!validation.isValid ? 'border-destructive' : ''} ${className}`}
        step={type === 'number' ? '0.01' : undefined}
      />
      {!validation.isValid && validation.error && (
        <p className="text-xs text-destructive">{validation.error}</p>
      )}
    </div>
  );
}
