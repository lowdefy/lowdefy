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
import { Text } from 'react-native';
import { type } from '@lowdefy/helpers';

import htmlToText from '../htmlToText.js';

const DEFAULT_SYMBOLS = ['Expand', 'Collapse'];

function getSymbols(ellipsis) {
  if (type.isArray(ellipsis.symbol)) return ellipsis.symbol;
  if (type.isString(ellipsis.symbol)) return [ellipsis.symbol, DEFAULT_SYMBOLS[1]];
  return DEFAULT_SYMBOLS;
}

// The rows an ellipsis keeps: one for `ellipsis: true`, `rows` for an ellipsis object.
function getRows(ellipsis) {
  if (ellipsis === true) return 1;
  if (type.isObject(ellipsis)) return ellipsis.rows ?? 1;
  return undefined;
}

/**
 * The text of a Title or Paragraph, with antd's ellipsis: the text is cut at `rows` lines, with
 * an expand control when `expandable` is set (and a collapse control when it is 'collapsible').
 * Pressing it fires onExpand with `{ expanded }`. A suffix follows the text.
 *
 * @param {Object} props
 * @param {Object} props.methods The block's methods.
 * @param {Object} props.properties The block's properties.
 * @param {Object} props.style The text style.
 * @param {Object} props.linkStyle The style of the expand control.
 */
function TypographyText({ accessibilityRole, blockId, linkStyle, methods, properties, style }) {
  const { ellipsis } = properties;
  const ellipsisObject = type.isObject(ellipsis) ? ellipsis : {};
  const [expanded, setExpanded] = useState(ellipsisObject.defaultExpanded === true);
  const text = htmlToText(properties.content) ?? '';
  const expandable =
    ellipsisObject.expandable === true || ellipsisObject.expandable === 'collapsible';
  const canCollapse = ellipsisObject.expandable === 'collapsible';
  const rows = expanded ? undefined : getRows(ellipsis);
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    methods.triggerEvent({ name: 'onExpand', event: { expanded: next } });
  };
  const [expandSymbol, collapseSymbol] = getSymbols(ellipsisObject);
  const showControl = expandable && (!expanded || canCollapse);
  return (
    <>
      <Text accessibilityRole={accessibilityRole} numberOfLines={rows} style={style}>
        {text}
        {ellipsisObject.suffix}
      </Text>
      {showControl ? (
        <Text
          accessibilityRole="button"
          onPress={toggle}
          style={linkStyle}
          testID={`${blockId}_${expanded ? 'collapse' : 'expand'}`}
        >
          {expanded ? collapseSymbol : expandSymbol}
        </Text>
      ) : null}
    </>
  );
}

export default TypographyText;
