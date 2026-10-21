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

// A badge is a number, or { count, tone } where tone is `default` or `error`.
function getRailBadge(value) {
  if (typeof value === 'number') return { count: value, tone: 'default' };
  if (value !== null && typeof value === 'object') {
    return { count: value.count ?? 0, tone: value.tone ?? 'default' };
  }
  return { count: 0, tone: 'default' };
}

export default getRailBadge;
