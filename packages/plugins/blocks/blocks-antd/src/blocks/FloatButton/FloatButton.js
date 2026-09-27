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
import { FloatButton } from 'antd';

import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

// antd falls back to its own icons (a document, or an arrow for back to top),
// so the block names the app's equivalents instead.
function getIconProperties(properties) {
  if (!type.isNone(properties.icon)) {
    return properties.icon;
  }
  if (properties.backTop) {
    return 'arrow-up';
  }
  if (type.isNone(properties.description)) {
    return 'document';
  }
  return undefined;
}

function FloatButtonBlock({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  methods,
  properties,
  styles = {},
}) {
  const iconProperties = getIconProperties(properties);
  const buttonProps = {
    id: blockId,
    className: classNames.element,
    style: styles.element,
    type: properties.type,
    shape: properties.shape,
    content: properties.description,
    tooltip: properties.tooltip,
    disabled: properties.disabled,
    // antd renders an empty badge element for any badge key, even undefined.
    ...(type.isNone(properties.badge) ? {} : { badge: properties.badge }),
    icon: iconProperties && (
      <Icon
        blockId={`${blockId}_icon`}
        classNames={{ element: classNames.icon }}
        events={events}
        properties={iconProperties}
        styles={{ element: styles.icon }}
      />
    ),
    onClick: () => methods.triggerEvent({ name: 'onClick' }),
  };

  if (properties.backTop) {
    return (
      <FloatButton.BackTop
        {...buttonProps}
        duration={properties.duration}
        showProgress={properties.showProgress}
        visibilityHeight={properties.visibilityHeight}
      />
    );
  }
  return (
    <FloatButton
      {...buttonProps}
      htmlType={properties.htmlType}
      href={properties.href}
      target={properties.target}
    />
  );
}

export default withTheme('FloatButton', withBlockDefaults(FloatButtonBlock));
