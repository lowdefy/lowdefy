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

import { type } from '@lowdefy/helpers';

function resizeTextArea({ autoSize, textArea }) {
  if (autoSize === false) {
    textArea.style.overflowY = 'auto';
    return;
  }
  const { minRows = 1, maxRows } = type.isObject(autoSize) ? autoSize : {};
  const lineHeight = parseFloat(window.getComputedStyle(textArea).lineHeight);
  // Reset first so the textarea can shrink when text is deleted.
  textArea.style.height = 'auto';
  let height = Math.max(textArea.scrollHeight, minRows * lineHeight);
  if (type.isNumber(maxRows)) {
    height = Math.min(height, maxRows * lineHeight);
  }
  textArea.style.height = `${height}px`;
  textArea.style.overflowY = textArea.scrollHeight > height ? 'auto' : 'hidden';
}

export default resizeTextArea;
