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

const TEXT_STYLE_NAMES = [
  'largeTitle',
  'title1',
  'title2',
  'title3',
  'headline',
  'body',
  'callout',
  'subheadline',
  'footnote',
  'caption1',
  'caption2',
];

// The `textStyle` property of the text blocks: one of the iOS text styles.
export default {
  type: 'string',
  enum: TEXT_STYLE_NAMES,
  description:
    'The iOS text style of the text: largeTitle (34), title1 (28), title2 (22), title3 (20), headline (17 semibold), body (17), callout (16), subheadline (15), footnote (13), caption1 (12) or caption2 (11). Mobile only.',
};
