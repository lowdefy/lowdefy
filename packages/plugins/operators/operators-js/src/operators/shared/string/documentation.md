<TITLE>_string</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_string` operator can be used to run javascript [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) methods.</DESCRIPTION>
<USAGE>###### charAt
```
(arguments: {on: string, index: number}): string
(arguments: [on: string, index: number]): string
```
The `_string.charAt` method returns a string consisting of [the single UTF-16 code (character) unit located at the specified offset](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) into the string.
###### concat
```
(strings: string[]): string
```
The `_string.concat` method [concatenates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/concat) strings.
###### endsWith
```
(arguments: {
  on: string,
  searchString: string,
  length?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  length?: number
]): boolean
```
The `_string.endsWith` method determines whether a string [ends with the characters of a specified string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith), returning `true` or `false` as appropriate.
###### includes
```
(arguments: {
  on: string,
  searchString: string,
  position?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  position?: number
]): boolean
```
The `_string.includes` method determines whether [one string may be found within another string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes), returning `true` or `false` as appropriate.
###### indexOf
```
(arguments: {
  on: string,
  searchValue: string,
  fromIndex?: number
}): number
(arguments: [
  on: string,
  searchValue: string,
  fromIndex?: number
]): number
```
The `_string.indexOf` method returns the index within string of the [first occurrence of the specified value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf), starting the search at `fromIndex`. Returns `-1` if the value is not found.
###### length
```
(string: string): number
```
The `_string.length` method returns the [length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) of a string.
###### lastIndexOf
```
(arguments: {
  on: string,
  searchValue: string,
  fromIndex?: number
}): number
(arguments: [
  on: string,
  searchValue: string,
  fromIndex?: number
]): number
```
The `_string.lastIndexOf` method returns the index within string of the [last  occurrence of the specified value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf), searching backwards from `fromIndex`. Returns `-1` if the value is not found.
###### match
```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): string[]
```
The `_string.match` method returns the [result of matching a string against a regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match).
###### normalize
```
(arguments: {on: string, form?: enum}): string
(arguments: [on: string, form?: enum]): string
```
The `_string.normalize` method returns the [Unicode Normalization Form](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) of the string.
###### padEnd
```
(arguments: {
  on: string,
  targetLength: number,
  padString?: string
}): string
(arguments: [
  on: string,
  targetLength: number,
  padString?: string
]): string
```
The `_string.padEnd` method [pads the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd) with a given string (repeated, if needed) so that the resulting string reaches a given length. The padding is applied from the end of the string.
###### padStart
```
(arguments: {
  on: string,
  targetLength: number,
  padString?: string
}): string
(arguments: [
  on: string,
  targetLength: number,
  padString?: string
]): string
```
The `_string.padStart` method [pads the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd) with a given string (repeated, if needed) so that the resulting string reaches a given length. The padding is applied from the start of the string.
###### repeat
```
(arguments: {on: string, count: number}): string
(arguments: [on: string, count: number]): string
```
The `_string.repeat` method returns a string which contains [the specified number of copies of the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat) on which it was called, concatenated together.
###### replace
```
(arguments: {
  on: string,
  regex: string,
  newSubstr: string,
  regexFlags?: string
}): string
```
The `_string.replace` method returns a string with [some or all matches of a pattern replaced by a replacement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).
###### search
```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): number
```
The `_string.search` method executes a [search for a match between a regular expression and a string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search). It returns the index of the first match between the regular expression and the given string, or `-1` if no match was found.
###### slice
```
(arguments: {
  on: string,
  start: number,
  end?: number
}): string
(arguments: [
  on: string,
  start: number,
  end?: number
]): string
```
The `_string.slice` method [extracts a section](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice) of a string.
###### split
```
(arguments: {on: string, separator?: string}): string[]
(arguments: [on: string, separator?: string]): string[]
```
The `_string.split` method [divides a string into an array of substrings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split), splitting on the provided separator.
###### startsWith
```
(arguments: {
  on: string,
  searchString: string,
  position?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  position?: number
]): boolean
```
The `_string.startsWith` method determines whether a string [starts with the characters of a specified string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith), returning `true` or `false` as appropriate.
###### substring
```
(arguments: {
  on: string,
  start: number,
  end?: number
}): string
(arguments: [
  on: string,
  start: number,
  end?: number
]): string
```
The `_string.startsWith` method returns [the part of the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring) between the `start` and `end` indexes, or to the end of the string.
###### toLowerCase
```
(string: string): string
```
The `_string.toLowerCase` method converts the string to [lower case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase).
###### toUpperCase
```
(string: string): string
```
The `_string.toUpperCase` method converts the string to [upper case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toUpperCase).
###### trim
```
(string: string): string
```
The `_string.trim` method [removes whitespace from both ends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) of a string.
###### trimEnd
```
(string: string): string
```
The `_string.trimEnd` method [removes whitespace from the end](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimEnd) of a string.
###### trimStart
```
(string: string): string
```
The `_string.trimStart` method [removes whitespace from the start](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimStart) of a string.</USAGE>
