---
'lowdefy': minor
---

feat(cli): Add `lowdefy mobile checklist` and document `lowdefy mobile`

`lowdefy mobile checklist --shell <id>` prints, filled in with the shell's own ids, the steps the stores still need a person for: the store records, the first interactive build and submission, making a `private` app private, copying the Play app signing key into `android.sha256` (marked done once it is set), the App Store privacy labels and Play data safety answers for the shell's capability profile (with the background-location declaration for `field-tracking`), and review and promotion of each native release for `private` and `store` shells. It runs no EAS command.

The CLI docs describe every `lowdefy mobile` command, its flags, the generated `.lowdefy/mobile/<shell>/project` folder and the `EXPO_TOKEN` and `SENTRY_AUTH_TOKEN` variables.
