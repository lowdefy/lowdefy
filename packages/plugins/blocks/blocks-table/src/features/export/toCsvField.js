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

// Spreadsheet apps read a cell that starts with `=`, `+`, `-` or `@` as a formula (tab and
// carriage return are read the same way by some), so a row value such as `=HYPERLINK(...)` would
// run when the file is opened (CSV injection). Such cells get a leading `'`, OWASP's
// recommendation, which makes the spreadsheet read them as text. Plain numbers (`-12.5`, `+3`,
// `1e-7`) cannot hold a formula and stay numbers.
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function neutralizeFormula(value) {
  if (!FORMULA_START.test(value) || PLAIN_NUMBER.test(value)) return value;
  return `'${value}`;
}

function toCsvField(text) {
  const value = neutralizeFormula(String(text));
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default toCsvField;
