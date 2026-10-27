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
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import getSummaryCount from './getSummaryCount.js';

const MEASURE = {
  left: 0,
  opacity: 0,
  position: 'absolute',
  top: 0,
};

// A copy of text that is measured, kept out of the layout, out of sight and from screen readers.
function MeasureText({ children, numberOfLines, onLayout, onTextLayout, style, testID }) {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      numberOfLines={numberOfLines}
      onLayout={onLayout}
      onTextLayout={onTextLayout}
      pointerEvents="none"
      style={[style, MEASURE]}
      testID={testID}
    >
      {children}
    </Text>
  );
}

/**
 * The chosen labels of a MultipleSelector on one line, joined with ", ". When they do not fit,
 * the labels that fit are followed by "+N", the count of the rest, such as "agent-rules, ui +2";
 * a first label that does not fit alone ends in an ellipsis. The room is measured: the view's
 * width, the width of "+N", whether the joined labels fit on one line in the whole width, and
 * when they do not, the first line of the joined labels laid out in the room left beside "+N"
 * (getSummaryCount). Until those are known, the joined labels end in an ellipsis.
 *
 * @param {Object} props
 * @param {'left'|'right'} props.align Where the text sits in the room.
 * @param {string[]} props.labels
 * @param {Object|Object[]} props.style The text style.
 * @param {string} props.testID
 */
function ValueSummary({ align, labels, style, testID }) {
  const [width, setWidth] = useState(null);
  const [suffixWidth, setSuffixWidth] = useState(null);
  const [fitsWhole, setFitsWhole] = useState(null);
  const [fit, setFit] = useState(null);
  const joined = labels.join(', ');
  const room = width === null || suffixWidth === null ? null : width - suffixWidth;
  // A measure taken for other labels or another width is stale.
  const wholeKey = `${width}:${joined}`;
  const fitKey = `${room}:${joined}`;
  const whole = fitsWhole !== null && fitsWhole.key === wholeKey ? fitsWhole.fits : null;
  const fitCount = fit !== null && fit.key === fitKey ? fit.count : null;
  const measuring = labels.length > 1 && width !== null;
  const shown = whole === false && fitCount !== null ? fitCount : labels.length;
  const rest = labels.length - shown;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
      testID={testID}
    >
      {measuring ? (
        <>
          <MeasureText
            onTextLayout={(event) =>
              setFitsWhole({ fits: event.nativeEvent.lines.length <= 1, key: wholeKey })
            }
            style={[style, { width }]}
            testID={`${testID}_measure_whole`}
          >
            {joined}
          </MeasureText>
          <MeasureText
            numberOfLines={1}
            onLayout={(event) => setSuffixWidth(event.nativeEvent.layout.width)}
            style={style}
            testID={`${testID}_measure_suffix`}
          >
            {` +${labels.length}`}
          </MeasureText>
          {room === null || whole === true ? null : (
            <MeasureText
              onTextLayout={(event) => {
                const { lines } = event.nativeEvent;
                const count =
                  lines.length <= 1
                    ? labels.length
                    : getSummaryCount({ labels, lineText: lines[0].text });
                setFit({ count, key: fitKey });
              }}
              style={[style, { width: Math.max(room, 0) }]}
              testID={`${testID}_measure`}
            >
              {joined}
            </MeasureText>
          )}
        </>
      ) : null}
      <Text numberOfLines={1} style={[style, { flexShrink: 1 }]}>
        {rest === 0 ? joined : labels.slice(0, shown).join(', ')}
      </Text>
      {rest === 0 ? null : <Text style={[style, { flexShrink: 0 }]}>{` +${rest}`}</Text>}
    </View>
  );
}

export default ValueSummary;
