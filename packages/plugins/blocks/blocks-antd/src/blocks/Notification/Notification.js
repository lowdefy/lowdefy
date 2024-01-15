/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { notification } from 'antd';
import { type } from '@lowdefy/helpers';

import Button from '../Button/Button.js';

const NotificationBlock = ({ blockId, components: { Icon }, events, methods, properties }) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      notification[args.status || properties.status || 'success']({
        id: `${blockId}_notification`,
        bottom: properties.bottom,
        className: methods.makeCssClass(properties.notificationStyle),
        description: renderHtml({ html: args.description || properties.description, methods }),
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        message: renderHtml({ html: args.message || properties.message || blockId, methods }),
        onClick: () => methods.triggerEvent({ name: 'onClick' }),
        onClose: () => methods.triggerEvent({ name: 'onClose' }),
        placement: properties.placement,
        top: properties.top,
        icon: properties.icon && (
          <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
        ),
        btn: properties.button && (
          <Button
            blockId={`${blockId}_button`}
            events={events}
            properties={properties.button}
            onClick={() => methods.triggerEvent({ name: 'onClose' })}
          />
        ),
        closeIcon: properties.closeIcon && (
          <Icon
            blockId={`${blockId}_closeIcon`}
            events={events}
            properties={properties.closeIcon}
          />
        ),
      });
    });
  });
  return <div id={blockId} />;
};

NotificationBlock.defaultProps = blockDefaultProps;
NotificationBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Notification/style.less'],
};

export default NotificationBlock;
