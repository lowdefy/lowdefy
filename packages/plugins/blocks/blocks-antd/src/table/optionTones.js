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

// The tag tones an AI answer option can take, in the order new options get them, so neighbouring
// options differ. Preset names only: a user-defined column is rendered in every viewer's browser,
// so its colours are never free CSS.
const OPTION_TONES = [
  'blue',
  'green',
  'orange',
  'purple',
  'cyan',
  'magenta',
  'gold',
  'red',
  'geekblue',
  'lime',
  'volcano',
  'yellow',
];

export default OPTION_TONES;
