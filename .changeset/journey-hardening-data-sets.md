---
'lowdefy': minor
---

feat: Lint journeys on data sets

- **`lowdefy test --lint` checks data set users (L5)**: a journey names a user from its data set, or `user: none`. An inline user object, or no `user`, is a warning until the journey moves onto a data set. Users are read from the data set file, with no server.
- **`lowdefy test --lint` keeps snapshot values out of journeys (L7)**: on a data set with a `snapshot`, every value a journey selects or asserts by must be the app's own text, a fixture or user value, or something the journey typed earlier. Typing a value only the pulled snapshot holds, or picking a grid row by index, is an error. The development server builds the pages L7 reads.
