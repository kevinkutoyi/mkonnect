"use client";
// components/onboarding/FormField.tsx — reusable labeled field wrapper
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  error?: string | unknown;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium leading-none">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error as string}</p>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors",
        "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary",
        error ? "border-destructive focus:ring-destructive" : "border-input",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors resize-none",
        "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary",
        error ? "border-destructive focus:ring-destructive" : "border-input",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
  options: { value: string | number; label: string }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, placeholder, options, className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors",
        "focus:ring-2 focus:ring-primary",
        error ? "border-destructive focus:ring-destructive" : "border-input",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = "Select";
