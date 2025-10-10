<TITLE>_log</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_log` operator logs it input to the console, and returns the value it received. Since it returns the value it received, it can be used to debug without affecting the rest of the configuration.</DESCRIPTION>
<USAGE>(value: any): any
###### any</USAGE>
<EXAMPLES>###### Log the results of a request to the console:
```yaml
_log:
  _request: my_request
```
Returns: The value of the request</EXAMPLES>
