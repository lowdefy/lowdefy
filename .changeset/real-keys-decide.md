---
'@lowdefy/operators-change-case': major
---

Upgrade change-case dependency to 5.4.0

This is a breaking change and effects the `_change_case` operator.

Changes to the `_change_case` operator:

- Options splitRegex and stripRegexp are no longer supported.
- paramCase has been renamed to kebabCase
- headerCase has been renamed to trainCase
- The following options have been added:

  - locale
  - mergeAmbiguousCharacters
  - prefixCharacters
  - split
  - suffixCharacters

- Added pascalSnakeCase which transforms a string into a string of capitalized words with underscores between words.
