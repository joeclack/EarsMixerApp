#!/usr/bin/env bash
set -euo pipefail

: "${R2_ACCESS_KEY_ID:?Set R2_ACCESS_KEY_ID in the EAS preview environment}"
: "${R2_SECRET_ACCESS_KEY:?Set R2_SECRET_ACCESS_KEY in the EAS preview environment}"
: "${R2_S3_ENDPOINT:?Set the Cloudflare R2 S3 endpoint}"
: "${R2_BUCKET:?Set the Cloudflare R2 bucket name}"

if [[ ! -s "$APK_PATH" || "$APK_PATH" != *.apk || ! "$APK_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ||
      ! "$APK_VERSION_CODE" =~ ^[1-9][0-9]*$ || ! "$APK_BUILD_ID" =~ ^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$ ||
      ! "$APK_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Expected a signed Android APK and its EAS build metadata.' >&2
  exit 1
fi

main_commit=$(git ls-remote --exit-code origin refs/heads/main | cut -f1)
if [[ "$main_commit" != "$APK_COMMIT" ]]; then
  echo 'A newer commit is on main. Skipping the public download update.'
  exit 0
fi

upload() {
  local file=$1 key=$2 type=$3 cache_control=$4 checksum
  shift 4
  checksum=$(sha256sum "$file")
  printf 'user = "%s:%s"\n' "$R2_ACCESS_KEY_ID" "$R2_SECRET_ACCESS_KEY" |
    curl --config - --fail --silent --show-error --retry 3 --aws-sigv4 'aws:amz:auto:s3' \
      --upload-file "$file" --header "x-amz-content-sha256: ${checksum%% *}" \
      --header "Content-Type: $type" --header "Cache-Control: $cache_control" "$@" \
      "$R2_S3_ENDPOINT/$R2_BUCKET/$key"
}

filename="EarsMixerApp-$APK_VERSION-preview.apk"
object_key="android/releases/v$APK_VERSION/$APK_BUILD_ID/$filename"
upload "$APK_PATH" "$object_key" application/vnd.android.package-archive 'public, max-age=31536000, immutable' \
  --header "Content-Disposition: attachment; filename=\"$filename\""

# Leave the current download in place until the new APK is publicly reachable.
curl --fail --silent --show-error --head --retry 3 --output /dev/null "https://downloads.earsmixer.app/$object_key"
manifest=$(mktemp)
trap 'rm -f "$manifest"' EXIT
printf '{"version":"%s","build":"%s","versionCode":%s,"commit":"%s"}\n' \
  "$APK_VERSION" "$APK_BUILD_ID" "$APK_VERSION_CODE" "$APK_COMMIT" > "$manifest"
upload "$manifest" android/latest.json application/json no-store
echo "Published Android $APK_VERSION ($APK_VERSION_CODE) to https://downloads.earsmixer.app/$object_key"
