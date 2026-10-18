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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type } from '@lowdefy/helpers';

import applyDisplayEdit from './applyDisplayEdit.js';
import createMentionPattern, { DEFAULT_MENTION_FORMAT } from './createMentionPattern.js';
import findTrigger from './findTrigger.js';
import insertLink from './insertLink.js';
import insertMention from './insertMention.js';
import parseMentionValue from './parseMentionValue.js';
import snapSelection from './snapSelection.js';
import { toDisplay, toValue } from './segmentText.js';

/**
 * The state of a text input that holds mentions: the markdown value (with mention tokens) is
 * shown with each mention as "@Name", which the cursor and Backspace treat as one character.
 * It tracks the cursor through onSelectionChange to find an @ or `[[` being typed, and puts a
 * picked person or record in its place.
 *
 * A selection the editor sets (after a pick, or when a mention is removed or stepped over) is
 * passed to the input for one frame, then released, so typing moves the cursor as usual.
 *
 * @param {Object} params
 * @param {string} params.value The markdown value.
 * @param {Function} params.onChangeValue Called with the new markdown value.
 * @param {Array<{ value: string, label: string, sees?: boolean }>} [params.people]
 * @param {string} [params.mentionFormat]
 */
function useMentionEditor({ value, onChangeValue, people, mentionFormat }) {
  const format = type.isString(mentionFormat) ? mentionFormat : DEFAULT_MENTION_FORMAT;
  const pattern = useMemo(() => createMentionPattern(format), [format]);
  const peopleById = useMemo(
    () => new Map((people ?? []).map((person) => [String(person.value), person])),
    [people]
  );
  const incoming = type.isString(value) ? value : '';
  const [text, setText] = useState(incoming);
  const lastValue = useRef(incoming);
  // A value from outside (cleared after a send, set by the page) replaces the text; the echo of
  // what was typed does not.
  useEffect(() => {
    if (incoming !== lastValue.current) {
      lastValue.current = incoming;
      setText(incoming);
    }
  }, [incoming]);

  const segments = useMemo(
    () => parseMentionValue({ value: text, pattern, people: peopleById }),
    [text, pattern, peopleById]
  );
  const display = useMemo(() => toDisplay(segments), [segments]);
  const selection = useRef({ start: display.length, end: display.length });
  const [cursor, setCursor] = useState(display.length);
  const [forced, setForced] = useState(undefined);

  useEffect(() => {
    if (forced === undefined) return undefined;
    const frame = requestAnimationFrame(() => setForced(undefined));
    return () => cancelAnimationFrame(frame);
  }, [forced]);

  const commit = useCallback(
    ({ nextSegments, nextCursor, force }) => {
      const next = toValue({ segments: nextSegments, format });
      lastValue.current = next;
      setText(next);
      selection.current = { start: nextCursor, end: nextCursor };
      setCursor(nextCursor);
      if (force) {
        setForced({ start: nextCursor, end: nextCursor });
      }
      onChangeValue(next);
    },
    [format, onChangeValue]
  );

  const onChangeText = (nextDisplay) => {
    const result = applyDisplayEdit({
      segments,
      previous: display,
      next: nextDisplay,
      selection: selection.current,
    });
    commit({
      nextSegments: result.segments,
      nextCursor: result.cursor,
      force: result.cursor !== result.natural,
    });
  };

  const onSelectionChange = ({ nativeEvent }) => {
    const snapped = snapSelection({ segments, selection: nativeEvent.selection });
    selection.current = snapped;
    setCursor(snapped.start === snapped.end ? snapped.start : -1);
    if (snapped !== nativeEvent.selection) {
      setForced(snapped);
    }
  };

  const trigger = useMemo(() => {
    if (cursor < 0 || cursor > display.length) return null;
    return findTrigger({ segments, cursor });
  }, [cursor, display, segments]);

  const pickMention = (person) => {
    if (trigger?.kind !== 'mention') return;
    const result = insertMention({ segments, at: trigger.at, cursor, person });
    commit({ nextSegments: result.segments, nextCursor: result.cursor, force: true });
  };

  const pickLink = (key) => {
    if (trigger?.kind !== 'link') return;
    const result = insertLink({ segments, at: trigger.at, cursor, key });
    commit({ nextSegments: result.segments, nextCursor: result.cursor, force: true });
  };

  return {
    display,
    onChangeText,
    onSelectionChange,
    pickLink,
    pickMention,
    segments,
    selection: forced,
    text,
    trigger,
  };
}

export default useMentionEditor;
