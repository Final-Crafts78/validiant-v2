import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'verified'
    | 'pending'
    | 'in_progress';
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest transition-colors focus:outline-none';

  const variants = {
    default:
      'bg-[#64FFDA] text-slate-950 shadow-[0_0_12px_rgba(100,255,218,0.2)]',
    secondary: 'bg-white/10 text-white',
    destructive: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    outline: 'text-white/40 border border-white/5',
    verified: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
    pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    in_progress: 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className || ''}`;

  return <div className={combinedClassName} {...props} />;
};

export { Badge };
