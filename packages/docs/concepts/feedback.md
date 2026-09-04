{% raw %}
An end user who hits a problem in a running app usually has no way to tell anyone about it except by messaging a person. What they can describe is what they were trying to do; what they cannot describe is what the app actually did. Lowdefy's feedback reports close that gap: a signed-in user sends a short report, and the framework attaches the id of the [journey](/logger) their tab is recording under — so the report and the ordered steps that led to it land in the same log sink, keyed together.

The framework produces the facts. It does not open a ticket, notify a channel, or triage anything: a report is a `feedback_submitted` wide event on your log sink, and what happens next is yours to compose.

## Enabling feedback

Feedback is off unless you turn it on:

```yaml
config:
  feedback:
    enabled: true
    roles:
      - support
      - admin
```

| Property  | Type       | Description                                                                                                         |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `enabled` | `boolean`  | Accept reports at `POST /api/feedback` and offer the in-app affordance. Default `false`.                            |
| `roles`   | `string[]` | Roles allowed to report. A caller holding any one of them is accepted. Omitted or empty means every signed-in user. |

A report is always signed. An unauthenticated caller is refused with a `403`, whatever `roles` says — an anonymous report cannot be traced back to a session, and an open write path into your log sink is not something an app should have.

## What the user sees

In a running app, a permitted user presses **Cmd/Ctrl + /** and gets a small modal with one text field. Sending it posts the report and confirms; the field holds at most 4000 characters. There is deliberately nothing else in the dialog — the value of a report is not its prose, it is everything the framework attaches to it.

> This is not the dev feedback overlay. `lowdefy dev` binds the same shortcut to a richer tool where **you**, the developer, annotate a page and hand the result to an AI agent. Feedback reports are for the people using the deployed app.

## The `feedback_submitted` event

Each report emits exactly one wide event, at `info`, on the app's logger:

| Field                           | Description                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `event`                         | `feedback_submitted`                                                            |
| `text`                          | What the user wrote.                                                            |
| `page_id`, `block_id`           | Where they were.                                                                |
| `url`                           | The full URL at the time of the report.                                         |
| `session_id`                    | The journey session of the tab — the key to the recorded steps.                 |
| `user`                          | The reporter's id. Always present, whatever `logger.events.identity` is set to. |
| `rid`, `app_version`, `git_sha` | Stamped by the server on every line.                                            |

Unlike the per-request lines, a feedback report ignores `logger.events` sampling and the identity gate. A report is a signed statement by a named person, not a diagnostic sample: dropping it, or stripping who made it, would leave a fact nobody can act on.

## From a report to a reproduction

Because the report carries the journey `session_id`, one query returns everything that tab did:

```
lowdefy_prod_trace({ session_id: '...' })
```

That returns the session's `journey_event` steps and the `feedback_submitted` report, oldest first — which page, which block, which action, which request failed, in order, ending at the user's own account of it. This is the `lowdefy_prod_trace` tool from the dev server's [ops tools](/ai-agent-docs); it takes either a `rid` or a `session_id`.

From the moment a report arrives, the server stops sampling that session: every wide event carrying the same `session_id` is written at `info`, whatever `logger.events.sample_rate` would have decided, so the trace a developer opens is not half a story. The server instance that took the report remembers the 100 most recently reporting sessions and forgets the oldest beyond that; it is a per-instance memory, so on a multi-instance or serverless deployment only the instance that answered the report keeps the following events. The report line itself is always kept, on every instance.

Two things make a session come back empty. Journeys are sampled in the browser (`logger.journeys.sample_rate`, 5% by default), so a tab that was never recording sends no steps — the report still arrives, it just has no trace beside it, and nothing the server does after the fact can recover steps that were never recorded. Raise the rate if reports matter more than log volume. And the sink only holds its retention window, 30 days unless configured otherwise.

## Screenshots

A report may carry a screenshot as an image data URL of at most 256 KB, sent as `screenshot`. It rides on the wide event; there is no file store for report attachments, so anything larger is rejected with a `400`. The in-app affordance does not attach one — the field exists for apps that post their own reports.

## Posting a report yourself

The route is same-origin, `POST /api/feedback`, with a JSON body. It is a browser route: the request must carry an `Origin` matching the app's own host, and a request a browser marks as cross-site is refused with a `403` before anything is read — the same defence `/api/journey` and `/api/client-error` use. Server-to-server callers have no path in.

```json
{
  "text": "Submitting the order does nothing.",
  "page_id": "checkout",
  "block_id": "submit_button",
  "url": "https://app.example.com/checkout",
  "session_id": "…"
}
```

`text` and `page_id` are required; the rest are optional. It answers `204` on success, `400` for a malformed report, and `403` when feedback is off, the caller is not signed in, or their roles do not match.

{% endraw %}
