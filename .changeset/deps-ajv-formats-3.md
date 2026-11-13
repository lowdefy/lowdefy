---
'@lowdefy/ajv': major
---

fix(deps)!: Update ajv-formats to 3.0.1

JSON Schema validation now uses ajv-formats 3. The `date-time` and `time` formats require a timezone, as RFC 3339 and the JSON Schema spec say. `2026-05-13T10:00:00Z` and `2026-05-13T10:00:00+02:00` still pass. `2026-05-13T10:00:00` and `10:00:00`, which passed before, now fail.

This affects JSON schemas you write in your app:

- An API endpoint's `payloadSchema`. A payload with a date-time or time without a timezone is now refused with a `400` before the routine runs. This covers every caller: `CallAPI` from a page, MCP and agent tool calls, nested `CallApi` and scheduled runs. An agent that sends local times to an endpoint tool gets the error back.
- The `schema` of a `ValidateSchema` routine step.
- The schemas of your own plugins (block, connection, request, action or operator schemas), which Lowdefy validates config against.

Lowdefy's own schemas do not use these formats. To check whether your app is affected, search your config and plugins for `format: date-time` and `format: time`. If those fields can hold a value without a timezone, use `iso-date-time` or `iso-time`, new in ajv-formats 3, which accept a value with or without one:

```yaml
# Before
payloadSchema:
  type: object
  properties:
    starts_at:
      type: string
      format: date-time

# After: also accepts 2026-05-13T10:00:00
payloadSchema:
  type: object
  properties:
    starts_at:
      type: string
      format: iso-date-time
```

Two smaller changes: `formatMinimum` and `formatMaximum` on `date-time` and `time` now compare the actual instants, taking the timezone into account (`iso-date-time` and `iso-time` keep the old comparison, which ignores it). The `ipv4` format rejects octets with a leading zero, such as `192.168.01.1`.
