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

// Leading and trailing C0 control characters and spaces, and tabs and newlines
// anywhere: what the browser's URL parser drops before it reads a URL.
// eslint-disable-next-line no-control-regex
const EDGE_CONTROLS = /^[\x00-\x20]+|[\x00-\x20]+$/g;
const TABS_AND_NEWLINES = /[\t\n\r]/g;

// A URL string as the browser's URL parser reads it, so " https://x" and
// "java\tscript:" are judged as what they are to it.
function normalizeUrlText(value) {
  return value.replace(EDGE_CONTROLS, '').replace(TABS_AND_NEWLINES, '');
}

export default normalizeUrlText;
