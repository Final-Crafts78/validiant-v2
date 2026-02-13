# Validiant Mobile App

## React Native + Expo Mobile Application

Cross-platform mobile app for iOS and Android built with React Native and Expo.

---

## Features

- 📱 **Cross-Platform** - iOS and Android from single codebase
- 🔒 **Authentication** - Login, register, forgot password
- 🎨 **Native UI** - Platform-specific components
- 📦 **State Management** - Zustand for global state
- ⚙️ **Navigation** - React Navigation with tabs
- ⚡ **TypeScript** - Full type safety

---

## Tech Stack

- **React Native** - UI framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Axios** - API requests

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI (installed automatically)
- iOS Simulator (Mac only) or Android Studio

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device
# Scan QR code with Expo Go app
```

---

## Project Structure

```
apps/mobile/
├── app/
│   ├── (auth)/           # Auth screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/           # Tab screens
│   │   ├── index.tsx     # Dashboard
│   │   ├── projects.tsx
│   │   ├── tasks.tsx
│   │   ├── organizations.tsx
│   │   └── profile.tsx
│   └── _layout.tsx       # Root layout
├── components/
│   ├── ui/               # Reusable components
│   └── icons/            # Icon components
├── store/
│   └── auth.ts           # Auth store
├── services/
│   └── api.ts            # API service
├── utils/
│   └── index.ts          # Utilities
├── app.json              # Expo config
└── package.json          # Dependencies
```

---

## Building

### Development Build

```bash
# Install Expo CLI globally (if needed)
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile development

# Build for Android
eas build --platform android --profile development
```

### Production Build

```bash
# Build for app stores
eas build --platform all --profile production
```

---

## License

MIT
