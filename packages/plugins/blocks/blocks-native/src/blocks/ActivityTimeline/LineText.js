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

/**
 * A timeline line's sentence as one wrapping text: the actor in the label colour and bold (with
 * "via agent" for an agent), strong parts in the label colour, the rest secondary, and the time
 * after it.
 */
function LineText({ colors, hideActor, segments, time }) {
  const pieces = [];
  segments.forEach((segment, index) => {
    if (segment.kind === 'actor') {
      if (hideActor) return;
      pieces.push(
        <Text key={index} style={{ color: colors.label, fontWeight: '600' }}>
          {segment.name}
        </Text>
      );
      if (segment.agent) {
        pieces.push(
          <Text key={`${index}-agent`} style={{ color: colors.tertiary }}>
            {' via agent'}
          </Text>
        );
      }
      return;
    }
    let text = segment.text;
    // A line drawn without its actor starts at the verb: "edited the body".
    if (hideActor && pieces.length === 0) {
      text = text.replace(/^\s+/, '');
    }
    pieces.push(
      <Text
        key={index}
        style={segment.kind === 'strong' ? { color: colors.label, fontWeight: '500' } : null}
      >
        {text}
      </Text>
    );
  });
  return (
    <Text style={{ color: colors.secondary, fontSize: 15, lineHeight: 20 }}>
      {pieces}
      {time ? <Text style={{ color: colors.tertiary, fontSize: 13 }}>{`  ${time}`}</Text> : null}
    </Text>
  );
}

export default LineText;
