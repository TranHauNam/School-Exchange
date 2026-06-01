import type { ReactNode } from 'react';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, helperText, children }: FieldProps) {
  return (
    <div className="field">
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {helperText ? <span className="small muted">{helperText}</span> : null}
      <span className="error-text">{error ?? ''}</span>
    </div>
  );
}
