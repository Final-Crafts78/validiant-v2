/**
 * Generated Theme Tokens for NativeWind / Tailwind
 */
export const themeTokens = {
  "themes": {
    "light": {
      "colors": {
        "surface": {
          "base": "#FFFFFF",
          "subtle": "#F9FAFB",
          "muted": "#F3F4F6",
          "inverse": "#111827"
        },
        "text": {
          "base": "#111827",
          "subtle": "#4B5563",
          "muted": "#9CA3AF",
          "inverse": "#FFFFFF"
        },
        "border": {
          "base": "#E5E7EB",
          "subtle": "#F3F4F6",
          "strong": "#D1D5DB"
        },
        "accent": {
          "base": "#3B82F6",
          "subtle": "#EFF6FF",
          "strong": "#2563EB",
          "text": "#FFFFFF"
        },
        "positive": {
          "base": "#10B981",
          "subtle": "#ECFDF5",
          "strong": "#059669",
          "text": "#FFFFFF"
        },
        "warning": {
          "base": "#F59E0B",
          "subtle": "#FFFBEB",
          "strong": "#D97706",
          "text": "#FFFFFF"
        },
        "critical": {
          "base": "#EF4444",
          "subtle": "#FEF2F2",
          "strong": "#DC2626",
          "text": "#FFFFFF"
        }
      }
    },
    "dark": {
      "colors": {
        "surface": {
          "base": "#0B0C0E",
          "subtle": "#141619",
          "muted": "#1C1F23",
          "inverse": "#FFFFFF"
        },
        "text": {
          "base": "#F9FAFB",
          "subtle": "#D1D5DB",
          "muted": "#9CA3AF",
          "inverse": "#111827"
        },
        "border": {
          "base": "#1C1F23",
          "subtle": "#141619",
          "strong": "#374151"
        },
        "accent": {
          "base": "#3B82F6",
          "subtle": "#1D4ED81A",
          "strong": "#60A5FA",
          "text": "#FFFFFF"
        },
        "positive": {
          "base": "#10B981",
          "subtle": "#065F461A",
          "strong": "#34D399",
          "text": "#FFFFFF"
        },
        "warning": {
          "base": "#F59E0B",
          "subtle": "#92400E1A",
          "strong": "#FBBF24",
          "text": "#FFFFFF"
        },
        "critical": {
          "base": "#EF4444",
          "subtle": "#991B1B1A",
          "strong": "#F87171",
          "text": "#FFFFFF"
        }
      }
    }
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px"
  },
  "motion": {
    "duration": {
      "fast": "150ms",
      "base": "300ms",
      "slow": "500ms"
    },
    "easing": {
      "base": "cubic-bezier(0.4, 0, 0.2, 1)",
      "in": "cubic-bezier(0.4, 0, 1, 1)",
      "out": "cubic-bezier(0, 0, 0.2, 1)"
    }
  }
} as const;

export type ThemeTokens = typeof themeTokens;
