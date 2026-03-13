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

import React, { useEffect } from 'react';
import { ErrorBoundary, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { notification } from 'antd';
import { type } from '@lowdefy/helpers';

import Button from '../Button/Button.js';

const NotificationBlock = ({
  blockId,
  classNames = {},
  components: { Icon, handleError },
  events,
  methods,
  properties,
  styles = {},
}) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      notification[args.status || properties.status || 'success']({
        id: `${blockId}_notification`,
        bottom: properties.bottom,
        className: classNames.element,
        style: styles.element,
        description: renderHtml({ html: args.description || properties.description, methods }),
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        message: renderHtml({ html: args.title || properties.title || blockId, methods }),
        onClick: () => methods.triggerEvent({ name: 'onClick' }),
        onClose: () => methods.triggerEvent({ name: 'onClose' }),
        placement: properties.placement,
        top: properties.top,
        icon: properties.icon && (
          <ErrorBoundary onError={handleError}>
            <Icon
              blockId={`${blockId}_icon`}
              classNames={{ element: classNames.icon }}
              events={events}
              properties={properties.icon}
              styles={{ element: styles.icon }}
            />
          </ErrorBoundary>
        ),
        btn: properties.button && (
          <ErrorBoundary onError={handleError}>
            <Button
              blockId={`${blockId}_button`}
              components={{ Icon }}
              events={events}
              properties={properties.button}
              onClick={() => methods.triggerEvent({ name: 'onClose' })}
            />
          </ErrorBoundary>
        ),
        closeIcon: properties.closeIcon && (
          <ErrorBoundary onError={handleError}>
            <Icon
              blockId={`${blockId}_closeIcon`}
              classNames={{ element: classNames.closeIcon }}
              events={events}
              properties={properties.closeIcon}
              styles={{ element: styles.closeIcon }}
            />
          </ErrorBoundary>
        ),
      });
    });
  });
  return <div id={blockId} />;
};

export default withBlockDefaults(NotificationBlock);
