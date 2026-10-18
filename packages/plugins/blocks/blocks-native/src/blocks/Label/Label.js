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

import getLabelState from './getLabelState.js';

function getFeedbackColor({ status, tokens }) {
  if (status === 'warning') return tokens.colorWarning;
  return tokens.colorError;
}

/**
 * The label every input draws around its control, as the web inputs use the antd Label: the
 * title with the `required` mark and colon, the control, and under it the validation message
 * from the engine or the label's extra text. `inline` puts the title beside the control.
 *
 * The `label`, `extra` and `feedback` style slots style the title, the extra text and the
 * message.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.properties The label properties: `{ title, ...properties.label }`.
 * @param {boolean} [props.required] Whether the input is required (the engine's `required`).
 * @param {Object} props.styles The block's style slots.
 * @param {Object} props.tokens The block's antd tokens.
 * @param {Object} [props.validation] The engine's `{ status, errors, warnings }`.
 */
function Label({ blockId, children, properties, required, styles, tokens, validation }) {
  const { colon, extra, feedback, title } = getLabelState({ blockId, properties, validation });
  const inline = properties.inline === true;
  const titleNode = title === null ? null : (
    <Text
      nativeID={`${blockId}_label`}
      style={[
        {
          color: tokens.colorText,
          fontSize: tokens.fontSize,
          marginBottom: inline ? 0 : tokens.marginXS,
          marginRight: inline ? tokens.marginXS : 0,
        },
        styles.label,
      ]}
    >
      {required === true ? <Text style={{ color: tokens.colorError }}>* </Text> : null}
      {title}
      {colon ? ':' : null}
    </Text>
  );
  return (
    <View>
      <View style={inline ? { alignItems: 'center', flexDirection: 'row' } : null}>
        {titleNode}
        <View style={inline ? { flex: 1 } : null}>{children}</View>
      </View>
      {feedback === null ? null : (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            {
              color: getFeedbackColor({ status: validation.status, tokens }),
              fontSize: tokens.fontSize,
              marginTop: tokens.marginXXS,
            },
            styles.feedback,
          ]}
          testID={`${blockId}_feedback`}
        >
          {feedback}
        </Text>
      )}
      {extra === null ? null : (
        <Text
          style={[
            { color: tokens.colorTextSecondary, fontSize: tokens.fontSize, marginTop: tokens.marginXXS },
            styles.extra,
          ]}
          testID={`${blockId}_extra`}
        >
          {extra}
        </Text>
      )}
    </View>
  );
}

export default Label;
