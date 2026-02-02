"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  function Progress({ className, value = 0, max = 100, ...props }, ref) {
    const pct = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
        {...props}
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
