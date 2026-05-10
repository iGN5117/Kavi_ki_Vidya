# Kavi ki Vidya Native Testing Checklist

Status: Active runbook
Date: 2026-04-29
Owner: Native readiness

This checklist is for iOS Simulator, real iPhone, Android Emulator, and real Android phone testing without requiring everyone on the team to own every device. The app is an Expo React Native prototype with a local Node practice API.

## Current Native Config

`app.json` already includes the required native readiness basics:

- App scheme: `kavi-ki-vidya`
- iOS microphone usage copy: `NSMicrophoneUsageDescription`
- Android microphone permission: `android.permission.RECORD_AUDIO`
- Expo audio plugin with microphone permission copy and Android recording enabled

Keep these in place when editing Expo config. If a new native audio package is added, update this doc and retest the matrix below.

## Command Matrix

Install dependencies first:

```sh
npm install
```

Run the local practice API in one terminal:

```sh
npm run server
```

Run the app in another terminal:

```sh
npm run ios
npm run android
npm run start:lan
npm run start:tunnel
npm run ios:native
npm run android:native
npm run ios:export
npm run android:export
```

Use `ios` and `android` for Expo Go or simulator/emulator starts. Use `start:lan` for phones on the same Wi-Fi. Use `start:tunnel` when LAN discovery is unreliable. Use `ios:native` and `android:native` only when Xcode or Android Studio native build tooling is installed. Use export scripts when the native runtime cannot be launched but the bundle still needs validation.

## API Host Configuration

The app reads `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT` at Metro start time. Restart Expo after changing `.env`.

Recommended endpoint values:

| Target | Endpoint |
| --- | --- |
| iOS Simulator | `http://localhost:8787/api/realtime/session` |
| Android Emulator | `http://10.0.2.2:8787/api/realtime/session` |
| Real iPhone on same Wi-Fi | `http://<Mac-LAN-IP>:8787/api/realtime/session` |
| Real Android phone on same Wi-Fi | `http://<Mac-LAN-IP>:8787/api/realtime/session` |

Find the Mac LAN IP with:

```sh
ipconfig getifaddr en0
```

If Wi-Fi is not on `en0`, check System Settings or run `ifconfig` and use the active local network address. The local server currently logs `http://localhost:8787`, but Express listens on the port for local development and phones should call the LAN IP. If a phone cannot reach the server, check macOS firewall prompts, VPNs, corporate Wi-Fi isolation, and that both devices are on the same network.

Health checks:

```sh
curl http://localhost:8787/health
curl http://<Mac-LAN-IP>:8787/health
```

`OPENAI_API_KEY` stays server-side only. Never add it to an `EXPO_PUBLIC_*` variable.

## iOS Simulator Checklist

1. Start the API with `npm run server`.
2. Set `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=http://localhost:8787/api/realtime/session`.
3. Start with `npm run ios`.
4. Open a speaking conversation and tap the mic.
5. Confirm iOS shows the microphone permission prompt with Kavi ki Vidya copy.
6. Allow the permission, record at least one clear sentence, then stop.
7. Confirm the app sends the turn to the local API and receives transcript, text reply, and coach audio when OpenAI is configured.
8. If no input is captured, check Simulator > Device > Microphone and ensure the Mac microphone is selected.
9. To retest the permission prompt, reset simulator privacy:

```sh
xcrun simctl privacy booted reset microphone
```

Common fixes:

- If the app is stuck in demo mode, restart Expo after editing `.env`.
- If audio is too small or rejected, speak for more than one second before stopping.
- If the coach audio URL fails, confirm the server response uses a host reachable from the simulator.

## Real iPhone Checklist

1. Start the API with `npm run server`.
2. Set `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=http://<Mac-LAN-IP>:8787/api/realtime/session`.
3. Start with `npm run start:lan`. Use `npm run start:tunnel` only when LAN discovery fails.
4. Open the app with Expo Go or a dev build.
5. Accept any Local Network prompt from iOS or Expo.
6. Tap the mic and confirm the microphone permission prompt appears once.
7. Record one clear sentence and verify the API receives the upload.
8. Confirm coach audio plays from the phone speaker.
9. Test background interruption basics by opening Control Center and returning to the app.

Common fixes:

- If the phone cannot connect, open `http://<Mac-LAN-IP>:8787/health` from Safari on the phone.
- If Safari cannot reach the server, disable VPN, check firewall prompts, and keep both devices on the same Wi-Fi.
- If microphone permission was denied, re-enable it in Settings > Privacy & Security > Microphone.
- If coach audio does not play, switch off Silent Mode and raise media volume.

## Android Emulator Checklist

1. Start the API with `npm run server`.
2. Set `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=http://10.0.2.2:8787/api/realtime/session`.
3. Start with `npm run android`.
4. Tap the mic and confirm Android requests microphone permission.
5. Allow permission, record one clear sentence, then stop.
6. Confirm the app reaches the local API through `10.0.2.2`.
7. Confirm coach audio playback.

Common fixes:

- If the API is unreachable, do not use `localhost` from the Android Emulator. Use `10.0.2.2`.
- If recording is silent, check Emulator > Extended Controls > Microphone and host audio input settings.
- If the permission prompt does not reappear, clear app data or uninstall the Expo/dev build from the emulator.

## Real Android Phone Checklist

1. Start the API with `npm run server`.
2. Set `EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=http://<Mac-LAN-IP>:8787/api/realtime/session`.
3. Start with `npm run start:lan`, or `npm run start:tunnel` if the QR code cannot connect.
4. Open the app with Expo Go or a dev build.
5. Tap the mic and allow microphone access.
6. Record one clear sentence and confirm the API receives the upload.
7. Confirm coach audio playback.

Common fixes:

- If the phone cannot reach the server, test `http://<Mac-LAN-IP>:8787/health` in Chrome on the phone.
- If the phone is on mobile data, switch to the same Wi-Fi as the Mac.
- If permission was denied, re-enable it in Android Settings > Apps > Kavi ki Vidya or Expo Go > Permissions > Microphone.

## Account And Persistence Checklist

Google OAuth and Apple Sign In are intentionally out of scope for now. The app uses one local learner profile and syncs progress through the Supabase-backed API.

1. Confirm the sign-in screen shows a single Continue action.
2. Confirm the Profile tab shows the local learner profile and Supabase sync status.
3. Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present for mobile bootstrap.
4. Confirm `SUPABASE_SERVICE_ROLE_KEY` stays only in the server env.
5. Run `npm run verify:local-api` with `PROGRESS_STORAGE_PROVIDER=supabase-rest`.

## Known iOS Start Issue

As of 2026-04-29, iOS export validation passes, but live iOS start may hang after Expo performs dependency installation. Treat this as a local start/runtime issue, not proof that the iOS bundle is broken.

Validation path:

```sh
npm run ios:export
npm run typecheck
```

Troubleshooting path:

1. Stop Metro and Expo sessions.
2. Run `npm install` manually, then rerun `npm run ios`.
3. If it still hangs, run `npm run start -- --clear`, wait for Metro to finish loading, then press `i`.
4. If the simulator is stale, quit Simulator and reopen with `npm run ios`.
5. If multiple Metro processes are running, stop them before retrying.
6. If live start still hangs, use `npm run ios:export` for bundle validation and continue native checks on Android or web until the iOS local toolchain issue is cleared.

Capture the exact last terminal line, Xcode version, macOS version, simulator device, and whether Expo installed dependencies before the hang. Add that to any follow-up issue so the next worker can reproduce it.

## Final Smoke Checklist

Before marking native readiness done for a change:

- `npm run typecheck` passes.
- `npm run ios:export` or `npm run android:export` passes when a live native runtime is unavailable.
- Microphone permission prompt has product-specific copy on iOS.
- Android requests microphone permission before recording.
- iOS Simulator uses `localhost`; Android Emulator uses `10.0.2.2`; real phones use the Mac LAN IP.
- Local learner sign-in works without OAuth IDs.
- Supabase-backed progress sync passes through the API.
- No permanent OpenAI key is exposed through `EXPO_PUBLIC_*`.
