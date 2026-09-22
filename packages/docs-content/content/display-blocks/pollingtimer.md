# PollingTimer

A headless timer that renders nothing and triggers its `onTick` event every `interval` milliseconds while it is running. Use it to poll a request until a background job completes, or to refresh a page on a schedule. Start and stop it with the `start`, `stop` and `toggle` methods, or set `autoStart` to start it on mount. The timer always stops when the block unmounts.

```yaml
- id: manual_timer
  type: PollingTimer
  properties:
    interval: 1000
  events:
    onTick:
      - id: manual_timer_set_tick
        type: SetState
        params:
          manual_ticks:
            _event: tick
- id: manual_timer_controls
  type: Box
  layout:
    gap: 8
  blocks:
    - id: manual_timer_start
      type: Button
      properties:
        title: Start
        icon: AiOutlinePlayCircle
      events:
        onClick:
          - id: manual_timer_call_start
            type: CallMethod
            params:
              blockId: manual_timer
              method: start
    - id: manual_timer_stop
      type: Button
      properties:
        title: Stop
        icon: AiOutlinePauseCircle
      events:
        onClick:
          - id: manual_timer_call_stop
            type: CallMethod
            params:
              blockId: manual_timer
              method: stop
    - id: manual_timer_toggle
      type: Button
      properties:
        title: Toggle
        icon: AiOutlineSwap
      events:
        onClick:
          - id: manual_timer_call_toggle
            type: CallMethod
            params:
              blockId: manual_timer
              method: toggle
- id: manual_timer_ticks
  type: Span
  properties:
    content:
      _nunjucks:
        template: "Ticks: {{ ticks }}"
        on:
          ticks:
            _state: manual_ticks
```

```yaml
- id: limited_timer
  type: PollingTimer
  properties:
    interval: 1000
    autoStart: true
    maxTicks: 5
  events:
    onTick:
      - id: limited_timer_set_tick
        type: SetState
        params:
          limited_ticks:
            _event: tick
- id: limited_timer_ticks
  type: Span
  properties:
    content:
      _nunjucks:
        template: "Ticks: {{ ticks }} of 5"
        on:
          ticks:
            _state: limited_ticks
```

```yaml
- id: background_timer
  type: PollingTimer
  properties:
    interval: 2000
    autoStart: true
    pauseWhenHidden: false
  events:
    onTick:
      - id: background_timer_set_tick
        type: SetState
        params:
          background_ticks:
            _event: tick
- id: background_timer_ticks
  type: Span
  properties:
    content:
      _nunjucks:
        template: "Ticks while this tab was open or hidden: {{ ticks }}"
        on:
          ticks:
            _state: background_ticks
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `interval` | integer | - | Required. Milliseconds between ticks. Changing it while the timer is running restarts the interval. |
| `autoStart` | boolean | `false` | Start ticking when the block mounts. Off by default, so the timer is started with the `start` method. |
| `maxTicks` | integer | - | Stop the timer after this many ticks. The `onTick` event of the last tick is still triggered. Unlimited by default. |
| `pauseWhenHidden` | boolean | `true` | Pause ticking while the browser tab is hidden, and resume when it becomes visible again. Ticks missed while hidden are not fired on resume. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onTick` | \- | Trigger actions on every interval tick while the timer is running. The event object is `{ tick: number }`, the count of ticks since the timer was started. |

No CSS keys defined.

No slots defined.
