---
'@lowdefy/blocks-antd': minor
---

feat: Tabs block now supports per-tab dynamic events.

Each entry in the Tabs `tabs[]` array can declare an `eventName`. When that tab becomes active, the named event is triggered (with `{ key }` of the now-active tab) in addition to the generic `onChange`. This mirrors the per-button `eventName` pattern used by the AgGrid blocks and lets each tab run its own actions without branching inside `onChange`.

The Tabs event surface is `onChange` (fires on any tab change → `{ activeKey }`) plus these per-tab events.

```yaml
- id: settings_tabs
  type: Tabs
  properties:
    tabs:
      - key: profile
        title: Profile
        eventName: onProfileTab
      - key: billing
        title: Billing
        eventName: onBillingTab
  events:
    onChange: # fires on any tab change → { activeKey }
      - id: log_change
        type: SetState
        params:
          activeTab:
            _event: true
    onProfileTab: # fires only when the Profile tab is selected → { key }
      - id: load_profile
        type: Request
        params: get_profile
    onBillingTab:
      - id: load_billing
        type: Request
        params: get_billing
```
