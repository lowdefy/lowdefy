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

// CSV text as records of fields (RFC 4180): fields separated by the delimiter (detected when not
// given), records by CRLF, LF or CR; a field in double quotes may hold delimiters, line breaks and
// escaped quotes (`""`). A leading byte order mark is dropped, as are blank lines (a trailing
// line break makes none). Quotes inside an unquoted field are kept as written, and text after a
// closing quote is appended to the field, as spreadsheet apps read it. Returns string[][].
function parseCsv(text, { delimiter } = {}) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const separator = delimiter ?? detectCsvDelimiter(source);
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  let fieldStarted = false;
  // Anything on the line at all, so a line holding only `""` is a record and an empty line not.
  let recordStarted = false;

  function endField() {
    record.push(field);
    field = '';
    fieldStarted = false;
  }
  function endRecord() {
    endField();
    if (recordStarted) records.push(record);
    record = [];
    recordStarted = false;
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = false;
      }
      continue;
    }
    if (char !== '\r' && char !== '\n') recordStarted = true;
    if (char === '"' && !fieldStarted) {
      quoted = true;
      fieldStarted = true;
    } else if (char === separator) {
      endField();
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      endRecord();
    } else {
      field += char;
      fieldStarted = true;
    }
  }
  if (recordStarted) endRecord();
  return records;
}

export default parseCsv;
