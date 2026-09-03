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

// Draws a rounded box around a title and body lines for CLI startup notices.
// The border width is derived from the longest line so it's always aligned,
// regardless of the content passed in. Returned with a leading newline so it
// starts on its own line under the CLI logger's timestamp/symbol prefix.
function formatNoticeBox({ title, lines }) {
  const inner = Math.max(title.length + 1, ...lines.map((line) => line.length));
  const pad = (line) => line + ' '.repeat(inner - line.length);
  const top = `╭─ ${title} ${'─'.repeat(inner - title.length - 1)}╮`;
  const bottom = `╰${'─'.repeat(inner + 2)}╯`;
  const body = lines.map((line) => `│ ${pad(line)} │`);
  return ['', top, ...body, bottom].join('\n');
}

export default formatNoticeBox;
