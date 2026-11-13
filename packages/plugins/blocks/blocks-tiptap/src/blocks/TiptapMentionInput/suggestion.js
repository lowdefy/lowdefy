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

import { ReactRenderer } from '@tiptap/react';
import { type } from '@lowdefy/helpers';

import createPopupMiddleware from './createPopupMiddleware.js';
import MentionList from './MentionList.js';
import itemSection from './itemSection.js';

function suggestion({ methods, char = '@', allowSpaces = true, limit = 5 }) {
  return {
    // `char` must be set explicitly: Mention.configure does a shallow merge
    // on its options.suggestion, replacing the extension's default `@`.
    char,
    allowSpaces,
    // The suggestion plugin positions the list with Floating UI once `render` mounts it: 10px
    // below the caret, flipping and shifting as createPopupMiddleware sets out. Its own flip has no
    // padding, so it is replaced.
    placement: 'bottom-start',
    offset: { mainAxis: 10 },
    flip: false,
    floatingUi: { middleware: createPopupMiddleware() },
    items: ({ query, editor }) => {
      const itemsList = editor.options.editorProps.items ?? [];
      const filtered = itemsList.filter((item) => {
        if (type.isString(item)) {
          return item.toLowerCase().includes(query.toLowerCase());
        }
        if (type.isString(item?.label)) {
          return item.label.toLowerCase().includes(query.toLowerCase());
        }
        return false;
      });
      // no option declares a section → flat list capped at limit (today's behaviour)
      if (!filtered.some((item) => !type.isNone(itemSection(item)))) {
        return filtered.slice(0, limit);
      }
      const counts = new Map();
      return filtered.filter((item) => {
        const section = itemSection(item);
        const n = counts.get(section) ?? 0;
        if (n >= limit) return false;
        counts.set(section, n + 1);
        return true;
      });
    },

    render: () => {
      let component;
      let unmount;
      let current;

      const start = (props) => {
        current = { from: props.range.from, query: props.query };
        component = new ReactRenderer(MentionList, {
          props: { ...props, methods },
          editor: props.editor,
          className: 'tiptap-mention-popup',
        });
        // Mounts the list into document.body, keeps it placed while the page scrolls or
        // resizes, and ends the suggestion on a press outside the list and the editor.
        unmount = props.mount(component.element);
      };

      const exit = () => {
        // Destroying the renderer removes the list's element from the page, while it is still
        // the parent of the React content, so React's later portal teardown never fails to remove
        // a child. unmount then stops the positioning and the outside-press listener.
        component?.destroy();
        component = undefined;
        unmount?.();
        unmount = undefined;
      };

      return {
        onStart: start,

        onUpdate(props) {
          // A suggestion that moves to a new trigger with a new query (e.g. a
          // second "@" typed while the first was open) restarted in TipTap v2.
          // v3 reports it as an update, so restart it here.
          if (props.range.from !== current?.from && props.query !== current?.query) {
            exit();
            start(props);
            return;
          }
          current = { from: props.range.from, query: props.query };
          component?.updateProps(props);
        },

        // Escape ends the suggestion in the plugin itself, which calls onExit.
        onKeyDown(props) {
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: exit,
      };
    },
  };
}

export default suggestion;
