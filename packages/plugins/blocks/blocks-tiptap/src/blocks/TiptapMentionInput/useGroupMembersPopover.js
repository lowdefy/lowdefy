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

import { useEffect, useRef } from 'react';
import { type } from '@lowdefy/helpers';

import mountGroupPopover from './mountGroupPopover.js';

function buildPopoverContent({ chip, group, groupMembers, char }) {
  const members = groupMembers[group] ?? [];

  const root = document.createElement('div');
  root.className = 'tiptap-mention-group-popover';

  let title = chip.textContent ?? '';
  if (title.startsWith(char)) {
    title = title.slice(char.length);
  }

  const header = document.createElement('div');
  header.className = 'tiptap-mention-group-popover-header';
  header.textContent = `${title} — ${members.length}`;
  root.appendChild(header);

  if (members.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tiptap-mention-group-popover-empty';
    empty.textContent = 'No members';
    root.appendChild(empty);
    return root;
  }

  members.forEach((member) => {
    const item = document.createElement('div');
    item.className = 'tiptap-mention-group-popover-item';

    const name = document.createElement('div');
    name.textContent = member?.name ?? '';
    item.appendChild(name);

    if (!type.isNone(member?.email)) {
      const email = document.createElement('div');
      email.className = 'tiptap-mention-group-popover-email';
      email.textContent = member.email;
      item.appendChild(email);
    }

    root.appendChild(item);
  });

  return root;
}

function useGroupMembersPopover({ editor, properties }) {
  // Updated every render so late-arriving groupMembers (typically from a
  // request) is read at hover time, not captured at mount.
  const mentionsRef = useRef(properties.mentions);
  mentionsRef.current = properties.mentions;

  const unmountPopoverRef = useRef(null);
  const activeChipRef = useRef(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined;
    const dom = editor.view.dom;

    const removePopover = () => {
      if (unmountPopoverRef.current) {
        unmountPopoverRef.current();
        unmountPopoverRef.current = null;
      }
    };

    const hide = () => {
      removePopover();
      activeChipRef.current = null;
    };

    const handleMouseOver = (event) => {
      const chip = event.target?.closest?.('.tiptap-mention-group[data-mention-group]');
      if (!chip) return;
      if (!dom.contains(chip)) return;
      if (chip === activeChipRef.current) return;

      const groupMembers = mentionsRef.current?.groupMembers;
      if (type.isNone(groupMembers)) return;

      const group = chip.getAttribute('data-mention-group');
      if (!Object.prototype.hasOwnProperty.call(groupMembers, group)) return;

      hide();

      const char = mentionsRef.current?.char ?? '@';
      const content = buildPopoverContent({ chip, group, groupMembers, char });
      unmountPopoverRef.current = mountGroupPopover({ chip, content });
      activeChipRef.current = chip;
    };

    const handleMouseOut = (event) => {
      if (activeChipRef.current && !activeChipRef.current.contains(event.relatedTarget)) {
        hide();
      }
    };

    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);
    // A press anywhere removes the popover. The chip stays active, so the popover shows again only
    // once the pointer has left the chip and come back.
    document.addEventListener('mousedown', removePopover, true);
    editor.on('update', hide);

    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousedown', removePopover, true);
      editor.off('update', hide);
      hide();
    };
  }, [editor]);
}

export default useGroupMembersPopover;
