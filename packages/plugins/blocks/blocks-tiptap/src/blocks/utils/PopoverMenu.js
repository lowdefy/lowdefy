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

function hasExt(editor, name) {
  return editor.extensionManager.extensions.some((ext) => ext.name === name);
}

// Custom bubble menu built on tiptap's BubbleMenuPlugin instead of the
// `<BubbleMenu>` React wrapper. The wrapper renders its menu element with
// React and then the plugin calls `element.remove()` on it (bubble-menu-plugin
// detaches the menu from the DOM on construction). When the editor block later
// unmounts — e.g. the surrounding page navigates away, or `disabled` flips and
// unmounts this menu — React tries to removeChild an element that is no longer
// where it rendered it, throwing "NotFoundError: Failed to execute
// 'removeChild' on 'Node'".
//
// Here we own the container element ourselves and render the buttons into it
// with a portal. React only ever removes the buttons from our container (always
// their parent), never the plugin-detached element, so the teardown race is
// gone.
const PopoverMenu = ({ editor }) => {
  const [container] = useState(() =>
    typeof document === 'undefined' ? null : document.createElement('div')
  );

  const showBold = hasExt(editor, 'bold');
  const showItalic = hasExt(editor, 'italic');
  const showStrike = hasExt(editor, 'strike');
  const showHighlight = hasExt(editor, 'highlight');
  const hasTools = showBold || showItalic || showStrike || showHighlight;

  useEffect(() => {
    if (!container || !editor || editor.isDestroyed || !hasTools) return undefined;

    container.className = 'tiptap-popover';

    const plugin = BubbleMenuPlugin({
      pluginKey: 'bubbleMenu',
      editor,
      element: container,
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
      // Tear the plugin (and its tippy instance) down first. React then
      // unmounts the portal, removing the buttons from our still-intact
      // container.
      if (!editor.isDestroyed) {
        editor.unregisterPlugin('bubbleMenu');
      }
    };
  }, [editor, container, hasTools]);

  if (!container || !hasTools) return null;

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
    container
  );
};

export default PopoverMenu;
