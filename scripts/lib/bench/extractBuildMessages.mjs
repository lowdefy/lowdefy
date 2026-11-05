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

// The CLI writes each log line as `HH:MM:SS <symbol> <text>`, coloured with
// ANSI codes, and prints the config location of a warning or error as a blue
// info line just before it.
const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
const BLUE = `${ESC}[34m`;
const LINE_PATTERN = /^\d{2}:\d{2}:\d{2} (\S+) (.*)$/;
const MESSAGE_SYMBOLS = new Set(['⚠', '✖']);

// The warnings and errors in a CLI build log, each with the location printed
// before it, sorted: the order of messages from parallel work can change from
// one build to the next. replacePath rewrites each side's server directory.
function extractBuildMessages({ output, replacePath = (value) => value }) {
  const messages = [];
  let location = null;
  for (const rawLine of output.split('\n')) {
    const isBlue = rawLine.includes(BLUE);
    const match = rawLine.replace(ANSI_PATTERN, '').match(LINE_PATTERN);
    if (match === null) {
      location = null;
      continue;
    }
    const [, symbol, text] = match;
    if (MESSAGE_SYMBOLS.has(symbol)) {
      messages.push(
        replacePath(location === null ? `${symbol} ${text}` : `${symbol} ${location}: ${text}`)
      );
      location = null;
      continue;
    }
    location = isBlue ? text : null;
  }
  return messages.sort();
}

export default extractBuildMessages;
