---
'@lowdefy/server-dev': patch
---

fix(server-dev): The dev recorder no longer credits an event with another block's request or endpoint call

The development recorder matched a request or endpoint call to an event by its action id alone. Action ids are not unique across blocks, so a click could be logged with a request another block's action of the same id had called earlier, or one a skipped action had called on an earlier run. A call now counts for an event only when it came from the event's own block and from an action the event did not skip.
