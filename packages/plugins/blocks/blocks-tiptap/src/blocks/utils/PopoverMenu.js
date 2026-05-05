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

import React from 'react';
import { BubbleMenu } from '@tiptap/react';
import {
  AiOutlineBold,
  AiOutlineItalic,
  AiOutlineStrikethrough,
  AiOutlineHighlight,
} from 'react-icons/ai';
import { isTextSelection } from '@tiptap/core';

const HIGHLIGHT_SWATCHES = [
  { color: 'rgba(170, 255, 0, 1)', fill: 'rgba(170, 255, 0, 0.5)' },
  { color: 'rgba(255, 170, 0, 1)', fill: 'rgba(255, 170, 0, 0.5)' },
  { color: 'rgba(255, 0, 170, 1)', fill: 'rgba(255, 0, 170, 0.5)' },
  { color: 'rgba(170, 0, 255, 1)', fill: 'rgba(170, 0, 255, 0.5)' },
];

function hasExt(editor, name) {
  return editor.extensionManager.extensions.some((ext) => ext.name === name);
}

const PopoverMenu = ({ editor }) => {
  const showBold = hasExt(editor, 'bold');
  const showItalic = hasExt(editor, 'italic');
  const showStrike = hasExt(editor, 'strike');
  const showHighlight = hasExt(editor, 'highlight');

  if (!showBold && !showItalic && !showStrike && !showHighlight) {
    return null;
  }

  return (
    <BubbleMenu
      className="tiptap-popover"
      editor={editor}
      shouldShow={({ editor, view, state, from, to }) => {
        if (editor.isActive('image')) return false;
        const { doc, selection } = state;
        const { empty } = selection;
        const isEmptyTextBlock =
          !doc.textBetween(from, to).length && isTextSelection(state.selection);
        const hasEditorFocus = view.hasFocus();
        if (!hasEditorFocus || empty || isEmptyTextBlock || !editor.isEditable) {
          return false;
        }
        return true;
      }}
    >
      {showBold && (
        <AiOutlineBold
          className="tiptap-icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
      )}
      {showItalic && (
        <AiOutlineItalic
          className="tiptap-icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
      )}
      {showStrike && (
        <AiOutlineStrikethrough
          className="tiptap-icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      )}
      {showHighlight &&
        HIGHLIGHT_SWATCHES.map(({ color, fill }) => (
          <AiOutlineHighlight
            key={color}
            className="tiptap-icon"
            style={{ color }}
            onClick={() => editor.chain().focus().toggleHighlight({ color: fill }).run()}
          />
        ))}
    </BubbleMenu>
  );
};

export default PopoverMenu;
