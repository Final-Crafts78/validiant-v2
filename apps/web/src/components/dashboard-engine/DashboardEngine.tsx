'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import ReactGridLayout, { Responsive as ResponsiveGridLayoutRaw } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardLayout, LayoutItem } from './types';
import { getWidgetDefinition, getAllWidgets } from './WidgetRegistry';
import { WidgetShell } from './WidgetShell';
import { Settings2, Plus, X } from 'lucide-react';

const ResponsiveGridLayout = (ReactGridLayout as any).WidthProvider(ResponsiveGridLayoutRaw);

interface DashboardEngineProps {
  orgId: string;
  projectId?: string; // Optional if we are in a project-specific dashboard
}

export default function DashboardEngine({ orgId, projectId }: DashboardEngineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  
  // Safe SSR check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Here we would typically load layout from DB/Zustand. Using a local state for demo purposes.
  // In a real implementation this would sync with useWorkspaceStore.
  const [layout, setLayout] = useState<DashboardLayout>({
    version: 1,
    widgets: [
      { i: 'inst-1', x: 0, y: 0, w: 12, h: 4, widgetId: 'project-status-matrix' },
      { i: 'inst-2', x: 0, y: 4, w: 12, h: 3, widgetId: 'kpi-scorecard' },
       { i: 'inst-3', x: 0, y: 7, w: 4, h: 4, widgetId: 'quick-actions' },
      { i: 'inst-4', x: 4, y: 7, w: 4, h: 6, widgetId: 'recent-activity' },
    ]
  });

  const onLayoutChange = (currentLayout: any[]) => {
    if (!isEditing) return;
    
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => {
        const updated = currentLayout.find(l => l.i === w.i);
        if (updated) {
          return { ...w, x: updated.x, y: updated.y, w: updated.w, h: updated.h };
        }
        return w;
      })
    }));
  };

  const removeWidget = (instanceId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.i !== instanceId)
    }));
  };

  const addWidget = (widgetId: string) => {
    const def = getWidgetDefinition(widgetId);
    if (!def) return;
    
    const newInstanceId = `inst-${Date.now()}`;
    const newWidget: LayoutItem = {
      i: newInstanceId,
      x: 0,
      y: Infinity, // put at bottom automatically
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      widgetId: widgetId
    };

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
    setIsAddWidgetOpen(false);
  };

  // Build the RGL layout array
  const rglLayout = useMemo(() => {
    return layout.widgets.map(w => {
      const def = getWidgetDefinition(w.widgetId);
      return {
        i: w.i,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        minW: def?.minSize.w || 2,
        minH: def?.minSize.h || 2,
        maxW: def?.maxSize?.w,
        maxH: def?.maxSize?.h,
      };
    });
  }, [layout.widgets]);

  if (!mounted) {
    return <div className="h-64 w-full animate-pulse bg-[var(--color-surface-subtle)] rounded-3xl" />;
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full relative">
      {/* Dashboard Toolbar */}
      <div className="flex justify-end items-center sticky top-0 z-40 mb-2 mt-4 px-2">
        {isEditing ? (
          <div className="flex gap-2 bg-[var(--color-surface-base)] shadow-obsidian p-2 rounded-2xl border border-[var(--color-border-base)]/20 text-sm">
             <button
               onClick={() => setIsAddWidgetOpen(true)}
               className="btn btn-outline h-9 flex items-center gap-2 border-[var(--color-accent-base)] text-[var(--color-accent-base)] hover:bg-[var(--color-accent-base)]/10"
             >
               <Plus className="w-4 h-4" /> Add Widget
             </button>
             <button
              onClick={() => setIsEditing(false)}
              className="btn btn-primary h-9 flex items-center gap-2"
            >
              Done Editing
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors p-2 rounded-xl hover:bg-[var(--color-surface-subtle)] text-sm font-semibold"
          >
            <Settings2 className="w-4 h-4" />
            Customize Dashboard
          </button>
        )}
      </div>

      {/* Adding Widget Drawer/Modal overlay */}
      {isAddWidgetOpen && isEditing && (
         <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-sm h-full bg-[var(--color-surface-base)] shadow-2xl p-6 flex flex-col border-l border-[var(--color-border-base)]/10 animate-in slide-in-from-right duration-300">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="font-bold text-lg text-[var(--color-text-base)]">Widget Catalog</h2>
                 <button onClick={() => setIsAddWidgetOpen(false)} className="p-2 rounded-full hover:bg-[var(--color-surface-subtle)]">
                   <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                 </button>
               </div>
               <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-10">
                  {getAllWidgets().map(widget => {
                    const Icon = widget.icon;
                    return (
                      <button 
                        key={widget.id} 
                        onClick={() => addWidget(widget.id)}
                        className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer hover:bg-[var(--color-surface-subtle)] border border-transparent hover:border-[var(--color-border-base)]/10 transition-all text-left"
                      >
                        <div className="p-2 rounded-xl bg-[var(--color-accent-base)]/10 text-[var(--color-accent-base)] shrink-0">
                           <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[var(--color-text-base)]">{widget.name}</h4>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{widget.description}</p>
                        </div>
                      </button>
                    )
                  })}
               </div>
            </div>
         </div>
      )}

      {/* Grid Layout engine */}
      <ResponsiveGridLayout
        className="layout -mx-4 pb-20"
        layouts={{ lg: rglLayout }}
        breakpoints={{ lg: 1200, md: 768, sm: 480, xs: 0 }}
        cols={{ lg: 12, md: 6, sm: 2, xs: 1 }}
        rowHeight={80} // Base unit height
        onLayoutChange={onLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        containerPadding={[16, 16]}
        compactType="vertical"
        useCSSTransforms={true}
      >
        {layout.widgets.map(item => {
          const def = getWidgetDefinition(item.widgetId);
          if (!def) return <div key={item.i} />; // Fallback 
          
          const WidgetComponent = def.component;
          
          return (
            <div key={item.i}>
              <WidgetShell
                id={item.i}
                title={def.name}
                isEditing={isEditing}
                onRemove={removeWidget}
              >
                 <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-[var(--color-text-muted)] text-xs animate-pulse opacity-50">Loading Widget...</div>}>
                   <WidgetComponent orgId={orgId} projectId={projectId} isEditing={isEditing} />
                 </Suspense>
              </WidgetShell>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
