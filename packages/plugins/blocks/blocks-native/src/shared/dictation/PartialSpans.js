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

import React from 'react';
import { Text } from 'react-native';

import insertAtSelection from './insertAtSelection.js';

/**
 * The children a plain TextInput renders in place of its value while dictation listens: the text
 * before the selection, the words still being heard in the secondary colour, then the text after.
 * The words sit where insertAtSelection will put them once final, with the same spacing, and
 * stand in for a selected range they will replace, so nothing moves when they commit.
 *
 * @param {Object} props
 * @param {string} props.color The partial words' colour, the host's secondary label colour.
 * @param {string} props.partial useDictation's partial.
 * @param {{ start: number, end: number }} [props.selection] The input's selection when dictation
 *   started.
 * @param {string} props.text The input's text.
 */
function PartialSpans({ color, partial, selection, text }) {
  const start = selection?.start ?? text.length;
  const end = selection?.end ?? start;
  if (partial === '') {
    return <Text>{text}</Text>;
  }
  const shown = insertAtSelection({ text, selection: { start, end }, insert: partial });
  return (
    <>
      <Text>{text.slice(0, start)}</Text>
      <Text style={{ color }}>{shown.text.slice(start, shown.cursor)}</Text>
      <Text>{text.slice(end)}</Text>
    </>
  );
}

export default PartialSpans;
