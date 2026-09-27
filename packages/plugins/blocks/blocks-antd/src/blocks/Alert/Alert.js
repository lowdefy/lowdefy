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
import { Alert } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';

const AlertBlock = ({
  blockId,
  classNames = {},
  content,
  events,
  components: { Icon },
  methods,
  properties,
  styles = {},
}) => {
  const additionalProps = {};
  if (properties.icon) {
    additionalProps.icon = (
      <Icon
        blockId={`${blockId}_icon`}
        classNames={{ element: classNames.icon }}
        events={events}
        properties={properties.icon}
        styles={{ element: styles.icon }}
      />
    );
  }
  // antd shows a close button whenever a close text is set, so closeText keeps implying closable.
  const closable = properties.closable === true || !type.isNone(properties.closeText);
  let closeIcon;
  if (!type.isNone(properties.closeText)) {
    closeIcon = properties.closeText;
  } else if (!type.isNone(properties.closeIcon)) {
    closeIcon = (
      <Icon blockId={`${blockId}_closeIcon`} events={events} properties={properties.closeIcon} />
    );
  }
  return (
    <Alert
      action={content.action && content.action()}
      banner={properties.banner}
      closable={
        closable
          ? {
              closeIcon,
              onClose: () => methods.triggerEvent({ name: 'onClose' }),
              afterClose: () => methods.triggerEvent({ name: 'afterClose' }),
            }
          : false
      }
      className={classNames.element}
      classNames={{
        actions: classNames.action,
        close: classNames.closeIcon,
        description: classNames.description,
        icon: classNames.icon,
        title: classNames.message,
      }}
      description={renderHtml({ html: properties.description, methods })}
      id={blockId}
      showIcon={properties.showIcon === false ? false : true}
      style={styles.element}
      styles={{
        actions: styles.action,
        close: styles.closeIcon,
        description: styles.description,
        icon: styles.icon,
        title: styles.message,
      }}
      title={
        type.isNone(properties.message) ? (
          <div style={{ marginBottom: -4 }} />
        ) : (
          renderHtml({ html: properties.message, methods })
        )
      }
      type={properties.type}
      variant={properties.variant}
      {...additionalProps}
    />
  );
};

export default withTheme('Alert', withBlockDefaults(AlertBlock));
