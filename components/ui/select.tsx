"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options, value, onValueChange, placeholder, ...props },
    ref
  ) => {
    return (
      <select
        ref={ref}
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
