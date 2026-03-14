import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  sidebarCollapsed: z.boolean().default(false),
  caseListDensity: z.enum(['compact', 'comfortable']).default('comfortable'),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('MMM dd, yyyy'),
  timeFormat: z.string().default('HH:mm'),
  defaultCaseView: z.enum(['table', 'board']).default('table'),
  accessibility: z
    .object({
      reduceMotion: z.boolean().default(false),
      highContrast: z.boolean().default(false),
      fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    })
    .default({}),
  keyboardMap: z
    .object({
      commandPaletteShortcut: z.string().default('mod+k'),
      keyboardShortcutOverrides: z.record(z.string()).default({}),
    })
    .default({}),
  recentItems: z.array(z.string()).max(10).default([]),
  columnConfig: z.record(z.any()).default({}),
  notificationConfig: z
    .object({
      sound: z.boolean().default(true),
      soundVolume: z.number().min(0).max(100).default(80),
      soundType: z.string().default('default'),
      desktopPush: z.boolean().default(true),
      urgentFlash: z.boolean().default(true),
      showPreviewInBell: z.boolean().default(true),
    })
    .default({}),
});

export type UserPreferencesInferred = z.infer<typeof UserPreferencesSchema>;
