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
import { message } from 'antd';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const MessageBlock = ({ blockId, events, properties, methods }) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      return message[args.status || properties.status || 'success']({
        id: `${blockId}_message`,
        content: args.content || properties.content || blockId,
        duration: type.isNone(args.duration) ? properties.duration : args.duration,
        onClose: () => methods.triggerEvent({ name: 'onClose' }),
        icon: (args.icon || properties.icon) && (
          <Icon
            blockId={`${blockId}_icon`}
            events={events}
            properties={args.icon || properties.icon}
            methods={methods}
          />
        ),
        className: methods.makeCssClass(properties.messageStyle),
      });
    });
  });
  return <div id={blockId} />;
};

MessageBlock.defaultProps = blockDefaultProps;

export default MessageBlock;
