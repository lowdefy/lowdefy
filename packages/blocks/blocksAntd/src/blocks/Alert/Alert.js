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

import React from 'react';
import { Alert } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Icon from '../Icon/Icon';

const AlertBlock = ({ blockId, methods, properties }) => {
  const additionalProps = {};
  if (properties.icon) {
    additionalProps.icon = (
      <Icon blockId={`${blockId}_icon`} methods={methods} properties={properties.icon} />
    );
  }
  return (
    <Alert
      afterClose={() => methods.triggerEvent({ name: 'afterClose' })}
      banner={properties.banner}
      closable={properties.closable}
      closeText={properties.closeText}
      description={properties.description}
      id={blockId}
      message={
        properties.message
          ? properties.message
          : !properties.description && <div style={{ height: '1.5175em' }}></div>
      }
      onClose={() => methods.triggerEvent({ name: 'onClose' })}
      showIcon={properties.showIcon === false ? false : true}
      type={properties.type}
      {...additionalProps}
    />
  );
};

AlertBlock.defaultProps = blockDefaultProps;

export default AlertBlock;
