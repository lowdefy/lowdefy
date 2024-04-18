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

import React from 'react';
import { Alert } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

const AlertBlock = ({ blockId, content, events, components: { Icon }, methods, properties }) => {
  const additionalProps = {};
  if (properties.icon) {
    additionalProps.icon = (
      <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
    );
  }
  return (
    <Alert
      action={content.action && content.action()}
      afterClose={() => methods.triggerEvent({ name: 'afterClose' })}
      banner={properties.banner}
      closable={properties.closable}
      closeText={properties.closeText}
      description={renderHtml({ html: properties.description, methods })}
      id={blockId}
      message={
        type.isNone(properties.message) ? (
          <div style={{ marginBottom: -4 }} />
        ) : (
          renderHtml({ html: properties.message, methods })
        )
      }
      onClose={() => methods.triggerEvent({ name: 'onClose' })}
      showIcon={properties.showIcon === false ? false : true}
      type={properties.type}
      {...additionalProps}
    />
  );
};

AlertBlock.defaultProps = blockDefaultProps;
AlertBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Alert/style.less'],
};

export default AlertBlock;
