import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MultiSelectProps {
  options: { label: string; value: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  disabled = false,
  className
}) => {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item))
  }

  const handleSelect = (item: string) => {
    if (value.includes(item)) {
      handleUnselect(item)
    } else {
      onChange([...value, item])
    }
  }


  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "flex min-h-12 w-full flex-wrap gap-2 items-center rounded-[1.5rem] bg-surface-lowest/50 border border-white/[0.03] px-6 py-2 text-sm text-white focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-obsidian inset-shadow-sm cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map((val) => {
              const label = options.find((opt) => opt.value === val)?.label || val;
              return (
                <span
                  key={val}
                  className="flex items-center gap-1 rounded-full bg-primary/20 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary group/tag"
                >
                  {label}
                  <button
                    type="button"
                    className="hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(val);
                    }}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-white/20">{placeholder}</span>
        )}
        <div className="ml-auto flex items-center">
          <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-auto rounded-3xl bg-slate-950/90 backdrop-blur-xl border border-white/10 p-2 shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="grid gap-1">
            {options.map((option) => {
              const isSelected = value.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors",
                    isSelected ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-white/60 hover:text-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                >
                  {option.label}
                  {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_white]" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
