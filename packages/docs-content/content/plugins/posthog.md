# PostHog

The `@lowdefy/plugin-posthog` plugin adds [PostHog](https://posthog.com) product analytics to a Lowdefy app. It wraps the `posthog-js` browser SDK in a set of actions: initialise PostHog, capture events, identify people and groups, manage consent and read feature flags.

The plugin bundles `posthog-js` as a module, so no script tag, snippet or reverse proxy configuration is needed.

## Install

The `@lowdefy/plugin-posthog` package is included by default, so no `plugins` entry is needed in `lowdefy.yaml`. The `posthog-js` SDK is loaded lazily: it is downloaded the first time [`PostHogInit`](/PostHogInit) runs with PostHog enabled, so an app with analytics switched off never downloads or runs it.

## Initialise PostHog

The [`PostHogInit`](/PostHogInit) action loads and configures `posthog-js`. Every other action in this package does nothing until it has run. Run it from the app's root `events.onInitAsync` in `lowdefy.yaml`: app events run once per app load, on whichever page a user opens first, including public pages outside a layout, and `onInitAsync` does not hold the first render. Keep the actions in one file:

```yaml
# lowdefy.yaml
events:
  onInitAsync:
    _ref: shared/posthog_init.yaml
```

```yaml
# shared/posthog_init.yaml
- id: init_posthog
  type: PostHogInit
  params:
    apiKey:
      _build.env: POSTHOG_API_KEY
    enabled:
      _build.ne:
        - _build.env: POSTHOG_API_KEY
        - null
    options:
      capture_pageview: history_change
      person_profiles: identified_only
- id: identify_person
  type: PostHogIdentify
  params:
    id:
      _user: id
```

A user who signs in later is identified on the reload that follows sign in.

`PostHogInit` is idempotent. The first call downloads and initialises `posthog-js`; later calls with the same `apiKey` do nothing, so an app that runs it from every page's `onInit` instead still loads PostHog once and captures each failure once. Calling it with a different `apiKey` throws, because a second PostHog instance would split the session.

The PostHog project API key is a public, write only key that is meant to ship in the browser bundle, so [`_build.env`](/_build) is the right operator for it. Never use a personal API key here.

###### Turning analytics off

With `enabled: false`, `PostHogInit` does not load `posthog-js` and every other action in this package becomes a silent no-op, so `apiKey` is not required. The example above sets `enabled` from the key itself: leave `POSTHOG_API_KEY` unset in local development and set it in the deployments that should send data. Any other build time switch works too, for example a `POSTHOG_ENABLED` environment variable:

```yaml
enabled:
  _build.eq:
    - _build.env: POSTHOG_ENABLED
    - 'true'
```

A later `PostHogInit` call with `enabled: true` and an `apiKey` still loads PostHog after a disabled call. The reverse throws: once PostHog is running, use [`PostHogOptOut`](/PostHogOptOut) to stop capturing for a person.

## Lowdefy semantics on every event

Autocapture records the DOM: which element was clicked, and its text. The plugin adds what that element means in the Lowdefy app, so analysis can work in pages, blocks and events instead of CSS selectors:

- __Autocaptured clicks, rage clicks and dead clicks__ get `lowdefy_page_id`, `lowdefy_block_id` (the block clicked), `lowdefy_block_type` (for example `Button`), `lowdefy_block_ids` (every enclosing block, innermost first, so a click on a title inside a clickable card also names the card), `lowdefy_option: true` when a dropdown option was picked, `lowdefy_text` (the text of the control the click reached, such as a button or menu item, even when the click landed on its icon or a wrapper, where `$el_text` holds only the clicked element's own text) and, inside a grid, `lowdefy_row` (the displayed row index) and `lowdefy_column` (the column id).
- __Every other event__, pageviews and [`PostHogCapture`](/PostHogCapture) events included, gets `lowdefy_page_id`, read from the URL it was captured on, and `lowdefy_path_params`, the path values of a page with a `path` pattern (`{}` otherwise).
- __Super properties__: `lowdefy_build_id` and `lowdefy_app_version` (the app's `version`) on every event, beside `environment`.

Null, false and empty values are left out. The enrichment adds properties, never events, so it costs nothing in billing, and it has no switch. A block with the `ph-no-capture` class is not autocaptured, so it is never enriched.

###### Failed events

When a block or app event fails, for example a `Validate` that finds invalid fields or a `CallAPI` that times out, the plugin captures one `lowdefy_event_failed` event. It is the one event the plugin adds. It carries ids only, never error messages or values:

| Property | Value |
| --- | --- |
| `lowdefy_event_scope` | `page`, or `app` for the app's root events |
| `lowdefy_page_id` | the page the event ran on |
| `lowdefy_path_params` | the path values of the page the event ran on |
| `lowdefy_block_id` | the block, or `app` for an app event |
| `lowdefy_block_type` | the block type, left out for an app event |
| `lowdefy_event_name` | for example `onClick` or `onInit` |
| `lowdefy_debounce_ms` | the event's debounce, or `0` |
| `lowdefy_action_id` | the id of the action that failed |
| `lowdefy_action_type` | for example `Validate` or `CallAPI` |
| `lowdefy_error_name` | for example `UserError` or `RequestError` |
| `lowdefy_config_key` | the config key of the action, resolvable with `lowdefy_build_id` |
| `lowdefy_invalid_blocks` | the blocks a `Validate` found invalid, left out when empty |

The event is timestamped when the failed event's actions started, so it lines up with the click that caused it. A failure in the app's `onInit`, such as a startup `CallAPI` that times out, is captured too, although `PostHogInit` runs later in `onInitAsync`: Lowdefy holds up to 20 failures until PostHog starts. At most 50 are captured per app load. Set `captureEventFailures: false` on `PostHogInit` to turn it off.

###### Querying

In a PostHog SQL insight, the properties read like any other:

```sql
select properties.lowdefy_page_id as page, properties.lowdefy_block_id as block, count() as clicks
from events
where event = '$autocapture' and properties.lowdefy_block_id is not null
  and timestamp > now() - interval 7 day
group by page, block
order by clicks desc
```

```sql
select properties.lowdefy_page_id as page, properties.lowdefy_block_id as block,
  properties.lowdefy_action_type as action, count() as failures
from events
where event = 'lowdefy_event_failed' and timestamp > now() - interval 7 day
group by page, block, action
order by failures desc
```

###### Journeys from production

`lowdefy journeys pull posthog` reads these events back to your machine over PostHog's query API, so [journeys can be mined from production](/config-tests#production-journeys): compiled into candidate tests, checked for how much real use backs each journey, and compared with what users do that no journey covers. It needs `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` and your own personal API key with the Query Read scope in `POSTHOG_PERSONAL_API_KEY`; see the [CLI reference](/cli#journeys-pull-posthog).

What reaches your machine, in `.lowdefy/traces/production/`, which is not committed: no typed values (PostHog never captured them), person and organisation ids hashed with a salt that stays on your machine, URL query parameter names without their values, and no clicked text. The clicked element's text is stored only as a token, a hash under the same salt; the journey commands turn a token back into text only when it is text from the app's own config, such as a button label or a menu item. The element chain is read in memory and never written. PostHog itself only holds the clicked text the app's config spells out, unless `maskDataText` is `false` (see [Click text masking](#click-text-masking)), so a production record of a click on data carries its page, block, row and column but no text. Events from before the Lowdefy properties above were added still count: the pull reads the block ids from the element chain instead.

Every event the plugin enriches names its page in `lowdefy_page_id`, so the pull never guesses it. A failed app event names the page the app loaded on, including a configured home page served at the app root (`/`). Events from before the Lowdefy properties were added carry no page id, so the pull reads the page from the URL path. That reading assumes the app is served at the root and that `/` only redirects: older events from an app with a `basePath`, or from a home page served at `/`, are dropped.

## Click text masking

By default, `posthog-js` sends the text of every element a person clicks. In a business app that text is often data: a customer's name in a grid row, an account picked from a dropdown filled by a request. The plugin masks that text in the browser, before any event is sent, and keeps the text the app's config spells out.

###### What is masked

On every event, whatever its name (autocaptured clicks, rage clicks, dead clicks and swipes, copy events and any event `posthog-js` adds later):

- __Text that is not config text.__ Each clicked text (`$el_text`, `lowdefy_text`, the `text` entries of `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when it equals, after whitespace is collapsed, a string in the config of the page the event was captured on, in the app's menus, in the i18n messages or in the antd locale. Everything else is removed: grid and table cell values, options and menu items a request fills, labels built from records, and anything a `Dynamic` block's endpoint returned. A link whose target is not config text keeps its `href` attribute, emptied, so the click still reads as a link click.
- __Element attributes outside a structural allow-list.__ Only the tag, classes, `class`, `role`, `type`, `row-index`, `col-id`, `nth-child` and `nth-of-type` are kept, and `id` only when it is a block's wrapper id (`bl-<blockId>`). Other ids are removed, because ids that libraries generate can embed runtime keys: an antd tab is `rc-tabs-<n>-tab-<key>`, so a `Tabs` block keyed by record would send the record. Every other attribute is removed, including `title` (antd select options carry their label there), `aria-label`, `value`, `placeholder`, `alt` and every `data-*` attribute.

###### What stays

- Config labels: button titles, menu and tab labels, column headers, card titles, literal option labels, and antd's own strings such as modal __OK__ and __Cancel__ or pagination.
- Every other `lowdefy_*` property, so a click on data still records its page, block, row, column and whether it picked an option.

A data value that happens to equal a config string, such as a status `Active` that is also a literal option, is kept: that string is already in config shipped to every visitor of the page.

###### What is not masked

URLs. `$current_url`, `$pathname`, URL query values and `lowdefy_path_params` still reach PostHog unchanged, so keep names and other personal data out of page paths and query parameters.

###### Changing it

- `maskDataText: false` on [`PostHogInit`](/PostHogInit) sends full click text and every attribute, as `posthog-js` does by default.
- `options.mask_all_text: true` sends no click text at all, config labels included.
- A block `class` of `ph-sensitive` masks that block's config text too. It covers only the block's own DOM: popups a block renders into the page body, such as `Dropdown` and `DropdownButton` items, table and grid `MenuCell` menus, `Modal` and `Drawer`, are outside it.

Two things are left to the app:

- Classes are sent as they are, so never build a block's `class` from data.
- A `data-ph-capture-attribute-<name>` attribute is how `posthog-js` lets an app add a property to a click: its value is sent unmasked as property `<name>`. Only put config values in it.

###### Session replay

Session replay is separate from click events and is not covered by this masking. When the PostHog project turns recordings on, replay records the page's text (inputs are masked by `posthog-js` by default). Set `options.session_recording.maskTextSelector: '*'` to mask all text in recordings, or give a block a `class` of `ph-mask` to mask one block.

## Analytics never breaks the app

Every action in this package, except `PostHogInit`, does nothing and returns `null` when PostHog is disabled or `posthog-js` could not be downloaded. A disabled environment or a flaky network can never throw from an analytics action and can never stop an event chain. [`PostHogFeatureFlag`](/PostHogFeatureFlag) returns its configured `default` instead of `null`, so flag driven config keeps working with PostHog switched off, and [`PostHogReloadFeatureFlags`](/PostHogReloadFeatureFlags) returns `{ flags: [], variants: {} }`.

Two kinds of config mistake are still reported:

- __Invalid params__ always throw, whether PostHog is enabled or not, so a mistake shows up in development even when analytics is switched off there.
- __A PostHog action that runs before `PostHogInit`__ does nothing, and logs a warning to the browser console once.

An action that runs while `PostHogInit` is still downloading `posthog-js` waits for it to finish.

## Never send personal data

Never send personally identifiable information to PostHog: no names, no email addresses, no phone numbers, and no free text a user typed into a form. Send stable ids and low cardinality attributes such as a plan name, a role, a locale or an organization id.

## Pageviews

A Lowdefy app routes on the client without a page load, so the `posthog-js` default, `capture_pageview: true`, only captures the first page. Set `capture_pageview: history_change` in the `PostHogInit` options, as in the example above, and `posthog-js` captures a `$pageview` every time the path changes. It also captures a `$pageleave` when the tab is closed, which PostHog needs for bounce rate and time on page.

To capture pageviews by hand instead, for example to add properties to them, set `capture_pageview: false` and run [`PostHogPageview`](/PostHogPageview) from each page's `onMountAsync` event, which runs every time the page is shown without holding it in a loading state:

```yaml
# pages/reports.yaml
id: reports
type: PageHeaderMenu
events:
  onMountAsync:
    - id: capture_pageview
      type: PostHogPageview
      params:
        properties:
          section: reports
```

With automatic pageviews off, `posthog-js` also stops capturing pageleaves, because `capture_pageleave` defaults to `if_capture_pageview`. Set `capture_pageleave: true` in the options to keep them, or capture one by hand with [`PostHogCapturePageLeave`](/PostHogCapturePageLeave), for example before a `Link` or `Logout` action. The page `onHidden` event is not a page leave: it also fires when the browser window loses focus.

## Identify a person

[`PostHogIdentify`](/PostHogIdentify) ties the current browser session to a person. Run it once the user is known, usually right after `PostHogInit` in the app's `onInitAsync` actions, as in the example above, or after a successful login.

```yaml
- id: identify_person
  type: PostHogIdentify
  params:
    id:
      _user: id
    properties:
      role:
        _user: role
      locale:
        _locale: active
```

A missing or empty `id` is a no-op, so on a public page the anonymous session is left alone. That anonymous session is what a later `PostHogIdentify` merges into the person, which is what makes signup funnels work. `null` and `undefined` property values are dropped, so an absent value never overwrites one PostHog already has.

The action is safe to run on every page. It reads the identity `posthog-js` already holds:

- __Same person__: when the id is already the current `distinct_id`, it only updates the person properties, if any are given. `posthog-js` skips a property update identical to the previous one.
- __Person swap__: PostHog refuses to move an identified `distinct_id` onto a different person, so when the browser is identified as someone else, `PostHogIdentify` calls `reset()` before identifying the new person.
- __Anonymous visitor__: identified without a reset, so the anonymous session merges into the person.

Use [`PostHogSetPersonProperties`](/PostHogSetPersonProperties) to update a person's properties on their own, and [`PostHogAlias`](/PostHogAlias) to point a second id at the person PostHog already knows.

## Sign out

[`PostHogReset`](/PostHogReset) forgets the current person and starts a fresh anonymous session. Run it on sign out so the next person on a shared browser is not merged into this one.

```yaml
- id: reset_posthog
  type: PostHogReset
- id: logout
  type: Logout
```

## Capture events

[`PostHogCapture`](/PostHogCapture) captures a named product event.

```yaml
- id: submit_report
  type: Button
  properties:
    title: Submit report
  events:
    onClick:
      - id: submit
        type: Request
        params: submit_report
      - id: capture_event
        type: PostHogCapture
        params:
          event: report_submitted
          properties:
            report_type:
              _state: report_type
```

Autocapture already records clicks and pageviews, so keep the set of named events small. Every event is billable, and a funnel of thirty near identical events tells you less than one of five.

## Groups

[`PostHogGroup`](/PostHogGroup) associates the current person with a group, so events can be analysed per organization, team or account. The association sticks until `PostHogReset` is called, so run it after `PostHogIdentify`.

```yaml
- id: set_group
  type: PostHogGroup
  params:
    type: organization
    key:
      _user: organizationId
```

## Feature flags

[`PostHogFeatureFlag`](/PostHogFeatureFlag) reads a feature flag and returns its value, so it can be used further down the action chain with the [`_actions`](/_actions) operator. The value is whatever PostHog resolved for this person when flags were last loaded; the action does not wait for a network call. When the person or their groups just changed, reload the flags first with [`PostHogReloadFeatureFlags`](/PostHogReloadFeatureFlags), which resolves once the new flags have arrived.

```yaml
events:
  onMount:
    - id: read_flag
      type: PostHogFeatureFlag
      params:
        key: new-checkout
        default: control
    - id: store_flag
      type: SetState
      params:
        checkout_variant:
          _actions: read_flag.response
```

After a change that affects flag targeting, reload before reading:

```yaml
- id: switch_organization
  type: Button
  events:
    onClick:
      - id: set_group
        type: PostHogGroup
        params:
          type: organization
          key:
            _state: organization_id
      - id: reload_flags
        type: PostHogReloadFeatureFlags
      - id: store_flags
        type: SetState
        params:
          feature_flags:
            _actions: reload_flags.response.variants
```

## Consent

When consent is required before any data is sent, initialise PostHog with capturing switched off, and turn it on with [`PostHogOptIn`](/PostHogOptIn) when the user accepts, or keep it off with [`PostHogOptOut`](/PostHogOptOut):

```yaml
# shared/posthog_init.yaml
- id: init_posthog
  type: PostHogInit
  params:
    apiKey:
      _build.env: POSTHOG_API_KEY
    options:
      capture_pageview: history_change
      opt_out_capturing_by_default: true
```

```yaml
# the consent banner
- id: accept_analytics
  type: Button
  properties:
    title: Accept
  events:
    onClick:
      - id: opt_in
        type: PostHogOptIn
```

The choice is remembered in the persistence store configured on `PostHogInit`.

## Actions

| Action | Params | Response |
| --- | --- | --- |
| [`PostHogInit`](/PostHogInit) | `apiKey`, `apiHost`, `options`, `debug`, `enabled`, `captureEventFailures`, `maskDataText` | `null` |
| [`PostHogCapture`](/PostHogCapture) | `event`, `properties`, `groups` | `null` |
| [`PostHogPageview`](/PostHogPageview) | `properties` | `null` |
| [`PostHogCapturePageLeave`](/PostHogCapturePageLeave) | `properties` | `null` |
| [`PostHogIdentify`](/PostHogIdentify) | `id`, `properties`, `propertiesOnce` | `null` |
| [`PostHogSetPersonProperties`](/PostHogSetPersonProperties) | `set`, `setOnce` | `null` |
| [`PostHogAlias`](/PostHogAlias) | `alias` | `null` |
| [`PostHogGroup`](/PostHogGroup) | `type`, `key`, `properties` | `null` |
| [`PostHogReset`](/PostHogReset) | `resetDeviceId` | `null` |
| [`PostHogOptIn`](/PostHogOptIn) | none | `null` |
| [`PostHogOptOut`](/PostHogOptOut) | none | `null` |
| [`PostHogFeatureFlag`](/PostHogFeatureFlag) | `key`, `default`, `enabled`, `payload` | the flag value, or `default` |
| [`PostHogReloadFeatureFlags`](/PostHogReloadFeatureFlags) | `timeout` | `{ flags, variants }` |
