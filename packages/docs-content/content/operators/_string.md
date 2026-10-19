# _string

The `_string` operator can be used to run javascript [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) methods.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _string.charAt

```
(arguments: {on: string, index: number}): string
(arguments: [on: string, index: number]): string
```

The `_string.charAt` method returns a string consisting of [the single UTF-16 code (character) unit located at the specified offset](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) into the string.

## _string.concat

```
(strings: string[]): string
```

The `_string.concat` method [concatenates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/concat) strings.

For label-style interpolation (`"Updates (5)"`), prefer [`_string.format`](#format) — it's more concise and renders `null`/`undefined` values as empty strings.

## _string.format

```
(template: string, ...values: any[]): string
(arguments: { template: string, on?: object }): string
```

The `_string.format` method substitutes placeholders in a template string with values. Two input forms are supported:

**Positional (array form)** — `{0}`, `{1}`, ... refer to elements after the template:
```yaml
_string.format:
  - 'Updates ({0})'
  - _request: get_counts.0.update
```

**Named (object form)** — `{name}` placeholders are looked up in `on`:
```yaml
_string.format:
  template: 'Updates ({count}) since {date}'
  on:
    count:
      _request: get_counts.0.update
    date:
      _date.format:
        - YYYY-MM-DD
        - _state: lastSync
```

**Behavior**:
- `null` and `undefined` values render as an empty string. This often makes `_if_none` unnecessary — `_string.format: ['Updates ({0})', null]` produces `'Updates ()'` directly.
- Missing positional indexes or named keys render as an empty string.
- Non-string values are coerced via `String(v)`. For object/array values, use [`_json.stringify`](/_json) first.
- To include a literal `{` or `}`, use `{{` or `}}`.
- Use [`_nunjucks`](/_nunjucks) when you need conditionals, loops, or filters.

## _string.endsWith

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

## _string.includes

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

## _string.indexOf

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

## _string.length

```
(string: string): number
```

The `_string.length` method returns the [length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) of a string.

## _string.lastIndexOf

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

## _string.match

```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): string[]
```

The `_string.match` method returns the [result of matching a string against a regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match).

## _string.normalize

```
(arguments: {on: string, form?: enum}): string
(arguments: [on: string, form?: enum]): string
```

The `_string.normalize` method returns the [Unicode Normalization Form](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) of the string.

## _string.padEnd

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

## _string.padStart

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

## _string.repeat

```
(arguments: {on: string, count: number}): string
(arguments: [on: string, count: number]): string
```

The `_string.repeat` method returns a string which contains [the specified number of copies of the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat) on which it was called, concatenated together.

## _string.replace

```
(arguments: {
  on: string,
  regex: string,
  newSubstr: string,
  regexFlags?: string
}): string
```

The `_string.replace` method returns a string with [some or all matches of a pattern replaced by a replacement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).

## _string.search

```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): number
```

The `_string.search` method executes a [search for a match between a regular expression and a string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search). It returns the index of the first match between the regular expression and the given string, or `-1` if no match was found.

## _string.slice

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

## _string.split

```
(arguments: {on: string, separator?: string}): string[]
(arguments: [on: string, separator?: string]): string[]
```

The `_string.split` method [divides a string into an array of substrings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split), splitting on the provided separator.

## _string.startsWith

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

## _string.substring

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

## _string.toLowerCase

```
(string: string): string
```

The `_string.toLowerCase` method converts the string to [lower case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase).

## _string.toUpperCase

```
(string: string): string
```

The `_string.toUpperCase` method converts the string to [upper case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toUpperCase).

## _string.trim

```
(string: string): string
```

The `_string.trim` method [removes whitespace from both ends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) of a string.

## _string.trimEnd

```
(string: string): string
```

The `_string.trimEnd` method [removes whitespace from the end](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimEnd) of a string.

## _string.trimStart

```
(string: string): string
```

The `_string.trimStart` method [removes whitespace from the start](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimStart) of a string.
