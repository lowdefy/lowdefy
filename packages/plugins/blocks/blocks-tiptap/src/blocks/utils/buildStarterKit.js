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

import StarterKit from '@tiptap/starter-kit';
import { type } from '@lowdefy/helpers';

// TipTap v3's StarterKit bundles extensions the v2 kit did not. They default to off so the
// editor keeps its v2 extension set: Underline would keep <u> in the saved html, TrailingNode
// appends an empty paragraph after a final table or image, and ListKeymap changes Backspace and
// Delete in lists.
const V3_KIT_DEFAULTS = {
  listKeymap: false,
  trailingNode: false,
  underline: false,
};

// Builds the StarterKit from the block's `starterKit` property, which is written against the v2
// kit, so that it enables the same extensions as v2 did.
function buildStarterKit(starterKit) {
  const { history, ...options } = type.isObject(starterKit) ? starterKit : {};

  // v3 renamed the History extension to UndoRedo.
  if (!type.isUndefined(history) && type.isUndefined(options.undoRedo)) {
    options.undoRedo = history;
  }

  // v3 CodeBlock inserts a paragraph above a code block at the top of the document on ArrowUp.
  if (options.codeBlock !== false) {
    options.codeBlock = {
      exitOnArrowUp: false,
      ...(type.isObject(options.codeBlock) ? options.codeBlock : {}),
    };
  }

  return StarterKit.configure({
    ...V3_KIT_DEFAULTS,
    ...options,
    // The Link extension is added by buildExtensions from the block's `link` property.
    link: false,
  });
}

export default buildStarterKit;
