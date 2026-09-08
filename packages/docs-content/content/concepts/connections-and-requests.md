# Connections and Requests

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.

> Sensitive information like passwords or API keys are often required to use external services. The <a href = "./_secret">_secret</a> operator should be used to reference these secrets, they should never be coded directly in your app, or committed to source control.

> The <code>_user</code> operator should be used under <code>properties</code> and not <code>payload</code>. This is important since operators under <code>payload</code> are evaluated on the client, and are therefore vulnerable to users with malicious intent.
