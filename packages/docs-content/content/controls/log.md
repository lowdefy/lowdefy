# :log

```
({:log: any, :level: string}): void
```

The `:log` control outputs messages to the server console at specified log levels (debug, info, warn, error).

#### Keys

- `:log: any`: __Required__ - The value to be log to the console.
- `:level: string`: Level of log. One of debug, info, warn, error. The default is info.

#### Examples

###### String Message
```yaml
:log: 'New Log Message'
```

###### Log a JSON Object
```yaml
:log:
  message: Log Message
  user_id:
    _user: id
  timestamp:
    _date: now
```

###### Set log levels
```yaml
- :log:
    payload:
      _payload: true
  :level: debug
- :log: 'Processing started'
  :level: 'info'
- :log:
    message: Multiple failed attempts
    attempts:
      _payload: attempt_count
    user:
      _user: id
  :level: warn
- :log:
    message: An error occurred.

  :level: error
```
