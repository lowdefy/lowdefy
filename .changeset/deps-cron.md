---
'@lowdefy/operators-cron': patch
---

fix(deps): Update cronstrue to 3.39.0 and cron-parser to 5.10.4

cronstrue 3.39.0 uses singular units for a count of one in English descriptions, fixes descriptions of lists mixing plain values and steps, last-weekday and step schedules in other languages and month steps, and rejects zero-valued steps and out-of-range ranges and nth weekdays. cron-parser 5.10.4 fixes a timestamp of 0 being read as a missing date, month and weekday names being resolved in the wrong fields, schedules with an unrestricted day of month landing in months the expression excludes, and rejects ranges with more than two parts.
