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

const MAX_LENGTH = 60;

// A recorded value as JSON, cut short so a pasted document or a long list
// cannot push the rest of the line off the screen.
function describeLogValue(value) {
  const text = JSON.stringify(value) ?? 'undefined';
  if (text.length <= MAX_LENGTH) return text;
  return `${text.slice(0, MAX_LENGTH - 1)}…`;
}

export default describeLogValue;
