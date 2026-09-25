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
import tippy from 'tippy.js';

import MentionList from './MentionList.js';
import itemSection from './itemSection.js';

function suggestion({ methods, char = '@', allowSpaces = true, limit = 5 }) {
  return {
    // `char` must be set explicitly: Mention.configure does a shallow merge
    // on its options.suggestion, replacing the extension's default `@`.
    char,
    allowSpaces,
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
      let popup;
      let current;

      const start = (props) => {
        current = { from: props.range.from, query: props.query };
        component = new ReactRenderer(MentionList, {
          props: { ...props, methods },
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      };

      const exit = () => {
        // Tear down in this order — React portal first, tippy popup after —
        // to avoid "NotFoundError: Failed to execute 'removeChild'" when the
        // user navigates away (e.g. clicks another item) while the mention
        // popup is open. MentionList is rendered as a React portal into
        // component.element, which tippy relocates into document.body.
        // Destroying tippy first detaches that container out from under
        // React's portal teardown; destroying the component first lets React
        // remove the MentionList DOM cleanly while the container is still
        // attached. The tippy teardown is then deferred to a microtask so it
        // never runs synchronously inside React's own unmount commit.
        component?.destroy();
        component = undefined;
        const instance = popup?.[0];
        popup = undefined;
        if (instance && !instance.state.isDestroyed) {
          queueMicrotask(() => {
            if (!instance.state.isDestroyed) instance.destroy();
          });
        }
      };

      return {
        onStart: start,

        onUpdate(props) {
          // A suggestion that moves to a new trigger with a new query (e.g. a
          // second "@" typed while the first was open) restarted in TipTap v2,
          // which also showed a popup that an outside click had hidden. v3
          // reports it as an update, so restart it here.
          if (props.range.from !== current?.from && props.query !== current?.query) {
            exit();
            start(props);
            return;
          }
          current = { from: props.range.from, query: props.query };
          component?.updateProps(props);
          if (!props.clientRect) return;
          popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
        },

        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: exit,
      };
    },
  };
}

export default suggestion;
