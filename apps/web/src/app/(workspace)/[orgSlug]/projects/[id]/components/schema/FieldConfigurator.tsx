'use client';
import React from 'react';
import { TypeColumn, ColumnType } from '@validiant/shared';
import {
  X,
  Settings,
  Zap,
  Eye,
  Trash2,
  Plus,
  ShieldCheck,
  List,
  Calculator,
} from 'lucide-react';

const VALIDATION_PRESETS = [
  {
    value: 'pan_card',
    label: 'PAN Card (India)',
    regex: '^[A-Z]{5}[0-9]{4}[A-Z]$',
    message: 'Invalid PAN format',
  },
  {
    value: 'aadhaar',
    label: 'Aadhaar (India)',
    regex: '^[2-9]{1}[0-9]{11}$',
    message: 'Invalid Aadhaar number',
  },
  {
    value: 'gstin',
    label: 'GSTIN (India)',
    regex: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
    message: 'Invalid GSTIN format',
  },
  {
    value: 'ifsc',
    label: 'IFSC Code',
    regex: '^[A-Z]{4}0[A-Z0-9]{6}$',
    message: 'Invalid IFSC code',
  },
  {
    value: 'pincode',
    label: 'PIN Code (India)',
    regex: '^[1-9][0-9]{5}$',
    message: 'Invalid PIN code',
  },
  {
    value: 'mobile_in',
    label: 'Mobile Number (India)',
    regex: '^[6-9]\\d{9}$',
    message: 'Invalid Indian mobile number',
  },
];

interface FieldConfiguratorProps {
  column: TypeColumn;
  onClose: () => void;
  onUpdate: (data: Partial<TypeColumn>) => void;
  onDelete: (id: string) => void;
  allColumns: TypeColumn[];
}

/**
 * FieldConfigurator - Detailed configuration panel for a schema element.
 * Supports metadata, visibility, and nested conditional logic.
 */
export function FieldConfigurator({
  column,
  onClose,
  onUpdate,
  onDelete,
  allColumns,
}: FieldConfiguratorProps) {
  // Filter out the current column to prevent self-referencing logic
  const otherColumns = allColumns.filter((c) => c.id !== column.id);

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-[#0c1324] border-l border-[var(--color-border-base)]/20 shadow-2xl z-[80] flex flex-col animate-in slide-in-from-right duration-500">
      <header className="p-8 border-b border-[var(--color-border-base)]/20 flex items-center justify-between bg-[#151b2d]/50 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              ELEMENT_CONFIG
            </span>
          </div>
          <h3 className="text-xl font-black text-[var(--color-text-base)] tracking-tight uppercase truncate max-w-[280px]">
            {column.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-3 hover:bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--color-border-base)]/20 transition-all group"
        >
          <X className="w-5 h-5 text-[var(--color-text-base)]/40 group-hover:text-[var(--color-text-base)]" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {/* Section: Core Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#adc6ff]" />
            <h4 className="text-[11px] font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
              Core_Identity
            </h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest ml-1">
                Display Label
              </label>
              <input
                className="w-full bg-[#070d1f] border border-[var(--color-border-base)]/20 rounded-xl p-4 text-[var(--color-text-base)] text-sm font-bold focus:border-[#adc6ff]/50 transition-all outline-none"
                value={column.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest ml-1">
                  System Key
                </label>
                <div className="bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-xl p-4 text-[var(--color-text-base)]/30 text-[10px] font-mono cursor-not-allowed">
                  {column.key}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest ml-1">
                  Data Type
                </label>
                <div className="bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-xl p-4 text-[#adc6ff] text-[10px] font-black uppercase tracking-widest">
                  {column.columnType}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Select / Multi-Select Choices */}
        {(column.columnType === ColumnType.SELECT ||
          column.columnType === ColumnType.MULTI_SELECT) && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-4 h-4 text-[#adc6ff]" />
              <h4 className="text-[11px] font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
                Choice Manager
              </h4>
            </div>
            <div className="space-y-2">
              {(column.options?.choices || []).map((choice, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="flex-1 bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-xl p-3 text-xs font-bold text-[var(--color-text-base)] outline-none"
                    value={choice.label}
                    onChange={(e) => {
                      const newChoices = (column.options?.choices || []).map(
                        (choice, i) =>
                          i === idx
                            ? {
                                ...choice,
                                label: e.target.value,
                                value: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, '_'),
                              }
                            : choice
                      );
                      onUpdate({
                        options: { ...column.options, choices: newChoices },
                      });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newChoices = [...(column.options?.choices || [])];
                      newChoices.splice(idx, 1);
                      onUpdate({
                        options: { ...column.options, choices: newChoices },
                      });
                    }}
                    className="p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newChoices = [
                    ...(column.options?.choices || []),
                    {
                      label: `Option ${(column.options?.choices?.length || 0) + 1}`,
                      value: `opt_${(column.options?.choices?.length || 0) + 1}`,
                    },
                  ];
                  onUpdate({
                    options: { ...column.options, choices: newChoices },
                  });
                }}
                className="w-full mt-2 p-3 border border-dashed border-[var(--color-border-base)]/40 rounded-xl text-[10px] font-black text-[var(--color-text-base)]/40 hover:text-[#adc6ff] hover:border-[#adc6ff]/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" /> ADD CHOICE
              </button>
            </div>
          </div>
        )}

        {/* Section: Formula Engine */}
        {column.columnType === ColumnType.FORMULA && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-[#adc6ff]" />
              <h4 className="text-[11px] font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
                Formula Engine
              </h4>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest ml-1">
                Expression
              </label>
              <textarea
                className="w-full h-24 bg-[#151b2d] border border-[#adc6ff]/20 rounded-xl p-4 text-[var(--color-text-base)] text-sm font-mono focus:border-[#adc6ff]/50 transition-all outline-none resize-none"
                placeholder="{unit_price} * {quantity}"
                value={column.settings?.formulaExpression || ''}
                onChange={(e) =>
                  onUpdate({
                    settings: {
                      ...column.settings,
                      formulaExpression: e.target.value,
                    },
                  })
                }
              />
              <p className="text-[9px] text-[var(--color-text-base)]/30 px-2 leading-relaxed">
                Use <strong className="text-[#adc6ff]">{'{field_key}'}</strong>{' '}
                to reference other attributes. Math operations (+, -, *, /) are
                natively evaluated.
              </p>
            </div>
          </div>
        )}

        {/* Section: Validation & UI */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-[11px] font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
              Validation_Behavior
            </h4>
          </div>

          <div className="space-y-4">
            <button
              onClick={() =>
                onUpdate({
                  settings: {
                    ...column.settings,
                    required: !column.settings?.required,
                  },
                })
              }
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                column.settings?.required
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-[#070d1f] border-[var(--color-border-base)]/20 text-[var(--color-text-base)]/40'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                Required Field
              </span>
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all ${column.settings?.required ? 'bg-emerald-400 border-emerald-400' : 'border-[var(--color-border-base)]/40'}`}
              />
            </button>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--color-text-base)]/20 uppercase tracking-widest ml-1">
                Help Hint (Optional)
              </label>
              <input
                className="w-full bg-[#070d1f] border border-[var(--color-border-base)]/20 rounded-xl p-4 text-[var(--color-text-base)] text-xs outline-none focus:border-[#adc6ff]/30 transition-all font-medium"
                placeholder="Provide context for field agents..."
                value={column.settings?.hint || ''}
                onChange={(e) =>
                  onUpdate({
                    settings: { ...column.settings, hint: e.target.value },
                  })
                }
              />
            </div>

            {/* Validation Rules Panel */}
            <div className="pt-4 mt-2 border-t border-[var(--color-border-subtle)] space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[var(--color-text-base)]/40 uppercase tracking-widest ml-1">
                  Validation Presets
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VALIDATION_PRESETS.map((preset) => {
                  const isActive = column.settings?.validationRules?.some(
                    (r) => r.preset === preset.value
                  );
                  return (
                    <button
                      key={preset.value}
                      onClick={() => {
                        let newRules = [
                          ...(column.settings?.validationRules || []),
                        ];
                        if (isActive) {
                          newRules = newRules.filter(
                            (r) => r.preset !== preset.value
                          );
                        } else {
                          newRules.push({
                            type: 'preset',
                            preset: preset.value as any,
                            value: preset.regex,
                            message: preset.message,
                          });
                        }
                        onUpdate({
                          settings: {
                            ...column.settings,
                            validationRules: newRules,
                          },
                        });
                      }}
                      className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all text-left ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#151b2d] border-[var(--color-border-base)]/20 text-[var(--color-text-base)]/40 hover:border-emerald-500/20 hover:text-emerald-500/60'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Conditional Logic (The Star Feature) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <h4 className="text-[11px] font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
                Visibility_Logic
              </h4>
            </div>
          </div>

          <div className="space-y-4">
            {column.settings?.conditions?.map((cond, idx) => (
              <div
                key={idx}
                className="bg-[#070d1f] rounded-2xl p-5 border border-[var(--color-border-base)]/20 space-y-4 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400/60">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                      Rule_{idx + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newConds = [...(column.settings?.conditions || [])];
                      newConds.splice(idx, 1);
                      onUpdate({
                        settings: { ...column.settings, conditions: newConds },
                      });
                    }}
                    className="text-[9px] font-black text-rose-400/40 hover:text-rose-400 uppercase tracking-widest"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[var(--color-text-base)]/20 uppercase w-12">
                      IF
                    </span>
                    <select
                      className="flex-1 bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-lg p-2 text-[10px] font-black text-[var(--color-text-base)]/80 outline-none"
                      value={cond.fieldKey}
                      onChange={(e) => {
                        const newConds = [
                          ...(column.settings?.conditions || []),
                        ];
                        newConds[idx] = { ...cond, fieldKey: e.target.value };
                        onUpdate({
                          settings: {
                            ...column.settings,
                            conditions: newConds,
                          },
                        });
                      }}
                    >
                      <option value="">Select Field...</option>
                      {otherColumns.map((c) => (
                        <option key={c.id} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[var(--color-text-base)]/20 uppercase w-12">
                      OP
                    </span>
                    <select
                      className="flex-1 bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-lg p-2 text-[10px] font-black text-[#adc6ff] outline-none"
                      value={cond.operator}
                      onChange={(e) => {
                        const newConds = [
                          ...(column.settings?.conditions || []),
                        ];
                        newConds[idx] = {
                          ...cond,
                          operator: e.target.value as any,
                        };
                        onUpdate({
                          settings: {
                            ...column.settings,
                            conditions: newConds,
                          },
                        });
                      }}
                    >
                      <option value="equals">is equal to</option>
                      <option value="not_equals">is not equal to</option>
                      <option value="is_set">has any value</option>
                      <option value="is_not_set">is empty</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[var(--color-text-base)]/20 uppercase w-12">
                      VAL
                    </span>
                    {otherColumns.find((c) => c.key === cond.fieldKey)
                      ?.columnType === ColumnType.CHECKBOX ? (
                      <div className="flex gap-2 flex-1">
                        {[true, false].map((v) => (
                          <button
                            key={v.toString()}
                            onClick={() => {
                              const newConds = [
                                ...(column.settings?.conditions || []),
                              ];
                              newConds[idx] = { ...cond, value: v };
                              onUpdate({
                                settings: {
                                  ...column.settings,
                                  conditions: newConds,
                                },
                              });
                            }}
                            className={`flex-1 p-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                              cond.value === v
                                ? 'bg-primary text-[#070d1f]'
                                : 'bg-[#151b2d] text-[var(--color-text-base)]/20 hover:text-[var(--color-text-base)]/40'
                            }`}
                          >
                            {v ? 'YES' : 'NO'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        className="flex-1 bg-[#151b2d] border border-[var(--color-border-base)]/20 rounded-lg p-2 text-[10px] font-mono text-[var(--color-text-base)]/60 outline-none"
                        placeholder="Value..."
                        value={(cond.value as string) || ''}
                        onChange={(e) => {
                          const newConds = [
                            ...(column.settings?.conditions || []),
                          ];
                          newConds[idx] = { ...cond, value: e.target.value };
                          onUpdate({
                            settings: {
                              ...column.settings,
                              conditions: newConds,
                            },
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const newConds = [
                  ...(column.settings?.conditions || []),
                  { fieldKey: '', operator: 'equals', value: '' },
                ];
                onUpdate({
                  settings: { ...column.settings, conditions: newConds as any },
                });
              }}
              className="w-full p-4 border border-dashed border-[var(--color-border-base)]/40 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-[var(--color-text-base)]/20 hover:text-[#adc6ff] hover:border-[#adc6ff]/20 hover:bg-[#adc6ff]/5 transition-all group"
            >
              <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
              ADD VISIBILITY RULE
            </button>
          </div>
        </div>

        {/* Destructive Actions */}
        <div className="pt-10">
          <button
            onClick={() => onDelete(column.id)}
            className="w-full py-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-[var(--color-text-base)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            DECOMMISSION ELEMENT
          </button>
        </div>
      </div>

      <footer className="p-8 bg-[#070d1f] border-t border-[var(--color-border-base)]/20">
        <button
          onClick={onClose}
          className="w-full py-5 bg-[#adc6ff] text-[#070d1f] rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-[#adc6ff]/10 hover:bg-white transition-all active:scale-[0.98]"
        >
          Commit Changes
        </button>
      </footer>
    </div>
  );
}
