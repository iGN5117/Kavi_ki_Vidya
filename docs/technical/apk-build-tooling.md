# APK build tooling

Use the project scripts below to create and retrieve shareable Android APK links without asking Codex to look them up.

## Commands

```bash
npm run apk:build
```

Dispatches an EAS Android build with the `preview` profile, polls until it finishes, then prints:

```text
APK_URL=https://...
BUILD_ID=...
BUILD_PAGE=https://...
```

```bash
npm run apk:dispatch
```

Starts the same APK build and exits after printing the build ID. Poll later with:

```bash
npm run apk:poll -- <build-id-or-expo-build-url>
```

```bash
npm run apk:latest
```

Prints the newest finished Android APK artifact URL from EAS.

## Notes

- These commands use the existing `preview` EAS profile, which is configured as an APK in `eas.json`.
- You must be logged in to EAS locally. Check with `npx eas-cli@latest whoami`.
- The last dispatched build ID is cached in `.tmp/apk-builds/last-build.json`, which is intentionally gitignored.
- To change polling cadence, pass `--poll-interval <seconds>` or `--poll-interval-seconds <seconds>`.
