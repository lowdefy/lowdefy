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

import readableToneText from './readableToneText.js';

// The tag look for a colour that is not a tone name (a hex, rgb() or var() value): a fill and
// border tinted with the colour, and the colour darkened (or, in a dark theme, lightened) toward
// the text colour for the label, so a light custom colour still reads.
function customTagTone(color) {
  return {
    color,
    text: readableToneText({ color, share: 60 }),
    bg: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

export default customTagTone;
