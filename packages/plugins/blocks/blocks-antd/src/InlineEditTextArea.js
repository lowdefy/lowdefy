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

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import resizeTextArea from './resizeTextArea.js';

// Borderless textarea rendered inside the Typography element being edited. It inherits the
// element's font, so the text keeps its size, weight and position when editing starts.
function InlineEditTextArea({
  autoSize,
  caretOffset,
  maxLength,
  onCancel,
  onCommit,
  placeholder,
  value,
}) {
  const textAreaRef = useRef(null);
  // Escape unmounts the textarea; a blur fired on the way out must not save the discarded draft.
  const cancelledRef = useRef(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const textArea = textAreaRef.current;
    const offset = Math.min(caretOffset ?? value.length, value.length);
    textArea.focus({ preventScroll: true });
    textArea.setSelectionRange(offset, offset);
  }, []);

  useLayoutEffect(() => {
    resizeTextArea({ autoSize, textArea: textAreaRef.current });
  }, [autoSize, draft]);

  function commit({ viaKeyboard }) {
    if (cancelledRef.current) return;
    onCommit({ value: draft.trim(), viaKeyboard });
  }

  function handleKeyDown(event) {
    // Enter while an IME is composing picks a candidate; it must not save.
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      commit({ viaKeyboard: true });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      // Keep Escape from also closing a surrounding Modal or Drawer.
      event.stopPropagation();
      cancelledRef.current = true;
      setDraft(value);
      onCancel({ viaKeyboard: true });
    }
  }

  function handleChange(event) {
    cancelledRef.current = false;
    // The value is a single line; pasted line breaks become spaces instead of joining words.
    setDraft(event.target.value.replace(/[\r\n]+/g, ' '));
  }

  return (
    <textarea
      ref={textAreaRef}
      className="lf-inline-edit-textarea"
      maxLength={maxLength}
      onBlur={() => commit({ viaKeyboard: false })}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      value={draft}
    />
  );
}

export default InlineEditTextArea;
