# ReYadan Stiker Maker — APK-ready Expo project

This project is configured for an Android APK build with Expo/EAS and includes the native WhatsApp sticker-pack ContentProvider.

## Build

```bash
npm install
npx expo prebuild --clean
npx expo run:android
```

For a cloud APK:

```bash
npm install
npx eas build --platform android --profile preview
```

The `preview` profile is configured to produce an `.apk`.

## WhatsApp integration

The app exposes:

- `.../metadata`
- `.../metadata/reyadan_pack`
- `.../stickers/reyadan_pack`
- `.../stickers_asset/reyadan_pack/<file>.webp`
- `.../stickers_asset/reyadan_pack/tray.png`

The React Native app writes the editable pack name, publisher, sticker filenames, emoji and accessibility text to its internal `files/stickers/metadata.txt` file. The native provider reads that data and serves the generated WebP files to WhatsApp.

The Add to WhatsApp button launches the official `com.whatsapp.intent.action.ENABLE_STICKER_PACK` intent.

## Important

The final APK still needs to be built in an Android/EAS environment and tested with WhatsApp installed. This ZIP is the corrected source/build project; it is not itself an APK.
