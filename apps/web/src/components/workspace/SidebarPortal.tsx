'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * useSidebarContent Hook
 * Allows any view component to inject its own navigation/controls into the WorkspaceSidebar.
 */
export function SidebarPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const element = document.getElementById('sidebar-content-root');
    if (element) {
      setTarget(element);
    }
  }, []);

  if (!mounted || !target) return null;

  return createPortal(children, target);
}
