'use client';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  rows = 5,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">
        {label}
        {required && <span className="form-field__required"> *</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="form-field__textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className="form-field__input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
