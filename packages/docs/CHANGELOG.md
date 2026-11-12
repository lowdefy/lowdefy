# Change Log

## 7.2.0

### Minor Changes

- a41d898: feat(api): Agents mask patterns in the user's messages with `redact`

  An agent's new `redact` property lists regular expressions the server masks in the text of every user message before the model, title generation, tools and `onFinish` hooks see it. Use it to keep ID numbers, email addresses and other personal information a user pastes into a chat away from the AI provider and out of chat history.

  ```yaml
  agents:
    - id: support_agent
      type: ClaudeAgent
      connectionId: anthropic
      redact:
        replacement: '[removed]' # default
        patterns:
          - name: email
            pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
          - '\d(?:[ -]?\d){8,}'
  ```

  Patterns are strings or `{ name, pattern, flags }` objects, and may be operators. The build rejects a missing or empty `patterns` list, a pattern that is not a string, an invalid regular expression, the sticky flag `y` and a pattern that matches empty text; a pattern an operator returns is checked when the request runs. It applies to chat turns, not to sub-agent calls or the `CallAgent` step. Assistant messages, tool calls and files are left as they are, and the debug log counts replacements by name without the matched text.

- 8b0c8be: feat(api): Link endpoints serve a file at a stable URL, and Tiptap editors save it with `imageSrc`

  An `Api` endpoint with `link: true` answers a `GET` on `/api/endpoints/<endpointId>/<path...>`: its routine runs as the signed-in caller, with `{ path, query }` as payload and the endpoint's `auth` applied, and the endpoint answers `302` to the URL its `:return` gives (an absolute http(s) URL or a path starting with `/`), with `Cache-Control: private, no-store`. Endpoint ids can hold slashes, so the longest link id the URL starts with wins. A signed-out caller on a protected link gets `401`, a caller without its roles `403`, a `:reject` its `:status` (default `400`), all with no body; an unknown id answers `404` (`401` to a signed-out caller on an app with auth), and any other error `500` with a fixed message. A payload its `payloadSchema` refuses answers `400` with no body. A `POST` to a link endpoint is refused as a missing endpoint, and the build refuses one as an MCP tool. The build refuses `link` on `InternalApi` and with `webhook` or `async`, and allows `:status`, not `:body`, on a `:reject` in a link endpoint. Link endpoints must have no side effects, since any page that embeds the URL can trigger the `GET`.

  `TiptapInput` and `TiptapMentionInput` take an `imageSrc` `_function`, called with `{ key, bucket, name, type }` once an image is uploaded; its string is the inserted `src`. It takes precedence over `downloadPolicyRequestId`, so no download request runs. Pointing it at a link endpoint lets the bucket behind inline images stay private.

- 20dd549: feat(api, build): The owner of a new organization can get app roles

  A new signup under `organizations.policy: tenant` with `create: auto` became the `owner` of their own organization with no app roles, so in an app that gates pages, endpoints and menus on app roles, every gated page was closed to them in their own organization. The new `auth.organizations.creatorAppRoles` setting lists the app roles the owner of a new organization gets on their membership:

  ```yaml
  auth:
    roles:
      - id: workspace-admin
    organizations:
      policy: tenant
      creatorAppRoles:
        - workspace-admin
  ```

  It applies to the organization a tenant signup mints and to the `CreateOrganization` step when it is given a creator. The owner's organization tier stays `owner`; invited members and users auto-joined to a pinned organization are unchanged. Every listed id must be declared in `auth.roles`, or the build fails naming the unknown id. Unset, it defaults to `[]` and owners get no app roles, as before. Existing memberships are left as they are.

### Patch Changes

- 163905d: fix(operators-js): `_base64` in the browser encodes and decodes UTF-8 text

  `_base64.encode` and `_base64.decode` in the browser now read and write the UTF-8 bytes of a string, like the server and `_build` versions. Before, the browser used Latin-1: text with an accented letter encoded to a different value than on the server, decoding server-encoded text gave garbled characters, and text such as emoji or Chinese threw an `Invalid character` error. `_base64.decode` in the browser also accepts base64url and unpadded input, as the server does. Other characters outside the base64 alphabet still throw in the browser, where the server ignores them.

  ASCII text encodes and decodes as before. Non-ASCII text that an earlier version encoded in the browser is Latin-1, not UTF-8, so `_base64.decode` in the browser now throws an error for it instead of returning the original text. Re-encode stored values like these. Base64 of bytes that are not UTF-8 text, such as binary files, also throws in the browser, where the server replaces the invalid bytes with U+FFFD.

- c84f275: fix(client): A sign-in that stays on the page renders the signed-in user before the action returns

  A sign-in with `callbackUrl: false`, which stays on the page, now finishes by asking the server who signed in, as `UpdateSession` does, and renders that user before the `Login` action returns. The next action in the chain, such as a request, is answered as the user the page shows. Before, that request could reload the page and lose the page's state. If the page cannot get the signed-in user from the server, it reloads in place rather than failing a sign-in that succeeded.

- 74122f0: Mobile apps are experimental: the `mobile` section and `offline` on requests build only when the app sets `config.experimental.mobile: true`. Without it the build fails with a message that names the flag. The new docs page, Mobile Apps (Experimental), covers the section, capability profiles, offline requests, sign-in and the phone dev loop.
- ab1f114: fix(api): The accept page works for a pinned app's invitee on the dev server

  Under `organizations.policy: pinned`, a signed-in user with a pending invitation to the app's organization now resolves as an awaiting-organization caller, as it already did under `tenant`: `_user.awaiting_organization` is `true` and `_user.pending_invitation_id` names the invitation. The server used to resolve them as signed out while the page showed them signed in, so every request from the accept page looked like it came from another user. The page reloaded until it failed with "The server answered as a different user or organization than this page shows". Only an invitation to the app's own organization counts, a user who already holds a member row there signs in again instead, and the caller is still refused on every page that is not public.

- d8f2f6d: feat(server-dev): A smaller dev server agent surface, so an agent session starts on about half the tokens.

  Removed dev tools: `lowdefy_list_plugins`, `lowdefy_get_plugin_doc`, `lowdefy_overview`, `lowdefy_scaffold_page`, `lowdefy_checkpoint`, `lowdefy_revert_checkpoint`, `lowdefy_snapshot_state`, `lowdefy_load_state`, `lowdefy_list_state_checkpoints` and `lowdefy_checkpoint_to_mocks`. The config and state checkpoint stores, the `?_checkpoint=` URL and the dev mock registry go with them. Use git for config checkpoints, `list_types` for a type's package, and `get_doc` or `search_docs` for plugin docs. `lowdefy_restart` stays, hidden.

  Merged: `lowdefy_eval_operator` is now the optional `expression` argument of `lowdefy_inspect_state`. It takes the same `pageId`, `pathParams`, `source`, `user` and `data` arguments, and returns `{ value, errors, source, reads }`, where `reads` names the paths the expression read. A dev server older than this release answers `expression` with plain state and no value.

  Removed HTTP routes under `/lowdefy-docs` that only mirrored a tool: `app-map`, `checkpoints*`, `state-checkpoints*`, `eval-operator`, `run-request`, `run-endpoint`, `inspect-state`, `screenshot`, `plugins`, `schema`, `examples`, `search`, `icons`, `plugin-doc`, `content` and `:kind`. `build-status`, `journey`, `mutants`, `page-config`, `find`, `events`, `restart`, `mcp` and `GET /lowdefy-docs` stay.

  The MCP instructions shrink from 7,000 to at most 2,500 characters, and the dev server's `tools/list` to at most 25,000. The journey step grammar is served only by `lowdefy_get_schema` with `kind: "journey-step"`. Tool results are compact JSON, and `lowdefy_get_page_config` now answers `{ page }`, or `{ block }` with the new optional `blockId` for one block's subtree, writing a page over 40,000 characters to `pageFile` instead. `GET /lowdefy-docs/page-config` still returns the full page.

  fix(cli): `lowdefy mcp` logs each tool call to `tool-calls.jsonl` in the Lowdefy home: the tool, the app, the time, the duration and whether it worked, with no arguments or results. The file stays on your machine and rolls over at 1 MB. `lowdefy agent-setup` no longer repeats the dev server rules between AGENTS.md and the `lowdefy-config` skill. Tests hold the shim's `tools/list` for a current server to 40,000 characters.

- 12bb05c: feat(api, plugin-better-auth): Suspend a member in one organization without banning their login

  Two new auth steps, `SuspendMember` and `UnsuspendMember` (`memberId`, and optionally `organizationId`), suspend and restore a membership. A suspended membership keeps its row, app roles, org tier and attributes, so the app's own queries still find the person, but Lowdefy treats it as no membership. The person resolves unauthenticated on every protected page, request and endpoint, their MCP tokens stop working, and a pinned app refuses their sign-in with `MEMBERSHIP_REQUIRED`. Under `tenant`, `ListOrganizations` leaves the organization out and the organization endpoints refuse it. `BanUser` covers every organization and app sharing the auth database, so use this when someone should lose access to only one of them.

  The membership row stores the flag as `suspended: true` in `user-members`; rows without it are not suspended. Both steps need the new `member: [suspend]` permission, which `owner` and `admin` hold. An `owner` cannot be suspended (change their org tier with `UpdateMemberOrgRole` first), and a suspended member cannot be made an `owner`.

- 962ac05: feat(blocks-table): The Table cell details panel can load a cell's raw result on demand

  An enrichment or ai cell keeps the provider's whole answer as its raw result, often many times the size of the value, and the rows sent to the browser carried it for every cell although only the details panel shows it. The new `rawEndpoint` property names an API endpoint that returns one cell's raw result: rows can leave `_enrich.<key>.raw` out, and the details panel calls the endpoint with `{ rowKey, key }` when it opens a finished cell whose row has none, showing "Loading the raw result…" meanwhile and an error if the call fails. It loads again when the cell finishes a new run. A table without `rawEndpoint`, or a row that carries the raw result, works as before. TableLight names `rawEndpoint` as a Table-only property.

- f51a6cc: fix(blocks-table): The details panel, TableInput and openFilter fixes from the Table review

  - An app with a Table builds again. The date column filter imported `getOperatorLabel` from a file that had moved to `@lowdefy/helpers`, so the client bundle failed with "Could not resolve './getOperatorLabel.js'".
  - A raw result the details panel loads from `rawEndpoint` no longer offers to add its values as extract columns. Extract columns read the raw result from the row, which such rows leave out, so a column added that way stayed empty. The panel now says the result was loaded and shows it read-only. Switching the open panel to another cell no longer shows the previous cell's raw result for a frame.
  - TableInput names `rawEndpoint` as a Table-only property, as TableLight does, so a TableInput config that sets it fails the build with that message instead of accepting a property it never uses.
  - A condition `openFilter({ key })` asked to focus is dropped if it has not appeared after about a second, or when the builder closes. Before, the next plain click on Filter could focus that old condition. `openFilter` also preloads the builder, as hovering the Filter button does.

- Updated dependencies [31d7de8]
- Updated dependencies [dd5c2b1]
- Updated dependencies [61ae799]
- Updated dependencies [3cd6d62]
- Updated dependencies [b1d42ca]
  - @lowdefy/helpers@7.2.0

## 7.1.0

### Patch Changes

- d197cb4: fix(server-dev): Build status no longer says ok while a page fails to build

  The dev server builds each page when it is first requested, after the config build. `lowdefy_build_status` and `GET /lowdefy-docs/build-status` took their top-level `build.status` from the config build alone, so it read `ok` while a page failed, and the failure showed only in `pages.failed` further down. Agents that read the top line moved on with a broken page.

  `build.status` now reads `pages_failed` when the config builds but a page failed its latest build and has not changed since, and `build.failedPages` names those pages. A failed page that changed after that build is not counted until it is rebuilt, since its failure may already be fixed. Each page's errors stay under `pages.failed`. `error` still means the config build itself failed and the dev server is serving the previous build; it names no failed pages. `build.configStatus` is the config build's own status, and `lowdefy journeys harden`, which waits for a successful config build after an edit, reads it. `lowdefy_dev_status` reports the number of failed pages as `failedPageCount`.

  - @lowdefy/helpers@7.1.0

## 7.0.0

### Minor Changes

- b3ba6fb: feat: Tool endpoints know the calling agent with the `_agent` operator

  - **`_agent` server operator.** `_agent: id` returns the id of the agent that called the endpoint as a tool or hook, `_agent: conversationId` the chat's conversation id, and `_agent: true` both as `{ id, conversationId }`. On a call that did not come from an agent (a page request, an MCP tool call, a scheduled, webhook or auth hook run), it returns `null`, or the `default` when one is given, and never throws.
  - **Set by the engine, not the model.** The agent runtime puts the running agent on the tool endpoint's routine. Nothing in the tool's payload or the chat request can set or change it, so an app can record agent work apart from a person's.
  - **Inherited by nested calls.** Endpoints a tool endpoint calls through `CallApi` (including `detached: true`) or a connection's `callApi` see the same agent.
  - **Headless agents.** Tools an agent run by a `CallAgent` routine step calls see the agent with `conversationId: null`.

- 07a67b5: AI requests take `maxOutputTokens` and `timeout`, and a closed request cancels its model call.

  - `GenerateText`, `GenerateObject` and `Decide` take `timeout`: the milliseconds a model call may take, retries included, before it is cancelled. `Decide` also takes `maxOutputTokens`.
  - The `Anthropic`, `OpenAI`, `Google` and `AIGateway` connections take `maxOutputTokens` and `timeout` as defaults for every request and agent on the connection that does not set its own.
  - Request resolvers receive `signal`, which aborts when the request that started the work closes: when the server's request timeout (`config.requestTimeout`) answers first, or, on the Node server, when the client disconnects. The AI requests pass it to the model call, so a call that nobody is waiting for stops instead of running, and billing, to its end. A call stopped by the request timeout fails with a `ServiceError`. A call stopped because the client left fails with a `UserError`, which is logged as a warning.
  - Work that outlives its request is not cancelled with it: endpoints with `async: true`, detached runs, and agent chat turns, which still run to their end so `onFinish` hooks save the conversation. A `CallAgent` step is cancelled with the routine that runs it.

  A synchronous routine that kept running after its request timed out now has its AI calls cancelled at the timeout. Use `async: true` for work that takes longer than `config.requestTimeout`.

- 6d311c8: feat: AwsS3PutObject copies a file from a URL

  `AwsS3PutObject` takes a `url` in place of `content` and streams what that `https:` link answers into the bucket, so a routine can copy a file it is handed as a presigned link without the bytes passing through the routine as base64.

  - **Limits.** `maxBytes` (required with `url`) caps the copy: a `Content-Length` over it is refused before reading, and a body that passes it is cut off. `contentTypes` (such as `image/*`) limits what the link may answer with, and `timeout` (default 20 seconds) covers the whole fetch and upload.
  - **Refusals name their reason.** A refused copy stores nothing and throws an error whose `code` is `url_not_https`, `url_not_public`, `too_large`, `content_type`, `fetch_failed` or `timeout`, so a `:catch` can answer each its own way.
  - **Public addresses only.** The link, and every link it redirects to, must lead to a public address. Loopback, private, link-local (cloud metadata), unique-local, carrier-grade NAT, unspecified and multicast addresses are refused with `url_not_public`, checked on the address the connection opens to, so a name that resolves differently a second time cannot get past it.
  - **The link stays out of logs.** When the request fails, the error's `received` holds `[REDACTED]` in place of `url`, since a presigned link carries its signature. Request types name such properties in `meta.credentialProperties`, which plugin authors can use for any property derived from a secret.
  - **Return value.** `AwsS3PutObject` returns `{ bucket, key, size, contentType }`, with `content` as well as with `url`.

- 575a5ee: feat(blocks-basic)!: `ClickableHtml` fires only the events its `dataEvents` property lists.

  **Breaking:** a `data-event` in a `ClickableHtml` block's HTML now fires its event only when the
  block's new `dataEvents` property lists that event. A block without `dataEvents` fires no events
  from its HTML, and a click on an unlisted `data-event` does nothing and logs a console warning.
  Until now any `data-event` in the HTML fired the block event it named. HTML is often built from
  request or user data, and sanitising keeps `data-*` attributes, so the block now has the author
  say which events its HTML may fire.

  ```yaml
  - id: rows
    type: ClickableHtml
    properties:
      dataEvents:
        - onEdit
        - name: onDelete
          confirm: Delete this row?
      html: ...
  ```

  An entry is an event name, or `{ name, confirm }`. With `confirm`, every click on the event asks
  first whatever the markup says: `confirm: true` uses the element's `data-confirm` message or "Are
  you sure?", and a string is the message. Any `confirm` other than `false` asks, so an empty or
  missing message still asks, with the default message. Unlisted targets are no longer made keyboard
  focusable.

  To migrate, run `lowdefy upgrade`: the `clickable-html-data-events` codemod adds `dataEvents` to
  each `ClickableHtml` block and reports HTML built from data that inserts values without escaping
  them. `ClickableHtml` blocks that `Dynamic` content builds at page load, from config stored outside
  the app's files, need `dataEvents` added where that config lives. The docs now state that HTML
  built from user or request data must escape that data.

  `HtmlComponent` in `@lowdefy/block-utils` takes the list as its `dataEvents` prop, next to
  `onDataEvent`, and applies it inside popover content too.

- 460fdaa: feat(ai): New `Decide` request for typed AI decisions

  `Decide` asks typed questions about a state — pick one of these options (`choice` + `options`),
  is this true (`yesno`), where does this sit on a scale (`score` + `levels`) — and returns each
  answer in its declared shape with a confidence, so a routine can branch on
  `_step: triage.team.choice` and send a low-confidence answer to a person.

  - On the `AIGateway` connection it asks an evaluation model by default, such as TypeSafe's Jev
    (`typesafe-ai/jev`): a probability for every option in one pass, billed on input tokens only.
  - On every AI connection, `backend: structured-output` asks any language model for the same answers
    as schema-checked structured output.
  - An answer outside its question's terms (an option or level the question does not have, a yes/no
    that is not a boolean, or no answer) comes back with every field `null`, confidence and
    probability included, so a review gate on confidence catches it.
  - A `choice` option can be a name or an object with a `description` (other keys are ignored), so
    one intents file can serve as both the `IntentInput` block's `intents` and the question's options.
  - The build checks a routine against the questions it declares: a branch that compares an answer
    with a name that is not one of its options, or a `_step` reference to a question or field the
    step does not have, is a build error instead of a branch that never matches. Questions whose
    `options` or `levels` are built by an operator are not checked.

  The docs gain an AI Gateway connection page.

- f889c26: feat: dynamic blocks policies. Declare `policies.dynamicBlocks` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

  - `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
  - New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
  - New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
  - The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.

- 239a3a7: feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

  - **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
  - **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
  - **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
  - **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
  - **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
  - **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
  - **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A change to the HTML closes it without firing. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
  - **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.

- 49490b6: feat: in-app links and status tags in HTML.

  - **Links.** In any HTML string, `<a data-page-id="contacts" data-url-query="_id=42">` links to an app page: Lowdefy sets the `href` (with the app's `basePath`), and a plain click opens the page without reloading the app, like a `Link` action. `data-link` does the same for an existing app-relative `href="/path"`; a `data-page-id` or `data-link` that does not resolve to a page of the app is left as written. `data-new-tab` opens any link in a new tab (sanitising removes `target`, so `target="_blank"` never worked in HTML). The build warns when a `data-page-id` in page config or in an API endpoint names a page that does not exist, with a suggestion for a likely typo.
  - **Status tags and dots.** `<span data-tag="success">Approved</span>` renders a tinted tag and `data-status="warning"` a status dot, in theme colours that follow dark mode. Values are antd status names and preset colours, CSS colours, or any other value, which picks a stable colour. HTML tags look exactly like the ag-grid `tag` cells: both now use the same formatting code in `@lowdefy/block-utils`.
  - **Docs.** A new HTML attributes page describes every attribute HTML understands, and the Html block's schema, hazards and examples teach agents to use them instead of hard-coded hrefs and inline-styled pills.

- a79fb1d: feat: semantic icon names, and icons, tooltips and popovers in HTML.

  - **Semantic icon names.** Anywhere an icon name is accepted you can now write a name like `edit`, `delete`, `warning` or `external-link` (67 built-in names plus Ant Design spellings like `plus` and `setting`). They map to Lucide icons, so apps look consistent without picking a pack per icon. Add or override names with `theme.icons.aliases` in `lowdefy.yaml`, and list icon names that only exist at runtime under `theme.icons.include`. Existing React Icons names work exactly as before, and the build still bundles only the icons your config uses.
  - **Icons, tooltips and popovers in HTML.** Every block that renders HTML (`Html`, `ClickableHtml`, `DangerousHtml`, and HTML properties such as Tooltip and Card titles) understands `<i data-icon="edit"></i>`, `data-tooltip="Text"`, and `data-popover="id"` with a matching `data-popover-content="id"` element. Tooltips and popovers use the app's antd theme and load on first use. An open popover stays open with its new content when the HTML changes, as long as the new HTML still has its trigger. In `ClickableHtml`, `data-event` targets are now keyboard focusable (Enter and Space click them), and a `data-event` inside a popover fires and closes it.
  - **Icon fixes.** Icons no longer remount on every parent render, an icon that failed recovers when its name changes, and a clickable `Icon` block is keyboard focusable.
  - **Agents.** The dev server adds `lowdefy_search_icons` and `GET /lowdefy-docs/icons?q=`, and the agent setup files explain the icon and HTML conventions.

- 7bd38cb: Implement the `:while` routine control. A routine using `:while` now runs its `:do` routine repeatedly while the condition holds, instead of failing at request time with "Unexpected control" for config that built cleanly.

  The condition is re-evaluated before every iteration against the routine's current `state` and `steps`. Unlike `:for`, a `:while` loop does not index the step results of its body, so each iteration overwrites the previous one and `_step: my_step` reads the latest iteration's value. There is no iteration cap - a condition the body never falsifies loops forever, as it would in JavaScript.

- 9a92898: feat: `expect: { effect: true }` checks that the interaction before it did something

  A journey step `expect: { effect: true }` fails when the click, open, fill, select, press or back just before it ran no event, changed nothing on the page, called no request or endpoint and left the URL as it was. It must directly follow one of those steps, and `true` is its only value. Put it after a click on a control that should do something, so the journey fails while the control does nothing.

- e5b2f83: feat: A journey runs once per user in a `user` list

  A journey's `user` can be a list of data set user names, such as `user: [admin, member]`, on a journey with `data:`. `lowdefy test` and the `lowdefy_run_tests` MCP tool run the journey once as each user, each in a fresh database, and report each run on its own line as `<name> [<user>]`. `--filter` matches that name (`--filter "[member]"` runs one user's run), recordings and coverage see each run apart, and `--repeat` repeats each run. `as:` steps are unchanged: the first actor is the run's user.

  - A list holds distinct data set user names only and needs `data:`; `none` and inline user objects stay single values. Anything else is refused as an invalid journey file before a server starts.
  - `lowdefy test --lint` reads such a journey once, and L5 checks every listed name against the data set.
  - `lowdefy_run_journey` takes the same list and returns `{ passed, runs: [{ user, ... }] }`. `POST /lowdefy-docs/journey` still runs one user per call and refuses a list with a 400.
  - `lowdefy journeys variants` skips the role sets a journey's listed users already have, and a granted role variant's first comment names the user list to set on the original journey. The `journeys-harden` skill keeps a passing granted role variant by adding its user to that list and deleting the variant file, rather than committing a copy of the journey. A refused role stays a journey of its own.

- 9953932: feat(cli): Run journeys by popularity tier with `lowdefy test --tier`

  `lowdefy test --tier <common|wide|edge|full>` runs only the most-used journeys of a selection, ranked by their recent production use, so you can check the happy paths first (`common`) and widen to the edge cases real users still reach (`edge`) before calling a change done. Tiers are cut after paths, `--tag` and `--filter` narrow the suite, over that selection alone, and `--usage-window <n>m` (default `3m`) sets the calendar months the ranking reads. A journey with a list of users is tiered once and runs as each user. Journeys with no counts for their current steps run in every tier. A tiered run never records as the suite's run, and a selection with fewer than 100 journey matches in the window, or no evidence, is refused. `lowdefy_run_tests` takes the same `tier` and `usageWindow`.

  The `PASS` line shows a journey's tier, rank, rate and failures over the usage window: `PASS  member assigns an open ticket  (5 steps, 2100ms)  common #2 · 13.7/day · 14 failed (3m) · 11/12 mutants`, or `unranked` for a journey with no counts for its current steps.

  A journey with `deprecated: true` is skipped in every run, even when named by path or `--filter`, and listed as `SKIP deprecated` with its recent rate. A plain run that skips one still records as the full suite.

  `lowdefy journeys usage` selects journeys the same way as `lowdefy test`, so a persona filter such as `--filter "[admin]"` picks the same journeys in both. The AGENTS.md section and `lowdefy-config` skill that `lowdefy agent-setup` writes tell agents to run `tier: common` first and widen to `tier: edge` before calling a change done.

- 371a4a6: feat(build): Module agents need a signed-in caller by default

  In an app with auth configured, an agent a module ships is protected unless the module lists it under `auth.agents.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module agent stays protected where an app agent would be public, so installing a module never lets signed-out callers run an agent, spend model calls and run its tools unannounced. Roles in `auth.api.roles` apply as before; without app auth nothing changes. A public agent's tool endpoints keep their own access, and an agent listed under a module's `auth.api.public` is refused with a message that names `auth.agents.public`.

- c6b598a: feat(build): Module endpoints need a signed-in caller by default

  In an app with auth configured, an API endpoint a module ships is protected unless the module lists it under `auth.api.public` in its manifest, or the app makes it public with `auth.api.public: true` or a `public` list that names it. With no `auth.api` rule, or under a `protected` list that does not name it, a module endpoint stays protected where an app endpoint would be public, so installing a module never adds a public endpoint unannounced. This covers `InternalApi` endpoints and `CallApi` steps too: a public app endpoint, or a webhook without a `verify` gate, that calls a module endpoint is refused when the caller is signed out. Roles in `auth.api.roles` apply as before, and a module webhook endpoint must still be listed in the app's `auth.api.public`.

- aa510ca: feat(build): Modules ship websockets

  A module manifest takes a `websockets:` section with the same items as the app's top-level `websockets:`, so a module ships the change streams its own pages subscribe to and an app that installs it needs no websocket config of its own. Websocket ids are scoped to the module entry (`support/thread-messages`), a websocket's `connectionId` written with `_module.connectionId` resolves to the app's connection when the entry remaps it, and the app's `auth.websockets` rules match the scoped ids (`support/**`). In an app with auth, a module websocket is protected unless the module lists it under `auth.websockets.public` in its manifest or the app makes it public (`auth.websockets.public: true`, or a `public` list that names it), so installing a module never adds a public change stream unannounced. The new `_module.websocketId` operator resolves a module websocket's scoped id for page `subscriptions` and the `Subscribe`, `Unsubscribe` and `Publish` actions, with a `{ id, module }` form for another module's websocket or for app-level config.

- 959ec32: feat: The `_credential` operator keeps a runtime-made credential out of the server logs

  The log scrub only knew the secrets the server holds, so a value a routine made at runtime, such as a new API key or a secret derived with `_hmac`, printed in plain text at debug level in every `:set_state`, `:return`, step result and error `received` that held it. Wrap the value in `_credential` where it is made: it is returned unchanged, so the routine and its caller still get it, and every log line for the rest of that request shows `[REDACTED]` in its place, on the production and development servers alike. Marked values are also scrubbed from the request's Sentry events, and an endpoint run through a `CallApi` step with `detached: true` keeps the marks its dispatcher made. The development server still logs `_secret` values in full.

- 856e65d: feat: The `_hmac` server operator signs a string with a key

  `_hmac.sha256: { key, data }` returns the lower-case hex HMAC-SHA256 of `data` under `key`, and `_hmac.sha512` the HMAC-SHA512. Both read `key` and `data` as UTF-8 strings. Like `_hash`, it runs only on the server, so a `_secret` key never reaches the browser. The output of one call works as the `key` of the next, so a routine can derive a per-app secret from one root secret and sign a webhook body with it. A `_hmac` refusal is a config error reported without the operator's params, so a derived `key` is never logged.

- db99f9f: feat(client,engine): page lifecycle events for the browser tab, network and window

  Pages can now react to the browser instead of polling to notice that something
  changed while the user was away. Five new events can be defined on the first
  blocks of a page: `onVisible` and `onHidden` when the tab is shown or hidden, or
  the window regains or loses focus (coalesced over 300ms so a focus and
  visibility pair only runs the chain once, with `_event` carrying `visible` and
  `reason`); `onOnline` and `onOffline` when the browser reports the network
  connection was regained or lost (`_event` carrying `online`); and `onResize`
  when the window is resized, debounced by 200ms (`_event` carrying `width` and
  `height`).

  The listeners are attached once while the page is mounted and removed when the
  user navigates away, so they never trigger for a page that is no longer open,
  and none of them trigger on the initial page load. The action chains run
  non-blocking, like `onMountAsync`, so they never hold the page in loading.

- fa02e14: feat: Page subscriptions that wait for the Subscribe action

  - **`client.subscribeOnMount`.** A page subscription with `client.subscribeOnMount: false` is declared on the page but does not open when the page mounts. The `Subscribe` action opens it, evaluating its `payload` at that moment, and `Unsubscribe` closes it. A widget on every page can then hold its channel only while it is in use. The default, `true`, keeps subscribing on mount.
  - **`Subscribe` with a changed payload replaces the channel.** Running `Subscribe` on an open subscription evaluates its payload again. When the payload changed, the channel is replaced and its `_websocket` state starts empty, and messages from the old channel are dropped. When it did not change, nothing happens, as before.

- 4f37391: feat: Webhook endpoints answer with the HTTP status their routine sets

  - **`:reject` takes `:status` and `:body`.** In a webhook endpoint, `:status` (400 to 499) sets the HTTP status and `:body` the body, sent as is. A `:reject` without `:status` answers 400 with `{ error: { code: 'rejected', message } }`.
  - **Through `CallApi`.** A `:reject` in an `InternalApi` endpoint the webhook calls sets the answer the same way, so the work can live in the called endpoint.
  - **Clear statuses for the rest.** A failed `ValidateSchema` step answers 400 (`invalid_request`, naming the failing path), a failed verifier 401 (`unauthorized`), and any other error 500 (`internal_error`) with nothing from the error. A successful routine still answers 200 with its return value.
  - **Build check.** `:status` and `:body` on a `:reject` in any endpoint other than a webhook or an `InternalApi` endpoint is a build error.

- 5d951af: feat: Webhook endpoints can answer with plain text

  - **`:return` takes `:content_type: text/plain`.** In a webhook endpoint, the endpoint answers `200` with the returned string as the body, `Content-Type: text/plain; charset=UTF-8` and `X-Content-Type-Options: nosniff`. This completes subscription handshakes that want the token echoed as text, such as Microsoft Graph's `validationToken` check.
  - **Strings only.** The returned value must be a string; any other value fails the run with the `500` answer.
  - **Build check.** `:content_type` on a `:return` outside a webhook endpoint, or with any value other than `text/plain`, is a build error.
  - A `:return` without `:content_type` answers JSON exactly as before.

### Patch Changes

- 14c4764: Coding agents now get their Lowdefy tools from `lowdefy mcp`, a stdio MCP server the agent client starts itself, instead of a dev server URL with a port in it. One checked-in `.mcp.json` entry works in every git worktree, the tools are there from the first moment of a session whether or not a dev server is running, and each call reaches the dev server of the app and worktree the agent is working in — pass `directory` when a repository holds several apps or a subagent works in another worktree. Every result starts with the app and checkout it came from.

  `lowdefy mcp` acts only on apps in the checkout the agent session started in and in the git worktrees of that repository. A `directory` anywhere else is refused with a message naming the session's checkout; when the agent client supports MCP elicitation, `lowdefy mcp` asks you first instead, and your answer holds for the session.

  Agents no longer run `lowdefy dev`, pick ports or kill processes. `lowdefy mcp` starts dev servers through the Lowdefy hub, a small per-user background process whose socket only your user can read and write: it gives each app its own port (4100 and up, kept across restarts), runs the app's own dev script so wrappers such as a secrets manager still apply, reports when the server is ready, and restarts it fully (clearing local plugin code) with `lowdefy_dev_start({ restart: true })`. It only ever stops servers it started — a `lowdefy dev` you run in a terminal is used by agents but never stopped by them. New tools: `lowdefy_dev_start`, `lowdefy_dev_stop`, `lowdefy_dev_status`, `lowdefy_dev_logs` (at most 1000 lines), `lowdefy_dev_list`; new commands: `lowdefy mcp`, `lowdefy hub status|start|stop|logs`. When several `package.json` scripts run `lowdefy dev`, set `cli.devScript` in `lowdefy.yaml` to the one the hub should use.

  The hub keeps few servers running, even when agents hand work to helper agents:

  - **Idle by last use.** The hub stops a server it started once nobody has used it for 15 minutes (any request through its port, or a build; status polls and long-lived event streams do not count) and no browser tab has it open, or once its worktree is removed. A stopped server starts again on the next `lowdefy_` call.
  - **Memory pressure.** When the operating system reports memory pressure (macOS and Linux), the idle limit drops to 5 minutes, or 2 at critical pressure, and a start that would take the hub past four servers first stops the idle ones.
  - **Start slots.** At most two dev servers launch at once across the machine (one at critical pressure); the rest queue in order. A start still queued after two minutes answers `queued` with its place, and calling `lowdefy_dev_start` again keeps it.
  - **Browser slots.** At most three headless browser operations (journeys, screenshots, state inspections, operator evaluations, state loads) run at once across the machine, whichever way they were called.
  - **Agents are told.** The `lowdefy mcp` instructions, and the AGENTS.md and skill that `lowdefy agent-setup` writes, tell an agent to stop the dev server of a git worktree it created when it finishes there, and that a server left running stops after 15 idle minutes.

  Rerun `lowdefy agent-setup` to switch a project over: it replaces the `lowdefy-docs` entry (`http://localhost:<port>/lowdefy-docs/mcp`) and other per-port entries such as `lowdefy-3010` in `.mcp.json` with one `lowdefy` server, and updates the skill and `AGENTS.md` section it wrote before. The `--port` option of `agent-setup` is gone; nothing it writes names a port any more.

  `lowdefy dev` changes:

  - A running dev server records itself in `.lowdefy/instance.json`. A second `lowdefy dev` for the same app exits before it touches `.lowdefy/dev`. A record copied into another git worktree, or left by a killed dev server whose process id has been reused, is ignored. `lowdefy test` runs against an already running dev server.
  - A port you set — `--port`, `PORT` or `cli.port` — is used or the command fails. It no longer moves to the next free port and hands you a server on a port you did not expect; only the default port 3000 still does.
  - `/lowdefy-docs/*` and `/api/dev-inspect/*` refuse requests a browser makes on behalf of another website, so a page you visit can no longer drive the dev tools (run requests and endpoints, load state checkpoints) on your machine. Agents, curl and the dev app's own pages are unaffected.

  Also fixed: CLI error reports were sent to Lowdefy even with `--disable-telemetry` or `cli.disableTelemetry` set. They now respect the opt-out.

- 7c4879b: feat: Expose antd 6 options on the overlay, feedback, layout and file blocks.

  The overlay, feedback, layout and upload blocks now expose the antd 6.6 features that fit
  declarative config, and several properties that silently did nothing now work.

  **Modal, ConfirmModal and Drawer**

  - `mask` also takes an object: `enabled`, `blur` (blur the page behind the dialog) and `closable`.
    `maskClosable` still works and is folded into `mask.closable`.
  - `closable` also takes an object: `disabled` shows the close button disabled; on Drawer,
    `placement: end` moves it to the end of the header.
  - New `focusable` object (`trap`, `focusTriggerAfterClose`; ConfirmModal adds `autoFocusButton`).
  - New `keyboard` (Modal, ConfirmModal) and `scrollLock` (Modal, ConfirmModal).
  - New `loading`, `destroyOnHidden` and `forceRender` (Modal, Drawer).
  - Modal: responsive `width` object (`xs` to `xxl`), `afterOpenChange` event with `{ open }`, `title`
    cssKey. The `afterClose` event it already fired is now documented.
  - Drawer: `size` (`default`, `large`, a number or a CSS length), `resizable` with `maxSize` and an
    `onResizeEnd` event with `{ size }`, html `title`, `title` cssKey, and `open` on the
    `afterOpenChange` event. The `getContainer` property it already passed to antd is now documented:
    `false` renders the drawer in place, a CSS selector mounts it in the matching element.
  - ConfirmModal: `okButton` and `cancelButton` document their button properties, including
    `iconPlacement: end`.

  **Message and Notification**

  - Notification: `showProgress`, `pauseOnHover`, `closable`, `role`, the `placement` values `top`
    and `bottom`, and `title`, `description`, `actions` and `progress` cssKeys.
  - Notification: the `button` now closes the notification when clicked, as documented.
  - Message: `pauseOnHover` and an `onClick` event.

  **Tooltip and Popover**

  - `arrow` (`false` hides it, `{ pointAtCenter: true }` centres it), the `contextMenu` trigger, and
    `{ open }` on the `onOpenChange` event.
  - Popover: `destroyOnHidden`, html `title`, and the `width` and `minWidth` theme tokens.
  - Tooltip: `destroyOnHidden`, the antd 6 name for `destroyTooltipOnHide`, which still works.

  **Flex, Masonry, MasonryList, Splitter and ConfigProvider**

  - Flex: `orientation`, the `medium` gap preset, and the `start`, `end`, `left`, `right`, `normal`,
    `self-start` and `self-end` alignment values.
  - Masonry and MasonryList: `item` cssKey and responsive `gutter` objects.
  - Splitter: `collapsible` (`motion`, custom `icon.start` and `icon.end`), `destroyOnHidden` (also per
    panel), `draggerIcon`, the `onDraggerDoubleClick` event with `{ index }`, and `panel`, `dragger`,
    `draggerIcon` and `collapseIcon` cssKeys. Panel `collapsible` objects document `start`, `end` and
    `showCollapsibleIcon`. The default collapse arrows are now the `chevron-left`, `chevron-right`,
    `chevron-up` and `chevron-down` icons, so they follow the app icon set.
  - ConfigProvider: `virtual`, `popupMatchSelectWidth`, `popupOverflow`, `wave` and the `medium`
    component size.

  **Upload, UploadDragger and UploadPhoto**

  - `showUploadList` also takes an object with `showPreviewIcon`, `showRemoveIcon` and
    `showDownloadIcon`.
  - Upload and UploadDragger: `directory` (upload a folder) and `listType` (`text` or `picture`).
  - Upload and UploadPhoto: `pastable` (upload files pasted on the page).
  - UploadDragger: `openFileDialogOnClick`, for a drop or paste only area.
  - UploadPhoto: `capture` (`user` or `environment` camera on mobile) and `listType`
    (`picture-card` or `picture-circle`).
  - Upload documents `iconPlacement` on its `button`.

  **Fixes**

  - Notification status icons lost their colour on antd 6.6; the colour class now reaches antd's icon
    wrapper. Notification passes `actions` instead of the deprecated `btn`.
  - Modal and ConfirmModal no longer pass the deprecated `maskClosable`, Tooltip no longer passes
    `destroyTooltipOnHide` or the removed `arrowPointAtCenter`, Popover no longer passes
    `overlayInnerStyle`, and Splitter no longer passes `layout`. The Lowdefy properties keep working.
  - The Modal `content` cssKey and the Tooltip `inner` cssKey styled nothing, because antd 6 renamed
    those parts to `container`. Modal `header`, `footer` and `content` styles were not passed.
  - The Popover `inner`, `title` and `content` cssKeys were never wired.
  - ConfirmModal ignored `theme` and never fired its `onClose` event.
  - ConfigProvider ignored its `theme` property; it is now merged into the design tokens, with
    `token` taking precedence.
  - ConfigProvider `componentSize: middle` and Flex `gap: middle` now reach antd as `medium`, the
    name antd 6 uses.
  - Corrected documented defaults and descriptions: Drawer size (378px), Message duration (3s) and
    status (`success`), Popover placement (`top`) and hover delays (seconds), Masonry `fresh`, and
    the Flex theme tokens (the gap preset tokens `paddingXS`, `padding` and `paddingLG`).
  - The MasonryList docs page linked to the antd List component instead of Masonry.
  - Message and Notification `theme`, Notification `top` and `bottom`, and Masonry and MasonryList
    `sequential` never had an effect. They stay valid, and their descriptions now say so: set
    Message and Notification tokens app-wide under `theme.antd.components` in `lowdefy.yaml`, and
    move notifications with the `--notification-top` and `--notification-bottom` CSS variables on
    `.ant-notification`.

- 660157b: Add app events. The `events` object at the root of `lowdefy.yaml` takes `onInit` and `onInitAsync` actions that run once each time the app loads in the browser, whichever page opens first, and do not run again on navigation. The app `onInit` runs before the first page's own events and keeps the page in its loading state until it finishes, so a page's `onInit` can read the global values it set. The app `onInitAsync` runs after it without blocking the page, and pages re-render when it sets global values. Use them to set up `global`, for example user settings fetched with `CallAPI`. App events run outside any page, so the build fails if one uses a page-scoped action (`SetState`, `Request`, `Validate`, `Reset`, `CallMethod`, ...) or operator (`_state`, `_input`, `_request`, ...). Errors display and log like page event errors, run the `catch` actions, and do not stop the page from loading.

  Closes #815.

- db1a4d3: fix(client): Keep browser storage per app and clear user data at sign-out

  Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

  Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches. It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

  Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.

- 04077d9: fix(build): Check that CallMethod actions target a block on the page

  A CallMethod whose `blockId` did not exist on the page failed at runtime with `Cannot read properties of undefined (reading 'methods')`. The build now warns when a static CallMethod `blockId` names no block on the page (an error in production builds), pointing at the action's config location. A concrete list row such as `list.0.input` matches the configured `list.$.input` block, and pages with Dynamic blocks are not checked because their blocks are only known at runtime. The check can be suppressed with `~ignoreBuildChecks: [callmethod-refs]`. At runtime, a `blockId` produced by an operator that names no block now fails with `block "<id>" does not exist on this page`. Fixes #1176.

- fd3c3aa: `lowdefy_build_status` takes `wait: true` (`GET /lowdefy-docs/build-status?wait=true`): it answers once the dev server has processed your latest edits — the rebuild or page invalidation they trigger, and any server restart or plugin install they need (a new connection type, a new plugin package, a `.env` change) — instead of with the build before them. After `lowdefy_restart`, the same call waits for the restarted server to be ready. One call returns the result of the edit the agent just made, with no polling. It waits up to a minute and says `settled: false` if it gives up. The MCP instructions, `lowdefy agent-setup` guidance and docs tell agents to call it this way after every edit.
- 24383b5: Add `lowdefy test`, which runs an app's config tests: the journeys committed in `tests/journeys/*.yaml`. Each journey names a page, an optional inline user object and a list of declarative steps (`click`, `fill`, `select`, `press`, `wait`, `screenshot`, `expect`). The command boots the development server headless on a free port (or targets a running one with `--url`), runs every journey through `POST /lowdefy-docs/journey`, prints `PASS`/`FAIL` per journey with the failing step's index, `expected` and `actual`, and exits `1` when any journey fails. `--filter <name>` narrows the run. Journey files are validated against a schema; an invalid file is reported as a failed journey without aborting the run.

  - **Journeys fail at the step that causes an app error**: an action that fails with an error that is not a user error, an uncaught exception or an error the page reports, a request or endpoint that throws on the server, or a 5xx from one. Errors raised while the first page opens (its `onInit` and `onMount` requests) fail the journey on open. `lowdefy test` prints the step and each error's kind, message and config file and line; the journey route's result carries them as `failure.errors`, each with a stable finding key. Only errors a journey's own browsers cause count, and they are reported in its result, not in the dev server's build status or event stream. Expected outcomes never fail a journey: a failed `Validate`, a `Throw` action or any other user error, and 401 or 403 refusals. Where an error is the outcome the app means, assert it with `expect: { error: <text> }` straight after the interaction that raises it: it claims that interaction's errors whose message contains the text, and fails when none does.
  - **Every reference is checked before its step runs.** A blockId, request, endpoint or `goto` page the step names that is not in the app's build, or an `as` name that is not a data set user, fails the step naming the unknown id.
  - **`wait: { request }` waits for a fresh call**: one started since the last interaction (or since the page opened, before the first). `wait: 3000` is shorthand for `wait: { ms: 3000 }`.
  - **The step grammar is a JSON schema**: `GET /lowdefy-docs/schema/journey-step/all` returns every step and `/lowdefy-docs/schema/journey-step/wait` one step, the `lowdefy_get_schema` MCP tool takes `kind: "journey-step"`, and `@lowdefy/node-utils` exports it as `journeyStepSchema`.

- 8c68631: feat: Opt-in Content-Security-Policy and no-store caching for pages and API responses

  - **`config.security.contentSecurityPolicy`.** Set `true` to send a Content-Security-Policy header with every app page, or an object with `reportOnly: true` to send it as `Content-Security-Policy-Report-Only`, and `directives` to add sources per directive (for example `script-src: ['https://www.googletagmanager.com']`). Sources are added to the default policy, never replace it. The build checks the option and writes the resolved policy to `build/security.json`. Off by default: without the option nothing changes.
  - **A nonce per render.** With the policy on, every page render draws a new 128-bit nonce. Lowdefy's inline scripts, the page config script, and every `<script>` and `<style>` element in `app.html.appendHead` and `appendBody` carry it, and antd's style tags take it through `ConfigProvider`. Styles allow `'unsafe-inline'`, since parts of antd (the modal and drawer scroll lock, text area auto size, watermarks) add styles that cannot carry a nonce.
  - **Dev server too.** `lowdefy dev` sends the same header, and allows the page's own websocket origin for hot reload.
  - **No-store responses.** HTML pages, `/api/page`, `/api/user`, `/api/request` and `/api/endpoints` (and `/api/root` in dev) send `Cache-Control: private, no-store`, so neither the browser nor a shared proxy stores them. Hashed assets under `/assets` keep their long-lived immutable caching.

- badaa49: Pages re-evaluate only the blocks whose inputs changed.

  Every change - a keystroke, SetState, a request completing - used to re-evaluate every block on the page. The engine now records what each block reads (the state paths, requests, globals and other values its operators read) and re-evaluates only the blocks whose reads changed. Values that change without notice - the clock, the URL, window size, randomness - keep their blocks evaluating on every update, exactly as before. On the docs app and a large production app, a keystroke evaluates 6-8x fewer blocks overall (from all blocks on a page to a handful), with identical output.

  - Every core operator declares how it reads (`tracking`); an operator without a declaration keeps its blocks evaluating every time, so third-party plugins keep working unchanged.
  - `_js` functions that use the clock, randomness or browser globals are detected at build and treated as always changing.
  - Set `config.dependencyTracking: false` in `lowdefy.yaml` to evaluate every block on every update as before.

- dda12e3: fix(api,servers): detached calls release the dispatcher at once. The `/api/detached` route awaited the target's whole routine before replying, and the dispatching invocation keeps itself alive (`waitUntil`) until that reply arrives — so every parent stayed in flight for as long as its detached children ran (a cron tick that answers in milliseconds was held open by its slowest dispatched job, keeping its instance's memory billed), and a chain of detached hops was a chain of nested in-flight requests. The route now answers `202` as soon as the call is authorized and runs the target after the response under its own `waitUntil` (new `acceptDetachedEndpoint` in `@lowdefy/api`); the outcome is logged as `detached_run_done` / `detached_run_failed`.
- 2ef077f: fix: `lowdefy dev` works with `config.basePath`, dev warns about inline page links, and the agent docs are complete

  - `lowdefy dev` now boots an app that sets `config.basePath`. The dev server used to answer `<basePath>/@vite/client` and the client entry with the page HTML, so the app never loaded. The app, its API and the `/lowdefy-docs` agent tools are all served under the base path (`/app/lowdefy-docs` for `basePath: /app`), and `.lowdefy/instance.json` records the URL with the base path, so `lowdefy mcp`, the hub and `lowdefy test` reach the dev server without extra setup. The dev server also reports itself ready and opens the browser at the base path.
  - `lowdefy dev` now reports the same warnings as `lowdefy build` for pages written directly in `lowdefy.yaml`: a `Link` to a page that does not exist, a `CallAPI` to a missing or `InternalApi` endpoint, websocket and dynamic block references, and `_state`, `_payload` and request state references. Before, only pages in their own `_ref` files were checked in dev.
  - `@lowdefy/docs-content` holds 20 pages it was missing, among them theming, blocks, page and app state, roles, auth configuration, websockets and notifications. The extractor now renders docs pages written as `_nunjucks` templates, and the content is regenerated from the current docs. The docs site's notifications, AxiosHttp and v3-to-v4 migration pages now show their `{{ ... }}` template examples instead of dropping them; the notifications page failed to render before.

- 588344b: feat: Dev tools build status and request runner report the config you just edited

  The dev server builds a page only when it is requested, so agent tools could answer from a page's previous build after an edit. They now tell the truth about pages built on request:

  **Build status (`lowdefy_build_status`, `GET /lowdefy-docs/build-status`)**

  - With `wait: true`, build status builds every page your edit touched before it answers, whether or not anything has opened the page since. A new `pages` section lists the pages it built (`checked`), the pages whose last build failed with their errors and source file (`failed`), pages changed on disk that the dev server has not rebuilt (`changedSinceBuild`), and how many pages nothing has built since the dev server started (`unbuilt`).
  - Browser and server errors carry the build they happened under (`buildId`). Errors reported before the latest config build or page edit are listed apart under `earlierErrors`, so errors that may already be fixed no longer read as live.
  - A build that fails with an internal error now reports the error's message, stack and the config file being resolved, instead of only "Build failed due to internal error. See above for details."

  **Request and endpoint runners (`lowdefy_run_request`, `lowdefy_run_endpoint`)**

  - `lowdefy_run_request` builds the page first when it changed since its last build, so it runs the request in the config now rather than the page's previous build. A page that fails to build is refused with its `buildErrors`, and a result from a page whose edit the dev server has not picked up yet carries a `staleConfig` note.
  - A response over 40,000 serialized characters is no longer cut to a string prefix. It is written in full to a JSON file under `.lowdefy/responses/` in the app directory, and the result carries `responseFile`, `responseChars` and, for an array, `responseItems`. The new `saveResponse: true` option writes any response there. Only the 20 most recent response files are kept.

- abb3f27: feat(server-dev): Every dev tool that acts as someone takes the same `user` option

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator`, `lowdefy_load_state`, `lowdefy_run_request` and `lowdefy_run_endpoint` now take `user` in the forms `lowdefy_run_journey` already took: a user object, `"none"` to act signed out, or the name of a user in a journey data set together with `data`. With a data set the call acts as that user and runs on a fresh database of its own loaded with the data set, as a journey with `data` does, so an agent can check a page, a request or an endpoint as a real user without hand-made cookies or scripts. `lowdefy_run_endpoint` keeps `system: true` as its only other form. Every tool description carries the same sentence explaining the option, and the `/lowdefy-docs` routes take the same `user` and `data` params.

- 73642f1: feat(dev): Screenshot viewport and colour scheme, smaller journey results, and Back, title and segmented-control steps for journeys.

  **Screenshots (`lowdefy_screenshot_page`)**

  - New `width`, `height` and `colorScheme: 'light' | 'dark'` options check a phone layout or dark mode, e.g. `{ "width": 390, "colorScheme": "dark" }`. The REST route takes them as `?viewportWidth=390&viewportHeight=844&colorScheme=dark`, since `width` and `height` there already name the clip.

  **Journeys (`lowdefy_run_journey`, `POST /lowdefy-docs/journey`, `lowdefy test`)**

  - A final page state over 10000 characters is no longer returned whole: the result carries `stateOmitted` with its size and each top-level key's size. A new `state` option picks what comes back: an array of state paths, `true` for the whole state, or `false` for none.
  - New `{ "back": true }` step presses the browser's Back button, and `{ "expect": { "title": { "equals" | "contains" } } }` checks the document title.
  - Segmented controls, radio groups and checkboxes are reached through their labels, so `click` by text and `select` by value work on a `SegmentedSelector`, `RadioSelector` or `ButtonSelector` option; before, the runner found the option's hidden input and timed out.

- 8d1ea50: `index.json` records, for each extracted doc, the docs source files it was built from and their hash, and the docs tests fail naming each doc whose source changed since the last `pnpm docs:content`. Before, only added, removed or moved pages were caught, so edits to an existing page could ship without the extracted docs agents read.
- d2c8e01: feat(api)!: Data read into a Dynamic block's `:return` stays data.

  **Breaking:** a Dynamic block without a dynamic blocks policy no longer renders blocks or actions that its endpoint read as data. In v6, stored operator-free block config returned from a Dynamic endpoint rendered as it was; in v7 the block renders its fallback. Every block and action in the returned content must be written in the endpoint's `:return` config. A block or action that is data an operator returned (a step result, routine state, the payload, a `:for` item, a nested endpoint's result), or a copy or extension of one made with `_get`, `__args` or `__object.assign`, fails resolution. Operators that only pass their checked params through (`_if`, `_switch`, `_if_none`, `_get`, `_args`, `_function`, `_log`, `_array`, and `_object` except `fromEntries` and `defineProperty`) may return written config; content that breaks the rule renders the fallback, with an error naming the operator and the path in its result. Blocks built up in routine state, returned by a nested endpoint, looped over with `_item`, or built by `_js`/`_jsonata` fail: build them inside `:return` with `_array.map`/`_array.concat`, share block config with `_ref`, and write client operators (`__state`, `_array.map` callbacks) in the `:return` config. Data may still fill values inside written blocks, as in the documented `_array.map` pattern, and a block built by config from a stored field renders even when it equals the field. To render stored or generated block config, put the Dynamic block under a dynamic blocks policy and return the content through a `ValidateDynamic` step. See the v6 to v7 migration guide.

  Also:

  - Only operator keys lose their escaping underscore in the returned content (`__state` becomes `_state`); data keys such as `__typename` pass through unchanged.
  - Data read into a Dynamic `:return` may nest at most 200 levels deep, and dynamic blocks policy content likewise (`limits.depth`); deeper data fails resolution with an error saying so.
  - An object from data that `_object.assign` merges with other config can no longer end up as an operator on the client, for example next to a key whose value is a function or evaluates to undefined.
  - Only keys that name one of the app's operators count as operators: in the literal data check an installed client or server operator, in dynamic blocks policies and the fragment build a client operator. Data such as `{ _score: 0.5 }` or `{ _source: { ... } }` now renders as data instead of failing. The build writes `plugins/clientOperators.json` with every client operator name the app knows.
  - Dynamic blocks policies: with `state` set, every `_state` read in the content must name a literal key under that path. URLs are judged by the block's properties schema, which now marks URL-valued properties with `urlKind` (`Search` `indexUrl`, `QRCode` `icon`, `Watermark` `image`, `Tour` step covers, avatar and logo sources, link `url`s and `href`s, `Img` `src`/`srcSet`, AgGrid link cells), whatever the property is called. Every value no schema marks is still judged by its key name; `urlKind: false` opts a URL-named property out (`Search` `result.url`, the Tiptap `image` settings). URLs are read as the browser's URL parser reads them, so surrounding spaces and embedded tabs or newlines do not change the verdict.

- 550be9f: feat(api,client,build): email one-time code sign-in, and the magic-link email carries the code

  Magic-link sign-in fails behind corporate mail security that opens links before the
  person does: the scanner follows the link, the single-use token is spent, and the
  click that follows is rejected. Apps can now offer a one-time code instead. Enable
  `auth.emailOTP` and the app emails a short code the person types into the tab they
  started from, which no link scanner can consume, and which also works when the email
  is read on a different device from the one signing in. Two new actions drive it,
  `EmailOtpSend` and `EmailOtpVerify`.

  With both `auth.magicLink` and `auth.emailOTP` enabled, the magic-link email carries
  the code as well, so one email serves both paths and nothing about the existing
  `Login` flow changes: the person clicks the button, or falls back to typing the code.

- a1367df: fix(engine): Resolve `$` row indices in Validate and ResetValidation blockIds

  `Validate` and `ResetValidation` matched blockIds literally, so `params: list.$.name` in a list row matched nothing and the validation passed without checking the row. The blockIds are now resolved from the action's array indices, the same way `SetState` and `CallMethod` resolve them, so `list.$.name` validates the `name` input in the row where the action ran. `regex` patterns are not changed, because `$` already means end of string there. The docs also now name the object param `blockIds`, which is the key the actions read. Fixes #927.

- 7c20d1b: feat: Events no longer bubble to the blocks around the block that handled them

  A click on a block inside another clickable block used to run the events of both, so a Button in a clickable Card also opened the card, and a Box in a List row also ran the row's `onClick`. Now a browser event runs only the innermost event that handles it: once a block with actions for the event fires, the blocks around it skip that same browser event. A block without an event for the interaction, like a Paragraph in the card, still passes the click on to the card. Only blocks on the browser event's own path skip it: events that blocks fire from effects, events of blocks inside the one that handled it, events from method calls, and events a block runs for its own machinery (a file upload's policy request, a table's row fetch) all still run.

  Set `bubble: true` on an event to also run the events of the blocks around it:

  ```yaml
  events:
    onClick:
      bubble: true
      try:
        - id: select
          type: SetState
          params:
            selected: true
  ```

  Inside AgGrid blocks, clicks on a cell's buttons, links, menus, inputs, selectors, switches or selection checkbox no longer trigger `onRowClick` or `onCellClick`. They only fire the control's own event.

  This changes behaviour for apps that relied on a nested click running both events: add `bubble: true` to the inner event to keep it. The `nested-event-bubbling` codemod in `lowdefy upgrade` adds `bubble: true` only where an outer event reads a value the inner event sets, moves AgGrid row-click state setup into the cell control events that relied on it, and lists the other nested events for review. Closes #1154.

- 6b3a9bb: feat!: Replace the NextAuth-shaped auth system with BetterAuth.

  Lowdefy auth now runs on [BetterAuth](https://www.better-auth.com) 1.7.7 through the new `@lowdefy/plugin-better-auth` package; `@lowdefy/plugin-next-auth` and `@lowdefy/plugin-auth0` are removed. Every app with an `auth:` block is affected — follow the migration guide at `/migration/auth-upgrade` in the docs.

  Breaking changes:

  - **`auth.database` is required** for any login method; sessions are database-backed only (`session.maxAge` → `expiresIn`, no JWT strategy). Collections follow the `user-*` convention fixed by the adapter and auth columns are stored in snake_case.
  - **Provider type names change** — `GoogleProvider`, `GitHubProvider`, ... become `Google`, `GitHub`, ...; `OpenIDConnectProvider` → `GenericOAuth`. Provider `id`s and `/api/auth/callback/<id>` URLs are unchanged. Built-in and `GenericOAuth` providers share one id namespace, so the build fails when a `GenericOAuth` `id` is the key of a built-in provider the app also configures. `GenericOAuth` takes `trustEmail: true` to mark its users' emails verified, for an issuer that sends no `email_verified` claim. An invalid provider property fails startup with the provider id and its config location.
  - **`auth.callbacks` / `auth.events` JS plugins are replaced by `auth.hooks`** — bindings to `InternalApi` endpoints fired in a system context. Verification identifiers carry a `magic-link:` or `auth-state:` prefix, which a `verification.create.before` / `after` hook matching on the identifier must allow for.
  - **`NEXTAUTH_SECRET` / `AUTH_SECRET` env vars are replaced by `auth.secret`** (use the `_secret` operator); pin the canonical URL with `BETTER_AUTH_URL`, or the `url` of the current environment in `config.environments`. With `auth.email` configured, a production server refuses to start (`ConfigError`) until one of them is set, since every emailed link is built from it; without `auth.email` it logs a warning. While unpinned, auth trusts only the origin the request arrived on, so behind a proxy that ends TLS and forwards plain `http`, sign-in is refused until the URL is pinned. The dev server uses the request origin.
  - **Built-in auth UI and `auth.theme` are removed** — the app provides its own pages via `authPages` (`signIn`, `signUp`, `error`, `forgotPassword`, `resetPassword`, `verifyEmail`, `twoFactor`, `twoFactorEnrol`, `acceptInvitation`). The emailed verification link from `SignUp` / `SendVerificationEmail` without a `callbackUrl` lands on `verifyEmail` (default `/verify-email`), with `?error=INVALID_TOKEN` or `TOKEN_EXPIRED` when it fails. The reset link from `RequestPasswordReset` without a `redirectTo` lands on `resetPassword` (default `/reset-password`) with `?token=`, or `?error=INVALID_TOKEN`. The build warns when the app sends these emails (`auth.email` with `emailAndPassword`) and the page is missing.
  - **`EmailProvider` becomes `auth.magicLink` + `auth.email`**, with branded auth emails sent over an SMTP connection.
  - **The session user shape changes** — `userFields` is removed; `_user` carries `id`, `name`, `email`, `image`, `email_verified`, `active_organization_id`, `profile`, plus `roles` (app roles from the active membership's `appRoles`), `org_roles` (the `owner`/`admin`/`member` tier), `attributes` (merged global + per-organization bag), `two_factor_enrolled` and `auth_method`. `name` and `image` resolve per organization, from the member row `UpdateUserProfile` writes, falling back to the user row. A caller awaiting an organization carries `has_pending_invitation` and, when there is one, `pending_invitation_id`. `_user.sub` is gone — `_user.id` is the internal id.
  - **Organizations are always on** — roles live on organization memberships; `auth.organizations` configures `pinned` vs `tenant` policy, invitations, the role catalog and the tenant wall that scopes connections by `organization_id`. `invitationExpiresIn` sets how long an invitation stays acceptable (seconds, at least 60, default 48 hours); an expired or cancelled invitation fails with code `INVITATION_EXPIRED`. Accepting an invitation does not switch a session already active in another organization. Organizations have no practical member cap (default 1,000,000); `membershipLimit` sets one, and an unpaged `ListMembers` returns every member.
  - **Retired client actions** — `ImpersonateUser`, `StopImpersonating` (no replacement); `InviteMember`, `CancelInvitation`, `UpdateMemberRole`, `RemoveMember`, `UpdateOrganization` are now auth steps run from routines.
  - **Signed-out requests no longer reveal page or endpoint existence** — protected apps answer sign-in for every URL and `401` for missing or protected requests alike.

  New in this line: two-factor auth (TOTP, backup codes, passkeys, `twoFactor.required` enrolment; id token sign-ins are challenged too unless the provider sets `twoFactorTrusted: true`, and `Login` with an `idToken` then navigates to `authPages.twoFactor`), phone number and captcha sign-in, the app as an OAuth 2.1 authorization server for MCP clients (`auth.oauthProvider`, scoped MCP tools), the `_organization` server operator and the `_build.authConfig` projection, and a self-service auth action catalog (`SignUp`, `PasskeySignIn`, `PasskeyUpdate`, `TwoFactorGenerateBackupCodes`, `SetActiveOrganization`, `AcceptInvitation`, `LeaveOrganization`, ...). Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the client address the server resolves; behind a reverse proxy, list the proxy in `config.trustedProxies`.

- eaa6517: feat(server-dev): Return contextual hazards from the dev MCP with schemas, docs and config lookups.

  `lowdefy_get_schema`, `lowdefy_get_doc` (by kind and type) and `lowdefy_find_config` (per match) now
  include `hazards: [{ id, message, see }]` — behaviours of a type that its schema does not show, such as
  `Html` stripping `<style>`, a closed `Modal` keeping its state, `_state` being `undefined` inside request
  properties, or the tenant wall injecting a `$match` into every `$lookup` of a request over a walled
  connection (`tenant-wall-lookup`, returned only when the request's connection is walled).

  Hazards come from two channels. Plugins declare type-attached hazards through `meta.hazards`: the build
  now carries them into `plugins/blockMetas.json`, request metas already ride along in
  `plugins/requestSchemas.json`, and operator packages can export a `./metas` module which the build
  writes to the new `plugins/operatorMetas.json`. Framework-level hazards ship hand-authored in
  `@lowdefy/docs-content/hazards.json`. Seeds: `Html`, `DangerousHtml`, `Modal` and `_js` carry their
  first hazards; the docs describe hazards and the `meta.hazards` plugin contract.

- b56bb7a: feat: Lowdefy apps as OAuth 2.1 authorization server for external MCP clients.

  The app's MCP endpoint gains an app-issued OAuth 2.1 envelope, so external MCP clients connect with app-issued bearer tokens.

  - One MCP address per deployment: `POST /api/mcp`, with RFC 9728 metadata at `/.well-known/oauth-protected-resource/api/mcp`. The resource URIs default to the current environment's `url` in `config.environments`. The organization a token acts in is chosen at authorization, not encoded in the address.
  - After login and before consent the authorization server sends the user to `auth.oauthProvider.postLoginPage` (required under the `tenant` organizations policy) to choose one of their organizations; the page runs `SetActiveOrganization` then the new `OAuthContinue` action. Consent is then per (client, user, organization), and every access token carries the choice as its `organization_id` claim — refresh grants keep it.
  - Scopes are `mcp:read`, `mcp:write` and `offline_access`, so clients get refresh tokens: access tokens last 1 hour, refresh tokens 30 days. A rotated refresh token is accepted again for two minutes, so several sessions sharing one sign-in can refresh together.
  - The `/api/mcp` route resolves the member from that claim, refuses a token whose grant no longer stands (consent deleted), and stamps `auth_method: 'mcp'` on the caller. A token whose user is no longer a member of its organization gets the `401` `WWW-Authenticate` challenge and cannot be refreshed, which sends the client back through authorization.
  - New `RevokeMcpGrant` auth step: an MCP tool built on it gives up the calling assistant's own grant, so the assistant's next call is challenged to reconnect — and to choose an organization again.
  - `mcp.endpoints` entries carry a `scope` (`mcp:read` | `mcp:write`); tools are listed and callable only when the caller's role gate and token scope both allow.

- 1d31a29: feat: Set MCP server instructions with `mcp.instructions`.

  The app's `mcp` block takes an optional `instructions` string, sent to MCP clients in the `initialize` result. Clients such as Claude Code place it in the model's system prompt, so it suits a short note on how the app's tools fit together. Clients may truncate long instructions, so keep it to a few lines.

- 09717e8: MongoDB driver errors become `ServiceError`s with a code and a hint.

  Every MongoDBCollection request now maps a driver failure to a `ServiceError` whose message names the collection and the operation, whose `code` is the MongoDB error code, and whose new `hint` says what to do about it — add `upsert: true` on a duplicate key, index the filter fields on a time limit, grant the database user a role on an authorization failure, and so on.

  The driver's raw message is no longer sent to the browser: it can quote values from the document that triggered the error. A `ServiceError`'s cause is now dropped when the error is serialized to the client, so the raw text stays in the server log, where the dev terminal prints it as `Caused by: MongoServerError: …` under the located error line.

- 6b4bd99: Runtime errors reach the agent feedback channel with their config source.

  - The dev server now collects server-side failures — request, endpoint, MCP and agent tool errors — into a ring buffer surfaced as `serverErrors` in `GET /lowdefy-docs/build-status` and the `lowdefy_build_status` MCP tool, beside `clientErrors`. Each entry carries the resolved yaml `source` and `config` path, plus `endpointId`, `requestId` and `pageId` where known (page request failures name the request).
  - MCP tool errors carry their config source (` (at file.yaml:line)`) and hint in dev. Unexpected tool-call failures now go through the server's error sink so they are logged with their source. Production keeps returning the bare message.
  - `_js` execution errors report the original JavaScript error (`ReferenceError: x is not defined`) instead of pasting the whole function source into the message.

- 2ffac21: fix: Clear antd 6 deprecation warnings from the block console.

  Four blocks passed props that antd 6.3.1 marks `@deprecated`, so every dev console carried
  `[antd: <Component>] ...` noise that crowded out real errors. The Lowdefy-facing property names
  are unchanged — `showArrow`, `destroyInactivePanel`, `mask` and `maskClosable` are still the
  app's API; only what reaches antd changed:

  - `PhoneNumberInput` now passes `popupMatchSelectWidth` instead of `dropdownMatchSelectWidth`.
  - `Collapse` now passes `destroyOnHidden` instead of `destroyInactivePanel`.
  - `Selector`, `MultipleSelector` and `PhoneNumberInput` no longer pass `showArrow`. antd shows the
    arrow by default, so `showArrow: false` now hides it by clearing the suffix icon.
  - `Drawer` now passes antd's object mask form, `mask={{ closable: ... }}`, instead of the
    deprecated top-level `maskClosable`.

  A new e2e spec, `e2e/tests/no-antd-deprecations.e2e.spec.js`, opens every page of the blocks-antd
  e2e app and fails on any `[antd` console message.

- b226c43: fix: Classify expected outcomes and faults consistently across the v7 runtime and build.

  A sign-in the auth server rejects - a wrong password, an expired or already-used link, a stale
  OAuth authorization query - was reported as an `ActionError`: logged in the browser, posted to
  `/api/client-error`, and logged again on the server at error level against the action's config
  location, while BetterAuth itself logged every 4xx as `ERROR [Better Auth]`. These are expected
  outcomes of user interaction, not app faults. Auth client methods now throw a `UserError` for a
  4xx (with `metaData.code` / `metaData.status` for `catch` actions to branch on), and the server
  owns BetterAuth's API-error logging so a rejected attempt is one warn line.

  The same rule was applied across the code new in v7:

  - New `AuthorizationError` (403): an authenticated caller refused by a request, endpoint, agent,
    websocket or auth-step gate is one warn line and a 403, not a `ConfigError` logged at error
    level with a 500 and a Sentry event. The agent and websocket gates now also return 401 to an
    unauthenticated caller. All three servers handle `AuthenticationError`,
    `TwoFactorEnrolmentRequiredError` and `AuthorizationError` the same way; `server` no longer
    reports each fault to Sentry twice.
  - A wrong HTTP method on an API route is a 405, not an error-level log and a 500.
  - Routine `:throw`, schema validation failures and a nested `CallApi` that ended in `:throw` are
    `UserError`s logged at warn, not error.
  - Config faults that were plain `Error`s are `ConfigError`s (unconfigured auth, mock user without
    auth, missing `auth.email`, unknown block type, ambiguous link targets, strategy secrets,
    tenant-wall refusals, storage post-policy fields, `_organization` / `_build.authConfig`
    misuse); invariant violations are `LowdefyInternalError`s (write-phase artifact checks, invalid
    routine, auth adapter contract); upstream failures are `ServiceError`s (websocket transport,
    JWKS fetch, BetterAuth 5xx, tenant preflight probes, SMTP only when the network failed).
    `ServiceError.isServiceError` also recognises AWS SDK `$metadata.httpStatusCode` and numeric
    5xx codes.
  - Build: agents, MCP endpoints, notifications, websockets, `CallAgent` / `RenderNotification`
    step references and organization client-action references collect every error instead of
    stopping at the first; `websocket-refs`, `dynamic-endpoint-refs`, `callapi-refs`,
    `callapi-internal-refs` and `icons` are valid `~ignoreBuildChecks` slugs; a plugin module that
    resolves but fails to load is reported instead of surfacing later as an unknown type (a plugin
    without an optional subpath such as `schemas` is not a failure); the deprecated
    `public/styles.less` check runs as a validation step rather than failing the write phase.
  - Errors revived from the wire keep their class for the auth gate errors, and the dev client
    revives serialized Lowdefy errors instead of flattening them to their message.

- de6a268: GitHub module sources in private repositories can now be fetched with an SSH key instead of a token. Set `GITHUB_SSH_KEY` to a private key, such as a read-only deploy key on the module's repository. When the GitHub API returns 401, 403 or 404 for a repository, the build fetches it with `git` over SSH using that key and GitHub's pinned host keys. Public repositories are still downloaded through the API, so apps that mix public and private modules work with a deploy key. Over SSH, the `ref` must be a tag, a branch or a full commit SHA, and the build machine needs `git` and `ssh`.
- fbc43dc: Headless agent captures now wait for the page's async lifecycle instead of only for initial requests.

  `lowdefy_screenshot_page`, `lowdefy_inspect_state`, `lowdefy_eval_operator` and `lowdefy_load_state` previously read the page as soon as its context existed and no request was in flight — which is true before `onMountAsync` has even started, so a page fed by an `onMountAsync` `Request` action was screenshotted and inspected empty. They now wait for `onInit`, `onInitAsync`, every block event (including `onMountAsync`), in-flight requests, and the first websocket message. A page that has not settled within the 15s timeout is still returned, now carrying `ready: false` and a note saying the result is a snapshot of an unsettled page.

- cb0acad: feat: Journey data set files and `lowdefy data list`

  Declare a journey data set in `tests/data/<name>.yaml`: committed `fixtures` keyed by connection id, named `users` (injected callers, no credentials), optional `indexes` in the `listIndexes()` shape, and an optional seeded `generate` block for background documents. Everything a data set loads is committed, so it is the same on every machine. `lowdefy data list` prints each data set with the documents it loads and the users it names.

  A data set can extend others with a top-level `extends: [<data set name>, ...]`. The named data sets' fixtures, indexes and users load first, in the order listed, then the file's own. A later fixture with an `_id`, an index with the same `key` or a user of the same name replaces the earlier one. `generate` stays per file: only the named data set's own `generate` runs, and its refs and `_id` checks see the extended fixtures. A set reached twice loads once, and a cycle or an undeclared name is refused.

  Journeys accept `data: <name>` and a data set user name as `user:`, and `lowdefy test` prints the data set a run used once, with its document count.

- 85b4c93: feat: `lowdefy agent-setup` installs a `journeys-autopilot` skill that builds and hardens an app's journeys on its own

  Start it once (in Claude Code, `/loop /journeys-autopilot`) from a shell that holds your app's secrets, and leave it running. It works alone, one dev server and one test run at a time, in its own git worktree, so your checkout and dev server are untouched. On an app with no journeys it first writes a data set with fixtures and a test user for each role and maps every page by role. On an app that already has a data set and journeys, it builds on your data set without editing it and counts your journeys as covered, never rewriting or duplicating them. It keeps a progress list in `tests/autopilot.yaml` and each cycle writes the journeys that matter most next: refusals and permissions, then writes, then the most-used pages, then edge cases. A journey is kept only after three clean runs and must check a value only the fixtures hold. Flaky journeys are quarantined with their cause, journeys that expose app bugs are kept as findings, and nothing is deleted or weakened to pass. When everything is covered it moves on to hardening. It keeps one pull request of journeys open at a time, resumes it from any machine, and stops adding to it at about 20 journeys until you merge it. Once those journeys merge, it fixes an obvious local app bug in a separate small pull request. It never merges or touches production or shared databases. Each cycle stops at a clean point, so it can be interrupted any time.

- 73c5e14: feat: `lowdefy journeys pull posthog` brings production analytics into local journey traces; `journeys evidence` and `journeys coverage` report how much real use backs each journey and what no journey covers yet.

  - `lowdefy journeys pull posthog [--since 30d | --from --to]` reads the app's PostHog project over the HogQL query API with your own personal API key (`POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PERSONAL_API_KEY` with the Query Read scope) and writes one day of interaction traces per file to `.lowdefy/traces/production/`. A window is at most 30 days. Final days are fetched once, today and yesterday again on every run, and files older than 400 days are removed. Person and organisation ids are hashed, and each clicked element's text is stored as a token (`target.text_token`), never as text, both with a salt that never leaves your machine; typed values, URL query values and element chains are never stored. Options: `--environment`, `--include-test-accounts`, `--org-property`, `--roles-property`, `--page-size`, `--max-rows` and `--refetch`.
  - Coverage and evidence turn a token back into text only when it is text from the app's config (the built pages, menus, i18n messages, block plugins' default messages and antd's locale strings, collected with one build by the installed dev server and cached until the config changes). A click on any other text (a customer's name in a grid cell) is read as its block, row and column with a `tokenised-text` flag, and a journey clicking a data value is backed exactly as one with no text. A day pulled under another salt, or with different filters (project, `--environment`, `--include-test-accounts`), is not mixed in: coverage and evidence name the days and the `--refetch` pull that makes them one set.
  - `lowdefy journeys evidence [--refresh]` counts, for each journey in `tests/journeys/`, the production sessions that did what it does, with people, organisations and failures. `--refresh` writes them into the journey's `evidence` key and changes nothing else in the file, and a hardening run's `.lowdefy/test/mutation.json` adds `evidence.mutation`. Journeys nothing backs are listed beside their mutation numbers and never removed.
  - `lowdefy journeys coverage --source production [--json]` reports interaction, flow, failure, frustration and role coverage, each with what is uncovered ranked by use, and writes them with a production profile to `.lowdefy/test/coverage.json`, which lists per block the clicks, distinct tokens and most-clicked tokens. Journeys with `deprecated: true` are left out of every measure. Sessions are grouped into flows only when the window holds 100,000 production rows or more; below that the summary points to the session logs (`--group` and `--no-group` force either way).
  - `lowdefy journeys session --source production` lists the pulled production sessions (`--since`, `--from`, `--to`, at most 30 days) and prints any one as a log, as dev sessions print: the controls used and what the app did, without typed values, and with clicked text only when it is config text.
  - With a recorded full test run, `journeys coverage` reports the interaction share that run drove beside the static one, and counts a failure as covered only when a journey that passed produced it (`failure.mode: measured`); without one it reports failures as reached. `lowdefy test` and `lowdefy_run_tests` keep which journeys passed in a recorded run in `.lowdefy/test/run.json`.
  - `lowdefy agent-setup` installs a `journeys-from-production` skill that runs the loop with you: it picks the window, pulls, reads each recorded routine with the app's config and code, takes one uncovered failure or flow at a time into a journey proven by three runs, then refreshes evidence. Running `lowdefy journeys usage --json` before and after the refresh, it reports the deprecated flows users still follow, the journeys whose tier changed and those still unranked. It commits nothing, never deletes a journey, and never reads production text or credentials or queries PostHog directly.
  - Journey files accept a strictly validated `evidence` key, and `lowdefy test` (and the `lowdefy_run_tests` MCP tool) print it after each passing journey: `412 sessions · 9 orgs · 11/12 mutants`.

  `@lowdefy/node-utils` exports `isBackedBy`, the one rule for whether a recorded segment did what a journey does, `profileProduction`, `listFailurePaths` and `failurePathKey`. `compileSegments` segments also carry their entry page, pages, failure path and frustrated clicks.

- 08f76bb: Heavy blocks load their code when they first mount.

  - `createLazyBlock` in `@lowdefy/block-utils` lets any plugin block load its implementation on first mount. A hidden block, or one in a closed panel, unopened tab or modal, never downloads it. The block's methods (declared in `meta.methods`) can be called from mount: calls made before the code arrives run in order once it loads, or fail with the usual error. Implementation modules are named `*.lazy.js`, and the production server prefetches them at low priority.
  - `AgentChat` is lazy. Its drawer launcher paints immediately, and a click before load opens the drawer when the chat arrives. Mermaid diagrams, code highlighting and LaTeX load only when a message uses them. `setInput` is now listed in the block's methods, and `renderLatex` works in the browser build.
  - `EChart` loads the charting library inside its own sized box, so pages paint without it and the layout does not move.
  - `HtmlComponent` no longer re-sanitizes and re-renders HTML that has not changed.

  No config changes.

- 1d547f3: The SMTP and SendGridMail connections now drop every recipient on the reserved `.invalid` domain (the domain `invalid` and any `*.invalid`, which RFC 6761 says never resolve) before the delivery filter runs. Case is ignored. Surrounding spaces and a trailing dot are ignored too. They are removed from `to`, `cc` and `bcc` on every send, in every environment, with no filter and with `filter: false`, and for auth emails too.

  Before, a `replaceAddress` catch-all redirected mail for test users (`user@audit.invalid`, say) into the team's inbox, so apps had to skip email for test users themselves. Now only the `.invalid` addresses are dropped and every other recipient still gets the mail:

  - SMTP checks each address in a comma-separated string on its own and keeps the others. SendGrid reads a string as one address, so it drops a comma-separated string only when every address in it is on `.invalid`.
  - When every `to` recipient is on `.invalid`, the remaining `cc` and `bcc` recipients still get the mail. SMTP sends it without a To header; SendGrid, which needs a `to` recipient, sends each of them their own copy.
  - When no recipient is left, nothing is sent and the send reports `{ messageId: null, to: null, filtered: true }`, as a fully filtered message does. Otherwise `replaceAddress`, `allowlist` and `regex` apply to the remaining recipients as before.

  Use `.invalid` for test users that must never receive mail, and `example.com` or `.test` for journey users whose mail a journey reads from the dev server's SMTP catcher.

- f33e96a: `lowdefy mcp` works in every project and worktree you open an agent session in, and one session can run the dev servers of several projects.

  - **Register once for every project.** `lowdefy agent-setup --user` adds the `lowdefy` MCP server to Claude Code's user scope, so every session has the Lowdefy tools — in a repository nobody set up, in a directory above several projects, anywhere. It needs no app. On Windows it registers `cmd /c npx ...`. A rerun whose add fails keeps your existing registration. Without Claude Code on your `PATH` it prints the entry for your agent client.
  - **Tools in a fresh worktree.** `agent-setup` writes `npx --prefer-offline --yes lowdefy@<version> mcp` into `.mcp.json`, pinned to the version of the CLI running agent-setup, so every app in a repository writes the same entry. A worktree nobody has installed yet still starts the server: npx serves the pinned version from the shared npm cache, offline, in under a second. agent-setup first runs the pinned version through npx and refuses one npm cannot serve, so a committed entry never leaves teammates without tools.
  - **Agents install what is missing.** When an app lists `lowdefy` in its `package.json` but its dependencies are not installed, `lowdefy_dev_start` answers with the install command and where to run it (for example `pnpm install` at the workspace root), instead of running a dev script that cannot start.
  - **Trust a repository once.** Approving an app outside the session's checkout offers **Always allow this repository**, which covers all of its git worktrees in every later session. Trust is per git repository and only comes from you: the question, or `lowdefy hub trust [directory]`, which runs only in an interactive terminal so an agent cannot run it. `lowdefy hub untrust [directory]` and `lowdefy hub trusted` manage the list.
  - **The MCP server is renamed `lowdefy`** (was `lowdefy-docs`), so its tools are `mcp__lowdefy__*`. Rerunning `lowdefy agent-setup` replaces the `lowdefy-docs` entry 6.x wrote in `.mcp.json` (an entry pointing at a `localhost` port; a `lowdefy-docs` entry pointing anywhere else is left as it is) and renames the server in `.claude/settings.json` and `.claude/settings.local.json`: in `enabledMcpjsonServers` and `disabledMcpjsonServers`, and in the `permissions.allow`, `ask` and `deny` tool rules (`mcp__lowdefy-docs__lowdefy_get_schema`, or `mcp__lowdefy-docs` for all its tools, become `mcp__lowdefy__…`), so tool approvals carry over. It also updates the name in the skill and `AGENTS.md` section it wrote, and `agent-setup --user` removes an old `lowdefy-docs` user registration. Update any other place that names `mcp__lowdefy-docs__` tools, such as hooks. The dev server's `/lowdefy-docs` routes are unchanged.
  - **Mixed Lowdefy versions.** When `lowdefy mcp` and the dev server it calls run different Lowdefy versions, a tool call either works or fails with the fix spelled out. `lowdefy mcp` adds the tools it does not know to the session's tool list, and shared tools follow the newest comparable server: a dev server on a newer Lowdefy version replaces their descriptions and schemas. Versions are compared only when both are releases or share a major, so an experimental build is never overridden by an older release line. The client is told to list the tools again. A successful call notes both versions once a session, and every failed call carries the note, with the pinned fix `npx lowdefy@<dev server version> agent-setup` for the agent to pass to the developer rather than run. A dev server `lowdefy mcp` cannot reach is reported with its URL.

- 5e6bed8: New dev MCP tool `lowdefy_check`: validates the whole app the way `lowdefy build` would, without building it — every page, including ones not yet opened in dev, and the checks `lowdefy dev` only warns about but a production build rejects (they come back as errors with `prodError: true`). Returns `ok` plus located errors and warnings. It runs in a separate process so it never disturbs the running dev server, and it writes nothing. Agents call it before saying a change is done, so "works in dev, fails the deploy" is caught in the session.

  `@lowdefy/build` gains the `validateOnly` build option (every validation runs, nothing is written) and a `check()` entry on `@lowdefy/build/dev`. It adds no new build rules: `lowdefy_check` reports exactly what `lowdefy build` already rejects.

- 3bebfd9: `lowdefy mcp` adds `lowdefy_run_tests`: it runs the app's journeys (`tests/journeys/*.yaml`, the same selection and runner as `lowdefy test`, with an optional name `filter`) against the app's dev server, starting it if needed, and returns a summary plus one result per journey — passed, or the failing step with what was expected and what happened. Agents can prove a change did not break anything without a shell, and turn the steps they verified with `lowdefy_run_journey` into regression tests.
- c1bb9a0: feat(build)!: `_operator` with a name chosen at runtime lists the operators it may call.

  **Breaking:** an `_operator` whose `name` is read at runtime (from state, a request, a payload or `__args`) now fails the build unless it lists the operators it may call in `operators`:

  ```yaml
  _operator:
    name:
      _state: aggregation
    operators:
      - _sum
      - _product
    params:
      _state: values
  ```

  The build bundles exactly the listed operators with the page (or the server), so the call works on a direct page load in production as it does in development, and `_operator` refuses any name not in the list. A listed operator allows all its methods; a listed method (`_number.round`) allows only that method. A literal `name`, and the literal branches an `_if` or `_switch` returns, need no list.

  The `_operator` docs name the property `name`; they showed `operator:` before.

  `_operator` also refuses a name with a method on `_operator` itself (`_operator.anything`), which would call it again with a name read at runtime and no list.

- 409c918: feat(operators-js): Add push, unshift, pop, shift, at, findLast, findLastIndex, flatMap and from to `_array`

  `_array` gains the array methods that were missing:

  - `_array.push` and `_array.unshift` add items to the end or start of an array.
  - `_array.pop` and `_array.shift` remove the last or first item.
  - `_array.at` returns the item at an index, with negative indices counting back from the end (`-1` is the last item).
  - `_array.findLast`, `_array.findLastIndex` and `_array.flatMap` work like their JavaScript counterparts.
  - `_array.from` creates a new array from an array, a string, or `{ length: n }`, with an optional callback that receives each item and its index. For example `_array.from: { on: { length: 3 }, callback: { _function: { __args: 1 } } }` gives `[0, 1, 2]`, and it can be combined with `_array.fill` to repeat a value.

  Like `_array.splice`, the methods that change an array (`push`, `unshift`, `pop`, `shift`) return the changed array rather than JavaScript's new length or removed item. Closes #1315.

- b368cfe: docs: page paths and path parameters

  A new Page Paths concept page covers the page `path` field: placeholders, quoting a path that starts with one, module prefixes, the home, auth and `404` page rules, how URLs are matched to pages and when two paths tie, the values other addresses take first, page instances, the security note and the build errors. A new `_path_params` operator page documents reading the values. `pathParams` is documented next to `urlQuery` on the `Link` action, the auth actions' callback targets, menu links, HTML `data-path-params` links, table and grid links, notification links, Dynamic page content payloads, agents and the `_js` and action plugin methods. The agent docs content is regenerated.

- 99fcb06: Document `:reject` vs `:throw` semantics in API routines: `:reject` is a reply, not an exception; `:try`/`:catch` never catches it, while `:finally` still runs. Use `:throw` for failures a `:catch` should handle. The `:try`, `:reject` and `:throw` docs pages and the API concepts page now state the rule, and the routine control types carry a `description` for tools to quote.
- 06a3a4a: feat(api)!: RenderNotification's landingPage names the page by id

  **Breaking:** `properties.landingPage` is now a page id (or `{ pageId, pathParams }`) instead of a page path. Change `landingPage: /notifications/link` to the landing page's id, for example `landingPage: notifications-link`. A value that names no page, such as a path, fails the step with a `ConfigError` that says to pass the page id.

  The step builds the landing URL path from the route table with `buildPagePath`, like every other notification link, so a landing page with a `path` gets the right URL.

- 588ca93: The build warns when `config.requestTimeout` is not shorter than the Vercel function's `maxDuration`.

  Vercel stops the function at `config.vercel.maxDuration` (60 seconds by default), so a request timeout that is not shorter never answers, and the calls a request left running, such as an AI model call, are not cancelled. The warning applies when the app sets `config.vercel` or the build runs on Vercel.

  The Vercel deployment and AI request docs also note that on Vercel only the request timeout cancels a model call: a client disconnect does not.

- 493a1e6: feat(dev): `lowdefy_screenshot_page` can capture an open dropdown, a date picker's calendar or a modal, and a page opened at a query string.

  - New `steps` option runs interactions after the page settles and before the capture, addressed by block id — the same steps as `lowdefy_run_journey`. A new `{ "open": "blockId" }` step opens the popup of any input (Selector, MultipleSelector, AutoComplete, DateSelector and the other pickers, Cascader, TreeSelector) and waits for it to show. Popups are drawn at the end of the page, so `fullPage` and `clip` captures include them. If a step fails, the screenshot is still returned, showing where it stopped, together with the failure.
  - New `urlQuery` option opens the page with query params, for pages that read `_url_query`.
  - `open` is also a journey step for `lowdefy_run_journey` and `lowdefy test`.

- effdeb3: Journey steps can reach controls that are not blocks. Wherever `click`, `fill`, `select`, `expect.visible` and `expect.text` take a `blockId`, they also take a target object: `{ blockId, row, column }` narrows to a grid row (zero-based, as displayed) or cell (by col-id), `text` names the interactive control with exactly that visible text, and `nth` picks among several matches. `text` on its own searches the page front-most layer first — an open dropdown menu, then an open dialog, then the page — so a confirm dialog's `Delete` is clicked over the grid's `Delete` cell buttons behind its mask. This makes grid cell buttons, confirm dialogs, modal footers and menu items addressable by `lowdefy_run_journey`, `POST /lowdefy-docs/journey` and `lowdefy test`. Unknown target keys are rejected before a browser opens, and a failed step names the target the way it was written (`block "grid" row 1 control "Edit" to be actionable`).

  A `click`, `open`, `fill` or `select` whose `text` or `containing` target has no `nth` must match exactly one visible element, or the step fails and says how to narrow it:

  ```
  Matched 3 controls with text "Delete" in the page; add nth: 0..2, or a blockId/row to narrow it.
  ```

  Expectations do not need one match: `expect.visible` passes when any match is visible and `expect.hidden` when none is.

- 2e757a2: feat(server-dev): Add the `lowdefy_restart` MCP tool and `POST /lowdefy-docs/restart` route so an agent can restart the dev server process itself (via a `build/.restart` sentinel consumed by the manager), and watch every local plugin `lowdefy.yaml` lists. Editing a local plugin rebuilds the config, so a new block, action, operator or request type is defined and a build a broken plugin failed clears once the plugin is fixed; editing a plugin with server-side types (connections, requests, server operators, agents, websockets, notifications, auth) also restarts the dev server instead of serving a stale module.
- cac0798: A rate-limited request (HTTP 429) is a `ServiceError` on every connection, not a `RequestError`.

  `ServiceError.isServiceError` treats a 429 like a 5xx: an external condition that passes with time, not a config fault. It reads the status where client libraries put it (`statusCode`, `status`, `response.status`, the AWS SDK's `$metadata.httpStatusCode`, or a numeric `code`), follows a retrying client's last error and the `cause` chain, and also counts AWS SDK throttling exceptions and timeouts (`TimeoutError`). The `ServiceError` reports the status as `statusCode` and keeps the service's `Retry-After` as `retryAfter`, which the server log records.

  A `:catch` or a client `catch` that checked for `RequestError` on a 429 now sees `ServiceError`. `_error: statusCode` is `429` in both cases.

- 7623c86: The server resolves each request's client address itself, and a new `config.trustedProxies` setting names the proxies it believes.

  - Auth rate limits (sign-in and sign-up: 3 attempts per 10 seconds per address), the session's recorded address and the captcha check use the address the server resolved, not the `X-Forwarded-For` header a client sent. A self-hosted server takes the address from the connection. Behind a reverse proxy, load balancer or ingress, every connection comes from the proxy, so list its addresses or CIDR ranges in `config.trustedProxies`; the server then reads `X-Forwarded-For` from the right, skips trusted hops and takes the first untrusted address. Without it every client shares the proxy's rate limits. The server logs a warning the first time a request carries `X-Forwarded-For` while `trustedProxies` is not set.
  - On Vercel the function entry `lowdefy vercel-output` writes takes the address from `x-real-ip`, which the platform sets on every request.
  - The production request and error logs record the resolved address as `client_address`.
  - `lowdefy build` fails when a `config.trustedProxies` entry is not an IP address or CIDR range.
  - In `lowdefy test` journeys, each actor keeps its own client address.

- 4a6cf77: The Vercel function `lowdefy vercel-output` generates stops a `GET` stream, such as an MCP client's notification stream, when its client disconnects, instead of reading it until `maxDuration`. Other responses, such as an agent run, still run to the end. Websocket upgrade requests now get the protocol and host from Vercel's forwarding headers, like every other request, so `context.origin` is the deployment's `https://` origin on websocket connections too.
- 7ab8964: fix(server): The server imports a Sentry SDK only when `SENTRY_DSN` is set and `logger.sentry.server` is not `false`, which takes about 100 ms off the start of an app that does not use Sentry. The Node server traces requests by default; the new `logger.sentry.serverTracing: false` makes it report errors only.
- 712d6ef: fix(server,cli): The Vercel function now starts the same way as the Node server. The function entry that `lowdefy vercel-output` generates skipped two startup steps that only ran on the Node server:

  - **Sentry**: server-side Sentry now runs on Vercel. Before, with `SENTRY_DSN` set every server error was logged but never reached Sentry; only browser errors did. Sentry is initialised before the app loads, follows the `logger.sentry` settings (`server: false`, `environment`, `tracesSampleRate`), and logs `Sentry enabled: server` on a cold start. On Vercel it reports errors only, with Sentry's light SDK (`@sentry/node-core/light`: no tracing, OpenTelemetry set-up or module loader hooks, which would add about 300 ms and 130 MB to each cold start), and with client reports off. Set `logger.sentry.serverTracing: true` to trace server requests on Vercel. The flush of queued events starts once the response closes and is handed to Vercel's `waitUntil`, so a request that captured nothing ends right after its response, and one that captured an error, or whose transaction tracing sampled, waits only for that upload. Without `SENTRY_DSN` nothing changes.
  - **Environment guards**: `config.environments.<name>.guards` are now checked again when a Vercel function starts, as the docs already said. A deployment whose runtime variables differ from the build's, for example one built with `vercel build` and deployed with `--prebuilt` or `--env`, now fails every request with the guard error instead of serving with the wrong variables.

  Both entries now share one startup module (`src/initServer.js` in the server), so they stay in step. Redeploy to pick it up; the function entry is regenerated on every build.

- f160307: fix(api): Websockets re-check their caller and close when it changes

  An open websocket now follows the session it was opened with. The server resolves the caller again from the connection's upgrade headers before every subscribe and at least once a minute. When the user signed out, the session ended, the membership was removed, the roles changed or the user switched organization, the server closes the connection with code `4401`. The client reconnects straight away, which authenticates afresh, and resubscribes as the current caller (a connection closed this way again within 30 seconds of opening reconnects with the normal backoff); a subscription that caller may not hold fails as it would on a freshly loaded page.

  Subscriptions now run the connection `read` check, as requests do: a connection with `read: false` refuses a `MongoDBChangeStream` subscription. A websocket type on a connection is checked unless its meta sets `checkRead: false`.

- Updated dependencies [f7fa621]
- Updated dependencies [099d412]
- Updated dependencies [6144814]
- Updated dependencies [db1a4d3]
- Updated dependencies [2595439]
- Updated dependencies [f9e483f]
- Updated dependencies [bfc6a00]
- Updated dependencies [b226c43]
- Updated dependencies [239a3a7]
- Updated dependencies [1766343]
- Updated dependencies [a34939d]
- Updated dependencies [e6302c6]
- Updated dependencies [aa6bb38]
- Updated dependencies [81bd4f0]
  - @lowdefy/helpers@7.0.0

## 6.1.0

### Minor Changes

- ea69869: feat(blocks-basic): add the `ClickableHtml` block. It renders sanitised HTML like `Html`, and additionally fires a named event when an element carrying a `data-event` attribute inside the markup is clicked: `data-event="onEditClick"` fires the block's `onEditClick` event, so a single block of markup can carry many clickable targets, each with its own action chain, without a block per button. The event object holds the element's other `data-*` attributes with snake_case keys (`data-record-id` → `record_id`). `HtmlComponent` in `@lowdefy/block-utils` now accepts an `onClick` prop.

### Patch Changes

- 6d6f8fa: feat: add the `_error` operator, which reads the error being handled.

  - **Inside a server `:catch`**, `_error` returns the error that sent the routine there: its `name`, real `message`, `code`, `statusCode` and `cause` chain. Values of the app's secrets in the message are replaced with `[REDACTED]`. It resolves to the innermost `:catch`, a `:finally` reads the error of the `:catch` around its `:try`, and each `:parallel` branch reads its own. A routine can now branch on the failure:

    ```yaml
    - :try:
        - id: get_customer
          type: AxiosHttp
          connectionId: crm
          properties:
            url: /customers
      :catch:
        - :if:
            _eq: [{ _error: statusCode }, 404]
          :then:
            - :reject: Customer not found
        - :throw: Customer lookup failed
    ```

  - **Inside a client `catch` action list**, `_error` returns the error that sent the event there. An error from the server keeps its `code` and `statusCode`, so a page can branch on a failed `Request` without an endpoint.
  - **Outside a catch**, `_error` returns `null`.
  - **`:throw` and `:reject` accept an Error as their message.** `:throw: { _error: true }` rethrows the caught error, keeping its class, `code` and `statusCode`; `:reject: { _error: true }` rejects with its message as the user would see it. Use `{ _error: message }` to send the real message to the user.
  - `code` and `statusCode` are read the same way for every connection: `code` is the error's own `code`, and `statusCode` the first number among its `statusCode`, `status` and `response.status`. A request error now carries both from the error its connection threw, and AxiosHttp sets both on a non-2xx response.

- Updated dependencies [6d6f8fa]
- Updated dependencies [6d6f8fa]
  - @lowdefy/helpers@6.1.0

## 6.0.0

### Patch Changes

- 082acec: chore: Bump `yaml` to 2.9.0, clearing vite's `yaml@^2.4.2` peer warning.
- 51c3008: feat: Endpoint execution controls for serverless deployments.

  - `config.vercel { maxDuration, memory }` in `lowdefy.yaml` flows into the generated Vercel function config (default stays 60s).
  - `async: true` on Api/InternalApi endpoints responds `{ accepted: true }` immediately and runs the routine in the background (kept alive via the platform request context; outcome observable through logs).
  - `detached: true` on CallApi steps fire-and-forgets the target through the new `POST /api/detached/<endpointId>` route (CRON_SECRET transport auth), running it in its own invocation with a fresh duration budget.
  - `webhook: true` on endpoints turns them into third-party webhook receivers on the standard `/api/endpoints` route: raw `{ body, query, headers }` payload, verbatim response body, system context — caller auth is the routine's first step. Non-webhook endpoints are unchanged.

- 596212a: feat: `lowdefy init-vercel` instruments an app for Vercel, plus a configurable request timeout.

  **`init-vercel`** now scaffolds a complete Vercel setup into `<config-directory>/deploy/`, so a v6
  Lowdefy app (Hono server + Vite client) deploys to Vercel as static assets on the CDN plus one
  Serverless Function:

  - `vercel.json` — serves the built client (`dist/client`, which includes the app's `public/` files
    via Vite's `publicDir`) from the CDN, sets the build command (`pnpm run build:client`) and output
    directory, rewrites all other requests to the function, bundles the runtime-read build artifacts
    via `includeFiles`, and caps the function with `maxDuration`.
  - `api/index.js` — a Node Serverless Function that `chdir`s to the deploy directory, builds a Web
    `Request` from the buffered Node request body, and runs the Hono app. (Vercel's Node runtime does
    not drain a lazily-read body stream, so a streaming adapter hangs on every request with a body.)
  - `vercel.install.sh` + `README.md`.

  **Request timeout.** `@lowdefy/server`'s `createApp` now bounds request duration with a `timeout`
  middleware, configured by a new **`config.requestTimeout`** (milliseconds) in `lowdefy.yaml`
  (default `30000`, `0` disables). This protects against requests that hang on an upstream call
  (database, SMTP, external API) running to the host's function limit — important on serverless
  platforms billed by duration. Agent streaming routes are exempt. `@lowdefy/build` adds
  `config.requestTimeout` to the schema.

  `createApp` also gains a `{ serveStaticAssets }` option (default `true`); the Vercel function passes
  `false` so the CDN owns static files and the function only handles dynamic routes. Docs updated
  (deployment/Vercel and the config reference).

- 16fdeb8: fix(client): Make the `Link` action honour `href`.

  `createLink` routes `href` to `newOriginLink`, but the action's `newOriginLink` in
  `setupLink.js` only ever read `url` — so `{ type: Link, params: { href: '/some/path' } }`
  navigated to the literal string `"undefined"`. The anchor renderer used for `Link` blocks
  (`createLinkComponent.js`) already prefers `href` over `url`; this brings the action to the
  same precedence, and `href` is used verbatim: no protocol added, no `urlQuery` appended.

  That verbatim handling is the point of having the parameter at all. `url` means an external
  address and gains an `https://` prefix when the value has no scheme, which turns a
  root-relative `/reports?id=1` into a request for a host named `reports`. `href` is how you
  link to a same-origin path, a fragment, or any address that must be passed through as
  written — so the fix removes the need to work around `url`'s prefixing.

  `href` was also missing from the `Link` action docs, which is presumably how the gap went
  unnoticed. Documented alongside the fix.

- 53a36ed: feat(actions): Link action accepts `replace` and `scroll`.

  A same-page `Link` that only reflects state into the `urlQuery` no longer has to jump the page to
  the top or push a history entry per click: `scroll: false` keeps the current scroll position and
  `replace: true` swaps the current history entry instead of pushing one. The router and the `<Link>`
  block component already supported both; the Link action's same-origin path now forwards them too.

- Updated dependencies [6446ae6]
  - @lowdefy/helpers@6.0.0

## 5.6.0

### Patch Changes

- 8306262: feat(blocks-aggrid): Add `AgGridLowdefy`, upgrade to AG Grid v33, and theme every grid through the Theming API.

  **Two new blocks.** `AgGridLowdefy` (display) and `AgGridLowdefyInput` (input) are grids themed from the app's antd design tokens — primary colour, surfaces, fonts and radius — so they look like they belong in a Lowdefy app and follow light/dark mode automatically, with no configuration and no separate dark block. They take a `size` property (`small | middle | large`, default `middle`) mirroring antd Table's densities, which sets row and header height to 36 / 44 / 54 pixels. Everything else — properties, events, methods, cell renderers — is identical to the existing grids.

  To adopt, change `type: AgGridBalham` to `type: AgGridLowdefy` (or `type: AgGridInputBalham` to `type: AgGridLowdefyInput`). Every property carries over unchanged and the grid will deliberately look different afterwards. It is a visual opt-in, so there is no codemod.

  Note that `size` loses to an explicit height: `rowHeight` and `headerHeight` are AG Grid grid options, and a grid option beats the theme parameter `size` sets. Setting `size: large` alongside `rowHeight: 30` gives 30 pixel rows under a 54 pixel header — use one or the other.

  **AG Grid v33.** The package moves from `@ag-grid-community/*@32` to `ag-grid-community` + `ag-grid-react@33.3.2`, with `AllCommunityModule` registered explicitly. The Theming API is v33's default and class-based file themes are gone, so no block imports AG Grid CSS any more.

  **The Balham, Alpine and Material blocks change appearance slightly.** They are kept indefinitely with the same API and the same names, but they now render AG Grid's prebuilt Theming API equivalents of those themes, with the antd colour mapping carried across as theme parameters. No config change is needed. What shifts:

  - Spacing and header weight move a little — Balham rows go 28px to 29px, cell horizontal padding tightens on Balham and Alpine, the wrapper corner radius now comes from each theme (Balham 2px, Alpine 3px, Material 0) rather than a uniform 6px, and Balham's header weight goes from 600 to bold. Icons come from each theme's own SVG set, so glyph shapes differ from the old icon font.
  - Row height now tracks the app's antd font size on Balham and Material, because v33 derives it from the data font size. It was font-size-independent before. The height only moves once the font size passes the theme's icon size (16px on Balham, 18px on Material), so at antd's default 14px nothing changes — you will see it at 18px or 20px. Alpine is unaffected at any font size.
  - Four colours are re-pointed: row hover is a neutral fill rather than a primary tint, borders are lighter, the checkbox outline tone changes, and popup shadows are softer.
  - Zebra striping, fonts and overall row density are preserved.

  **A new `themeParams` property, on all eight blocks.** `themeParams` takes AG Grid Theming API parameter names and merges them onto the block's theme — the recommended way to retint a single grid:

  ```yaml
  - id: my_table
    type: AgGridLowdefy
    properties:
      themeParams:
        headerBackgroundColor: '#1a1a2e'
        headerTextColor: '#e0e0ff'
        borderColor: var(--ant-color-primary)
  ```

  Values are CSS strings and may reference antd tokens. Neither Lowdefy nor AG Grid validates parameter names, so a misspelled key is a silent no-op — check spelling against AG Grid's theming parameter reference.

  Overriding `--ag-*` variables through a block's `style` — the documented `custom_theme` technique — **still works**; the Theming API honours an ancestor's declaration by design. The one caveat is that v33 renamed or folded away a number of the v32 `--ag-*` variables, and an override naming one of those is now a silent no-op. `--ag-header-foreground-color`, which appears in the documented example, is the case to watch: it is now `headerTextColor` (`--ag-header-text-color`). The AgGrid docs page carries the mapping table.

  **One deprecation warning existing apps may see.** `rowSelection: multiple` / `single` is deprecated in v33 in favour of `rowSelection: { mode: multiRow }` / `{ mode: singleRow }`. The string form still works. If you migrate it, three things must move together:

  - **Set `enableClickSelection: true`.** The string form defaults click-to-select on; the object form defaults it **off**. A bare `{ mode: singleRow }` silently stops clicking a row from selecting it, and `onRowSelected` / `onSelectionChanged` stop firing. The object form is not equivalent without this.
  - **Move the colDef flags in the same edit.** `checkboxSelection` and `headerCheckboxSelection` on a column become `rowSelection.checkboxes` and `rowSelection.headerCheckbox`. v33 only supports `headerCheckboxSelection` alongside the _string_ form, so migrating one without the other breaks the header checkbox.
  - **Six sibling options are read only in the string branch and are silently lost on migration:** `suppressRowClickSelection`, `suppressRowDeselection`, `rowMultiSelectWithClick`, `groupSelectsChildren`, `groupSelectsFiltered` and `isRowSelectable`. All six are deprecated in favour of `rowSelection.*` — move any you use across.

  **Dark-mode apps now get dark browser chrome throughout (`@lowdefy/client`, `@lowdefy/server`, `@lowdefy/server-dev`, `@lowdefy/server-e2e`).** `color-scheme` is now set on `<html>` from the resolved dark-mode state — in the client's dark-mode effect and in each server's pre-hydration inline script, so first paint matches too. Native scrollbars, `<select>` dropdowns, date pickers and autofill backgrounds render dark in a dark app, inside grids and everywhere else. This is an app-wide behaviour change, well beyond AgGrid, and it is what lets the grid's own scrollbars follow dark mode. Apps pinned to light with `theme.darkMode: light` are unaffected, including on a dark OS. Apps that leave `theme.darkMode` unset get the default, `system`, so on a dark OS they resolve to dark and do pick up `color-scheme: dark` — set `theme.darkMode: light` if that is not wanted.

- Updated dependencies [3ead269]
- Updated dependencies [79bbd84]
- Updated dependencies [824f4be]
- Updated dependencies [824f4be]
- Updated dependencies [3ead269]
- Updated dependencies [1a6223f]
- Updated dependencies [3ead269]
  - @lowdefy/helpers@5.6.0

## 5.5.1

### Patch Changes

- @lowdefy/helpers@5.5.1

## 5.5.0

### Patch Changes

- @lowdefy/helpers@5.5.0

## 5.4.0

### Patch Changes

- Updated dependencies [25225ab]
- Updated dependencies [f11addd]
- Updated dependencies [0108f38]
  - @lowdefy/helpers@5.4.0

## 5.3.0

### Patch Changes

- @lowdefy/helpers@5.3.0

## 5.2.0

### Patch Changes

- @lowdefy/helpers@5.2.0

## 5.1.0

### Patch Changes

- af8ef77cb: feat(operators-js): Add `_user.hasRole`, `_user.hasSomeRoles`, and `_user.hasAllRoles` methods to check user roles against the `user.roles` array. `hasRole` takes a single role string; `hasSomeRoles` and `hasAllRoles` take an array of role strings. All return a boolean.
  - @lowdefy/helpers@5.1.0

## 5.0.0

### Major Changes

- f430f02dde: Docs app refactored for antd v6.

  - Converted all block schema definitions from JSON to JS modules with structured property/event/method documentation.
  - Added visual gallery pages for all 108 blocks with live rendered examples and code snippets.
  - Created custom `_yaml_parse` and `_yaml_stringify` operators for YAML handling in docs examples.
  - Applied antd v6 style codemods across all page templates and example configurations.
  - Updated migration guide covering all breaking changes.
  - Rewrote block gallery pages for 70+ blocks with real-world examples, theme token overrides, style/CSS sections with Tailwind examples, and copy-to-clipboard.
  - Gallery examples use `var(--ant-*)` tokens instead of hardcoded colors for dark mode compatibility.

### Patch Changes

- Updated dependencies [905d5d406]
  - @lowdefy/helpers@5.0.0

## 4.7.3

### Patch Changes

- @lowdefy/helpers@4.7.3

## 4.7.2

### Patch Changes

- @lowdefy/helpers@4.7.2

## 4.7.1

### Patch Changes

- @lowdefy/helpers@4.7.1

## 4.7.0

### Patch Changes

- 5716be2c8: fix(docs): Fix broken nav links and build warnings

  - Fix broken page links: tutorial pages were renamed/split but nav refs not updated
  - Remove OracleDB page: page was already commented out, only a stale link from Knex remained
  - Add granular `~ignoreBuildChecks` for false-positive warnings: state-refs on Descriptions, request-refs on AgGrid, types on Comment

- Updated dependencies [4543688f7]
- Updated dependencies [dea6651a1]
  - @lowdefy/helpers@4.7.0

## 4.6.0

### Minor Changes

- 338ea04b9f: feat(build): Add ~ignoreBuildChecks property to suppress build validation

  **Build Validation Suppression (#1949, #1963)**

  - New `~ignoreBuildChecks` property suppresses build-time validation errors and warnings
  - Supports `true` (suppress all) or array of specific check slugs (e.g., `['state-refs', 'types']`)
  - Cascades to all descendant config objects - set on a page to suppress for all child blocks
  - Silent suppression - no log output when validation is skipped (visible with `--log-level debug`)

  > **Renamed:** Previously `~ignoreBuildCheck` (singular) - using the old name throws a helpful migration error.

  **Available Check Slugs:**

  - `state-refs`, `payload-refs`, `step-refs` - Reference validation warnings
  - `link-refs`, `request-refs`, `connection-refs` - Action reference validation
  - `types` - All type validation (blocks, operators, actions, etc.)
  - `schema` - JSON schema validation errors

  **Use Cases:**

  - Dynamic state references created at runtime by custom blocks
  - Multi-app monorepos with conditional configurations
  - Work-in-progress features during development
  - Plugin development with custom types not yet registered

  **Example:**

  ```yaml
  # Suppress all checks for this page and descendants
  pages:
    - id: dynamic-page
      type: Box
      ~ignoreBuildChecks: true
      blocks:
        - id: block1
          type: TextInput
          properties:
            value:
              _state: dynamicField # No warning

  # Suppress only specific checks
  blocks:
    - id: custom_block
      type: CustomBlock
      ~ignoreBuildChecks:
        - state-refs
        - types
      properties:
        onClick:
          _state: dynamicState # No warning (state-refs suppressed)
  ```

### Patch Changes

- Updated dependencies [aa0d6d363e]
- Updated dependencies [aebca6ab51]
- Updated dependencies [ab19b1bb77]
- Updated dependencies [8ec5f1be05]
  - @lowdefy/helpers@4.6.0

## 4.5.2

### Patch Changes

- @lowdefy/helpers@4.5.2

## 4.5.1

### Patch Changes

- @lowdefy/helpers@4.5.1

## 4.5.0

### Minor Changes

- 09ae496d8: Add JSONata operator.

### Patch Changes

- @lowdefy/helpers@4.5.0

## 4.4.0

### Patch Changes

- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/helpers@4.2.0

## 4.1.0

### Patch Changes

- @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- 2bcd2a9f6: Fix broken link and use improved reference to Google Docs.
  - @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

### Features

- Add cover content area to Card block. ([c8a75a9](https://github.com/lowdefy/lowdefy/commit/c8a75a9155c994cc96658933ca4d0b6a5b1afc74))

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))

### Features

- **docs:** Add connectionId field to request docs. ([9f67461](https://github.com/lowdefy/lowdefy/commit/9f67461bed5f56a6a2f089bb6723a0bef9f358bf))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))

### Features

- **docs:** Add connectionId field to request docs. ([9f67461](https://github.com/lowdefy/lowdefy/commit/9f67461bed5f56a6a2f089bb6723a0bef9f358bf))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- **docs:** Fix payload on request examples. ([5ce3335](https://github.com/lowdefy/lowdefy/commit/5ce3335469c01979011f55cffd4f76285ef13d1a))
- **docs:** Update example requests to make use of payload. ([2917d07](https://github.com/lowdefy/lowdefy/commit/2917d07c423051125f723ca329691e5b5a1eafe8))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency next-auth to v4.23.1 ([48f9780](https://github.com/lowdefy/lowdefy/commit/48f97809e825fb9afdd169120371184b3e2a98c8))
- **docs:** Add Fetch action documentation. ([8a2af0c](https://github.com/lowdefy/lowdefy/commit/8a2af0c22a04e2ca6438dd6e13c9533d0b82face))
- **docs:** General polish and bug fixes. ([384e2ff](https://github.com/lowdefy/lowdefy/commit/384e2ff7224181c96b0b130b1f6ff583fc849cd3))
- **docs:** Update CopyToClipboard docs. ([8fd55ca](https://github.com/lowdefy/lowdefy/commit/8fd55cacc20c2a326cb7bf6fa7bf2f5a1bd9f53f))
- **docs:** Update migration guide ([9c1e6c0](https://github.com/lowdefy/lowdefy/commit/9c1e6c0ff2cb095b06fd9175f25e0fba0190b0d9))
- Documentation fixes. ([7753924](https://github.com/lowdefy/lowdefy/commit/7753924e578a860b890bab8c24497b090bc07f78))
- Fix docs quickstart command ([ad305b5](https://github.com/lowdefy/lowdefy/commit/ad305b582f74b8245d45aa6a8f6a572822bbcbf4))

### Features

- **actions-core:** Add CopyToClipboard action. ([964cd8f](https://github.com/lowdefy/lowdefy/commit/964cd8fb9cee93f4979f5c106f6ba89b5ea9b3a1))
- **blocks-algolia:** Add DocSearch block. ([701ee87](https://github.com/lowdefy/lowdefy/commit/701ee87ec7f3e5f2b28568e43c14948548b90d9e))
- **blocks-antd:** Add renderTags and option to render Tags in MultipleSelector. ([92a28fd](https://github.com/lowdefy/lowdefy/commit/92a28fd4ceb096257c4181a8ea0c5dd8bfbc8c2d))
- **blocks-antd:** Add Tag block. ([07d16cf](https://github.com/lowdefy/lowdefy/commit/07d16cfc31c34bc5f77e5ae76b4851f52f9bfda3))
- **blocks-antd:** Add Tag to docs. ([6a9a29e](https://github.com/lowdefy/lowdefy/commit/6a9a29e458eb52da6b65c8db5b1438ef592aa906))
- **plugin-mongodb:** Update docs. ([4d2e03d](https://github.com/lowdefy/lowdefy/commit/4d2e03d768cd0e651706b207c654a9c8d0837241))
- Update minimum node version to 18 ([0b64fd1](https://github.com/lowdefy/lowdefy/commit/0b64fd1347fc807d79819cc9c2022671088c8921))

### BREAKING CHANGES

- Update minimum node version to 18

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

### Bug Fixes

- Add V3 banner to docs. ([77610d1](https://github.com/lowdefy/lowdefy/commit/77610d11c23df8c128192beb2837e92e3664b835))
- Change lowdefy@4 references to lowdefy@rc. ([ceff662](https://github.com/lowdefy/lowdefy/commit/ceff66214482e1152bd15c74880f136f86100f4f))
- Docs polish and fixes ([1a00dd9](https://github.com/lowdefy/lowdefy/commit/1a00dd9e741e7492646cbfe949506a956103b0c0))
- **docs:** Fix blocks on docs not rendering. ([965fffa](https://github.com/lowdefy/lowdefy/commit/965fffae3d3dc120fdd5795130b20e5697ae3d31))
- **docs:** reference version number. ([b121006](https://github.com/lowdefy/lowdefy/commit/b1210065ba990db53d37504dbd4a93aaf2b7f1d4))
- **docs:** Remove post telemetry. ([93930d6](https://github.com/lowdefy/lowdefy/commit/93930d69fc61e23f281f47da0baceb439d3356e9))
- **docs:** Tutorial fixes and polish ([69e8c07](https://github.com/lowdefy/lowdefy/commit/69e8c07d23d27a11050886b8eec16e57c5de0bff))
- Fix documentation yaml indentation. ([12a9ecb](https://github.com/lowdefy/lowdefy/commit/12a9ecbb9ea10b2ec5e1545cf10ac16b05ea3d50))
- Plugins docs polish. ([286b01f](https://github.com/lowdefy/lowdefy/commit/286b01f167fec572f313ff164f6046bc8bcb1cf2))
- Remove arrayIndices param from operator docs. ([ba298f4](https://github.com/lowdefy/lowdefy/commit/ba298f4a7cb2360f2e938abcf8c27bcde84b87d8))
- SetState SetGlobal typo ([b54efb1](https://github.com/lowdefy/lowdefy/commit/b54efb1062f6244b24985c93b2d89d9659fb15d2))
- Small typos in plugins-dev.yaml ([45c77f3](https://github.com/lowdefy/lowdefy/commit/45c77f356f9dccc85e3944c5b051823ec58332df))
- Typo in plugins-connections.yaml ([68828cd](https://github.com/lowdefy/lowdefy/commit/68828cd254de46fd69d9d4ee0394e89001c8e0b8))
- Typos in plugins-operators.yaml ([e028644](https://github.com/lowdefy/lowdefy/commit/e028644b37f0b3e03a78d88ec017b087b36be899))

### Features

- Add Auth provider docs. ([7335dd8](https://github.com/lowdefy/lowdefy/commit/7335dd89a9ed093eb3a2ed639be8b7f305def726))
- **docs:** Add border radius. ([6d50050](https://github.com/lowdefy/lowdefy/commit/6d500504d7224c80c2a148060fb650411e94416a))
- **docs:** Add operator plugin docs. ([9fd356a](https://github.com/lowdefy/lowdefy/commit/9fd356a38d4ffa91e50171f9e8202763e98deb64))
- **docs:** Add plugins docs wip. ([00f661f](https://github.com/lowdefy/lowdefy/commit/00f661fa5fce55bdf243081a3c15439f1b0eb560))
- **docs:** Add posthog ([58e2b3a](https://github.com/lowdefy/lowdefy/commit/58e2b3a4c86f587da7c3757fdef2887f8e34dad2))
- **docs:** Plugin development docs. ([792eee0](https://github.com/lowdefy/lowdefy/commit/792eee0a6962494eadacb8cde7a592ecd61bbee4))
- **docs:** Post feedback and newsletter. ([cf7a4e2](https://github.com/lowdefy/lowdefy/commit/cf7a4e2c40b5477f577b7f627dc50fb5260699fc))
- Fix colors and sponsor btn. ([1160011](https://github.com/lowdefy/lowdefy/commit/1160011eb755447c9b044de42a4229186e76c84e))
- Plugin documentation ([6a4d3fe](https://github.com/lowdefy/lowdefy/commit/6a4d3fe696712d770e719cb47800e7b45c80c2e5))
- Plugins docs wip ([182ecab](https://github.com/lowdefy/lowdefy/commit/182ecab9020884a635ca432c306647afe02665d4))
- **website:** Add robots.txt ([b894817](https://github.com/lowdefy/lowdefy/commit/b8948174c15dadfeb4e9e64f0124ea7df9f0f151))

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

### Bug Fixes

- **docs:** Add note to migration guide on serialise breaking changes ([4a27aad](https://github.com/lowdefy/lowdefy/commit/4a27aadfe251ad620cbe44a1e73e65bd015fe283))

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- Fix server configuration migration guide ([53f52f6](https://github.com/lowdefy/lowdefy/commit/53f52f6b150ddbabfef5ab13b9a983173839fc97))

### Features

- **actions-core:** Add UpdateSession action. ([c5d6011](https://github.com/lowdefy/lowdefy/commit/c5d601151acbdb791aaf1304ae95b0ccb18b8c03))
- **blocks-antd:** Add Carousel block to default Lowdefy blocks. ([85972d1](https://github.com/lowdefy/lowdefy/commit/85972d1d8e4f3fbd00ac55e386ef0f9a326bbdaa))
- **docs:** Add Layout, Header-Content-Footer example to docs and migration guide ([878601e](https://github.com/lowdefy/lowdefy/commit/878601efda3b6190f34151e35daf6882a37ce328))
- Remove support for setting base path using an environment variable ([ec7052d](https://github.com/lowdefy/lowdefy/commit/ec7052dab152645b4a5ed9098320e46488041034))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

### Bug Fixes

- **docs:** Update docker docs ([d8b6e46](https://github.com/lowdefy/lowdefy/commit/d8b6e4600259ccf52c1b7d4eecf74b8e76d7724b))

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **blocks-antd:** Update PhoneNumberInput ([2cdfe2c](https://github.com/lowdefy/lowdefy/commit/2cdfe2cfa710b08eefeca9773f9aebd73b4b899e))
- **blocks-loaders:** Remove IconSpinner and update Spinner ([daa5696](https://github.com/lowdefy/lowdefy/commit/daa5696f3e53b4ed8590248ec948248cd16c1055))
- Change backlinks for layout to layout-overview ([0852011](https://github.com/lowdefy/lowdefy/commit/08520113d6d9a7824a95e0b7a43cb73e19fbe769))
- **docs:** Additional details on GoogleMapsScript.yaml ([f3296fd](https://github.com/lowdefy/lowdefy/commit/f3296fd0010b18dbb269f6acc7e310c4b79c5b42))
- **docs:** AgGrid docs typo. ([62f5937](https://github.com/lowdefy/lowdefy/commit/62f59376aadca524b15e357e160564f435d2e25e))
- **docs:** Fix monorepo docker deploy docs. ([c7a75e6](https://github.com/lowdefy/lowdefy/commit/c7a75e6351ee3448c63270400e1d2897a29d9163))
- **docs:** Only call telemetry on prod. ([5ac37b8](https://github.com/lowdefy/lowdefy/commit/5ac37b87608108f2be4587e29a9d3aac373b9f2c))
- **docs:** Rename layout in concepts to layout-overview ([621d1bd](https://github.com/lowdefy/lowdefy/commit/621d1bdf5bf58f1fa00269daa54b258ff0b9f55a))
- **docs:** Update AgGrid docs. ([9eeab3e](https://github.com/lowdefy/lowdefy/commit/9eeab3ed1f90c22bcdb3fbce46f8d874121f8e0c))
- **docs:** Update GoogleMaps blocks docs. Split into GoogleMaps, GoogleMapsHeatmap, GoogleMapsScript. ([262f5a4](https://github.com/lowdefy/lowdefy/commit/262f5a4392ecc3288f802b41cb0a854a01e991d9))
- **docs:** Update schema_definition usage. ([86f6c67](https://github.com/lowdefy/lowdefy/commit/86f6c67258cb2ae48b765f848dd00d2e6d74e8d1))

### Features

- **docs:** Add AgGrid display block. ([107866b](https://github.com/lowdefy/lowdefy/commit/107866b54a0cb1b5e676cd8b05ea2b36bf544085))
- **docs:** Add AgGrid server-side filter and sort example ([1dff161](https://github.com/lowdefy/lowdefy/commit/1dff161e58ff636d1e98a1ecacf3cb500764e933))
- **docs:** Add GeolocationCurrentPosition action to the docs. ([bdd75c0](https://github.com/lowdefy/lowdefy/commit/bdd75c09efa566fcf4887249787ce5858888a8a8))
- **docs:** Add GoogleMaps block to docs. ([eab438a](https://github.com/lowdefy/lowdefy/commit/eab438a0fa7f52eecd220f2c70ad69192be3ece4))
- **docs:** Add Header, Content, Sider, Footer, Layout blocks docs ([d7798b0](https://github.com/lowdefy/lowdefy/commit/d7798b0927da9602c9f680dc7e38a731b113cea7))
- **docs:** Add more GoogleMaps examples. ([7109d65](https://github.com/lowdefy/lowdefy/commit/7109d65aad73f292a4d377605d2b94cc3c08b5e8))
- **docs:** Add PhoneNumberInput block to the docs. ([b7d539e](https://github.com/lowdefy/lowdefy/commit/b7d539ea34826d52be167314dd8c1b64585d3a30))
- **docs:** Add Skeleton blocks docs ([a96a985](https://github.com/lowdefy/lowdefy/commit/a96a98574fdeae8f80b9998c9a8563f76b8902bd))
- **docs:** Finalise AgGrid docs and update README. ([0024b34](https://github.com/lowdefy/lowdefy/commit/0024b34d33e4e645d252dea42d895c3751a87202))
- **docs:** Update GeolocationCurrentPosition action docs. ([5af8c1c](https://github.com/lowdefy/lowdefy/commit/5af8c1c5081672ef55145a43f8ad97720700f48c))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

### Bug Fixes

- **docs:** Polish concepts pages ([9cfce96](https://github.com/lowdefy/lowdefy/commit/9cfce96f23f0304aa9ef4a38744a82323621e670))
- Fix docs generate sitemap transformer ([9cf4c1d](https://github.com/lowdefy/lowdefy/commit/9cf4c1d130f8c99d2eda420c68e0847bd76e6926))

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- Add MongoDBAdapter docs. ([c609b25](https://github.com/lowdefy/lowdefy/commit/c609b25311af8b5df250fc27b56f2fbbe6e80d49))
- Allow axios data property to be an array ([9b83af5](https://github.com/lowdefy/lowdefy/commit/9b83af5e0fa0600ff39b1c317fbce7e5be2a17a0)), closes [#1158](https://github.com/lowdefy/lowdefy/issues/1158)
- Auth docs fixes ([0e7a013](https://github.com/lowdefy/lowdefy/commit/0e7a0133a78904be54de79327dd7eca327bf4ce5))
- **docs:** Changed reference to request in DownloadCsv examples ([c81dc42](https://github.com/lowdefy/lowdefy/commit/c81dc42900ad7ddfee9922542022dbfe06451520))
- **docs:** Cleanup \_js references. ([f236a46](https://github.com/lowdefy/lowdefy/commit/f236a466c2a8d433893897b0f38184046f14bc48))
- **docs:** Fix \_object operator docs. ([8d1e10f](https://github.com/lowdefy/lowdefy/commit/8d1e10feb58e0e8638c89115466950ae43f7db84)), closes [#1339](https://github.com/lowdefy/lowdefy/issues/1339)
- **docs:** Fix syntax on Custom Styling Ant theme import example. ([b356f09](https://github.com/lowdefy/lowdefy/commit/b356f09779e3ad78e6e85035db59fbbfc9737c7b))
- **docs:** Fix typo ([fe9cba1](https://github.com/lowdefy/lowdefy/commit/fe9cba12056c502eaac33edeed0714afd4b8b360))
- **docs:** Make environment variables lowercase. ([bafc31d](https://github.com/lowdefy/lowdefy/commit/bafc31d6dde5558f5ef0025955a7cb9b326f3f06))
- **docs:** Minor fixes to requests and connections. ([f321396](https://github.com/lowdefy/lowdefy/commit/f321396e2a95f015ba31eb963a88639c712dbfa4))
- **docs:** Page and App State docs wording fixes. ([6de0792](https://github.com/lowdefy/lowdefy/commit/6de07926700a712d3a3d607e7f421ccf853f9849))
- **docs:** Update block docs. ([44a838f](https://github.com/lowdefy/lowdefy/commit/44a838f254cd99607a3813a2b3d4c44838ff1542))
- **docs:** Update custom code section. ([3d29cd6](https://github.com/lowdefy/lowdefy/commit/3d29cd688813ec58a7ca02c8d72af61032675e6e))
- **docs:** Update MongoDB docs with log collection info ([8e302b9](https://github.com/lowdefy/lowdefy/commit/8e302b9783052bf98af7e52fc5b51672f55efb42))
- Fix auth doc page paths ([e4bbdaf](https://github.com/lowdefy/lowdefy/commit/e4bbdafbc08e0c3e72c6933dd65e330e1bd1d341))
- Updates to page and app state docs. ([79ca911](https://github.com/lowdefy/lowdefy/commit/79ca91189fc2d9fb11e311c803b929b68709fdd4))

### Features

- Add auth configuration docs. ([8ec89ce](https://github.com/lowdefy/lowdefy/commit/8ec89ce66e2265ee4d95dc676f8ed066feef3404))
- Add Auth0LogoutCallback documentation. ([3fd174d](https://github.com/lowdefy/lowdefy/commit/3fd174d47ff69bc6b6a1e6329f4b0359f9771cb4))
- Add init-docker CLI command and docker docs ([d27975b](https://github.com/lowdefy/lowdefy/commit/d27975b52373b5bded837bb6d5202fe06ab8630d))
- Add init-vercel CLI command and Vercel deployment docs. ([408e21a](https://github.com/lowdefy/lowdefy/commit/408e21a1af4052af2fb16c335378977f70e0451b))
- Add next auth default provider docs. ([9c06de0](https://github.com/lowdefy/lowdefy/commit/9c06de019d03b18273c72cd5c80d7ee6bc05d4a3))
- Add OpenIDConnectProvider docs ([200182f](https://github.com/lowdefy/lowdefy/commit/200182fb1d123ea6ede2a60ef975dde4ce37db56))
- Add user object docs. ([6c8ed5f](https://github.com/lowdefy/lowdefy/commit/6c8ed5fcdb3c5c5e23194416834a0e81097f8cc1))
- **docs:** Add build note to all build operator pages. ([cff4233](https://github.com/lowdefy/lowdefy/commit/cff4233fb73a172cdde423bd124ae4f57b5d2f73)), closes [TECHMRM/lowdefy#46](https://github.com/TECHMRM/lowdefy/issues/46)
- **docs:** Add Custom Styling Concept page. ([1aad894](https://github.com/lowdefy/lowdefy/commit/1aad894956ca70425712e01cb56546075d7dbbc9))
- **docs:** Add Page and App State concept page. ([52dce71](https://github.com/lowdefy/lowdefy/commit/52dce71496bcdd05e677d575a2fcd328c177f3c4))
- **docs:** Add v3 to v4 migration guide page to the docs. ([d7f6128](https://github.com/lowdefy/lowdefy/commit/d7f6128f831ff6b33bb5ced3a5a5594ae28327fe))
- **docs:** Added DownloadCsv and PdfMake docs ([72f8a83](https://github.com/lowdefy/lowdefy/commit/72f8a83d8cbb1efaece083be6011fc86178fdea8))
- **docs:** Create build operator docs. ([2ea77e3](https://github.com/lowdefy/lowdefy/commit/2ea77e3eadf5bc6066b20ad6e56db20c7e6d1fce))
- **docs:** Remove all context references in docs. ([b316753](https://github.com/lowdefy/lowdefy/commit/b3167531b5db35c45a1265e7c0cc72ea7a466dbc))
- **docs:** Remove old context and state page. ([4392222](https://github.com/lowdefy/lowdefy/commit/439222255a2cf4fd499852bb9a957612849772ab))
- **docs:** Update \_build descriptions and examples. ([31236ae](https://github.com/lowdefy/lowdefy/commit/31236ae7fe48fdbe7db90bbd9f3c53bb39af52d4))
- **docs:** Update build operator concept description. ([e6f8caa](https://github.com/lowdefy/lowdefy/commit/e6f8caaf27896782e0f67750b7cb0b0a5a4f48b1))
- **docs:** Update context-and-state page references. ([aeab7ea](https://github.com/lowdefy/lowdefy/commit/aeab7ea6cf44381133c4db3de29efce7f1d51a57))
- **docs:** User docs intro, protected pages and roles sections ([4a59107](https://github.com/lowdefy/lowdefy/commit/4a5910727accf23826e161ae9eda05368c904310))
- Update CLI docs ([28ac5c5](https://github.com/lowdefy/lowdefy/commit/28ac5c58acfb3933a32df1a3fe0012db1f7bb7df))
- Updates to login and logout documentation ([4236023](https://github.com/lowdefy/lowdefy/commit/4236023102e227806ebaa8eb9175f2ceecb5965f))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

### Bug Fixes

- **docs:** Add lowdefy_app_schema.png ([f5a583b](https://github.com/lowdefy/lowdefy/commit/f5a583bf3b250d0b56d1cd4681872d6f8bb275ea))
- Docs introduction updates and fixes. ([57b3e93](https://github.com/lowdefy/lowdefy/commit/57b3e935e860587a2b69391aac324601a9f64df9))
- **docs:** Change Additional Page to Data Display Page. ([fafa178](https://github.com/lowdefy/lowdefy/commit/fafa178269045db9fe30d99b804558ff83657243))
- **docs:** Changed feedback anchors to boxes ([8f407ac](https://github.com/lowdefy/lowdefy/commit/8f407ac73a38d5859d33c912f458de4610aab792))
- **docs:** Fix typo. ([a01b4b9](https://github.com/lowdefy/lowdefy/commit/a01b4b982d10991e995c3b93a6973d2211a27b44))
- **docs:** Next for tutorial-start. ([e7de18b](https://github.com/lowdefy/lowdefy/commit/e7de18baee7e6445dc9a6e986be0589126a524e6))
- **docs:** Not renaming throw to break. ([a9ce920](https://github.com/lowdefy/lowdefy/commit/a9ce920919b6d1d4189ced072e88fabde7db5d55))
- **docs:** Simplify step titles. ([ade6016](https://github.com/lowdefy/lowdefy/commit/ade601674ad617165a4caba1e0335dc346a18d91))
- **docs:** Small fixes to v4 tutorial pages. ([9654eef](https://github.com/lowdefy/lowdefy/commit/9654eef9a0e0ece57d5e66f6400d8265e9346466))
- **docs:** Small grammar changes on introduction page. ([2185f7c](https://github.com/lowdefy/lowdefy/commit/2185f7c393e3cb32cf216ae86ec4d59f0b1a25a3))
- **docs:** Small grammar changes on overview concept page. ([d7f5f95](https://github.com/lowdefy/lowdefy/commit/d7f5f958bb5326e80b79cad66c7c811233af2893))
- **docs:** Update example tutorial code repo links. ([96399a2](https://github.com/lowdefy/lowdefy/commit/96399a2f88c7c58f5e0d8d837f92ffad1791ecf2))
- **docs:** Update overview page. ([89863fc](https://github.com/lowdefy/lowdefy/commit/89863fc7b13f4acb5a505ef5ec46d2922d92fbeb))
- **docs:** Update the introduction page for v4. ([d0cee2d](https://github.com/lowdefy/lowdefy/commit/d0cee2d77ddcf5a84e9eb41283c1128170870c47))
- **docs:** Update tutorial to reference pnpm instead of npm. ([03779d5](https://github.com/lowdefy/lowdefy/commit/03779d5cfac0a1aa60c314008ea9419ede966cff))
- **docs:** Updated moment operator description ([875f0ae](https://github.com/lowdefy/lowdefy/commit/875f0aeb8da33e7a316840835896c08db2431845))
- Fix broken ref in docs ([10cdb56](https://github.com/lowdefy/lowdefy/commit/10cdb561c6e9c7078bab4af09b20d2da762d9f4b))

### Features

- **docs:** Add updated tutorial for v4. ([7b9cb77](https://github.com/lowdefy/lowdefy/commit/7b9cb7798503463120ba730c81d6e0ae6ba46fd5))
- **docs:** Added intl operator doc ([924f7fa](https://github.com/lowdefy/lowdefy/commit/924f7fa4d7b5c47765184bc72f9d3a4b7e410d40))
- **docs:** Added moment operator doc ([4c8540b](https://github.com/lowdefy/lowdefy/commit/4c8540b711c7773e48d01b05c2040fdef5016e46))
- **docs:** Rename some tutorial files and minor fixes. ([0b1122d](https://github.com/lowdefy/lowdefy/commit/0b1122d9687a15673f2cfae030df09e6092fe9ca))
- **docs:** Update tutorial-start. ([200bcb0](https://github.com/lowdefy/lowdefy/commit/200bcb0429680f374afcf51bf0a770a956bf08a4))
- **docs:** Updated date operator doc with more methods ([fb423d7](https://github.com/lowdefy/lowdefy/commit/fb423d7307141bba482dd3a837530abd5501e76f))
- Updates to overview page. ([936159c](https://github.com/lowdefy/lowdefy/commit/936159cfc0762837fb1dd7a4e427d51e507f7831))

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **docs:** Add format operator change to migration guide. ([deee945](https://github.com/lowdefy/lowdefy/commit/deee945b5fab1ed6716824ed01a04de94dc99b50))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

### Bug Fixes

- **docs:** Add links to relevant pages on Connections and Requests concept page. ([d611ea5](https://github.com/lowdefy/lowdefy/commit/d611ea5901b9c9e552b83c41f6a7f5b674515f34))

### Features

- **docs:** Add working example to Connections and Requests concept page. ([a567a35](https://github.com/lowdefy/lowdefy/commit/a567a35ec213aa1507de4303f9c2423efc503e64))

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

### Bug Fixes

- **docs:** Fix Refernces and Templates wording. ([d9ad6e0](https://github.com/lowdefy/lowdefy/commit/d9ad6e012a786eeb90ec2e938dd465040c158fb1))

### Features

- Add the abilty to get a key from a reference JSON or YAML file. ([192267e](https://github.com/lowdefy/lowdefy/commit/192267ef716df1997a998a923e8b050aa5b86d35))
- **docs:** Add References and Templates use cases. ([1ee298e](https://github.com/lowdefy/lowdefy/commit/1ee298ee370bac30e1189237d5cf9ccb69a5fac3))
- **docs:** Update References and Templates concept page. ([9468acf](https://github.com/lowdefy/lowdefy/commit/9468acfa6e458bb72216e485b520fa0cf37d8cb4))
- Rename \_var name param to key for consistency ([d5bda68](https://github.com/lowdefy/lowdefy/commit/d5bda6876a52cd97fcdaac62c8aa3b99085bc3d5))

### BREAKING CHANGES

- The \_var operator ‘name’ param has been renamed to ‘key’ to be more consistent with other getter operators.

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

### Features

- Add additional migration guide notes. ([45eae2c](https://github.com/lowdefy/lowdefy/commit/45eae2cbb0845981ead2cc76028925a0f7b1372e))
- Update the V4 migration guide. ([e05e424](https://github.com/lowdefy/lowdefy/commit/e05e424a1851da6cbf40f91f4a6d9628f1a7421d))

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

### Features

- **dosc:** Update Connections and Requests concept page. ([97d1d76](https://github.com/lowdefy/lowdefy/commit/97d1d764505e2c23bfcbf67116271b2ab8a853f0))

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

### Bug Fixes

- Clean up files. ([eaf6bde](https://github.com/lowdefy/lowdefy/commit/eaf6bde3364e24cc5fce949ad03b9db2c779ea6e))

### Features

- **docs:** Add nunjucks date filter example. ([c4df77d](https://github.com/lowdefy/lowdefy/commit/c4df77d0b2bdeb1280db4f315a975952f09d27ef))
- **docs:** Update Events and Actions concept page. ([eb61475](https://github.com/lowdefy/lowdefy/commit/eb614758df9c5036d24ce224142dda3c60172021))
- **docs:** Update Menus concept page. ([0f8e3eb](https://github.com/lowdefy/lowdefy/commit/0f8e3ebcba1315a5f14cec4a02cd6f8426f948e2))
- **docs:** Update Secrets concept page. ([f0bddb8](https://github.com/lowdefy/lowdefy/commit/f0bddb86e11e71b9705c231eba66a8d71c8cdf56))

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- **docs:** Add catch to Selector and MultipleSelector block pages. ([9777175](https://github.com/lowdefy/lowdefy/commit/9777175ed6028d9ee6eabe68e63e14c4508d6d0b))
- **docs:** correct filePath for ControlledList ([c3a2cce](https://github.com/lowdefy/lowdefy/commit/c3a2cce54ee21064786571977183321f154f058a))
- **docs:** correct link to \_secret operator ([7124669](https://github.com/lowdefy/lowdefy/commit/712466993dd9b35e76d12da3146e6820138d41e6))
- **docs:** Docs V4 compatibilty fixes. ([520dce1](https://github.com/lowdefy/lowdefy/commit/520dce1f7bfa5d5b2eab36ebb58f340e5bf15cc6))
- **docs:** Fix MongoDB page. ([e282e54](https://github.com/lowdefy/lowdefy/commit/e282e54f650c06fed0bf947eecd0946fbbf8b469))
- **docs:** Fix typo media to menu. ([bccc978](https://github.com/lowdefy/lowdefy/commit/bccc978190e617689050df44af9183f68ce10ccf))
- **docs:** Remove catch from MultipleSelector and Selector block pages. ([adf6932](https://github.com/lowdefy/lowdefy/commit/adf6932528f9104905c272282e10ad5369a6bcd3))
- **docs:** Remove outdated pages and add todos. ([ff2c02b](https://github.com/lowdefy/lowdefy/commit/ff2c02b54476e92bf8a949bd91990d1a112791c3))
- **docs:** Rename and remove actions pages. ([0da95f3](https://github.com/lowdefy/lowdefy/commit/0da95f3ac97170864519e39b934c5b6ce9626919))
- Revert image url ([714ce8c](https://github.com/lowdefy/lowdefy/commit/714ce8c9298738b5097074d68c25db5b24ee272b))

### Features

- **docs:** Add examples to Lowdefy App Schema concept page. ([f27f7dd](https://github.com/lowdefy/lowdefy/commit/f27f7dd58e9cbb19ab620e4c9b265851a6396617))
- **docs:** Add examples to References and Templates concept page. ([cbe8690](https://github.com/lowdefy/lowdefy/commit/cbe8690877cfe8495f51f56a0b4284e8245c8dd3))
- **docs:** Add Menu concept page. ([5dfc51e](https://github.com/lowdefy/lowdefy/commit/5dfc51e2b1975bf45b713a0423a2ed6ce066cd1f))
- **docs:** Add more to references section on Lowdefy App Schema concept page. ([5837c29](https://github.com/lowdefy/lowdefy/commit/5837c29b0e95dd7432b8f4c6d314179c9aaf1428))
- **docs:** Add payload to Connections and Requests concept page. ([4f9bff6](https://github.com/lowdefy/lowdefy/commit/4f9bff6889655f6ae7cc4f8f517015adb3c0dc7f))
- **docs:** Add References and Templates concept page. ([874bc37](https://github.com/lowdefy/lowdefy/commit/874bc37e9ba3e59505d85787af5df0b0686d30c2))
- **docs:** Add roles example to Menus concept page. ([54c13df](https://github.com/lowdefy/lowdefy/commit/54c13dfac0aa5eabe507227ae174d4123fbcc0a0))
- **docs:** Add small changes to Blocks concept page. ([b4bcd68](https://github.com/lowdefy/lowdefy/commit/b4bcd68767166479063cf5cf27a7b242846eae2c))
- **docs:** Change pages example on Lowdefy App Schema concept page. ([1d17867](https://github.com/lowdefy/lowdefy/commit/1d17867585b365a21baccdb87c96bd049a70cda2))
- **docs:** Format changes to Blocks concept page. ([4713be6](https://github.com/lowdefy/lowdefy/commit/4713be632dbd35ab13855bf6f0c44f72fd0ee5b8))
- **docs:** General improvements to Events and Actions concept page. ([182ffc2](https://github.com/lowdefy/lowdefy/commit/182ffc2a787b7119716122b35d3035f1fdb5acb1))
- **docs:** General improvements to the Secrets concept page. ([1121edb](https://github.com/lowdefy/lowdefy/commit/1121edb66a6c4207c867e009bba9a9751aee0319))
- **docs:** Small changes in Blocks concept page. ([588e4aa](https://github.com/lowdefy/lowdefy/commit/588e4aa679103aeafccfcd3b5c073dd05bb8f7a2))
- **docs:** Small changes to Connections and Requests concept page. ([7c13734](https://github.com/lowdefy/lowdefy/commit/7c13734c6b8088bd9b0d92f90fa17f1c2ce2aae4))
- **docs:** Small format changes to Lowdefy App Schema concept page. ([8bf7f78](https://github.com/lowdefy/lowdefy/commit/8bf7f781cb7b85ba7206636816cca5f7dd69073f))
- **docs:** Small improvements to Lowdefy App Schema concept page. ([3864638](https://github.com/lowdefy/lowdefy/commit/386463869c78c494c05636e1e435419c96917b02))
- **docs:** Update blocks concept page. ([3e6a9b2](https://github.com/lowdefy/lowdefy/commit/3e6a9b2affd70c97aac60e80a5aa2c291002ad0b))
- **docs:** Update Connections and Requests concept page. ([879891e](https://github.com/lowdefy/lowdefy/commit/879891e2213cc57bad66ab0b73dba97e93985979))
- **docs:** Update Lowdefy App Schema concept page. ([7cd587e](https://github.com/lowdefy/lowdefy/commit/7cd587e1d4595c1ce26f57035583971218b4d479))
- **docs:** Update Lowdefy App Schema Concept Page. ([b39ce85](https://github.com/lowdefy/lowdefy/commit/b39ce85d47b7501974107ea6b3b04178945bb06d))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- **docs:** Add catch to Selector and MultipleSelector block pages. ([9777175](https://github.com/lowdefy/lowdefy/commit/9777175ed6028d9ee6eabe68e63e14c4508d6d0b))
- **docs:** correct filePath for ControlledList ([c3a2cce](https://github.com/lowdefy/lowdefy/commit/c3a2cce54ee21064786571977183321f154f058a))
- **docs:** correct link to \_secret operator ([7124669](https://github.com/lowdefy/lowdefy/commit/712466993dd9b35e76d12da3146e6820138d41e6))
- **docs:** Docs V4 compatibilty fixes. ([520dce1](https://github.com/lowdefy/lowdefy/commit/520dce1f7bfa5d5b2eab36ebb58f340e5bf15cc6))
- **docs:** Fix typo media to menu. ([bccc978](https://github.com/lowdefy/lowdefy/commit/bccc978190e617689050df44af9183f68ce10ccf))
- **docs:** Remove catch from MultipleSelector and Selector block pages. ([adf6932](https://github.com/lowdefy/lowdefy/commit/adf6932528f9104905c272282e10ad5369a6bcd3))
- **docs:** Remove outdated pages and add todos. ([ff2c02b](https://github.com/lowdefy/lowdefy/commit/ff2c02b54476e92bf8a949bd91990d1a112791c3))
- **docs:** Rename and remove actions pages. ([0da95f3](https://github.com/lowdefy/lowdefy/commit/0da95f3ac97170864519e39b934c5b6ce9626919))
- Revert image url ([714ce8c](https://github.com/lowdefy/lowdefy/commit/714ce8c9298738b5097074d68c25db5b24ee272b))

### Features

- **docs:** Add examples to Lowdefy App Schema concept page. ([f27f7dd](https://github.com/lowdefy/lowdefy/commit/f27f7dd58e9cbb19ab620e4c9b265851a6396617))
- **docs:** Add examples to References and Templates concept page. ([cbe8690](https://github.com/lowdefy/lowdefy/commit/cbe8690877cfe8495f51f56a0b4284e8245c8dd3))
- **docs:** Add Menu concept page. ([5dfc51e](https://github.com/lowdefy/lowdefy/commit/5dfc51e2b1975bf45b713a0423a2ed6ce066cd1f))
- **docs:** Add payload to Connections and Requests concept page. ([4f9bff6](https://github.com/lowdefy/lowdefy/commit/4f9bff6889655f6ae7cc4f8f517015adb3c0dc7f))
- **docs:** Add References and Templates concept page. ([874bc37](https://github.com/lowdefy/lowdefy/commit/874bc37e9ba3e59505d85787af5df0b0686d30c2))
- **docs:** Add roles example to Menus concept page. ([54c13df](https://github.com/lowdefy/lowdefy/commit/54c13dfac0aa5eabe507227ae174d4123fbcc0a0))
- **docs:** Change pages example on Lowdefy App Schema concept page. ([1d17867](https://github.com/lowdefy/lowdefy/commit/1d17867585b365a21baccdb87c96bd049a70cda2))
- **docs:** Format changes to Blocks concept page. ([4713be6](https://github.com/lowdefy/lowdefy/commit/4713be632dbd35ab13855bf6f0c44f72fd0ee5b8))
- **docs:** General improvements to Events and Actions concept page. ([182ffc2](https://github.com/lowdefy/lowdefy/commit/182ffc2a787b7119716122b35d3035f1fdb5acb1))
- **docs:** General improvements to the Secrets concept page. ([1121edb](https://github.com/lowdefy/lowdefy/commit/1121edb66a6c4207c867e009bba9a9751aee0319))
- **docs:** Small changes in Blocks concept page. ([588e4aa](https://github.com/lowdefy/lowdefy/commit/588e4aa679103aeafccfcd3b5c073dd05bb8f7a2))
- **docs:** Small changes to Connections and Requests concept page. ([7c13734](https://github.com/lowdefy/lowdefy/commit/7c13734c6b8088bd9b0d92f90fa17f1c2ce2aae4))
- **docs:** Small format changes to Lowdefy App Schema concept page. ([8bf7f78](https://github.com/lowdefy/lowdefy/commit/8bf7f781cb7b85ba7206636816cca5f7dd69073f))
- **docs:** Update blocks concept page. ([3e6a9b2](https://github.com/lowdefy/lowdefy/commit/3e6a9b2affd70c97aac60e80a5aa2c291002ad0b))
- **docs:** Update Connections and Requests concept page. ([879891e](https://github.com/lowdefy/lowdefy/commit/879891e2213cc57bad66ab0b73dba97e93985979))
- **docs:** Update Lowdefy App Schema concept page. ([7cd587e](https://github.com/lowdefy/lowdefy/commit/7cd587e1d4595c1ce26f57035583971218b4d479))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Features

- Add extra next-auth configuration properties. ([9781ba4](https://github.com/lowdefy/lowdefy/commit/9781ba46620eb0ddaa11d7d41eb0d8f518999784))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Fix license typo. ([972acbb](https://github.com/lowdefy/lowdefy/commit/972acbb46b9b1113053797f82a41c5f9032dd8b0))

### Features

- **docs:** Init v4 migration notes. ([674dc03](https://github.com/lowdefy/lowdefy/commit/674dc03f41175781e0b32a218b86addb2417079a))
- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **blocks-antd:** Fix confirm modal button icons, closes [#1160](https://github.com/lowdefy/lowdefy/issues/1160) ([bba35be](https://github.com/lowdefy/lowdefy/commit/bba35be1dbb6a8e142f70b2415e865dba59de47b))
- **docs:** Cleanup skeleton docs change. ([6310d13](https://github.com/lowdefy/lowdefy/commit/6310d13af0c9cc709c5c3f50cc9800ebb0a4640a))
- **docs:** Fix docs version plugin import and markdown template. ([3f3cf55](https://github.com/lowdefy/lowdefy/commit/3f3cf5569f5d15c0283f047f9a6aa404d9709fee))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))
- Fix icon names. ([2e81f58](https://github.com/lowdefy/lowdefy/commit/2e81f589fba193e7039dc7c099855831ff9a61fb))
- Review feedback changes. ([6925625](https://github.com/lowdefy/lowdefy/commit/69256253142813f0b78c353d0698f13386d10929))
- Update docs snapshot test ([8987ad8](https://github.com/lowdefy/lowdefy/commit/8987ad8652158bfb66a7334d7745c99d6b49ce11))
- Update snapshots. ([19db923](https://github.com/lowdefy/lowdefy/commit/19db92316c4a1f6aeccf8bb31a3f9ba8e7e66d5a))

### Features

- **docs:** Fix loading and skeleton definitions on blocks concept pages. ([b6207a9](https://github.com/lowdefy/lowdefy/commit/b6207a96ecd99b00e7ed0a3a2151f96ab48d509f))
- **docs:** Remove onEnter and fix onInit and onMount definitions. ([051154f](https://github.com/lowdefy/lowdefy/commit/051154fb5b027407907659547905f87c1557e45a))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))
- **docs:** Correct icon names for react-icons. ([4cae725](https://github.com/lowdefy/lowdefy/commit/4cae725caabc72848bf96ad1dc29d797d152cf27))
- **docs:** Fix \_yaml.parse takes an array. ([0943aa0](https://github.com/lowdefy/lowdefy/commit/0943aa0812ac84535d82e01825681c186fcb14ca))
- **docs:** Fix image route paths in docs. ([895d26d](https://github.com/lowdefy/lowdefy/commit/895d26d2b1ba10bd5b4ece5af73e6dd2e163da1d))
- **docs:** Fix JSON syntax error in S3 docs. ([0aa7501](https://github.com/lowdefy/lowdefy/commit/0aa7501bfcf88b144f6cf6f32a4395ea67647571))
- **docs:** Fixes in tests. ([567afa4](https://github.com/lowdefy/lowdefy/commit/567afa449182834d3d673672c6408f1e8b57f420))

### Features

- **docs:** Implement docs filter default value operator as plugin. ([fa46d22](https://github.com/lowdefy/lowdefy/commit/fa46d2267559dede520e0ddba0d070105bb85545))
- **docs:** Replace color selectors with react-colorful selector. ([3d146aa](https://github.com/lowdefy/lowdefy/commit/3d146aae853d2d437fa2a128380c13b09949365c))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **cli:** Change additional base dir references to config. ([e20cfdf](https://github.com/lowdefy/lowdefy/commit/e20cfdfdcb1f079ea80450b87608ae57ab4e30f8))
- **connection-mongodb:** Update MongoDB connection docs ([7f0fccf](https://github.com/lowdefy/lowdefy/commit/7f0fccffe308a14331c8c6f3ddb3c4579387facb))
- **docs:** Add CircleColorSelector to transformer and fix typo. ([9eea4f1](https://github.com/lowdefy/lowdefy/commit/9eea4f10b145929ace661f52809594cb02580a00))
- **docs:** Add docs on ES Modules in build resolvers and transformers. ([8a3605e](https://github.com/lowdefy/lowdefy/commit/8a3605e840b9f0a86fbf58f47ecbb507e85605fe))
- **docs:** Comment our JsAction usage. ([27a2361](https://github.com/lowdefy/lowdefy/commit/27a2361fc626a78a7b34b2bcdd074bc352a6a677))
- **docs:** Update paths for all blocks and some icon name fixes. ([e4369bb](https://github.com/lowdefy/lowdefy/commit/e4369bb3453c19d76f083b139f317de7dd96e090))
- Fix docs transformer fns tests. ([8a0e331](https://github.com/lowdefy/lowdefy/commit/8a0e3313abe15bee9ce28aa2d8b8f91a3482bae3))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Move S3UploadButton to plugin-aws. ([540aa03](https://github.com/lowdefy/lowdefy/commit/540aa035d2ed0672b0f3e233c1cee90e82d4bb52))
- Update docs for Anchor. ([53117b8](https://github.com/lowdefy/lowdefy/commit/53117b88cf759991539265ca84c0f47a9b45a911))

### Features

- **build:** Add buildPath to config. ([1cce024](https://github.com/lowdefy/lowdefy/commit/1cce024339bc89e4192d86f09d1a9ec233663f02))
- **build:** Use dynamic import for build resolver and transformer functions. ([c9db72a](https://github.com/lowdefy/lowdefy/commit/c9db72ac55109a85cfc821dfbbf87e54b4881d59))
- **cli:** Rename base-directory to config-directory. ([f09c569](https://github.com/lowdefy/lowdefy/commit/f09c569f0e4207ce31a9e5e002f8eb30ea221bc5))
- **docs:** Add docs for the Link component. ([37b80b1](https://github.com/lowdefy/lowdefy/commit/37b80b172bc078ab4b83f5932fc8d0908c5baf6f))
- **operators:** Change dependancy from js-yaml to yaml. ([cbb71d8](https://github.com/lowdefy/lowdefy/commit/cbb71d809b3117dbaf89b23c17a2229a24235308))
- **server:** Add ariaLabel and rel properties to Link. ([95b4447](https://github.com/lowdefy/lowdefy/commit/95b44473a3f67741951e4d020a0ad84a90805d94))
- **server:** Add replace and scroll to Link. ([9d6ac04](https://github.com/lowdefy/lowdefy/commit/9d6ac04b09f7c2281ebc699de504bba8b8b5e13b))

### BREAKING CHANGES

- **connection-mongodb:** The MongoDB driver was updated to v4, which has some changes to the option variable names.
- **operators:** \_yaml.parse now takes an array or an object data instead of a string.
- href and strong property removed for Anchor block, replaced with Link properties.
- **cli:** Rename base-directory to config-directory.

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v3.23.2) (2021-11-29)

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- **docs:** Added redis connection documentation. ([ee1620b](https://github.com/lowdefy/lowdefy/commit/ee1620bb41d8aa3f32e05e9b7e03c7986365c59f))

### Features

- Add \_diff to client operators as well as server. ([4e23fec](https://github.com/lowdefy/lowdefy/commit/4e23fec8a4985d7453dfcf750298bc0bedeb34a2))

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

## [3.23.2](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v3.23.2) (2021-11-29)

**Note:** Version bump only for package @lowdefy/docs

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

### Bug Fixes

- **docs:** Document that \_index operator is client side only. ([72c8228](https://github.com/lowdefy/lowdefy/commit/72c82282a3e6bcd3eb2eeaf3c09b395a0f152405))
- Replace all front end testing with @testing-library/react, jest and other updates. ([22ec295](https://github.com/lowdefy/lowdefy/commit/22ec2954047853096aabcddba7a2c509342f95f2))

### Features

- **blocksAntd:** Add HolderOutlined icon. ([c39c387](https://github.com/lowdefy/lowdefy/commit/c39c38752e4a681a1146e44b6638ff8486ff9da9))
- **blocksAntd:** Convert Alert to container and add action content area. ([49c6baa](https://github.com/lowdefy/lowdefy/commit/49c6baabeedd4ed5aaaf14f1d7b4ae5d2545d6cf))
- **blocksAntd:** Drawer: Add extra content area and contentWrapperStyle property. ([9273fac](https://github.com/lowdefy/lowdefy/commit/9273facac41e5ee6341c80e698f4367b7d8686f3))
- **blocks:** Convert all context category blocks to container. ([6bc03c8](https://github.com/lowdefy/lowdefy/commit/6bc03c86b80a3506c2b85076626ae15a401bcdfc))
- **blockTools:** Update to @emotion/css, optimize makeCssClass standarise jest settings. ([947defa](https://github.com/lowdefy/lowdefy/commit/947defa3d8934e061933b1e218b79f2f97456054))
- Replace server side state with payload and \_payload operator. ([1f928d9](https://github.com/lowdefy/lowdefy/commit/1f928d93db4cbe886d322a1a3998a817d769485f))

### BREAKING CHANGES

- The \_event, \_global, \_input, \_state, and \_url_query operators are no longer evaluated in connections or requests.

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/docs

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

### Bug Fixes

- **docs:** Fix \_ref resolver function example. ([0903094](https://github.com/lowdefy/lowdefy/commit/0903094ce531f4d8ab7849deb91ab3d6b7e5fd82))
- **docs:** Included onSearch event example in MultipleSelector and Selector docs. ([0e53cb8](https://github.com/lowdefy/lowdefy/commit/0e53cb8f93ed49e0122ac038113d7378f67501f7))

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

### Bug Fixes

- Add \_switch operator to docs. ([c5c6f0c](https://github.com/lowdefy/lowdefy/commit/c5c6f0c9a5b0dfc89e09835d3ab940195a077504))
- Support .yml in lowdefy.yaml file. ([0f7cc2a](https://github.com/lowdefy/lowdefy/commit/0f7cc2a7612a5ad9a8164d5a5437dde5c6d7da49)), closes [#902](https://github.com/lowdefy/lowdefy/issues/902)
- **docs:** Add avatar and links to blog template. ([d855599](https://github.com/lowdefy/lowdefy/commit/d855599398cae041933dd8b11aaf77648f87d4c2))
- **docs:** Add how to generate pdfs. ([7b35550](https://github.com/lowdefy/lowdefy/commit/7b35550fa944995be8f8a9d0e809971cabcf12af))
- **docs:** Fix the iframe videos in the docs. ([c4a957a](https://github.com/lowdefy/lowdefy/commit/c4a957a12ea5adf018b373d8da8c5116e064205f))
- improvements on blog template. ([30e2291](https://github.com/lowdefy/lowdefy/commit/30e22917fed9932e43cde942532654aa4a6aeac6))
- **docs:** Add how to generate CSVs. ([2cc8e45](https://github.com/lowdefy/lowdefy/commit/2cc8e45b165aa755dceb9e40525f8a0511fb3485))

### Features

- **docs:** Add how to generate csv. ([3257f51](https://github.com/lowdefy/lowdefy/commit/3257f514b95f7cafb8ac30998194e7ae0a327862))
- **docs:** Add videos to how tos. ([57c7779](https://github.com/lowdefy/lowdefy/commit/57c77798f0356c606cf90bfd36a4f63ab8d0ff36))
- Add generate pdf how to. ([5bde460](https://github.com/lowdefy/lowdefy/commit/5bde460934e2dc94d677af5f287e3c85c0ff4c34))
- **docs:** Added switch operator documentation. ([7c42c78](https://github.com/lowdefy/lowdefy/commit/7c42c7882422ea89332b32bcef985b5bc5059ec8))

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

### Bug Fixes

- **cli:** Use renderer served from blocks server url if configured. ([69d14b4](https://github.com/lowdefy/lowdefy/commit/69d14b4a862827beac955a5039df225af689f297)), closes [#840](https://github.com/lowdefy/lowdefy/issues/840)
- **docs:** Fix AxiosHttp connection type spelling in docs. ([d9b53a0](https://github.com/lowdefy/lowdefy/commit/d9b53a034111bc65813d81c036376d05274ff6c7))

### Features

- Add `_array.reduce` examples. ([c9a6b50](https://github.com/lowdefy/lowdefy/commit/c9a6b50017c05774654388244b06076646449ce9))

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **docs:** Added CheckboxSwitch examples and CheckboxSelector note. ([9cf56bf](https://github.com/lowdefy/lowdefy/commit/9cf56bfbaa5c7a75c55d24d2f965ec351c1672e0))
- **docs:** Added copyable and ellipsis config to Title block. ([9f8632e](https://github.com/lowdefy/lowdefy/commit/9f8632ec577196ea45471470a9dd13d3dbc09446))
- **docs:** Change npx commands to specific versions for deployments. ([f2c380b](https://github.com/lowdefy/lowdefy/commit/f2c380b07a78defff79281d5c07c61a718bfe750))
- **docs:** Convert CLI commands to npx commands. ([c9cd643](https://github.com/lowdefy/lowdefy/commit/c9cd643f3809fdc0cde7ba47e17e392b3236c17b))
- **docs:** Update CLI npm install docs. ([98a8b71](https://github.com/lowdefy/lowdefy/commit/98a8b71ff2ef961ccfcb8b94e115b4162881dd38))

### Features

- **docs:** Add \_get operator switch example. ([b727b9e](https://github.com/lowdefy/lowdefy/commit/b727b9edd0f37d3d10d5add32cbd9411fa4b6f98))
- **docs:** Added CheckboxSwitch docs. ([81752aa](https://github.com/lowdefy/lowdefy/commit/81752aa927f1d6050a290440ca15a87c05f3ea51))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

### Features

- **docs:** Add Stripe documentation. ([ed963ec](https://github.com/lowdefy/lowdefy/commit/ed963ec823ef19e88ed8320d71b83a7eef2e6cfe))
- **docs:** Added Password Input block docs. ([ee8bda4](https://github.com/lowdefy/lowdefy/commit/ee8bda4a5bd6248c03433a720652d72c3b9ddbae))

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/docs

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

### Bug Fixes

- Downgrade mongodb driver to LTS version 3.6.12. ([24f94f6](https://github.com/lowdefy/lowdefy/commit/24f94f644256cfc4f1b09c3122f2525c58f1502c))

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

### Bug Fixes

- **docs:** Add missing hash docs. ([2520555](https://github.com/lowdefy/lowdefy/commit/2520555212b699bf58d9a01b5db996cb2f5b44cb))
- **docs:** Add responsive layout docs and video. ([5c31dac](https://github.com/lowdefy/lowdefy/commit/5c31dacda32ec8688dcf6605756c6a1262867adf))
- **docs:** Update node server docs. ([bb64d3e](https://github.com/lowdefy/lowdefy/commit/bb64d3e850b0c60a5129babbb5b144a577d8635d))

### Features

- **docs:** Added responsive setup to Layout Concepts. ([0635433](https://github.com/lowdefy/lowdefy/commit/0635433df47ff1fd1fe067231ea0a9ff4b3f652e))

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **docs:** Add basic full example for AxiosHttp. ([1e689d2](https://github.com/lowdefy/lowdefy/commit/1e689d2cf27d9d94c1202bd4f716369b7aea8313))
- **docs:** Reformat v3 and v5 uuid argument definitions. ([98cd626](https://github.com/lowdefy/lowdefy/commit/98cd626550734313fb0cd3ab1206a13d258064ca))
- **docs:** Update \_uuid docs. ([07178f1](https://github.com/lowdefy/lowdefy/commit/07178f1bd59d5fb52f94bcfd08f860026aaeb83d))
- **docs:** Updated docs to remove legacy v1, v4 uuid operators. ([8544dc9](https://github.com/lowdefy/lowdefy/commit/8544dc9e69bce7345099508bfec3042b5e8997bd))
- **docs:** Updated documented v3, v5 uuid function definitions. ([bd0e777](https://github.com/lowdefy/lowdefy/commit/bd0e777c9744e668d7bf25e5aeb2b293e6337464))
- Add array and object param types to v3 and v5 uuid methods. ([0a551e9](https://github.com/lowdefy/lowdefy/commit/0a551e9d9303c9f4e7a15e82b439ec6291c49187))

### Features

- **docs:** Add onMount and onMountAsync docs. ([a3c698d](https://github.com/lowdefy/lowdefy/commit/a3c698dde629b475a8d1858613f85a67c4ec13f6))
- **graphql:** Add https agent options to AxiosHttp connection. ([df94e01](https://github.com/lowdefy/lowdefy/commit/df94e0191bf5dfbc539a3703d2090331ef810c24)), closes [#794](https://github.com/lowdefy/lowdefy/issues/794)
- Add support for v1, v3, v4 and v5 to the \_uuid operator. ([c9ef4b9](https://github.com/lowdefy/lowdefy/commit/c9ef4b93fadf3dfa9b01ffb43fbd0375706bcb25))
- **operators:** Add \_hash operator. ([0d3244a](https://github.com/lowdefy/lowdefy/commit/0d3244af5b13633c640bc471ed72cb7df035b415))
- **operators:** Add RIPEMD-160 algorithm. ([3e07218](https://github.com/lowdefy/lowdefy/commit/3e07218df07737fce28de4525f8d1fc69702e729))
- **operators:** Add uuid to client, closes [#783](https://github.com/lowdefy/lowdefy/issues/783) ([6dc8d28](https://github.com/lowdefy/lowdefy/commit/6dc8d28608f18317986f21613af59a513d84cef8))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/docs

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

### Bug Fixes

- **docs:** Remove console log. ([41bc269](https://github.com/lowdefy/lowdefy/commit/41bc269d67c1d7d258ef5705fe845921068d3de1))

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

### Bug Fixes

- **docs:** Remove console log. ([41bc269](https://github.com/lowdefy/lowdefy/commit/41bc269d67c1d7d258ef5705fe845921068d3de1))

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

### Bug Fixes

- **build:** Fix unevaluated being passed to \_ref transformer. ([537a776](https://github.com/lowdefy/lowdefy/commit/537a77651220d7ffab117572c40ff790e296af56))

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **blocksAntd:** Add option to define `showTotal` as a string or function. ([9ac3fc9](https://github.com/lowdefy/lowdefy/commit/9ac3fc9711df889a1d58d83a68ed2e6baf8f0946))
- **docs:** Add more examples to Throw. ([8ef4bb3](https://github.com/lowdefy/lowdefy/commit/8ef4bb3349e2edf3d95ab5c7bb70fa34f70c318e))
- **docs:** Docs typo fixes. ([df5770d](https://github.com/lowdefy/lowdefy/commit/df5770d13b9ae539df7af09bf1f28a00dcd8b834))
- **docs:** Fix AxiosHttp examples, closes [#686](https://github.com/lowdefy/lowdefy/issues/686) ([1fc3329](https://github.com/lowdefy/lowdefy/commit/1fc33295f07a215f12b229557468cb49159addcc))
- **docs:** Fix custom blocks basePath typo. ([eaee5aa](https://github.com/lowdefy/lowdefy/commit/eaee5aa4bf6c745de08892ac99ecccec3137f66e))
- **docs:** Fix mongodb examples in docs. ([cde85b7](https://github.com/lowdefy/lowdefy/commit/cde85b7fb81b4a02e631ca4381c8212e581b7fd9))
- **docs:** Fix sentences on Validation docs. ([d5a5b7f](https://github.com/lowdefy/lowdefy/commit/d5a5b7f8e5ad818c19ecb75c6d40eb2d714042cc))
- **docs:** Remove documentation for eval option on \_ref. ([baf1090](https://github.com/lowdefy/lowdefy/commit/baf1090be7774d427be476411cca9167d28382c7))
- **docs:** Remove local types. ([282380a](https://github.com/lowdefy/lowdefy/commit/282380a75d83eb66464ebd0fb4fda44c53b7d2bd))
- **docs:** Sort endpoints alphabetically ([26ca2b7](https://github.com/lowdefy/lowdefy/commit/26ca2b7b2b107bdcb7c6fd1c5859e1bf89cbd3fe))
- **docs:** Update Netlify deployment steps ([071d402](https://github.com/lowdefy/lowdefy/commit/071d402dfbd06c6cf28b4d58388e2910adae43a4))
- Add \_number operator. ([1ca3966](https://github.com/lowdefy/lowdefy/commit/1ca3966495f96da9a66fa912a70703748c10d197))
- Fix Docker server docs ([5171320](https://github.com/lowdefy/lowdefy/commit/517132043f18dce96729252c2aaac90e204df5d7))

### Features

- **cli:** Add option to configure cli from the lowdefy.yaml file ([e4f62d0](https://github.com/lowdefy/lowdefy/commit/e4f62d0cf4784ec1ffb872f876469fc6beea0efd))
- **cli:** Add watch and watchIgnore options to dev command ([9eaf3e8](https://github.com/lowdefy/lowdefy/commit/9eaf3e8adb39eca7e7c7a9c8fe131776960002c8))
- **docs:** Add event debounce. ([e4c5db4](https://github.com/lowdefy/lowdefy/commit/e4c5db4abdf63fc27719bf72890393f33004ef43))
- **docs:** Add ResetValidation docs. ([289c762](https://github.com/lowdefy/lowdefy/commit/289c762696cdf35f28a53d8d7ce1c340f8ca3b9f))
- **docs:** Document \_ref resolver functions. ([446b383](https://github.com/lowdefy/lowdefy/commit/446b3833a9c3c861db609319ed11e1b14222327e))
- **docs:** Document basePath setting. ([aa9601c](https://github.com/lowdefy/lowdefy/commit/aa9601c84935c60ec36c9bf752e94fe75a8b8505))
- **docs:** Update docs for new Validation. ([a91a7c7](https://github.com/lowdefy/lowdefy/commit/a91a7c77e93f6ab20fd520b9aa9bd75ecbf9650d))
- **engine:** Add async tests and update docs. ([fd967b9](https://github.com/lowdefy/lowdefy/commit/fd967b929b4ab57a787b1e052c74334dfc54e87b))
- **engine:** Add Throw action. ([d2a23f0](https://github.com/lowdefy/lowdefy/commit/d2a23f0022aca6d9f0e330ef3652ad2a8f8364b7))
- **engine:** Document Lowdefy action functions in JsAction. ([7634145](https://github.com/lowdefy/lowdefy/commit/7634145286cdb8483bbcd151343bbcb6d5a0a65f))
- **graphql:** Updated mongo client to include connection options and documented command options. ([57127ee](https://github.com/lowdefy/lowdefy/commit/57127ee9240ae1e20fae109e4928048e232b9935))
- **graphql:** Updated mongodb to 4.1.0 and documented MongoDBAggregation options. ([3fefe99](https://github.com/lowdefy/lowdefy/commit/3fefe9974362485d752a9de1c940d5e3f44932ea))
- **operators:** Add basePath to \_location. ([eb95c8a](https://github.com/lowdefy/lowdefy/commit/eb95c8a64b2b7698f006750cd3639ee71dbbf4a9))
- **operators:** Add pageId and homePageId to \_location. ([00842d4](https://github.com/lowdefy/lowdefy/commit/00842d48153fc2b49ac6bd6cd88d73c3cce0c178))
- Add back option to link. ([b6cf705](https://github.com/lowdefy/lowdefy/commit/b6cf705d5c7e0b54a3c22d7a33116fc30dc9e191)), closes [#728](https://github.com/lowdefy/lowdefy/issues/728)
- Document node server. ([20dfb7d](https://github.com/lowdefy/lowdefy/commit/20dfb7db70868a0b2006f4f004736562acc480dc))
- Make blocks server URL configurable. ([65c9fe7](https://github.com/lowdefy/lowdefy/commit/65c9fe79b254bf5a20b87e0a2ec4fdcd1ecd5427)), closes [#670](https://github.com/lowdefy/lowdefy/issues/670)
- Update Elasticsearch docs ([8feb78b](https://github.com/lowdefy/lowdefy/commit/8feb78b3cc168da818b156349d389c66ae8ddef3))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

### Bug Fixes

- **docs:** Comment fixes on \_change_case operator ([b2a30e7](https://github.com/lowdefy/lowdefy/commit/b2a30e713661d687705bb5e02289e8b35402a0b9))
- **operators:** Fix regex in \_change_case operator. ([e4d577f](https://github.com/lowdefy/lowdefy/commit/e4d577f856e2bc96598ffc715170417855c8ad25))

### Features

- Update Elasticsearch docs. ([7b883e1](https://github.com/lowdefy/lowdefy/commit/7b883e123e9f8ebc6423ceafe8e2ad03ee20a761))
- **docs:** Add \_change_case operator docs. ([f57d7eb](https://github.com/lowdefy/lowdefy/commit/f57d7ebc8040ba42f4e85977e9a82ef50a28effb))

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

### Bug Fixes

- **blocksAntd:** Fix S3UploadButton block to new responses schema. ([37a15bf](https://github.com/lowdefy/lowdefy/commit/37a15bf6c56519565ef1b62e38dc021eeea71262))
- **docs:** Fix typo in mql example. ([22ca375](https://github.com/lowdefy/lowdefy/commit/22ca375a8eaa54f193f06614ddbdc049989a1d2c))

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

### Bug Fixes

- **docs:** Fix Dockerfiles in docs ([4f53889](https://github.com/lowdefy/lowdefy/commit/4f538899fa977f7f6ff9012f0ef8b889f3c5b661))
- **docs:** Reconnect docsearch after page change. ([48c26e8](https://github.com/lowdefy/lowdefy/commit/48c26e8236569eb28816a230d2984570698f7615))

### Features

- **docs:** Add algolia docsearch. ([e3c6de7](https://github.com/lowdefy/lowdefy/commit/e3c6de76e22c0e42b6ccb98a58f8efe472e4fc4d))
- **engine:** Add wait operator. ([40ead25](https://github.com/lowdefy/lowdefy/commit/40ead255054a731cc70e7bee31c61d2d20ef0caf)), closes [#625](https://github.com/lowdefy/lowdefy/issues/625)
- **operators:** Add support for dot notation in \_request operator. ([6ffaf46](https://github.com/lowdefy/lowdefy/commit/6ffaf4690227b5a9be47b4815c78d7dd15420238))

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/docs

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/docs

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

### Bug Fixes

- **docs:** Add lowdefy version in dockerfile warnings ([1672f24](https://github.com/lowdefy/lowdefy/commit/1672f241c67f64129c3e6138efa1830716b445e3))
- **docs:** Fix aws lambda docs. ([7136663](https://github.com/lowdefy/lowdefy/commit/7136663ae482e3f5a3b9bd775118264f707b1fd5))
- **docs:** Fix type in MongoDB docs. ([07de3e9](https://github.com/lowdefy/lowdefy/commit/07de3e94a5f54095c8a0c08d919a5ee39655d188))

### Features

- **docs:** Add docs for Docker and AWS Lambda deployment ([e57fa03](https://github.com/lowdefy/lowdefy/commit/e57fa0309eeddaa815b1a96f9f5c0cc6381b4323))

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/docs

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

### Bug Fixes

- **docs:** Restore docs to previous stable version ([ce1aac0](https://github.com/lowdefy/lowdefy/commit/ce1aac0ff428db74b1d00499100acfbfa47f9e52))

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/docs

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Bug Fixes

- **docs:** Add \_location operator. ([038977a](https://github.com/lowdefy/lowdefy/commit/038977aac5dcc18fb1a9f18266ee80be6bb1970e))
- **docs:** Add forceSubMenuRender to menu. ([a4b7abc](https://github.com/lowdefy/lowdefy/commit/a4b7abc76bcd9a92f509ff02bd86ed90234af423))
- **docs:** Add lowdefy versions to docs. ([5ff0e16](https://github.com/lowdefy/lowdefy/commit/5ff0e16d0d987f819f9e1eb9820fd756634e4a2f))
- **docs:** Fix baseUrl typo, closes [#607](https://github.com/lowdefy/lowdefy/issues/607) ([4b1e6ce](https://github.com/lowdefy/lowdefy/commit/4b1e6ceb9a80db324a56692072315baeaf4053d2))
- **docs:** Remove deprecated \_js wasm. ([8b00683](https://github.com/lowdefy/lowdefy/commit/8b00683c4f96bcbe9944a990f6c8b5ec3c2d9bb1))
- **docs:** Update docs for try catch actions. ([3d7969d](https://github.com/lowdefy/lowdefy/commit/3d7969d9f6b483211820598b2deb69701ad2ed08))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

**Note:** Version bump only for package @lowdefy/docs

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

### Bug Fixes

- **docs:** Split file hosting to separate concepts section. ([f802a6c](https://github.com/lowdefy/lowdefy/commit/f802a6ce351e3e4d562e29d0d407d814cf49b38f))

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/docs

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/docs

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

### Bug Fixes

- **build:** Add default locations for new blocks. ([544d1e1](https://github.com/lowdefy/lowdefy/commit/544d1e1d8459fb03294eb692f12116fa9f3904a5))

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- **docs:** Add alerts for client or server operators. ([bf5c9be](https://github.com/lowdefy/lowdefy/commit/bf5c9be5e672703c7e31f7a5a7228e492dd73e9c))
- **docs:** Add custom code concept. ([b0e63e1](https://github.com/lowdefy/lowdefy/commit/b0e63e1e2e7bcbdcec3c96692f694a8cd33e3b1d))
- **docs:** Add discord link. ([0a24af7](https://github.com/lowdefy/lowdefy/commit/0a24af75ebb682abf51556cafcab1c584e01053e))
- **docs:** Change to head.html. ([a7f20c4](https://github.com/lowdefy/lowdefy/commit/a7f20c4d238b520cf172934fd9df0c4f83d9157d))
- **docs:** Create modules/index and load filterDefaultValue. ([e45e5f1](https://github.com/lowdefy/lowdefy/commit/e45e5f1f80ccc256d668e92813b9e5415eccf6b7))
- **docs:** Document context initialization events for context blocks. ([a59bff5](https://github.com/lowdefy/lowdefy/commit/a59bff50f25b79d0468a4a6afc836f264c3263b2)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- **docs:** Fix custom block event actions history description. ([eb49803](https://github.com/lowdefy/lowdefy/commit/eb49803a48719c38a7d4cb0ff7d0540c0da25d75))
- **docs:** Import \_js.filterDefaultValue as operator. ([a6e2fe0](https://github.com/lowdefy/lowdefy/commit/a6e2fe036160d49b6c1994aee68326f88fc7c564))
- **docs:** Sitemap must be https. ([290b271](https://github.com/lowdefy/lowdefy/commit/290b271ec6b1cff3e89c3381ab741d913eea5688))
- **docs:** Updates to custom code docs. ([a4be530](https://github.com/lowdefy/lowdefy/commit/a4be53077afd6dbcf42f41473695f77d00ccd1a5))
- Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))

### Features

- add Tooltip to docs ([e79a876](https://github.com/lowdefy/lowdefy/commit/e79a876a30585d90532680d7229ee921b18a4ac1))
- **blockBasic:** Add Img block. ([c850cb3](https://github.com/lowdefy/lowdefy/commit/c850cb32061cf2a4c361aecc024fe699cc06c7e0))
- **docs:** Add \_actions operator. ([d5583d2](https://github.com/lowdefy/lowdefy/commit/d5583d200a809cc451d051a7ee16455f018beff9))
- **docs:** Add JsAction. ([19fd956](https://github.com/lowdefy/lowdefy/commit/19fd9563c038a16aabebbf5c0e9b3324efa5b9d4))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

### Bug Fixes

- **docs:** Add users object, general fixes. ([72c0e25](https://github.com/lowdefy/lowdefy/commit/72c0e25632061f90176e2e235ac06cc6a24b3f38))
- **docs:** Add user authorization docs. ([9f259fd](https://github.com/lowdefy/lowdefy/commit/9f259fdb90bf5e6160c86343ae3ad64ce58b959a))
- **docs:** Add user object and roles docs. ([ccc8138](https://github.com/lowdefy/lowdefy/commit/ccc8138d402e485fd05944436d9c52f661c9cae2))
- **docs:** Document protected pages. ([7a338b9](https://github.com/lowdefy/lowdefy/commit/7a338b9e96e331bf5aa3cb81977d264fc45eaf84))
- **docs:** Generate sitemap for docs. ([5a2e0cd](https://github.com/lowdefy/lowdefy/commit/5a2e0cdffbf9f03769dc32674a5b4e957c524428))
- **docs:** Remove OracleDB. ([0672aa8](https://github.com/lowdefy/lowdefy/commit/0672aa8486daf7a43a7cb004606e682ecc52339c))

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/docs

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- **docs:** Fix typo in docs. ([343553a](https://github.com/lowdefy/lowdefy/commit/343553ac4a94fd5fb867346628c8f3ea10341f06))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- **docs:** Add \_js operator to docs. ([b7b2135](https://github.com/lowdefy/lowdefy/commit/b7b21354fb9822914357f5924349640a7e712578))
- **docs:** Add \_ref.eval to docs. ([d90e02f](https://github.com/lowdefy/lowdefy/commit/d90e02f719f506cd03a99a099524b0f98df10345))
- **docs:** Make connection examples and secrets more consistant ([4c473a3](https://github.com/lowdefy/lowdefy/commit/4c473a3e6308d768cf7658758aa696fa2141aeb8))
- **docs:** Update \_js operator docs. ([1c00b36](https://github.com/lowdefy/lowdefy/commit/1c00b369e2cbf6c1c180159eabf979ade0b1f6d2))
- **docs:** Update docs to use \_js operator. ([91dda91](https://github.com/lowdefy/lowdefy/commit/91dda91eea03654c55c16c089c3583f62aea3c10))

### Features

- Update Knex docs for all suported databases. ([1b45b01](https://github.com/lowdefy/lowdefy/commit/1b45b01a647e8710bfa3a60e1a0142226a2f60e2))
- **docs:** Add Knex docs. ([7caefdc](https://github.com/lowdefy/lowdefy/commit/7caefdcd0240a71a884a9c006996b523d3ad589d))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/docs

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/docs

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/docs

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

### Bug Fixes

- **operators:** Add \_ne operator. ([d7b62e0](https://github.com/lowdefy/lowdefy/commit/d7b62e0b898d8948ab77d9800ec0b8afdd2d8503))

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

### Bug Fixes

- **blocksECharts:** Correct the remoteEntry path for ECharts. ([f99cccc](https://github.com/lowdefy/lowdefy/commit/f99cccc28df53bc00bcced137820e6e89b206f3a))

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/docs

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

### Features

- **docs:** Add docs for EChart block. ([9f7b31a](https://github.com/lowdefy/lowdefy/commit/9f7b31a809d8bcc04a67ada5ba941f1484a3c665))

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

### Bug Fixes

- **docs:** typo \_object.defineProperty docs. ([c99ef38](https://github.com/lowdefy/lowdefy/commit/c99ef387a7d749874eb0df00b244b9766c587283))
- **operators:** Add \_object.defineProperty operator. ([52f598f](https://github.com/lowdefy/lowdefy/commit/52f598fe8c8f93ebe93f0e1293057af0efa31e70))

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/docs

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/docs

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/docs

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- **blocks-antd:** Fix Descriptions bordered property default value ([c2503e1](https://github.com/lowdefy/lowdefy/commit/c2503e167a4185cf23f38955f66e0664fc0c5b1a))
- **docs:** Add a section on using JSON instead of YAML ([a709086](https://github.com/lowdefy/lowdefy/commit/a709086a8bd239f020cb9cf9228baeaf9d15fb93))
- **docs:** Add app schema image to docs public folder. ([df1c6c7](https://github.com/lowdefy/lowdefy/commit/df1c6c772e0465a20ab76f9494d45c29424e2b7b))
- **docs:** Add deployment tutorial video ([1e63ddd](https://github.com/lowdefy/lowdefy/commit/1e63ddd7d6e2307f53605e6ea7c4cd0a1844b232))
- **docs:** Typos. ([760abe6](https://github.com/lowdefy/lowdefy/commit/760abe6c0e1fa71c02ce1aa71dca7a97451294e9))
- **docs:** Update overview with diagram. ([e8087b7](https://github.com/lowdefy/lowdefy/commit/e8087b728a42444dcd491fd47a7abac82c405560))
- Update telemetry data field names. ([085e5cc](https://github.com/lowdefy/lowdefy/commit/085e5cc635f3eab2433f376de96af67a762f828f))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

### Bug Fixes

- **docs:** Add AgGrid reference to custom-blocks. ([c90f7b5](https://github.com/lowdefy/lowdefy/commit/c90f7b5a2665e1ded79cfaa9d4e2d78ecf3b4507))
- **docs:** Add docs README ([2747197](https://github.com/lowdefy/lowdefy/commit/2747197dc2f86bb00dfeaffec8426a080731184b))
- **docs:** Add links to example demos and code in next steps. ([1bb9569](https://github.com/lowdefy/lowdefy/commit/1bb9569b41ea0c048999a99bfabfbbf5710fad50))
- **docs:** Add netlify deploy section to docs. ([be82708](https://github.com/lowdefy/lowdefy/commit/be827081ac3e1344ab6f907b0c17f9155ae0a47d))
- **docs:** Add telemetry ([1d6c07e](https://github.com/lowdefy/lowdefy/commit/1d6c07eb4ae0ec0ccfcb0b263324d144fbc1fcb3))
- **docs:** add thank you message to footer. ([aa85e8a](https://github.com/lowdefy/lowdefy/commit/aa85e8a792f72a9d39239b69e7ba88ad8564278a))
- **docs:** Add tutorial videos ([9e07674](https://github.com/lowdefy/lowdefy/commit/9e07674f199d9254c95915730561e6a4f95e0239))
- **docs:** Docs and tutorial improvements ([28ef6df](https://github.com/lowdefy/lowdefy/commit/28ef6df6e85fc71817e68428814fb557fb365776))
- **docs:** Fix links and improve docs content ([3019495](https://github.com/lowdefy/lowdefy/commit/30194956a5057b631865ebe4c977b4e5be492367))
- **docs:** fix Request action call all requests documentation. ([c6593f3](https://github.com/lowdefy/lowdefy/commit/c6593f3ac90d723743e57e95b46e8abfe8de084c))
- **docs:** fix tutorial. ([8c9d30d](https://github.com/lowdefy/lowdefy/commit/8c9d30dea44ba0948512d570e222769bbe3e8264))
- **docs:** General docs fixes and improvements ([deddeb4](https://github.com/lowdefy/lowdefy/commit/deddeb4045cde7286c9b58f5881778c87260dd33))
- **docs:** Improve body markdown block ids in tutorial ([7e04786](https://github.com/lowdefy/lowdefy/commit/7e04786cff0b1a5fc9ed73a69fab8f54018c76a0))
- **docs:** Move deployment to the end of tutorial ([b934f9c](https://github.com/lowdefy/lowdefy/commit/b934f9c6bdb48e5d8bb1d86e4d3fdd63e1441809))
- **docs:** Post newsletter subsriptions to Lowdefy API. ([ed51ddb](https://github.com/lowdefy/lowdefy/commit/ed51ddb1d0d522640799a6ff9f1ee34701ae2712))
- **docs:** Remove unused template files ([be0546d](https://github.com/lowdefy/lowdefy/commit/be0546d102d332349fd4ba5e2bb7b6ada62cb92a))
- **docs:** Rename `validation` to `validate` in docs. ([147f8de](https://github.com/lowdefy/lowdefy/commit/147f8dec5bd04471b25ca40b8b6d08fe1642fad0))
- **docs:** Tutorial fixes ([3bc9a55](https://github.com/lowdefy/lowdefy/commit/3bc9a55c786a0ad827d9810c1c44abe8abc38978))
- **docs:** Update introduction. ([4f17f35](https://github.com/lowdefy/lowdefy/commit/4f17f35f58ebc59f4285357ec54811ea700e4c9f))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

### Bug Fixes

- **docs:** Add comment on LTS version. ([fdf4361](https://github.com/lowdefy/lowdefy/commit/fdf4361516f2b4c87d327406ad8ab89237df2117))
- **docs:** Add custom blocks. ([501664a](https://github.com/lowdefy/lowdefy/commit/501664ab1ce8d1e48d8a617fef626b4332d04814))
- **docs:** Add versions and updates section. ([168175e](https://github.com/lowdefy/lowdefy/commit/168175e149d46c06e4a854b4f413a123f795257d))
- **docs:** Update custom blocks concepts. ([f5bdd5d](https://github.com/lowdefy/lowdefy/commit/f5bdd5d2011cd5168d8322a25cfcb0d0eb7c808c))
- **graphql:** MongoDB updates can use aggregation pipelines. ([8e9653c](https://github.com/lowdefy/lowdefy/commit/8e9653c09ebe390b64d4071056e3b08b86a80471))

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **docs:** Add concepts pages for lists, secrets and deployment. ([fb93e33](https://github.com/lowdefy/lowdefy/commit/fb93e3369578daf8d99707c531ca55c22d4d227b))
- **docs:** CallMethod takes an array as input. ([a698d0b](https://github.com/lowdefy/lowdefy/commit/a698d0b13739dd5728f69c55a75f3c644828e475))

### Features

- **cli:** Rename @lowdefy/cli package to lowdefy ([b73777a](https://github.com/lowdefy/lowdefy/commit/b73777a18f379c8cb2ffef7007ba487d4d1c051e))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **docs:** Add docs for SendGridMailSend. ([3e19e4c](https://github.com/lowdefy/lowdefy/commit/3e19e4c05ed026873d9e65fda1a667f27073d9c3))
- **docs:** Add init menu for PageSiderMenu and PageHeaderMenu. ([2f8c6d2](https://github.com/lowdefy/lowdefy/commit/2f8c6d29c034576340ae05250811ae54a6f8ecde))
- **docs:** Add List and ControlledList. ([513a494](https://github.com/lowdefy/lowdefy/commit/513a494dc5c9273d346ef850f413bb6721134c89))
- **docs:** filterDefaultValue not to filter arrays. ([48ccc5c](https://github.com/lowdefy/lowdefy/commit/48ccc5c6005760a21845fc1cf30b08ef387f44dc))
- **docs:** Fixes to SendGridMail. ([4a6cd66](https://github.com/lowdefy/lowdefy/commit/4a6cd663f67057ce120e37fc9d0368c34badf577))
- **docs:** Improve blocks default value filter. ([8e722d1](https://github.com/lowdefy/lowdefy/commit/8e722d1120d8f25da6c9e897701137d90534aecc))
- **docs:** Improve example rendering in template. ([e528776](https://github.com/lowdefy/lowdefy/commit/e5287763e98959a9a559c040e92bd8f895b8293c))
- **docs:** Only recurse getNestedValue on objects. ([d6d3e04](https://github.com/lowdefy/lowdefy/commit/d6d3e0429829f12466fdab56c17af9cfc1cc61ec))
- **docs:** Remove and fix old block examples. ([11defbe](https://github.com/lowdefy/lowdefy/commit/11defbe4b2140ee78a2cec073b9e225bdc1ae24b))
- **docs:** Typos in AxiosHttp. ([5928330](https://github.com/lowdefy/lowdefy/commit/59283307518f24b41dd592879f3eeaefd4cd50f9))
- **docs:** Update \_format operator docs. ([8aa42aa](https://github.com/lowdefy/lowdefy/commit/8aa42aaed51ad49459e0dbf330685019b99d61df))
- **docs:** Update CallMethod docs with new usage. ([0f0f320](https://github.com/lowdefy/lowdefy/commit/0f0f320d180a2ebdb1ae8c1b29ca2afb4f1b0730))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **blocksAntd:** Update Anchor to use href spec. ([1b9a5b1](https://github.com/lowdefy/lowdefy/commit/1b9a5b1b4c43489be583968480403325c49fdca7))
- **docs:** Improve concepts docs. ([f982f83](https://github.com/lowdefy/lowdefy/commit/f982f8339dd8889ced1b53b000373baca58df06c))
- **docs:** Add 404 to general template. ([c31cb4b](https://github.com/lowdefy/lowdefy/commit/c31cb4b85a07b2708cf34271bfa221d0efcc5043))
- **docs:** Add Collapse, Tabs and MobileMenu blocks ([6db451b](https://github.com/lowdefy/lowdefy/commit/6db451b2a991b4e64d9b58e62c4670b4713a36c9))
- **docs:** Add container block docs. ([b490ec7](https://github.com/lowdefy/lowdefy/commit/b490ec767d6ab78c79f8b78836aee88f2f3b3f12))
- **docs:** Add context category block docs. ([39fb6c3](https://github.com/lowdefy/lowdefy/commit/39fb6c3b78eed52a114608186ad16b385cd43828))
- **docs:** Add examples to Progress. ([9169001](https://github.com/lowdefy/lowdefy/commit/9169001ab56763b6d9ee26d6c9e33705367b60b8))
- **docs:** Add filePath to all pages. ([b890a2a](https://github.com/lowdefy/lowdefy/commit/b890a2a6a18151f47c011707578358668c16b71a))
- **docs:** Fix content overflow on mobile. ([33c1abb](https://github.com/lowdefy/lowdefy/commit/33c1abb8c1992d0d48965e06641a59ef3fc00f7e))
- **docs:** Fix object propertiesGetterTransformer to assign to default object when null. ([31df2a4](https://github.com/lowdefy/lowdefy/commit/31df2a41204365fd898d10df89a89261193b3a0e))
- **docs:** fix schema on ScrollTo blockId example ([9c0b620](https://github.com/lowdefy/lowdefy/commit/9c0b620555990aab52f283965cbdab6b43176a76))
- **docs:** Fix selector value types for init_state_values. ([6cfd6a1](https://github.com/lowdefy/lowdefy/commit/6cfd6a1aa711113f31130940ff5eec5cf008a1f1))
- **docs:** Link to community in header. ([62da21b](https://github.com/lowdefy/lowdefy/commit/62da21b09ae545301312ddac4c5eec9ad27231c7))
- **docs:** Remove Skeleton for now. ([45d5b69](https://github.com/lowdefy/lowdefy/commit/45d5b69db11104af57e719e8a465960cc60f91fd))
- **docs:** Render value by default on color selectors. ([3db0f53](https://github.com/lowdefy/lowdefy/commit/3db0f53e5b839931be831b3d459e6cc236a728c8))
- **docs:** Update blocks template to one use schema variable. ([54aa7dc](https://github.com/lowdefy/lowdefy/commit/54aa7dc1a1b8ba67e596edb8b415cb28c8dff6c1))
- **docs:** Update blocks templates for context blocks ([8e7bd77](https://github.com/lowdefy/lowdefy/commit/8e7bd77ba2ced9f87b502f8876880eec9dc80259))
- **docs:** Update footer links to hrefs. ([787cfb0](https://github.com/lowdefy/lowdefy/commit/787cfb025eac722156954a7cba2bb8dee8b999b5))
- **docs:** Update templates with header and footer. ([e2a63fa](https://github.com/lowdefy/lowdefy/commit/e2a63fac3dbcc6bba9de3d7c53edbb82a32c9c8d))
- **operators:** Allow get from object to take an integer argument. ([e8bdbd9](https://github.com/lowdefy/lowdefy/commit/e8bdbd96a3bf776365d77f9c0800c3c732ea0fbe))

### Features

- **engine:** Rename Link action newWindow to newTab. ([35b47f6](https://github.com/lowdefy/lowdefy/commit/35b47f6d47338b3f93ae41a0fcd2046b5593db50))
- **operators:** Add \_index operator. ([995a912](https://github.com/lowdefy/lowdefy/commit/995a9128e38a27d4e2fdad8c7b6459ee2640c120))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/docs

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Features

- **docs:** Update blocks property getters. ([e68f774](https://github.com/lowdefy/lowdefy/commit/e68f774a5c6421b2b1136fc6943ffd0aaf0da498))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- **docs:** Events rename fixes. ([a43cd3d](https://github.com/lowdefy/lowdefy/commit/a43cd3d3b09d88261638539d5c0383f539e705dd))
- **docs:** Update docs for v3.5.0 ([969414d](https://github.com/lowdefy/lowdefy/commit/969414dcaf47039f8feb82034d25bf6bb4aa4e78))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **build:** Add types object to app schema. ([bd40748](https://github.com/lowdefy/lowdefy/commit/bd40748afcbe3c31d83b7c2f169db9ae1285ea5d))
- **docs:** Add default values and loading to blocks. ([fcadf76](https://github.com/lowdefy/lowdefy/commit/fcadf76edca9828c8bc0a511ca24cbbb20ccd219))
- **docs:** Catch null in filter_default_value. ([8975b0f](https://github.com/lowdefy/lowdefy/commit/8975b0f5cbc62e93d32b2ecf151d3c5ed5a822a7))
- **docs:** Change secret warning to Alert. ([9be4ef5](https://github.com/lowdefy/lowdefy/commit/9be4ef585204d143b547da0147a66a827a456956))
- **docs:** Concepts pages fixes and additions. ([fd6fba5](https://github.com/lowdefy/lowdefy/commit/fd6fba55d1d57d120b3fad6045b3d671b1bec0e8))
- **docs:** Convert propertiesFormTransform to work with objects. ([33042ba](https://github.com/lowdefy/lowdefy/commit/33042ba8e5a867338822ba1f4383bf458f801fa1))
- **docs:** Fix all date value_type. ([51e6b70](https://github.com/lowdefy/lowdefy/commit/51e6b70a50fa4dc2579cf9180f7b93284322cd07))
- **docs:** Fix connection docs formatting ([37ff0ce](https://github.com/lowdefy/lowdefy/commit/37ff0cea9345a9741409b28d753d3a0cb36b424b))
- **docs:** Fix lowdfey.yaml ([01cc8fc](https://github.com/lowdefy/lowdefy/commit/01cc8fc27538eec1f4fa5c24e9110949928785ab))
- **docs:** Fix merge conflict and S3UploadButton examples ([e496d8c](https://github.com/lowdefy/lowdefy/commit/e496d8c8de04879fc59810ca66cf4182b3788997))
- **docs:** Fix operator docs ([7bf5a6c](https://github.com/lowdefy/lowdefy/commit/7bf5a6c8759cfd66aab74ba05eb4cb4401563e65))
- **docs:** Improve default value filter for config yaml. ([e0cfc63](https://github.com/lowdefy/lowdefy/commit/e0cfc63d5379637fa16f086bfde1c9eb9c24983d))
- **docs:** Operator docs fixes. ([a36f31c](https://github.com/lowdefy/lowdefy/commit/a36f31cfed44920557123e485c045a44c0d25db9))
- **docs:** Operator docs improvements. ([919949f](https://github.com/lowdefy/lowdefy/commit/919949f4e6cdb1c44d10f543b2ee638b1070beee))
- **docs:** Remove text size setting from markdown blocks. ([58cf464](https://github.com/lowdefy/lowdefy/commit/58cf46432431b35b3cbdb0bc520b7402b88207b6))
- **docs:** Review cli and lowdefy-schema. ([4440ecf](https://github.com/lowdefy/lowdefy/commit/4440ecf7378ff1d404c1ef5f03c7910f3599e202))
- **docs:** Right align all label for blocks. ([9060988](https://github.com/lowdefy/lowdefy/commit/906098885c9bee6abdb52af4e70883f67074edfe))
- **docs:** Set initial values for new propertiesFormTransformer. ([01632c6](https://github.com/lowdefy/lowdefy/commit/01632c6796b17f8f458b8b7b5db459ae32dcc441))
- **docs:** Tutorial fixes ([6536cc0](https://github.com/lowdefy/lowdefy/commit/6536cc04c89a18fabb4c3961f22ad519cc2fa284))
- **docs:** Typo fixes on operators. ([d48d391](https://github.com/lowdefy/lowdefy/commit/d48d3918751d048f2ac81e33f4f595e073c12cdc))
- **docs:** Update concpets ortder. ([91a5450](https://github.com/lowdefy/lowdefy/commit/91a54500ceb1a74dd13a2a0083c289ff0dc66884))
- **docs:** Update template tests. ([391c36e](https://github.com/lowdefy/lowdefy/commit/391c36e6f4ec7434eb8eee64f0b809540014b8a2))
- concept pages typos and minor fixes ([f0df767](https://github.com/lowdefy/lowdefy/commit/f0df767c4073ebeebef9081da8c3f0aef33bfb7a))
- **docs:** Update connections docs. ([75ac999](https://github.com/lowdefy/lowdefy/commit/75ac999f75f321390389fea0fc4bccbd16515fbc))

### Features

- **docs:** Add \_array and \_string docs. ([ea2ad05](https://github.com/lowdefy/lowdefy/commit/ea2ad05051e79fa22f1225f891065fcb00df725a))
- **docs:** Add \_date, \_object and \_state docs. ([de2035a](https://github.com/lowdefy/lowdefy/commit/de2035a776336a49b2c94b10d7de77cded1aa354))
- **docs:** Add \_input, \_global, \_media, and \_url_query docs. ([9c81963](https://github.com/lowdefy/lowdefy/commit/9c81963ebe27556461f78a78908d9fcd88939329))
- **docs:** Add \_ref and \_var operators. ([420eef7](https://github.com/lowdefy/lowdefy/commit/420eef7593799e13b7c99072d3fd2f7294ccf42b))
- **docs:** Add \_secret, \_menu, \_get, \_event doc pages ([edd5b01](https://github.com/lowdefy/lowdefy/commit/edd5b01dc0fb9a9e60725229dc7006a80cb70908))
- **docs:** Add Alert, Anchor, Avatar and Breadcrumb docs. ([0983607](https://github.com/lowdefy/lowdefy/commit/098360766d95789232050bce9cdfa72ed3405beb))
- **docs:** Add all ColorSelector blocks. ([3913968](https://github.com/lowdefy/lowdefy/commit/3913968620e50e771a21adc452bbc4696b31efab))
- **docs:** Add all Selectors. ([f5e65ab](https://github.com/lowdefy/lowdefy/commit/f5e65ab4068e7c6bd413026b2adecb4e4563761e))
- **docs:** Add block schema transformer ([4cdf891](https://github.com/lowdefy/lowdefy/commit/4cdf89182ce8a81b86a30c84c637ac79e2f5e9ab))
- **docs:** Add blocks for Divider, Menu, Icon, Paragraph, Progress, Skeleton, Statistic. ([a2901ec](https://github.com/lowdefy/lowdefy/commit/a2901ec4b1d29a6973093db877a1ab1e741e4a17))
- **docs:** Add CLI docs page. ([75cc5ba](https://github.com/lowdefy/lowdefy/commit/75cc5babb9d4c3448d38cfb22ce886617016aabf))
- **docs:** Add concepts and next steps. ([f1b8055](https://github.com/lowdefy/lowdefy/commit/f1b80555b6102854b8b7f68450c29d09a0c0d44a))
- **docs:** add concepts docs. ([3b12dc9](https://github.com/lowdefy/lowdefy/commit/3b12dc955edc226fe548c11d5f63d08ae2e3612c))
- **docs:** Add DangerousMarkdown, Markdown, MarkdownWithCode blocks. ([963cfa2](https://github.com/lowdefy/lowdefy/commit/963cfa2ef242ce17650493e1748d87770918d384))
- **docs:** Add date selector docs. ([767f9ac](https://github.com/lowdefy/lowdefy/commit/767f9ac8f3ae0c0ac91bdcd12761c2155b0f5ec8))
- **docs:** Add docs for GoogleSheet connection. ([8d2ff5d](https://github.com/lowdefy/lowdefy/commit/8d2ff5d0dd12064d809989023ff4a2c788b32aa6))
- **docs:** Add docs for TextArea. ([102494e](https://github.com/lowdefy/lowdefy/commit/102494ea422bf980e0b1ab82a2535faab1311605))
- **docs:** Add gutter example to layout docs. ([4929366](https://github.com/lowdefy/lowdefy/commit/492936696ed549078a1b4da32ec29f4c00533e3f))
- **docs:** Add Html and DangerousHtml to docs. ([c6fb602](https://github.com/lowdefy/lowdefy/commit/c6fb6028ca869db960a4b611df18518f9e32ee63))
- **docs:** Add Html block to docs. ([0daff90](https://github.com/lowdefy/lowdefy/commit/0daff90433f74b4132d18d1818bf931593b173ce))
- **docs:** Add Lowdefy schema concept page. ([5d6c78c](https://github.com/lowdefy/lowdefy/commit/5d6c78c6823877f1d75fd0ef4c35d54f760e6d9b))
- **docs:** Add math operator page. ([1c29bda](https://github.com/lowdefy/lowdefy/commit/1c29bdaea2865fc70244526b3d1adaaf6be4618f))
- **docs:** Add NumberInput docs. ([b05cf14](https://github.com/lowdefy/lowdefy/commit/b05cf143fe687f51938019d235710bbbcd750359))
- **docs:** Add operator docs. ([47ad077](https://github.com/lowdefy/lowdefy/commit/47ad0774465261ce3db3f3454660cd3aca0a4ef8))
- **docs:** Add operator docs. ([606346a](https://github.com/lowdefy/lowdefy/commit/606346aeaba441608b8163036f8d395095b61794))
- **docs:** Add operator docs. ([e164d7d](https://github.com/lowdefy/lowdefy/commit/e164d7d4d016218ade6096a85bc97b22733de4e4))
- **docs:** Add optionsSelector displayType. ([572a63d](https://github.com/lowdefy/lowdefy/commit/572a63d5de8a03f4e22d4a523edd118ca8bb6eb0))
- **docs:** Add Pagination to docs. ([83a96ab](https://github.com/lowdefy/lowdefy/commit/83a96ab340d52038ddee03dce554e54af476b7df))
- **docs:** Add RatingSlider to docs. ([f64e363](https://github.com/lowdefy/lowdefy/commit/f64e363691d9e1c8a2ddde92f29c7f5f5d48681e))
- **docs:** Add S3UploadButton docs. ([c024488](https://github.com/lowdefy/lowdefy/commit/c024488b6b4d71e500c480889d1116cd6ef5266f))
- **docs:** Add schemas for connections, requests, action. ([f061f96](https://github.com/lowdefy/lowdefy/commit/f061f9684e5b70b3934db34169b9a4834eb76d9f))
- **docs:** Add Switch block. ([7da2dfb](https://github.com/lowdefy/lowdefy/commit/7da2dfb092e72cc89e2b739ae1db336fed188380))
- **docs:** Add Title block. ([adaa229](https://github.com/lowdefy/lowdefy/commit/adaa229df2e5d9c138770dfe289f9cdb80e9c1b5))
- **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))
- **docs:** Add validation to blocks. ([c841b8a](https://github.com/lowdefy/lowdefy/commit/c841b8a172ad075fc2cca178f152a0d26a6436c7))
- **docs:** Block loading. ([a64c488](https://github.com/lowdefy/lowdefy/commit/a64c4888a6ed256eb2ae2e811c9c0a90e3d46e23))
- **docs:** Context data object init. ([f757eb2](https://github.com/lowdefy/lowdefy/commit/f757eb2c22afcaf9d413aceba10b3cd12c8365ae))
- **docs:** Docs improvements ([529e924](https://github.com/lowdefy/lowdefy/commit/529e92498758abdfec345414723278cb595359f3))
- **docs:** Finalize the Lowdefy introduction. ([938e6fc](https://github.com/lowdefy/lowdefy/commit/938e6fc7b488bc430e29590e39f222098836d9fe))
- **docs:** Init Blocks concept. ([acf7a0c](https://github.com/lowdefy/lowdefy/commit/acf7a0c99e8e52824dbee111d4e2142cf53e075a))
- **docs:** Init docs. ([99cdadd](https://github.com/lowdefy/lowdefy/commit/99cdadd8247b6f114c19d5169d850a445f062bf9))
- **docs:** Make propertiesFormTransformer work with arrays. ([9967d73](https://github.com/lowdefy/lowdefy/commit/9967d731843db28e1181e132d3d5fc7fe057d124))
- **docs:** Move tutorial content from md files to page yaml file ([30f5286](https://github.com/lowdefy/lowdefy/commit/30f528610d8324b49b949119a1f62107d4967883))
- **docs:** Nest layout examples in a Collapse. ([689a8d3](https://github.com/lowdefy/lowdefy/commit/689a8d3d11f731c4348406922c8bda29dc433442))
- **docs:** Overview and operators concepts pages. ([b298dd4](https://github.com/lowdefy/lowdefy/commit/b298dd4104da85dcbee0c78b54b472dfd4feb04f))
- **docs:** TDLR for blocks. ([ef1954b](https://github.com/lowdefy/lowdefy/commit/ef1954b219330457989daa9b778b38f583fab574))
- **docs:** Update actions doc pages. ([ae01776](https://github.com/lowdefy/lowdefy/commit/ae01776b34bda10947160c5adfb98312df156593))
- **docs:** Update blocks concepts. ([19ccf72](https://github.com/lowdefy/lowdefy/commit/19ccf7232e3d0c70724655f204233128eb8a75cd))
- **docs:** Update blocks page template to use transformers ([158539e](https://github.com/lowdefy/lowdefy/commit/158539ef517c4accd35ac3f77830dd43c781bf3c))
- **docs:** Update concepts ([04bfcef](https://github.com/lowdefy/lowdefy/commit/04bfcefe15668c1f702a7351f9dbd32d649ff6bc))
- **docs:** Update Connections and Requests. ([6600773](https://github.com/lowdefy/lowdefy/commit/6600773517669f1824199fafd2d89ecbf893a4ae))
- **docs:** Update context to context-and-state ([d6b0081](https://github.com/lowdefy/lowdefy/commit/d6b00810993b24f460422af92e2745c0fb040cfd))
- **docs:** Update defaultValueTransformer to pull nested defaults from schemas. ([4ecb396](https://github.com/lowdefy/lowdefy/commit/4ecb3962ee9f4091f0e72975d816fa663940d3f8))
- **docs:** Update events-and-actions. ([a09bb11](https://github.com/lowdefy/lowdefy/commit/a09bb114f38d352cda37e26b146d29f0bcbe3923))
- **docs:** Update Layout. ([3d920e6](https://github.com/lowdefy/lowdefy/commit/3d920e61f83531eaff56303e856b6aeddee9685f))
- **docs:** Update operator docs template for methods. ([03be26f](https://github.com/lowdefy/lowdefy/commit/03be26f8feb569bcf12dfc5ac915b93d2d819427))
- **docs:** Update operator docs. ([a31009c](https://github.com/lowdefy/lowdefy/commit/a31009cd7e0a1b6b9020659ef342e7a4f23d71e2))
- **docs:** Update tutorial. ([2c9cb61](https://github.com/lowdefy/lowdefy/commit/2c9cb61c091fc415892d20a34308436145245f62))
- **docs:** Update tutorial. ([b58e95d](https://github.com/lowdefy/lowdefy/commit/b58e95dc1e6d00a6619a5a966d888448dfb962ce))
- **docs:** Use transformer fn to create properties from block schema ([faad65c](https://github.com/lowdefy/lowdefy/commit/faad65cae33e5ea92304a7fa854463a436c2557c))
- **operators:** Add \_function operator. ([07f7e6f](https://github.com/lowdefy/lowdefy/commit/07f7e6f68ff90c742bb6fb7403bfc53cb0593cb7))
- **operators:** Add array methods that use functions. ([49f6a93](https://github.com/lowdefy/lowdefy/commit/49f6a9301e793181f7460bcdddd670969c26fd34))
