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
import { Text, View } from 'react-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import getLabelState from './getLabelState.js';

function getFeedbackColor({ status, tokens }) {
  if (status === 'warning') return tokens.colorWarning;
  return tokens.colorError;
}

/**
 * The label every input draws around its control, as the web inputs use the antd Label: the
 * title with the `required` mark and colon, the control, and under it the validation message
 * from the engine or the label's extra text. An input without a title draws no title. A title
 * above its control is a subheadline in the secondary label colour, as an iOS form labels a
 * field; `inline` puts it beside the control in the body style.
 *
 * The `label`, `extra` and `feedback` style slots style the title, the extra text and the
 * message.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.properties The label properties: `{ title, ...properties.label }`.
 * @param {boolean} [props.required] Whether the input is required (the engine's `required`).
 * @param {Object} props.styles The block's style slots.
 * @param {Object} props.tokens The block's theme tokens.
 * @param {Object} [props.validation] The engine's `{ status, errors, warnings }`.
 */
function Label({ blockId, children, properties, required, styles, tokens, validation }) {
  const { colon, extra, feedback, title } = getLabelState({ properties, validation });
  const inline = properties.inline === true;
  const titleStyle = inline
    ? getIosTextStyle({ textStyle: 'body', tokens })
    : getIosTextStyle({ color: tokens.colorSecondaryLabel, textStyle: 'subheadline', tokens });
  const titleNode =
    title === null ? null : (
      <Text
        nativeID={`${blockId}_label`}
        style={[
          titleStyle,
          {
            flexShrink: inline ? 1 : 0,
            fontWeight: inline ? '400' : '500',
            marginBottom: inline ? 0 : 6,
            marginRight: inline ? 12 : 0,
          },
          styles.label,
        ]}
      >
        {required === true ? <Text style={{ color: tokens.colorError }}>* </Text> : null}
        {title}
        {colon ? ':' : null}
      </Text>
    );
  const messageStyle = getIosTextStyle({ textStyle: 'footnote', tokens });
  return (
    <View>
      <View style={inline ? { alignItems: 'center', flexDirection: 'row', minHeight: 44 } : null}>
        {titleNode}
        <View style={inline ? { flex: 1 } : null}>{children}</View>
      </View>
      {feedback === null ? null : (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            messageStyle,
            { color: getFeedbackColor({ status: validation.status, tokens }), marginTop: 6 },
            styles.feedback,
          ]}
          testID={`${blockId}_feedback`}
        >
          {feedback}
        </Text>
      )}
      {extra === null ? null : (
        <Text
          style={[messageStyle, { color: tokens.colorSecondaryLabel, marginTop: 6 }, styles.extra]}
          testID={`${blockId}_extra`}
        >
          {extra}
        </Text>
      )}
    </View>
  );
}

export default Label;
