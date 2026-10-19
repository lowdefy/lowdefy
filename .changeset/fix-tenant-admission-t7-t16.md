---
'@lowdefy/api': patch
'@lowdefy/build': patch
---

fix(api): Diagnose the stranded invitee and stop invitation accept from stealing the active organization.

Two tenant-admission fixes (findings T7 and T16 from the auth-tenancy verification pass):

- A caller awaiting an organization now carries `has_pending_invitation` (always true or false) and,
  when one exists, `pending_invitation_id` — so an app can route an invited user who signed up
  directly (instead of via the invitation link) to the accept page rather than leaving them in a
  silent login loop. Diagnosis only: nothing is auto-accepted.
- Accepting an invitation no longer silently switches a session that is already active in another
  organization — the membership is created, the caller stays where they were, and switching remains
  their own explicit act. A session with no active organization still gains the accepted
  organization (the repair path for the directly-signed-up invitee). Implemented as an engine-tier
  `session.update.before` hook scoped to the accept-invitation route; the point is also added to the
  bindable hook catalog.
