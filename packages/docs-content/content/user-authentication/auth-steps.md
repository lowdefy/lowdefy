# Auth Steps

Auth steps are routine steps that administer users, organizations and memberships — inviting a member, updating an app role, banning a user, creating an organization. They run **inside an `Api` or `InternalApi` endpoint routine**, not as client actions, because administering *other* people's memberships is a server operation that must be authorized against the caller, name its target organization explicitly, and be visible in a diff.

> A **client action** mutates the caller's *own* session and nothing else — `SetActiveOrganization`, `AcceptInvitation`, `LeaveOrganization`. Anything that reaches another person's membership is an auth **step** in a routine, which is what earns it the per-step authority floor below. See the [Auth Upgrade guide](/auth-upgrade#retired-client-actions) for the actions that became steps.

```yaml
id: invite-member
type: Api
routine:
  - id: invite
    type: InviteMember
    properties:
      organizationId:
        _user: organization_id
      email:
        _payload: email
      appRoles:
        _payload: roles
  - ':return':
      _step: invite
```

## The authority model

Every auth step declares, in its own code, the authority it requires — and the engine's **authority floor** enforces that declaration mechanically before the step runs. This is not optional decoration: a step with no declared authority is a build/runtime error, so an app can never expose a member mutation by forgetting a check. The reason the floor exists in one place is that most steps go adapter-direct or through BetterAuth's admin plugin, whose check reads a single deployment-wide `user.role` field and **cannot** answer "is the caller an administrator of *this* organization". For those steps, the floor is the only authorization that can express per-organization authority.

A step declares one of three **scopes**.

### `org` — authorized against the caller's membership in the target organization

The common case. The floor:

1. **Resolves the target organization** (see below).
2. **Finds the caller's `member` row** in that organization and checks its role against the step's required **permissions**. The caller's authority is their membership in the *target* organization — an administrator of the team organization holds nothing in the customer organization.
3. For steps that write the deployment-wide `user` row, additionally requires the **target user** to be a member of that organization (`targetUser`), so org authority alone can never reach a user who is not the caller's business.

Permissions map to the organization tier via BetterAuth's organization access control: `owner` and `admin` are granted the member-management permissions out of the box; `member` holds none of them. A refused caller gets a `ConfigError` naming exactly what was required.

### `system` — caller-less, trusted runs only

A `system`-scoped step (`CreateOrganization`, `ListUsers`) has no organization to be authorized in, so a caller can never satisfy it. It runs **only** where the run itself is trusted — a caller-less system routine. Mark the step `system: true`, or run it from a system context (cron, a verified webhook, an auth hook):

```yaml
- id: create_org
  type: CreateOrganization
  system: true
  properties:
    name:
      _payload: name
    slug:
      _payload: slug
    userId:
      _payload: ownerUserId
```

### `caller` — acts on the caller's own records

A `caller`-scoped step (`RevokeMcpGrant`) acts only on rows the caller owns, so it needs no organization authority — but it is meaningless without a caller, and the system has no rows of its own. It requires a real caller and refuses `system: true`.

## `system: true` — the two doors to a caller-less run

The floor's caller requirement passes on either of two independent doors:

- a **run-level** system context (`context.system === true`) — a trusted, caller-less run such as a cron endpoint, an auth hook, or a verified webhook; or
- a **per-step** `system: true` on a single step in an otherwise user-driven run — a waiver visible in the diff, for the one privileged operation in a member-facing routine.

Either door makes the step act caller-less **as the system**, bypassing the org/permission checks. That is an explicit trust decision, not attribution — use it deliberately.

## How the target organization is resolved

For every `org`-scoped step the floor resolves the target organization once, and the step writes into the *same* one it authorized — they cannot drift. The rule:

1. An explicit **`organizationId`** property always wins. This is what a multi-organization admin routine passes, and it is what lets a session pinned to the team organization administer the customer organization.
2. `ListMembers` also accepts an **`organizationSlug`**, resolved to an id here.
3. Otherwise the **pinned** organization is the default — **but under `policy: tenant` there is no pinned organization**, so an omitted `organizationId` is a runtime error naming the fix. Under `tenant`, always pass `organizationId` explicitly.

## `targetUser` and `selfTargetExempt`

Two refinements the floor reads from a step's declaration:

- **`targetUser`** names the property holding the id of the user being acted on. Steps that write the shared `user` row declare it, so the floor can require that user to be a member of the target organization. An absent target-user property is the step's own required-property error, not the floor's.
- **`selfTargetExempt`** lets a caller act on **their own** row without holding org authority — this is what makes `UpdateUserProfile` a self-service "save my profile" step as well as an admin one. When the named property equals the caller's own id, the org authority check is skipped.

## Step reference

Scope, required permission, and target for every auth step. Permissions are checked against the caller's `member.role` in the target organization; `owner`/`admin` hold them by default.

| Step | Scope | Permission | Target | What it does |
| ---- | ----- | ---------- | ------ | ------------ |
| `InviteMember` | org | `invitation: [create]` | — | Invite a member by email; carries `appRoles`, `orgRole`, `attributes`, `contactId`, `profile`; `resend` refreshes. |
| `CancelInvitation` | org | `invitation: [cancel]` | — | Cancel a pending invitation. |
| `ListMembers` | org | `member: [list]` | — | List members of the organization (accepts `organizationSlug`). |
| `RemoveMember` | org | `member: [delete]` | — | Remove a member from the organization. |
| `UpdateMemberRoles` | org | `member: [update]` | — | Set the membership's **app roles** (`appRoles` array; empty clears). |
| `UpdateMemberOrgRole` | org | `member: [update]` | — | Set the **org tier** (`owner`/`admin`/`member`). |
| `UpdateMemberAttributes` | org | `member: [update]` | — | Set the membership's per-organization attributes. |
| `UpdateOrganization` | org | `organization: [update]` | — | Update the organization row (name, slug, metadata). |
| `UpdateUserProfile` | org | `user: [update]` | `userId` (self-exempt) | Update a member's display name/image (per-organization copy). Self-service save is exempt. |
| `UpdateUserAttributes` | org | `user: [set-attributes]` | `userId` | Set global user attributes. |
| `BanUser` | org | `user: [ban]` | `userId` | Ban a user. |
| `UnbanUser` | org | `user: [ban]` | `userId` | Lift a ban. |
| `DeleteUser` | org | `user: [delete]` | `userId` | Delete a user. |
| `RevokeUserSessions` | org | `session: [revoke]` | `userId` | Sign a user out of all sessions. |
| `ResetUserTwoFactor` | org | `user: [reset-two-factor]` | `userId` | Clear a user's two-factor enrolment and trust-device records. |
| `RevokeUserPasskeys` | org | `user: [revoke-passkeys]` | `userId` | Remove a user's passkeys (`passkeyId` to target one). |
| `CreateOrganization` | system | — | — | Create an organization (tenant provisioning). Needs `userId`, or `name`+`slug` for creator-less provisioning. |
| `ListUsers` | system | — | — | List every user in the deployment. |
| `RevokeMcpGrant` | caller | — | — | Revoke the calling assistant's own [MCP grant](/mcp-oauth#switching-organization-from-the-assistant). |

The two role tiers a member carries — the `owner`/`admin`/`member` org tier and the app's own role strings — are explained in [Organizations & Multi-Tenancy](/organizations#the-owner-admin-member-tier-vs-app-roles). Recovering a user who lost their second factor is a worked routine on the [Two-Factor Authentication](/two-factor#recovering-a-user-who-has-lost-their-factor) page.
