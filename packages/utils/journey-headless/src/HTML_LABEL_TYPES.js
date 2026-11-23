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

// The blocks-antd selectors that draw each option's label as html (renderHtml, through
// HtmlComponent), so the text a person sees is the html's text: Selector and MultipleSelector
// (getSelectOptions), the radio, checkbox, button and segmented selectors, and the tree selectors'
// titles. Any other block, such as AutoComplete, draws its labels as plain text.
const HTML_LABEL_TYPES = new Set([
  'ButtonSelector',
  'CheckboxSelector',
  'MultipleSelector',
  'RadioSelector',
  'SegmentedSelector',
  'Selector',
  'TreeMultipleSelector',
  'TreeSelector',
]);

export default HTML_LABEL_TYPES;
