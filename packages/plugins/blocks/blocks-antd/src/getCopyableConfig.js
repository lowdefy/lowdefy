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
import { type } from '@lowdefy/helpers';

// antd's ConfigProvider cannot replace the Typography copy icons, so the default pair is drawn with
// the app's icon set here, matching the edit icon and the rest of the app.
const defaultIcons = [
  { name: 'copy', title: '' },
  { name: 'check', title: '' },
];

// Typography copyable settings shared by TitleInput and ParagraphInput.
function getCopyableConfig({ blockId, classNames, copyable, events, Icon, methods, styles, text }) {
  const config = type.isObject(copyable) ? copyable : {};
  const copyText = config.text ?? text;
  // An empty value shows the placeholder, which is not something to copy.
  if (!copyable || copyText === '') {
    return false;
  }

  function renderIcon({ id, properties }) {
    return (
      <Icon
        key={id}
        blockId={`${blockId}_${id}`}
        classNames={{ element: classNames.copyableIcon }}
        events={events}
        properties={properties}
        styles={{ element: styles.copyableIcon }}
      />
    );
  }

  const icons = type.isNone(config.icon) ? defaultIcons : config.icon;
  return {
    text: copyText,
    onCopy: () => {
      methods.triggerEvent({ name: 'onCopy', event: { value: copyText } });
    },
    icon: type.isArray(icons)
      ? [
          renderIcon({ id: 'copyable_before_icon', properties: icons[0] }),
          renderIcon({ id: 'copyable_after_icon', properties: icons[1] }),
        ]
      : renderIcon({ id: 'copyable_icon', properties: icons }),
    tooltips: config.tooltips,
  };
}

export default getCopyableConfig;
