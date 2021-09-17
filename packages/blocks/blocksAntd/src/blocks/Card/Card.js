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
import { Card } from 'antd';
import { blockDefaultProps, RenderHtml } from '@lowdefy/block-tools';

const CardBlock = ({ blockId, content, properties, methods, events }) => (
  <Card
    id={blockId}
    title={
      content.title ? (
        content.title()
      ) : properties.title ? (
        <RenderHtml html={properties.title} methods={methods} />
      ) : undefined
    }
    headStyle={methods.makeCssClass(properties.headerStyle, { styleObjectOnly: true })}
    bodyStyle={methods.makeCssClass(properties.bodyStyle, { styleObjectOnly: true })}
    bordered={properties.bordered}
    extra={content.extra && content.extra()}
    hoverable={properties.hoverable}
    size={properties.size}
    type={properties.inner ? 'inner' : null}
    onClick={() => methods.triggerEvent({ name: 'onClick' })}
    className={methods.makeCssClass([
      { outline: 'none', cursor: events.onClick && 'pointer' },
      properties.style,
    ])}
  >
    {content.content && content.content()}
  </Card>
);

CardBlock.defaultProps = blockDefaultProps;

export default CardBlock;
