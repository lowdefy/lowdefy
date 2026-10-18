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

import insertAtSelection from '../../shared/dictation/insertAtSelection.js';
import useDictation from '../../shared/dictation/useDictation.js';

/**
 * Dictation into the chat composer's plain text (useDictation, with no hints). The selection when
 * a session starts is its anchor: words still being heard show there (the host renders
 * PartialSpans with `anchor`) and are not part of the text, and each final result goes in there
 * with insertAtSelection's spacing, moving the anchor after it. Text stays as said: there is no
 * spoken-mention conversion here.
 *
 * `discard` drops everything the session put in and puts the text and cursor back as they were;
 * a prompt chip, `setInput` and New chat call it. `endWithText` ends the session and keeps the
 * text as it is now, for typing and for a send that has its final words.
 *
 * @param {Object} params
 * @param {boolean} params.disabled Hide the mic.
 * @param {(text: string) => void} params.setText The composer's text setter.
 * @param {string} params.text The composer's text.
 */
function useChatDictation({ disabled, setText, text }) {
  const textRef = useRef(text);
  textRef.current = text;
  // The input's selection, as onSelectionChange last reported it; null until it reports one,
  // which puts the words at the end.
  const selectionRef = useRef(null);
  // The session's anchor, and the text and selection it started with, for discard.
  const sessionRef = useRef(null);
  const [anchor, setAnchor] = useState(null);
  // A selection set after the text changes under the cursor: passed to the input for one frame.
  const [forced, setForced] = useState(undefined);

  useEffect(() => {
    if (forced === undefined) return undefined;
    const frame = requestAnimationFrame(() => setForced(undefined));
    return () => cancelAnimationFrame(frame);
  }, [forced]);

  const placeCursor = (selection) => {
    selectionRef.current = selection;
    setForced(selection);
  };

  const dictation = useDictation({
    disabled,
    onFinal: (words) => {
      const session = sessionRef.current;
      const placed = insertAtSelection({
        text: textRef.current,
        selection: session?.anchor ?? selectionRef.current,
        insert: words,
      });
      const cursor = { start: placed.cursor, end: placed.cursor };
      // Two final results can arrive before the first one renders.
      textRef.current = placed.text;
      setText(placed.text);
      placeCursor(cursor);
      if (session !== null) {
        session.anchor = cursor;
        setAnchor(cursor);
      }
    },
  });
  const listening = dictation.status !== 'idle';

  const forget = () => {
    sessionRef.current = null;
    setAnchor(null);
  };

  useEffect(() => {
    if (listening) return;
    sessionRef.current = null;
    setAnchor(null);
  }, [listening]);

  const clearWarning = dictation.clearWarning;
  useEffect(() => {
    if (text === '') clearWarning();
  }, [text, clearWarning]);

  const toggle = () => {
    if (listening) {
      dictation.stop();
      return;
    }
    const end = textRef.current.length;
    const selection = selectionRef.current ?? { start: end, end };
    sessionRef.current = { anchor: selection, startSelection: selection, startText: text };
    setAnchor(selection);
    dictation.start();
  };

  const discard = () => {
    const session = sessionRef.current;
    dictation.cancel();
    if (!listening || session === null) return;
    forget();
    textRef.current = session.startText;
    setText(session.startText);
    placeCursor(session.startSelection);
  };

  const endWithText = () => {
    if (!listening) return;
    forget();
    dictation.cancel();
  };

  const onSelectionChange = ({ nativeEvent }) => {
    selectionRef.current = nativeEvent.selection;
  };

  return {
    anchor,
    available: dictation.available,
    clearWarning,
    // The text as of the last final result, which may not have rendered yet.
    currentText: () => textRef.current,
    discard,
    endWithText,
    finish: dictation.finish,
    level: dictation.level,
    listening,
    onSelectionChange,
    partial: dictation.partial,
    selection: forced,
    status: dictation.status,
    toggle,
    warning: dictation.warning,
  };
}

export default useChatDictation;
