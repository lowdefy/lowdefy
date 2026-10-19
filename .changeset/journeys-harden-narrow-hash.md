---
'lowdefy': patch
---

fix(cli): `lowdefy journeys harden --page` narrows the baseline when the config is unchanged, and says why when it does not

The baseline narrowing added for `--page` compared the dev server's build id with the one saved by the last `lowdefy test`. The build id is a timestamp and `lowdefy test` and `lowdefy journeys harden` each start their own server, so the two never matched and harden quietly ran every journey. `lowdefy test` now saves a hash of the built config with each journey's record in `.lowdefy/test/exercised.json`, and harden compares that hash, so a record counts for as long as the config is the same. When `--page` is given, harden logs how many journeys were left out and, when it kept journeys without a usable record, why: no record, the journey changed, or the config changed since the last `lowdefy test`. Run `lowdefy test` again after a config edit to get the saving back.
