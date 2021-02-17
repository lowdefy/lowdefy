/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { notification } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { type } from '@lowdefy/helpers';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';

const NotificationBlock = ({ blockId, events, properties, methods }) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      notification[args.status || properties.status || 'success']({
        id: `${blockId}_notification`,
        bottom: properties.bottom,
        btn: properties.button && (
          <Button
            blockId={`${blockId}_button`}
            events={events}
            properties={properties.button}
            onClick={() => methods.triggerEvent({ name: 'onClose' })}
          />
        ),
        className: methods.makeCssClass(properties.notificationStyle),
        description: args.description || properties.description,
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        icon: properties.icon && (
          <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
        ),
        closeIcon: properties.closeIcon && (
          <Icon
            blockId={`${blockId}_closeIcon`}
            events={events}
            properties={properties.closeIcon}
          />
        ),
        message: args.message || properties.message || blockId,
        onClose: () => methods.triggerEvent({ name: 'onClose' }),
        onClick: () => methods.triggerEvent({ name: 'onClick' }),
        placement: properties.placement,
        top: properties.top,
      });
    });
  });
  return <div id={blockId} />;
};

NotificationBlock.defaultProps = blockDefaultProps;

export default NotificationBlock;
