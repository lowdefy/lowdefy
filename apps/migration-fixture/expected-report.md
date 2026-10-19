# Expected prompt-07 `_user` report for this fixture

The gate: prompt 07 run against this fixture must report **exactly these 19 reads** — every one of them, and nothing else. Kept-key reads listed at the bottom must stay silent.

## Class A — dropped OIDC claims (12)

| Location | Read | New home |
| --- | --- | --- |
| `pages/profile.yaml` block `subject` | `_user: sub` | `_user.id` — different value; provider subject on `user-accounts.accountId` |
| `pages/profile.yaml` block `full_name` | `_user: given_name` | contact record (hook-persisted) |
| `pages/profile.yaml` block `full_name` | `_user: family_name` | contact record |
| `pages/profile.yaml` block `username` | `_user: preferred_username` | contact record |
| `pages/profile.yaml` block `photo` | `_user: picture` | `_user.image` |
| `pages/profile.yaml` block `verified` | `_user: email_verified` | `_user.email_verified` — unchanged; already the caller field name |
| `pages/profile.yaml` block `phone` | `_user: phone_number` | contact record |
| `pages/profile.yaml` block `country` | `_user: address.country` | contact record |
| `pages/profile.yaml` block `locale` | `_user: { key: locale }` (object form) | contact record or attributes |
| `pages/profile.yaml` block `last_updated` | `_user: updated_at` | not carried; hook-persist if needed |
| `pages/profile.yaml` block `website_card` | `_user: true` whole-object embed, template reads `user.website` | dropped claims absent from the whole-object read; `website` → contact |
| `api/whoami.yaml` step `:return` | `_user: sub` | `_user.id` — different value |

(12 rows, one read each — the two `full_name` claims are separate rows. The whole-object read counts once; its template's `website` usage is named inside that line, not counted separately.)

Note for reviewers: the fixture YAML carries inline comments pre-annotating each read's class. A strictly blind detection test strips those comments first; the annotations exist to document seeding intent.

## Class B — old attribute paths (5)

| Location | Read | New home |
| --- | --- | --- |
| `pages/admin.yaml` block `branch` | `_user: app_attributes.branch` | `_user.attributes.branch` (member attributes) |
| `pages/admin.yaml` block `tier` | `_user: global_attributes.tier` | `_user.attributes.tier` (user attributes) |
| `pages/admin.yaml` block `attribute_dump` | `_user: { key: app_attributes }` (bare, object form) | `_user.attributes` |
| `api/whoami.yaml` step `:return` | `_user: global_attributes.tier` | `_user.attributes.tier` |
| `api/admin-report.yaml` step `find_records` query | `_user: app_attributes.branch` | `_user.attributes.branch` |

## Class C — `userFields`-projected custom fields (2)

| Location | Read | New home |
| --- | --- | --- |
| `pages/profile.yaml` block `groups` | `_user: idp_groups` | dead projection (`userFields.idp_groups`); authorization input → attributes via hook, or role sync via member records |
| `pages/profile.yaml` block `company` | `_user: profile.company` | dead projection (`userFields.profile` dump); profile data → contact record |

## Must NOT be reported (kept keys)

- `pages/home.yaml`: `_user: name`, `_user: id`, `_user: email`, `_user: image`, `_user: roles`
- `pages/profile.yaml` block `profile_title`: `_user: name`
- `pages/admin.yaml` block `roles_list`: `_user: roles`
- `api/whoami.yaml`: `_user: email`
