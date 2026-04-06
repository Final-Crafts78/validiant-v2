import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'obsidian'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95"
    
    const variants = {
      default: "bg-[#64FFDA] text-slate-950 hover:opacity-90 shadow-[0_0_20px_rgba(100,255,218,0.3)]",
      outline: "border border-white/5 bg-transparent hover:bg-white/5 text-white/60 hover:text-white",
      ghost: "hover:bg-white/5 hover:text-white text-white/40",
      obsidian: "bg-[#0A0F16] border border-white/5 text-white/60 hover:text-white hover:border-[#64FFDA]/20 shadow-2xl",
    }

    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-9 px-4",
      lg: "h-14 rounded-[1.8rem] px-10",
    }

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
