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

import MarkdownRenderer from '../Markdown/MarkdownRenderer.js';
import parseTimelineHref from './parseTimelineHref.js';

// The Markdown block's renderer, with the links toTimelineMarkdown writes drawn as chips: a
// mention as a tinted @Name (muted for someone who cannot see the record), a record link as its
// key, pressed through onRecordPress.
class TimelineMarkdownRenderer extends MarkdownRenderer {
  constructor({ chipStyles, onRecordPress, ...options }) {
    super(options);
    this.chipStyles = chipStyles;
    this.onRecordPress = onRecordPress;
  }

  link(children, href, styles, title) {
    const target = parseTimelineHref(href);
    if (target.kind === 'mention') {
      return (
        <Text
          accessibilityLabel={`Mention ${target.name}`}
          key={this.getKey()}
          style={target.muted ? this.chipStyles.muted : this.chipStyles.mention}
        >
          {`@${target.name}`}
        </Text>
      );
    }
    if (target.kind === 'record') {
      return (
        <Text
          accessibilityRole="link"
          key={this.getKey()}
          onPress={() => this.onRecordPress(target.key)}
          style={this.chipStyles.record}
        >
          {target.key}
        </Text>
      );
    }
    return super.link(children, href, styles, title);
  }
}

export default TimelineMarkdownRenderer;
