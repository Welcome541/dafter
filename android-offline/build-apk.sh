#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$SCRIPT_DIR"
./gradlew --no-daemon assembleDebug

BUILT_APK="$SCRIPT_DIR/app/build/outputs/apk/debug/app-debug.apk"
OUTPUT_APK="$REPO_ROOT/Dafter-Whisper-Offline.apk"
if [[ ! -s "$BUILT_APK" ]]; then
  echo "Build succeeded but APK was not found at: $BUILT_APK" >&2
  exit 1
fi
cp "$BUILT_APK" "$OUTPUT_APK"
echo "Installable debug APK: $OUTPUT_APK"
sha256sum "$OUTPUT_APK"
