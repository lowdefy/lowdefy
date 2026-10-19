# PostHogPageview

```
(params: {
  properties?: object,
}): Promise<null>
```

The `PostHogPageview` action captures a `$pageview` event by hand.

A Lowdefy app routes on the client without a page load, so the `posthog-js` default only captures the first page. The simplest fix is to set `capture_pageview: history_change` in the [`PostHogInit`](/PostHogInit) options, which captures a pageview on every navigation, and not use this action at all. Use `PostHogPageview` when pageviews need extra properties or tighter control: set `capture_pageview: false` and run it from each page's `onMountAsync` event.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `properties: object`: Properties to add to the `$pageview` event.

#### Examples

###### Capture pageviews by hand:
```yaml
id: reports
type: PageHeaderMenu
events:
  onInit:
    _ref: shared/posthog_init.yaml # PostHogInit with options.capture_pageview: false
  onMountAsync:
    - id: capture_pageview
      type: PostHogPageview
      params:
        properties:
          section: reports
```
