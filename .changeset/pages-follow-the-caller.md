---
'@lowdefy/client': patch
'@lowdefy/engine': patch
'@lowdefy/helpers': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
---

fix: Reload when the server answers as another caller

Page, request and endpoint responses now carry an `x-lowdefy-caller` header naming the caller the server answered as (a short hash of the user id and active organization id, empty when anonymous). The browser compares it with the caller the page renders and reloads the page when they differ, so a page never keeps showing one person's or organization's data after a sign-in as someone else or an organization switch in another tab.

- A request or endpoint call answered with a 401 while the page shows a signed-in user reloads the page, since the session has ended. A 403 from a page request reloads too; a 403 from an endpoint, and a two-factor enrolment refusal, are thrown as before.
- When the session names a different user than the page renders, the page reloads instead of keeping the previous user rendered.
- A kept page instance is rebuilt after `SetActiveOrganization` and `UpdateSession` instead of rendering the state and request results it had under the previous organization.
- `CallAPI` results read by `_api` are dropped when the organization changes, so a result fetched for one organization is never read under another. Global state is left as it is.
- A tab reloads at most once every 10 seconds for these reasons; a second difference inside that window fails the call with an `AuthenticationError` instead of reloading again.
