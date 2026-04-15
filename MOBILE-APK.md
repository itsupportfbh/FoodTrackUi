# FoodTrack Mobile APK Setup

This project is now wired for Capacitor Android builds.

## What is already configured

- Capacitor packages are installed.
- `capacitor.config.ts` points to the Angular mobile build output at `dist/vuexy-mobile`.
- NPM scripts were added for sync and Android workflow.

## Commands

Build the Angular app and sync web assets into Android:

```powershell
npm run mobile:sync
```

Build, sync, and open Android Studio:

```powershell
npm run mobile:android
```

Open the Android project again later:

```powershell
npm run cap:open:android
```

## First-time requirements on your machine

1. Install Android Studio.
2. Install an Android SDK and build tools from Android Studio.
3. Make sure `JAVA_HOME` is set.
4. Make sure Android Studio can build the generated `android` project.

## Important project note

Your Angular environments still use localhost API URLs:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

That will not work on a real phone unless the API is also reachable from the device.

For APK testing you will usually need one of these:

1. A public API URL.
2. Your computer's LAN IP instead of `localhost`.
3. An Android emulator alias such as `10.0.2.2` if you are testing against a backend running on the same machine.

## Camera and scanner note

This app uses QR scanning libraries in the web layer. Those can work inside Capacitor WebView, but camera permission behavior must be verified on-device after Android sync.
