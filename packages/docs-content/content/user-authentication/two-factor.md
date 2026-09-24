# Two-Factor Authentication

Enabling `auth.twoFactor` gives your app a second factor for sign-in: time-based one-time password (TOTP) codes from an authenticator app, plus a set of single-use backup codes for when the authenticator is unavailable. Backup codes are consumed one per use. The challenge is enforced by the engine on every sign-in method that can meet it — not left to your app config — so an enrolled user cannot walk past their second factor by choosing a different way in.

## Enabling it

```yaml
auth:
  twoFactor:
    enabled: true
  authPages:
    twoFactor: /two-factor-challenge
```

`authPages.twoFactor` is required when `twoFactor.enabled` is true — the build fails without it. This is not a convenience default the build could invent: the engine navigates the user to that page itself, so a missing page would leave an enrolled user unable to sign in, with nowhere to show an error.

The challenge page is public automatically, the same way the password-reset page is. By the time a user lands on it, the engine has already deleted the session the sign-in created and set a signed cookie holding the pending challenge, so there is no session to authenticate the page against — the protection lives in the cookie, not in a page role.

The page should catch the `INVALID_TWO_FACTOR_COOKIE` error and redirect to sign-in. Visited directly, without the cookie, the page renders fine and the verify call throws. That is harmless, but it leaves the user looking at a code box that can never succeed.

## Which sign-in methods are challenged

| Sign-in method                 | Challenged                          |
| ------------------------------ | ----------------------------------- |
| Email + password               | Yes                                 |
| Phone number + password        | Yes                                 |
| Magic link                     | Yes — always, no toggle             |
| SMS code (`PhoneNumberVerify`) | Yes — always, no toggle             |
| OAuth provider                 | Yes, unless the provider is trusted |
| Passkey (`PasskeySignIn`)      | No — deliberately                   |

Magic link and SMS code have no toggle. A magic link is possession-of-inbox — the factor most likely to be compromised in exactly the incident two-factor authentication exists to survive. An SMS code is possession-of-SIM, and SIM-swap is the best-documented account-takeover attack of any factor on this list. Neither is a factor worth accepting on its own for an enrolled user.

Passkey sign-in is not challenged, and that is correct rather than missing. A passkey is possession of the authenticator plus user verification in a single phishing-resistant ceremony, and the major identity providers accept one as satisfying multi-factor authentication outright.

### The engine routes the challenge

[`Login`](/Login) and `PhoneNumberVerify` navigate to `authPages.twoFactor` themselves, and they **end the event chain** when they do. A step placed after `Login` or `PhoneNumberVerify` does not run on the challenge path, so your app needs no `skip` guard for it. Your app does not route the challenge. The action response still carries `twoFactorRedirect` and `twoFactorMethods` if you want to read them.

The trade this makes: an inline two-factor challenge rendered on the login page itself is no longer possible. The challenge is always a page.

### A challenge page routes nothing

The engine owns both ends of the challenge hop. It navigates to `authPages.twoFactor` on every sign-in path, carrying the destination the caller asked for as `?callbackUrl=`, and `TwoFactorVerify` navigates away again after a successful verify — reading that same parameter through the same ladder as the rest of sign-in. So an enrolled user who deep-linked to `/invoices/123`, was bounced to sign in and then challenged, lands back on `/invoices/123`, and your challenge page needs no routing config for it.

Only app-relative, same-origin destinations are carried; anything else falls through to the home page. `basePath` needs no handling: the carried path already includes it.

`TwoFactorVerify` takes the same `callbackUrl` param as [`Login`](/Login): an explicit target wins over the carried one, and `callbackUrl: false` stays put, for a challenge page that renders its own post-verify state instead.

### Trusting a device

`TwoFactorVerify`'s `trustDevice` param sets a cookie that short-circuits the challenge on later sign-ins from the same browser. It applies on every one of the challenged paths above, not just the one it was set from.

## Trusting an OAuth provider

An enterprise identity provider often enforces its own multi-factor policy. `twoFactorTrusted` on a provider entry tells the engine not to challenge sign-ins that came through it:

```yaml
auth:
  providers:
    - id: corp-idp
      type: GenericOAuth
      twoFactorTrusted: true
      properties: ...
```

What it means: skip the engine's challenge for sign-ins through this provider, because you are asserting the IdP enforced multi-factor authentication itself.

**The trust is declared, not verified.** The engine cannot confirm what the IdP actually enforced, and it checks nothing. Set this only where you control or otherwise trust the IdP's own MFA policy.

`twoFactorTrusted` is **unrelated to `auth.account.accountLinking.trustedProviders`**, which trusts a provider's _email claim_ enough to link a sign-in to an existing account automatically. Trusting Google's email claim is routine; it is not a claim that every Google sign-in cleared MFA. The two lists are independent, and setting one has no effect on the other. This is the mistake the separate key exists to prevent.

The escape hatch exists because without it the only advice would be "don't enable two-factor alongside an enterprise IdP", which is a functionality loss dressed up as operational advice. Entra has federated-IdP-MFA trust settings and Okta has the IdP factor: nobody double-challenges by default, and nobody silently accepts either.

## Known limitation: TOTP codes are replayable within their window

A TOTP code that has already been used successfully is accepted again inside its validity window — roughly 30 to 60 seconds. BetterAuth's verifier keeps no ledger of consumed codes and no last-used counter, so nothing distinguishes a second presentation of a code from the first.

This violates the standards:

- RFC 6238 §5.2: "The verifier MUST NOT accept the second attempt of the OTP after the successful validation has been issued for the first OTP."
- OWASP ASVS 5.0 §6.5.1 (L2), which requires the same single-use property.

**Severity is narrow.** Exploiting this needs the user's password _and_ a code inside its window — and an attacker holding both can simply sign in, with no replay involved. The real gain is the case where the legitimate user spent the code first: an attacker who has the password and observes that code can mint their own session inside the window without racing anyone for it.

It is not a bypass. The second factor works; it is replayable within its own validity. Replay against the _same_ sign-in challenge already fails, because that challenge's verification record is consumed and its cookie expired. What remains is a _fresh_ challenge accepting the same code while the window is still open.

Tracked upstream at [#10387](https://github.com/better-auth/better-auth/issues/10387). Lowdefy has not mitigated it locally: a `before` hook on the sign-in path has no session to work from, so recovering the user would mean reaching into the two-factor plugin's private cookie and verification internals — a bad trade for a sixty-second window that already sits behind a password.

If you are enabling multi-factor authentication to satisfy an auditor, know about this before the auditor tells you.

## Concurrent enrolment and the unique index

Two `TwoFactorEnable` calls that run concurrently for the same user can write two rows to the two-factor collection. Sign-in may then read the unverified row, find no methods to offer, and leave the user unable to complete a challenge — a silent lockout. Tracked upstream at [#10561](https://github.com/better-auth/better-auth/issues/10561).

The mitigation is a unique index on `userId` in the two-factor collection (`user-two-factors`), applied by the host app — no layer in Lowdefy provisions indexes. For MongoDB, see the `modules-mongodb` `user-account` index reference for how that module declares its auth indexes, rather than writing the command by hand.

Be clear about what the index buys: it converts an unrecoverable silent lockout into a visible, retryable duplicate-key error. It does not fix the race.

## Requiring two-factor enrolment

`twoFactor.enabled` lets a member enrol a factor. `twoFactor.required` makes enrolment a floor: a member who has not enrolled cannot use the app until they do.

```yaml
auth:
  twoFactor:
    enabled: true
    required: true
  authPages:
    twoFactor: /two-factor-challenge
    twoFactorEnrol: /two-factor-enrol
```

A caller satisfies `required` by holding **either** a TOTP enrolment **or** a registered passkey. A passkey counts on its own: it is a phishing-resistant possession factor bound to user verification, which is exactly why Entra and Okta accept one outright. Demanding TOTP on top of a passkey is theatre — it adds no assurance and pushes the user toward the weaker of the two factors.

An unenrolled caller is redirected to `authPages.twoFactorEnrol` on every page, and refused at every request, endpoint and websocket with a `TwoFactorEnrolmentRequiredError` — a **403, not a 401**. A 401 reads to the client as a dead session and bounces the user to sign-in, which is the loop the floor exists to avoid; a 403 says "you are signed in, but you are missing something".

The enrolment check runs **after** the role check. Probing a page you lack the roles for still returns the opaque 404 it always did, so turning `required` on never reveals a page's existence to someone who was not authorised for it in the first place.

`authPages.twoFactorEnrol` is **required when `required: true`** — the build fails without it. Every unenrolled user is redirected there, so a deployment that required enrolment without naming the page would redirect them to nowhere.

Callers that carry no session pass untouched: the API strategy and the injected callers used in dev and e2e are not session-resolved members, so the enrolment floor does not apply to them.

## What `required` guarantees — and what it does not

> `required` guarantees that every member has enrolled a factor. It does NOT guarantee that every session presented one.

Read the second sentence before you rely on the first. Here is the concrete gap. Take a user who registered a passkey and also holds a password. They sign in with the password. BetterAuth's sign-in hook opens with `if (!data?.user.twoFactorEnabled) return;`, so a passkey-only enrolment fires no challenge. The enrolment floor then computes `false || passkeyCount > 0` and reads the caller as satisfied. Nothing on this path compares the factor **presented this sign-in** against the factors the user **holds** — so a password-only sign-in clears a floor a passkey was meant to enforce.

This is an accepted cost, for three reasons:

- The fix is session-scoped satisfaction — comparing presented against held on every request. That is a larger feature than a per-user flag, and shipping it half-built would be worse than naming the limitation. It has a known correct answer; it is not in this release.
- Dropping the passkey disjunct would trade a soft hole for a hard lockout: a passwordless user who enrolled only a passkey would satisfy nothing and be locked out of an app they have a perfectly good factor for.
- The affected population **voluntarily registered a strong, phishing-resistant credential.** They are not the threat `required` defends against. `required` exists to catch members with **no second factor at all** — and every one of those is caught, because an unenrolled caller has neither a TOTP row nor a passkey and fails the floor outright.

## Two-factor with a trusted OAuth provider

A `twoFactorTrusted` provider's users are not challenged on that sign-in path (see **Trusting an OAuth provider**, above). Under `required`, a user who signed in that way and has not separately enrolled is unenrolled, so they are routed to `authPages.twoFactorEnrol` to enrol a TOTP their sign-in will never present.

The cost, stated plainly: a deployment whose **only** sign-in path is a trusted provider gets enrolment with no challenge ever attached to it.

The enrolled factor is not inert, though. It is what a password or magic-link sign-in **would** challenge, and it is what an admin reset restores. It earns its keep the moment a second sign-in path exists.

## Two-factor for passwordless users

The four BetterAuth two-factor endpoints that mutate a factor are password-gated: they call `shouldRequirePassword`, which demands the caller's current password unless `allowPasswordless` is set. Lowdefy sets `allowPasswordless: true`, so an OAuth or magic-link user who never set a password can still enrol TOTP.

The waiver is **per user**, not per app. A caller who *does* hold a password still faces the password gate on all four endpoints — the waiver only lifts it for the users who have no password to give. There is no route difference to configure: the same enrol flow serves both.

## The enrolment page

`authPages.twoFactorEnrol` is the one auth page that is **not public**. On the sign-in and challenge pages the user has no session yet; here they hold a valid session and are merely missing a factor — an authorisation gap, not an identity one — so the page stays behind a session.

The constraint that follows: **the enrolment page cannot call any Lowdefy request or endpoint.** An unenrolled caller is refused at every one of them with a 403, and the person on this page is unenrolled by definition. It must be self-sufficient on the client auth actions — `TwoFactorEnable`, `TwoFactorVerify` and `PasskeyRegister` — which hit `/api/auth/*` directly and are not behind the enrolment floor.

Reached with no session at all, it behaves like any protected page: the user is sent to sign in with a `callbackUrl` back to the enrolment page.

## Recovering a user who has lost their factor

When a member loses their authenticator or has a security key stolen, an administrator restores their access with two org-scoped steps:

| Step                                            | Properties            | Permission                    |
| ----------------------------------------------- | --------------------- | ----------------------------- |
| `ResetUserTwoFactor`                            | `userId`              | `user: ['reset-two-factor']`  |
| `RevokeUserPasskeys`                            | `userId`, `passkeyId?`| `user: ['revoke-passkeys']`   |

Both are `org`-scoped and bounded by target membership: an administrator can only reach a user who holds a member row in an organization they administer. Both permissions ship granted to `owner` and `admin`; a narrower custom role can be given member management without either of them.

Three things this routine must not miss:

**Pair the reset with `RevokeUserSessions`.** Clearing a factor does not end a session — an attacker who already holds one keeps it, which is precisely the incident you are recovering from. A reset without a session revocation has not recovered the account. Run all three together:

```yaml
id: admin-recover-user-two-factor
type: Api
routine:
  - id: reset_two_factor
    type: ResetUserTwoFactor
    properties:
      userId:
        _payload: userId
  - id: revoke_passkeys
    type: RevokeUserPasskeys
    properties:
      userId:
        _payload: userId
  - id: revoke_sessions
    type: RevokeUserSessions
    properties:
      userId:
        _payload: userId
  - ':return':
      _step: revoke_sessions
```

**The reach is suite-wide.** `twoFactorEnabled` lives on the deployment-wide user row, and there is one enrolment per user — never one factor per organization. The membership bound governs **who** an administrator may reset, not **how far** a reset reaches: reset the user in the one organization you administer and their factor is cleared everywhere.

**`ResetUserTwoFactor` also deletes the user's trust-device records.** This is load-bearing, not tidying. A device the user once ticked "trust this device" on holds a signed cookie that skips the challenge; leave the record in place and, the moment the victim re-enrols, a stolen device walks straight past the factor they just set up.

One timing note on session revocation: with `session.cookieCache` enabled, a revoked session can still be honoured from its cached copy for up to the cache's `maxAge` (default 300 seconds). Lowdefy defaults `cookieCache` **off**, so a default deployment has no such window — but if you turned it on, size the exposure accordingly.

## Before you turn `required` on

**Enrol your administrators first — more than one of them.** Turning `required` on sends every unenrolled user, administrators included, to the enrolment page at their next request. If the only person who can run `ResetUserTwoFactor` is themselves locked out mid-enrolment, you have no in-app way back.

**There is no escape hatch, by design.** No exempt identity, no environment override, no grace period. Each of those would be a permanent bypass of the floor, available to anyone who found it, so none exists.

**Last-admin recovery is a database edit.** If every administrator is locked out, the only way back is to clear one administrator's factor directly in the database — the same two writes `ResetUserTwoFactor` makes:

1. Delete the target's row from the `user-two-factors` collection.
2. Set `twoFactorEnabled` to `false` on their row in the `users` collection.

That administrator can then sign in and recover the others through the app.

## Required index

Under `required`, the engine counts a caller's passkeys on every request from anyone not yet enrolled, to decide whether they clear the floor. That read needs an index on the passkey collection:

```js
db['user-passkeys'].createIndex({ userId: 1 });
```

This index is **platform-owned but host-applied.** The engine reads it per request for any unenrolled caller under `required`; without it, that read is a full collection scan on every such request. But no layer in Lowdefy provisions indexes — the deployment applies this one, exactly as it applies the `user-two-factors` index above. (This example follows the `userId` field convention: the auth adapter maps its collections with camelCase field names, so the key is `{ userId: 1 }`, not `{ user_id: 1 }`.)

An **enrolled** caller never reaches the passkey read: the floor short-circuits on `twoFactorEnabled`, which rides the session, so an enrolled member pays nothing. Once `required` has been on for a while, that is the overwhelming majority of traffic.
