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

import { useEffect, useRef, useState } from 'react';

import getCaretOffsetFromPoint from './getCaretOffsetFromPoint.js';

// Click-to-edit state for TitleInput and ParagraphInput: the text itself is the control, so no
// edit icon is needed.
function useInlineEdit({ enabled, forceEditing, methods, text }) {
  const elementRef = useRef(null);
  const restoreFocusRef = useRef(false);
  const [session, setSession] = useState({ editing: false, caretOffset: null });
  const editing = enabled && (session.editing || forceEditing === true);

  useEffect(() => {
    // Enter and Escape hand focus back to the text so keyboard users keep their place.
    if (!editing && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      elementRef.current?.focus({ preventScroll: true });
    }
  }, [editing]);

  function start({ caretOffset = null } = {}) {
    setSession({ editing: true, caretOffset });
    methods.triggerEvent({ name: 'onStart' });
  }

  function stop({ viaKeyboard }) {
    restoreFocusRef.current = viaKeyboard;
    setSession({ editing: false, caretOffset: null });
  }

  function handleClick(event) {
    // Copy, expand and edit icon buttons, and links in the text, keep their own behaviour.
    if (event.target.closest('button, a')) return;
    // A drag that selects text to copy it should not switch to editing.
    if (!window.getSelection().isCollapsed) return;
    start({
      caretOffset: getCaretOffsetFromPoint({
        element: event.currentTarget,
        x: event.clientX,
        y: event.clientY,
      }),
    });
  }

  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      start();
    }
  }

  function commit({ value, viaKeyboard }) {
    stop({ viaKeyboard });
    if (value === text) return;
    methods.setValue(value);
    methods.triggerEvent({ name: 'onChange', event: { value } });
  }

  return {
    caretOffset: session.caretOffset,
    cancel: stop,
    commit,
    editing,
    elementRef,
    onClick: enabled ? handleClick : undefined,
    onKeyDown: enabled ? handleKeyDown : undefined,
    start,
    tabIndex: enabled ? 0 : undefined,
  };
}

export default useInlineEdit;
