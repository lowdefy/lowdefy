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
import convertSpokenMentions from './convertSpokenMentions.js';
import createMentionPattern, { DEFAULT_MENTION_FORMAT } from './createMentionPattern.js';
import findTrigger from './findTrigger.js';
import insertLink from './insertLink.js';
import insertMention from './insertMention.js';
import parseMentionValue from './parseMentionValue.js';
import shiftOffset from './shiftOffset.js';
import placeDictation from './placeDictation.js';
import snapSelection from './snapSelection.js';
import { toDisplay, toValue } from './segmentText.js';
import withPartial from './withPartial.js';

// Dictation puts text in a phrase at a time and typing a word at a time; spoken mentions are
// converted once the text has been still this long, so a name is not taken while it is spoken.
const SPOKEN_MENTION_MS = 900;

/**
 * The state of a text input that holds mentions: the markdown value (with mention tokens) is
 * shown with each mention as "@Name", which the cursor and Backspace treat as one character.
 * It tracks the cursor through onSelectionChange to find an @ or `[[` being typed, and puts a
 * picked person or record in its place.
 *
 * A selection the editor sets (after a pick, or when a mention is removed or stepped over) is
 * passed to the input for one frame, then released, so typing moves the cursor as usual.
 *
 * With `spokenWords`, spoken addressing ("for Sam, can you look") becomes a mention once the
 * text stops changing, and when it is sent (convertSpokenMentions).
 *
 * Dictation (useDictation) writes through `startDictation`, `setPartial`, `commitDictation`,
 * `cancelDictation` and `endDictation`. The selection when it starts is its anchor. Words still
 * being heard show at the anchor (`shown`) but are not part of the value, so neither onChangeValue,
 * the still-timer nor a send sees them. Each final result goes in at the anchor, the conversion
 * runs on the whole text at once, and the anchor moves after the words for the next result.
 *
 * @param {Object} params
 * @param {string} params.value The markdown value.
 * @param {Function} params.onChangeValue Called with the new markdown value.
 * @param {Array<{ value: string, label: string, sees?: boolean }>} [params.people]
 * @param {string} [params.mentionFormat]
 * @param {string[] | null} [params.spokenWords] The trigger words of spoken mentions; null for
 *   none.
 */
function useMentionEditor({ value, onChangeValue, people, mentionFormat, spokenWords = null }) {
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

  // The timer, a send and dictation read what is current when they run, not what was when they
  // were set up: two final results can arrive before the first one renders.
  const latest = useRef(null);
  latest.current = { people, segments, spokenWords, text };

  const commit = useCallback(
    ({ nextSegments, nextCursor, force, nextSelection }) => {
      const next = toValue({ segments: nextSegments, format });
      const placed = nextSelection ?? { start: nextCursor, end: nextCursor };
      lastValue.current = next;
      latest.current.segments = nextSegments;
      latest.current.text = next;
      setText(next);
      selection.current = placed;
      setCursor(placed.start === placed.end ? placed.start : -1);
      if (force) {
        setForced(placed);
      }
      onChangeValue(next);
      return next;
    },
    [format, onChangeValue]
  );

  const spokenTimer = useRef(null);
  useEffect(() => () => clearTimeout(spokenTimer.current), []);

  // Spoken addressing in `segments` as mentions, with `cursor` moved by the edits; null when there
  // is nothing to convert. The still-timer, a send and a dictated final result all convert here.
  const convertSegments = useCallback(({ segments: from, cursor: at, final }) => {
    const current = latest.current;
    if (current.spokenWords === null) return null;
    const result = convertSpokenMentions({
      segments: from,
      people: current.people,
      words: current.spokenWords,
      final,
    });
    if (result === null) return null;
    return {
      segments: result.segments,
      cursor: shiftOffset({ offset: at, edits: result.edits }),
    };
  }, []);

  const convertSpoken = useCallback(
    ({ final }) => {
      const converted = convertSegments({
        segments: latest.current.segments,
        cursor: selection.current.end,
        final,
      });
      if (converted === null) return null;
      return commit({
        nextSegments: converted.segments,
        nextCursor: converted.cursor,
        force: true,
      });
    },
    [commit, convertSegments]
  );

  // The dictation session: its anchor, the text and selection it started with (for cancel), and
  // the words still being heard. A ref for the handlers, and state to draw the partial.
  const dictationRef = useRef(null);
  const [dictation, setDictation] = useState(null);
  const updateDictation = (next) => {
    dictationRef.current = next;
    setDictation(next);
  };
  const shown = useMemo(
    () =>
      dictation === null || dictation.partial === ''
        ? { segments, display }
        : withPartial({ segments, selection: dictation.anchor, partial: dictation.partial }),
    [dictation, display, segments]
  );

  const onChangeText = (nextDisplay) => {
    // Typing while words are still being heard ends the session (the host stops the mic); the
    // words the person saw become text as they were shown.
    const typedOver = shown.display !== display;
    if (dictationRef.current !== null) {
      updateDictation(null);
    }
    const result = applyDisplayEdit({
      segments: typedOver ? shown.segments.map(asText) : segments,
      previous: shown.display,
      next: nextDisplay,
      selection: selection.current,
    });
    commit({
      nextSegments: result.segments,
      nextCursor: result.cursor,
      force: result.cursor !== result.natural,
    });
    if (spokenWords !== null) {
      clearTimeout(spokenTimer.current);
      spokenTimer.current = setTimeout(() => convertSpoken({ final: false }), SPOKEN_MENTION_MS);
    }
  };

  // Converts what is left to convert before a send, the end of the text included, and returns
  // the value to send.
  const finishSpokenMentions = () => {
    clearTimeout(spokenTimer.current);
    return convertSpoken({ final: true }) ?? latest.current.text;
  };

  // A session starts at the selection. A pending still-timer is dropped, so it cannot force the
  // selection while the anchor is held; the commit of each final result converts instead.
  const startDictation = () => {
    clearTimeout(spokenTimer.current);
    updateDictation({
      anchor: selection.current,
      partial: '',
      startSegments: latest.current.segments,
      startSelection: selection.current,
      startText: latest.current.text,
    });
  };

  const setPartial = (partial) => {
    const current = dictationRef.current;
    if (current === null || current.partial === (partial ?? '')) return;
    updateDictation({ ...current, partial: partial ?? '' });
  };

  // A final result: the words go in at the anchor as plain text, then the conversion runs on the
  // whole text, so a sentence start is judged in context and a name split across two results is
  // found. A name dictated at the end of the text is whole; one typed at the end still waits.
  const commitDictation = ({ text: words }) => {
    const current = dictationRef.current;
    const anchor = current?.anchor ?? selection.current;
    const placed = placeDictation({ segments: latest.current.segments, selection: anchor, words });
    const converted = convertSegments({
      segments: placed.segments,
      cursor: placed.cursor,
      final: placed.atEnd,
    });
    const nextSegments = converted?.segments ?? placed.segments;
    const nextCursor = converted?.cursor ?? placed.cursor;
    commit({ nextSegments, nextCursor, force: true });
    if (current !== null) {
      updateDictation({ ...current, anchor: { start: nextCursor, end: nextCursor }, partial: '' });
    }
  };

  // Drops everything the session put in: the text and selection go back to how they were.
  const cancelDictation = () => {
    const current = dictationRef.current;
    if (current === null) return;
    updateDictation(null);
    if (current.startText !== latest.current.text) {
      commit({
        nextSegments: current.startSegments,
        nextCursor: current.startSelection.end,
        nextSelection: current.startSelection,
        force: true,
      });
      return;
    }
    selection.current = current.startSelection;
    setForced(current.startSelection);
  };

  const endDictation = () => {
    if (dictationRef.current !== null) {
      updateDictation(null);
    }
  };

  const onSelectionChange = ({ nativeEvent }) => {
    const snapped = snapSelection({ segments: shown.segments, selection: nativeEvent.selection });
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
    cancelDictation,
    commitDictation,
    display,
    endDictation,
    finishSpokenMentions,
    onChangeText,
    onSelectionChange,
    pickLink,
    pickMention,
    segments,
    selection: forced,
    setPartial,
    shown,
    startDictation,
    text,
    trigger,
  };
}

function asText(segment) {
  return segment.kind === 'partial' ? { kind: 'text', text: segment.text } : segment;
}

export default useMentionEditor;
