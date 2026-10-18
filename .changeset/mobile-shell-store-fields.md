---
'@lowdefy/build': minor
---

feat(build): Mobile shells declare what a store build needs

A `mobile.shells` entry now takes `name`, `icon`, `color`, `profile`, `version`, `distribution` and `eas` beside `id`, `scheme`, `ios` and `android`. The build checks each one: the icon must exist, be a 1024×1024 PNG and have no alpha channel; `ios.bundleId` and `android.package` must be reverse-DNS ids; `version` is `major.minor`; `profile` is one of `basic`, `field`, `field-nfc` or `field-tracking`; and `distribution` is `private` (the default), `store` or `internal`. A shell with `ios` or `android` but no `android.sha256` builds with a warning, since the fingerprint exists only after the first Android upload. The built mobile config carries the new fields, with the icon as an absolute path, for `lowdefy mobile` to read.
