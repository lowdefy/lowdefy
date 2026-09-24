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

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
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

// Placement of the TipTap v2 (tippy.js) bubble menu: 10px above the selection,
// flipping below when that would leave less than 5px to the viewport edge, and
// kept 5px from the sides. v3 positions the menu with Floating UI and applies
// the offset after flip, so flip's padding includes the offset.
const FLOATING_OPTIONS = {
  placement: 'top',
  offset: 10,
  flip: { padding: 15 },
  shift: { padding: 5 },
};

function hasExt(editor, name) {
  return editor.extensionManager.extensions.some((ext) => ext.name === name);
}

function createMenuElements() {
  if (typeof document === 'undefined') return null;
  // `root` is the element the plugin positions and mounts, like tippy's root
  // in v2 (same z-index). `content` is the styled menu the buttons render into.
  // The root is absolute from the start so the plugin measures its final size
  // the first time it positions it.
  const root = document.createElement('div');
  root.style.position = 'absolute';
  root.style.visibility = 'hidden';
  root.style.zIndex = '9999';
  const content = document.createElement('div');
  content.className = 'tiptap-popover';
  root.appendChild(content);
  return { root, content };
}

// Custom bubble menu built on tiptap's BubbleMenuPlugin instead of the
// `<BubbleMenu>` React wrapper. The plugin moves its menu element in and out of
// the DOM itself. When the editor block later unmounts — e.g. the surrounding
// page navigates away, or `disabled` flips and unmounts this menu — React
// would try to removeChild an element that is no longer where it rendered it,
// throwing "NotFoundError: Failed to execute 'removeChild' on 'Node'".
//
// Here we own the menu elements ourselves and render the buttons into them
// with a portal. React only ever removes the buttons from our content element
// (always their parent), never the plugin-managed root, so the teardown race
// is gone.
const PopoverMenu = ({ editor }) => {
  const [menu] = useState(createMenuElements);

  const showBold = hasExt(editor, 'bold');
  const showItalic = hasExt(editor, 'italic');
  const showStrike = hasExt(editor, 'strike');
  const showHighlight = hasExt(editor, 'highlight');
  const hasTools = showBold || showItalic || showStrike || showHighlight;

  useEffect(() => {
    if (!menu || !editor || editor.isDestroyed || !hasTools) return undefined;

    const plugin = BubbleMenuPlugin({
      pluginKey: 'bubbleMenu',
      editor,
      element: menu.root,
      // v2 mounted the menu beside the editor wrapper; v3 defaults to inside it.
      appendTo: () => editor.view.dom.parentElement.parentElement,
      options: FLOATING_OPTIONS,
      shouldShow: ({ editor: menuEditor, view, state, from, to }) => {
        if (menuEditor.isActive('image')) return false;
        const { selection } = state;
        const { empty } = selection;
        const isEmptyTextBlock =
          !state.doc.textBetween(from, to).length && isTextSelection(state.selection);
        const hasEditorFocus = view.hasFocus();
        if (!hasEditorFocus || empty || isEmptyTextBlock || !menuEditor.isEditable) {
          return false;
        }
        return true;
      },
    });

    editor.registerPlugin(plugin);
    return () => {
      // Tear the plugin down first (it removes the root from the DOM). React
      // then unmounts the portal, removing the buttons from our still-intact
      // content element.
      if (!editor.isDestroyed) {
        editor.unregisterPlugin('bubbleMenu');
      }
    };
  }, [editor, menu, hasTools]);

  if (!menu || !hasTools) return null;

  return createPortal(
    <>
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
    </>,
    menu.content
  );
};

export default PopoverMenu;
