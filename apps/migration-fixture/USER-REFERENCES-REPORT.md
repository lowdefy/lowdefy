# `_user` Reference Report — migration-fixture

Detection pass per `07-user-references-report.md`. Scanned all `**/*.{yaml,yml}` under
`lowdefy.yaml`, `pages/`, and `api/`. Classes: **A** dropped OIDC claims, **B** old attribute
paths, **C** `userFields`-projected custom fields (cross-referenced against the pre-migration
`auth.userFields` block: `id`, `roles`, `app_attributes`, `global_attributes`, `phone`,
`idp_groups`, `profile`). Nothing was rewritten.

## Reported reads

### pages/profile.yaml

- `pages/profile.yaml:profile/subject` — _user read: `sub` (A) → `_user.id`, but the **value is different** (BetterAuth's internal id, not the provider's OIDC subject — the subject now lives on `user-accounts.accountId`); anything keyed on `sub` needs a data-migration decision, not a rename.
- `pages/profile.yaml:profile/full_name` — _user read: `given_name` (A, inside `_string.concat`) → not in the session; persist at signup via an endpoint hook (`user.create.before` / `account.create.after`) onto the `contact` record and read it from the contact collection.
- `pages/profile.yaml:profile/full_name` — _user read: `family_name` (A, inside `_string.concat`) → not in the session; persist onto the `contact` record via a signup endpoint hook and read from the contact collection.
- `pages/profile.yaml:profile/username` — _user read: `preferred_username` (A) → not in the session; persist onto the `contact` record via a signup endpoint hook and read from the contact collection.
- `pages/profile.yaml:profile/photo` — _user read: `picture` (A, inside `_string.concat`) → `_user.image` (populated by BetterAuth from the provider).
- `pages/profile.yaml:profile/verified` — _user read: `email_verified` (A, inside `_if.test`) → `_user.emailVerified`.
- `pages/profile.yaml:profile/phone` — _user read: `phone_number` (A) → not in the session; persist onto the `contact` record via a signup endpoint hook (profile/display data) and read from the contact collection.
- `pages/profile.yaml:profile/country` — _user read: `address.country` (A, address sub-path) → not in the session; persist onto the `contact` record via a signup endpoint hook and read from the contact collection.
- `pages/profile.yaml:profile/locale` — _user read: `locale` (A, object form with `default: en`) → not in the session; persist onto the `contact` record via a signup endpoint hook (or into attributes if it drives authorization) and read from there.
- `pages/profile.yaml:profile/last_updated` — _user read: `updated_at` (A) → not in the session; if still needed, persist it at signup/login via an endpoint hook onto the `contact` record and read from the contact collection.
- `pages/profile.yaml:profile/website_card` — _user read: `_user: true` (A, whole-object read embedded in `_nunjucks` context; template reads `{{ user.website }}`) → reads the whole user object; dropped claims will be absent — `website` must be persisted onto the `contact` record via a signup endpoint hook, or the template switched to kept keys.
- `pages/profile.yaml:profile/groups` — _user read: `idp_groups` (C, projected by old `userFields` from `profile.https://idp.example.com/groups`) → no session projection for custom provider claims; as an authorization input persist it into attributes (`member.attributes` / `user.attributes`) via an endpoint hook at signup/login and read `_user.attributes.<key>`, otherwise persist to `contact`.
- `pages/profile.yaml:profile/company` — _user read: `profile.company` (C — this is the `userFields` whole-`profile` dump, not the OIDC `profile` claim; deeper read) → no equivalent in the session; persist the needed fields onto the `contact` record via a signup endpoint hook and read from the contact collection.

### pages/admin.yaml

- `pages/admin.yaml:admin/branch` — _user read: `app_attributes.branch` (B) → `_user.attributes.branch` — per-app values now live on the active membership's `member.attributes` (written via `UpdateMemberAttributes` or a signup hook).
- `pages/admin.yaml:admin/tier` — _user read: `global_attributes.tier` (B) → `_user.attributes.tier` — global values now live on `user.attributes`, merged shallowly with member attributes (member wins).
- `pages/admin.yaml:admin/attribute_dump` — _user read: `app_attributes` (B, bare object form inside `_json.stringify`) → `_user.attributes` — note this now includes merged user + member attributes, not only per-app values.

### api/whoami.yaml

- `api/whoami.yaml:whoami` — _user read: `sub` (A) → `_user.id`, but the **value is different** (BetterAuth internal id; provider subject now on `user-accounts.accountId`) — if callers key on this value, that keying needs a data-migration decision.
- `api/whoami.yaml:whoami` — _user read: `global_attributes.tier` (B) → `_user.attributes.tier` — global values now live on `user.attributes` (member attributes win on key collision).

### api/admin-report.yaml

- `api/admin-report.yaml:admin-report` — _user read: `app_attributes.branch` (B, MongoDB request filter) → `_user.attributes.branch` — per-app values now live on `member.attributes`; verify stored documents' `branch` values still match the migrated attribute values.

## Count

**19 `_user` reads reported** (13 class A — including one whole-object read, 5 class B, 2 class C; the whole-object read is also the carrier for a class-A `website` template usage).

No other `_user` reads reference dropped fields.

## Not reported (verified kept or non-reads)

- Kept-key reads (correct, not listed per the prompt): `name` (profile/profile_title, home/greeting), `id`, `email`, `image`, `roles` (home page, admin/roles_list, whoami `email`).
- `pages/login.yaml`, `lowdefy.yaml`: no `_user` reads.
- `api/auth/audit-login.yaml`, `api/auth/audit-logout.yaml`, `api/auth/check-email-domain.yaml`, `api/auth/welcome-new-user.yaml`: the string `_user` appears only in comments ("`_user` is empty inside a hook") — non-reads, not flagged.

## Verification

- `grep -rn "_user"` over the app config: every hit is accounted for — 19 reported reads (classes A–C), kept-key reads, or comment-only mentions.
- Every reported entry names a new home (session key, `_user.attributes.<key>`, or contact-record-via-hook); no entry says only "removed".
