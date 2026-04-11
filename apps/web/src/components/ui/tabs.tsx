import * as React from 'react';

interface TabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(value);

  React.useEffect(() => {
    setActiveTab(value);
  }, [value]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    onValueChange?.(val);
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            handleTabChange,
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  handleTabChange?: (value: string) => void;
}

const TabsList = ({
  children,
  className,
  activeTab,
  handleTabChange,
}: TabsListProps) => (
  <div
    className={`inline-flex h-14 items-center justify-center rounded-[2rem] bg-[#0A0F16]/50 border border-[var(--color-border-base)]/20 p-1.5 text-slate-500 shadow-2xl px-3 ${className || ''}`}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          activeTab,
          handleTabChange,
        });
      }
      return child;
    })}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  handleTabChange?: (value: string) => void;
}

const TabsTrigger = ({
  value,
  children,
  className,
  activeTab,
  handleTabChange,
}: TabsTriggerProps) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => handleTabChange?.(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[1.5rem] px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
        isActive
          ? 'bg-[#64FFDA] text-slate-950 shadow-[0_0_15px_rgba(100,255,218,0.4)]'
          : 'text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/60'
      } ${className || ''}`}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}

const TabsContent = ({
  value,
  children,
  className,
  activeTab,
}: TabsContentProps) => {
  if (activeTab !== value) return null;
  return (
    <div
      className={`mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${className || ''}`}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
