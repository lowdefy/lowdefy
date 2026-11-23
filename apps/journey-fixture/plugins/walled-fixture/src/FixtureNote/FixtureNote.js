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

// A block of the fixture app's own plugin that draws its `content` property as text, as an app's
// label block does. Its meta (types.js) declares headlessText ['content'], so a headless text check
// reads that text (pages/text_checks.yaml, tests/journeys/_parity/text_checks.yaml, LDF-1147). It
// imports no React, since the plugin installs none: a component may return a string, which React
// draws as text.
function FixtureNote({ properties }) {
  return properties.content ?? null;
}

export default FixtureNote;
