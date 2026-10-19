/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import detectCsvDelimiter from './detectCsvDelimiter.js';

const QUOTE = 34;
const CR = 13;
const LF = 10;

// Reads CSV text record by record (RFC 4180): fields separated by the delimiter (detected when
// not given), records by CRLF, LF or CR; a field in double quotes may hold delimiters, line
// breaks and escaped quotes (`""`). A leading byte order mark is dropped, as are blank lines (a
// trailing line break makes none). Quotes inside an unquoted field are kept as written, and text
// after a closing quote is appended to the field, as spreadsheet apps read it. Fields are cut
// from the text with slices (never built a character at a time), so a large file parses fast,
// and `readRecord()` returns one record (string[]) at a time, or null at the end, so a caller
// can pause between records.
function createCsvReader(text, { delimiter } = {}) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const separator = (delimiter ?? detectCsvDelimiter(source)).charCodeAt(0);
  const { length } = source;
  let index = 0;

  function readUnquoted(start) {
    let end = start;
    while (end < length) {
      const code = source.charCodeAt(end);
      if (code === separator || code === CR || code === LF) break;
      end += 1;
    }
    index = end;
    return source.slice(start, end);
  }

  // A quoted field from the quote at `index`: the text up to the closing quote, with `""` read
  // as one quote, then any text after the closing quote up to the delimiter or line break. An
  // unterminated field ends at the end of the text.
  function readQuoted() {
    let value = '';
    let start = index + 1;
    for (;;) {
      const quote = source.indexOf('"', start);
      if (quote === -1) {
        index = length;
        return value + source.slice(start);
      }
      if (source.charCodeAt(quote + 1) === QUOTE) {
        value += source.slice(start, quote + 1);
        start = quote + 2;
      } else {
        value += source.slice(start, quote);
        const rest = readUnquoted(quote + 1);
        return rest === '' ? value : value + rest;
      }
    }
  }

  // The fields of the line at `index`, and whether the line holds anything at all (so a line of
  // only `""` or `,` is a record and an empty line is not). Leaves `index` after its line break.
  function readLine() {
    const fields = [];
    let started = false;
    for (;;) {
      if (source.charCodeAt(index) === QUOTE) {
        started = true;
        fields.push(readQuoted());
      } else {
        const field = readUnquoted(index);
        if (field !== '') started = true;
        fields.push(field);
      }
      if (index >= length) return { fields, started };
      const code = source.charCodeAt(index);
      index += 1;
      if (code === separator) {
        started = true;
        if (index >= length) {
          fields.push('');
          return { fields, started };
        }
      } else {
        if (code === CR && source.charCodeAt(index) === LF) index += 1;
        return { fields, started };
      }
    }
  }

  function readRecord() {
    while (index < length) {
      const { fields, started } = readLine();
      if (started) return fields;
    }
    return null;
  }

  return { readRecord };
}

export default createCsvReader;
