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

import customTagTone from '../format/customTagTone.js';
import seededTagColor from '../format/seededTagColor.js';
import TAG_TONES from '../format/tagTones.js';

const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(.*\)$/i;
const CSS_VARIABLE = /^var\(--[\w-]+\)$/;

// Only explicit colour syntax is a colour. A named colour or keyword ("White",
// "transparent") is a seed, so a category name never renders an invisible tag.
function isColor(value) {
  if (HEX_COLOR.test(value) || CSS_VARIABLE.test(value)) return true;
  return COLOR_FUNCTION.test(value) && !/url\(/i.test(value) && CSS.supports('color', value);
}

// A tone name, a colour, or a seed for a stable colour. Lowercase tone names
// are pure CSS (the stylesheet matches them); everything else gets its tone
// here: the colour and the tag's text, fill and border custom properties.
function resolveTone(element, value) {
  if (Object.hasOwn(TAG_TONES, value)) return null;
  const lower = value.toLowerCase();
  if (Object.hasOwn(TAG_TONES, lower)) return TAG_TONES[lower];
  if (isColor(value)) return customTagTone(value);
  const seed = value === '' ? element.textContent.trim() : value;
  return TAG_TONES[seededTagColor(seed)];
}

// data-tag and data-status: tinted tags and status dots in theme colours.
const toneEnhancer = {
  name: 'tone',
  attributes: ['data-tag', 'data-status'],
  prepare({ select }) {
    select('[data-tag], [data-status]').forEach((element) => {
      const attribute = element.hasAttribute('data-tag') ? 'data-tag' : 'data-status';
      const tone = resolveTone(element, element.getAttribute(attribute).trim());
      if (tone !== null) {
        element.style.setProperty('--lf-tone', tone.color);
        element.style.setProperty('--lf-tone-text', tone.text);
        element.style.setProperty('--lf-tone-bg', tone.bg);
        element.style.setProperty('--lf-tone-border', tone.border);
      }
    });
  },
};

export default toneEnhancer;
