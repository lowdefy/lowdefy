/*
  Copyright 2020 Lowdefy, Inc

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

const NotificationBlock = ({ blockId, properties, methods, onClose, onClick }) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      notification[args.status || properties.status || 'success']({
        id: `${blockId}_notification`,
        bottom: properties.bottom,
        btn: properties.button && (
          <Button
            blockId={`${blockId}_button`}
            properties={properties.button}
            methods={methods}
            onClick={() => methods.callAction({ action: 'onClose' })}
          />
        ),
        className: methods.makeCssClass(properties.notificationStyle),
        description: args.description || properties.description,
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        icon: properties.icon && <Icon properties={properties.icon} methods={methods} />,
        closeIcon: properties.closeIcon && (
          <Icon
            blockId={`${blockId}_closeIcon`}
            properties={properties.closeIcon}
            methods={methods}
          />
        ),
        message: args.message || properties.message || blockId,
        onClose: onClose || (() => methods.callAction({ action: 'onClose' })),
        onClick: onClick || (() => methods.callAction({ action: 'onClick' })),
        placement: properties.placement,
        top: properties.top,
      });
    });
  }, [methods.registerMethod]);
  return <div id={blockId} />;
};

NotificationBlock.defaultProps = blockDefaultProps;

export default NotificationBlock;
