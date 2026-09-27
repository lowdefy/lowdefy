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

import React, { useEffect, useRef } from 'react';
import { ErrorBoundary, renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { App } from 'antd';
import { type } from '@lowdefy/helpers';

import Button from '../Button/Button.js';
import statusIcons from '../statusIcons.js';

const NotificationBlock = ({
  blockId,
  classNames = {},
  components: { Icon, ShortcutBadge, handleError },
  events,
  methods,
  properties,
  styles = {},
}) => {
  const { notification } = App.useApp();
  const openCount = useRef(0);
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      const status = args.status || properties.status || 'success';
      const icon = properties.icon ?? statusIcons[status];
      openCount.current += 1;
      // The key lets the button close this notification; each open gets its own notification.
      const key = `${blockId}_notification_${openCount.current}`;
      notification[status]({
        key,
        bottom: properties.bottom,
        className: classNames.element,
        style: styles.element,
        description: renderHtml({ html: args.description || properties.description, methods }),
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        title: renderHtml({
          html: args.title || properties.title || blockId,
          methods,
        }),
        onClick: () => methods.triggerEvent({ name: 'onClick' }),
        onClose: () => methods.triggerEvent({ name: 'onClose' }),
        closable: properties.closable,
        pauseOnHover: properties.pauseOnHover,
        placement: properties.placement,
        role: properties.role,
        showProgress: properties.showProgress,
        top: properties.top,
        classNames: {
          actions: classNames.actions,
          description: classNames.description,
          // antd colours its status icon through a class on the icon wrapper, and only adds it
          // for its own icons; the Lowdefy status icon needs it too.
          icon: type.isNone(properties.icon) ? `ant-notification-notice-icon-${status}` : undefined,
          progress: classNames.progress,
          title: classNames.title,
        },
        styles: {
          actions: styles.actions,
          description: styles.description,
          progress: styles.progress,
          title: styles.title,
        },
        icon: icon && (
          <ErrorBoundary onError={handleError}>
            <Icon
              blockId={`${blockId}_icon`}
              classNames={{ element: classNames.icon }}
              events={events}
              properties={icon}
              styles={{ element: styles.icon }}
            />
          </ErrorBoundary>
        ),
        actions: properties.button && (
          <ErrorBoundary onError={handleError}>
            <Button
              blockId={`${blockId}_button`}
              components={{ Icon, ShortcutBadge }}
              events={events}
              properties={properties.button}
              onClick={() => {
                notification.destroy(key);
                methods.triggerEvent({ name: 'onClose' });
              }}
            />
          </ErrorBoundary>
        ),
        closeIcon: (
          <ErrorBoundary onError={handleError}>
            <Icon
              blockId={`${blockId}_closeIcon`}
              classNames={{ element: classNames.closeIcon }}
              events={events}
              properties={properties.closeIcon ?? { name: 'close', title: '' }}
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
