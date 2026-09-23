# PostHogCapture

```
(params: {
  event: string,
  properties?: object,
  groups?: object,
}): Promise<null>
```

The `PostHogCapture` action captures a named product event in [PostHog](https://posthog.com).

Autocapture already records clicks and pageviews, so keep the set of named events small. Every event is billable, and a funnel of thirty near identical events tells you less than one of five. Never send personally identifiable information as a property.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `event: string`: __Required__ - The event name. Snake case names that read as a completed action, like `report_submitted`, work best in funnels.
  - `properties: object`: Event properties.
  - `groups: object`: Groups to attach to this one event, as `{ groupType: groupKey }`. Sent to PostHog as the `$groups` property.

#### Examples

###### Capture an event after a request:
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
            line_item_count:
              _array.length:
                _state: line_items
```
