---
'lowdefy': major
---

feat(cli)!: Journey files take `serial`, and refuse unknown top-level keys

A journey file can mark a journey `serial: true`: it then runs with no other journey in flight once browser journeys run side by side. Mark a data-set journey that depends on something outside its data session, such as the clock, a file or an outside service that is not stubbed.

**A journey file with an unknown top-level key now fails.** Until now a misspelt key such as `seriel: true` or `pageid: orders` was ignored without a word. The journey is now refused as an invalid file, naming the key and listing the keys a journey takes; the run's other journeys still run. Rename or remove the key to fix it.
