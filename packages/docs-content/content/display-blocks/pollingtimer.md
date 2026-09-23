# PollingTimer

A headless timer that renders nothing and triggers its `onTick` event every `interval` milliseconds while it is running. Use it to poll a request until a background job completes, or to refresh a page on a schedule. Start and stop it with the `start`, `stop` and `toggle` methods, or set `autoStart` to start it on mount. The timer always stops when the block unmounts.

## Poll a request until a job is done

Start the timer when a background job is kicked off, fetch the job status on every tick, and stop the timer with the `stop` method once the job reports it is done:

```yaml
requests:
  - id: create_job
    type: MongoDBInsertOne
    connectionId: jobs
    properties:
      doc:
        status: queued
  - id: get_job
    type: MongoDBFindOne
    connectionId: jobs
    payload:
      job_id:
        _state: job_id
    properties:
      query:
        _id:
          _payload: job_id
blocks:
  - id: job_poller
    type: PollingTimer
    properties:
      interval: 3000
    events:
      onTick:
        - id: fetch_job
          type: Request
          params: get_job
        - id: stop_when_done
          type: CallMethod
          skip:
            _ne:
              - _request: get_job.status
              - done
          params:
            blockId: job_poller
            method: stop
  - id: start_job
    type: Button
    properties:
      title: Start job
    events:
      onClick:
        - id: create_job
          type: Request
          params: create_job
        - id: set_job_id
          type: SetState
          params:
            job_id:
              _request: create_job.insertedId
        - id: start_polling
          type: CallMethod
          params:
            blockId: job_poller
            method: start
```

## Timing

The next tick is scheduled `interval` ms after the `onTick` actions finish, so a slow request never causes ticks to overlap or pile up. Stopping the timer while `onTick` actions are running lets them finish, but no further tick is scheduled.

`pauseWhenHidden` pauses the timer while `document.visibilityState` is `hidden`, so a visible browser window that has lost focus keeps ticking. The page `onVisible` and `onHidden` events also fire when the window gains or loses focus, so use them instead when you want to react to focus changes, for example to refresh data once when the user returns.

The engine keeps a history of every event it runs, so each tick adds an `onTick` entry. For a timer that runs for a long time, prefer a longer `interval` or a `maxTicks` limit.

```yaml
- id: job_timer
  type: PollingTimer
  properties:
    interval: 1000
  events:
    onTick:
      - id: job_timer_set_status
        type: SetState
        params:
          job_status:
            _if:
              test:
                _gte:
                  - _event: tick
                  - 5
              then: done
              else: running
      - id: job_timer_stop_when_done
        type: CallMethod
        skip:
          _ne:
            - _state: job_status
            - done
        params:
          blockId: job_timer
          method: stop
- id: job_timer_controls
  type: Box
  layout:
    gap: 8
  blocks:
    - id: job_timer_start
      type: Button
      properties:
        title: Start Job
        icon: AiOutlinePlayCircle
      events:
        onClick:
          - id: job_timer_set_running
            type: SetState
            params:
              job_status: running
          - id: job_timer_call_start
            type: CallMethod
            params:
              blockId: job_timer
              method: start
    - id: job_timer_status
      type: Span
      properties:
        content:
          _nunjucks:
            template: "Job status: {{ status }}"
            on:
              status:
                _if_none:
                  - _state: job_status
                  - not started
```

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
| `interval` | integer | - | Milliseconds to wait after the `onTick` actions of one tick finish before the next tick fires. Changing it while the timer is waiting restarts the wait. |
| `autoStart` | boolean | `false` | Start ticking when the block mounts. Off by default, so the timer is started with the `start` method. |
| `maxTicks` | integer | - | Stop the timer after this many ticks. The `onTick` event of the last tick is still triggered. Unlimited by default. |
| `pauseWhenHidden` | boolean | `true` | Pause ticking while the browser tab is hidden (`document.visibilityState`), and resume when it becomes visible again. Ticks missed while hidden are not fired on resume; the next tick fires `interval` ms after the tab is visible. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onTick` | `{ tick }` | Trigger actions on every tick while the timer is running. The next tick is scheduled `interval` ms after the `onTick` actions finish, so ticks never overlap. |

No CSS keys defined.

No slots defined.
