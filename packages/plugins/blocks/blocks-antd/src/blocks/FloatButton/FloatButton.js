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

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const FloatButtonBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  methods,
  properties,
  styles = {},
}) => (
  <FloatButton
    id={blockId}
    className={classNames.element}
    style={styles.element}
    type={properties.type}
    shape={properties.shape}
    description={properties.description}
    tooltip={properties.tooltip}
    icon={
      properties.icon && (
        <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
      )
    }
    htmlType={properties.htmlType}
    href={properties.href}
    target={properties.target}
    badge={properties.badge}
    onClick={() => methods.triggerEvent({ name: 'onClick' })}
  />
);

export default withTheme('FloatButton', withBlockDefaults(FloatButtonBlock));
