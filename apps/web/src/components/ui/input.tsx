import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[1.5rem] bg-surface-lowest/50 border border-white/[0.03] px-6 py-2 text-sm text-white placeholder:text-white/20 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-obsidian inset-shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
