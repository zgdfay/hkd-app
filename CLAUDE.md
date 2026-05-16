# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React Native mobile app built with Expo and Expo Router for "Helo Kidul Dalem" — appears to be an Indonesian civic/government complaint management system with role-based dashboards (admin, lurah/village head, citizen).

## Development Commands

```bash
npm run dev      # Start Expo dev server
npm run android  # Start for Android
npm run ios      # Start for iOS
npm run web      # Start for Web
npm run clean    # Clean .expo and node_modules
```

## Architecture

- **File-based routing**: All routes live in `app/` directory using Expo Router (`expo-router/entry` as entry point in `package.json`)
- **UI Components**: Uses [React Native Reusables](https://reactnativereusables.com) — add components via `npx react-native-reusables/cli@latest add <component>`
- **Styling**: NativeWind (Tailwind CSS v3) configured in `tailwind.config.js` and `nativewind-env.d.ts`
- **Navigation**: Stack navigator via Expo Router's `Stack` component in root layout
- **State**: AsyncStorage for persistence (`@react-native-async-storage/async-storage`)

## Key Directories

- `app/` — Route segments (file-based routing). Subdirectories: `admin/`, `lurah/`, `lacak-pengaduan/`, `pengaduan/`
- `components/shared/` — Shared components like `LoadingScreen`, `UniversalComplaintCard`
- `components/ui/` — Base UI primitives (button, icon, text) from react-native-reusables
- `lib/` — Theme configuration (`theme.ts`)
- `constants/` — App constants including `API_URL` and `COLORS`
- `services/api.ts` — Base API fetch utility (`apiFetch<T>`)
- `hooks/` — Custom React hooks

## Important Configuration

- `app.json` defines app name ("Helo Kidul Dalem App"), slug, and Deep Link scheme (`helo-kidul-dalem-app`)
- `tailwind.config.js` extends default theme with custom colors (`primary: '#802d95'`, `secondary: '#f72585'`)
- Fonts: App loads Poppins font family from `assets/font/Poppins/`
- Portal host (`@rn-primitives/portal`) is mounted in root layout for modal/dialog support

## Adding Components

```bash
npx react-native-reusables/cli@latest add <component-name>
# e.g. npx react-native-reusables/cli@latest add input textarea
```