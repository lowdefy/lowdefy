---
'@lowdefy/client': patch
---

fix(client): A websocket connection closed after five idle seconds no longer disrupts the connection that replaces it, and a publish that timed out is not sent later.

When the last feed on a page was unsubscribed, the idle connection was closed, but its close event could arrive after a new page had already started a new connection. The late event marked the new connection as closed, so the next subscribe or publish opened a second connection, and feeds could be subscribed on both and receive every message twice. A publish made while the connection was down was also sent once a connection opened, even if it had already failed with a timeout, so a retried publish could be delivered twice.
