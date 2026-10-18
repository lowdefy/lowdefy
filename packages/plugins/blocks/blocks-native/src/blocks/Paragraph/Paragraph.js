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

import getTextStyle from '../../typography/getTextStyle.js';
import meta from './meta.js';
import TypographyText from '../../typography/TypographyText.js';
import useComponentTokens from '../../useComponentTokens.js';

// antd's paragraph: body text with an em below it.
function Paragraph({ blockId, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const baseStyle = {
    color: tokens.colorText,
    fontSize: tokens.fontSize,
    lineHeight: tokens.fontSize * tokens.lineHeight,
    marginBottom: tokens.fontSize,
  };
  return (
    <TypographyText
      blockId={blockId}
      linkStyle={[{ color: tokens.colorLink, fontSize: tokens.fontSize }, styles.actions]}
      methods={methods}
      properties={properties}
      style={[getTextStyle({ baseStyle, properties, tokens }), styles.element]}
    />
  );
}

Paragraph.meta = meta;

export default Paragraph;
