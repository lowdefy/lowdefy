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

import TEXT_TONE_COLORS from '../format/textToneColors.js';

// data-tone colours text with a theme tone. The stylesheet does the colouring;
// this puts data-tone in the gate (so the root gets its style scope) and
// reports values the stylesheet does not know.
const textToneEnhancer = {
  name: 'textTone',
  attributes: ['data-tone'],
  prepare({ select }) {
    select('[data-tone]').forEach((element) => {
      const tone = element.getAttribute('data-tone');
      if (!Object.hasOwn(TEXT_TONE_COLORS, tone.toLowerCase())) {
        console.warn(
          `data-tone="${tone}" is not a text tone (${Object.keys(TEXT_TONE_COLORS).join(
            ', '
          )}), so it was ignored.`
        );
      }
    });
  },
};

export default textToneEnhancer;
