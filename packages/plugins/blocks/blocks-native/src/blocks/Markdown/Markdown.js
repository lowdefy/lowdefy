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

import React, { useCallback } from 'react';

import MarkdownContent from './MarkdownContent.js';
import meta from './meta.js';

// GitHub-flavoured markdown drawn with React Native views in the iOS typography (MarkdownContent).
// Every pressed link, chips included, runs onLinkPress when the block has it. Without it a web
// link opens in the in-app browser and any other link (mail, phone) through the system; a chip is
// not pressable.
function Markdown({ components, events, methods, properties, styles = {} }) {
  const hasOnLinkPress = Boolean(events.onLinkPress);
  const triggerLinkPress = useCallback(
    (href) => methods.triggerEvent({ name: 'onLinkPress', event: { href } }),
    [methods]
  );
  return (
    <MarkdownContent
      components={components}
      content={properties.content}
      linkChips={properties.linkChips}
      onLinkPress={hasOnLinkPress ? triggerLinkPress : null}
      skipHtml={properties.skipHtml === true}
      style={styles.element}
    />
  );
}

Markdown.meta = meta;

export default Markdown;
