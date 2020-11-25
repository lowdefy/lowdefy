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

import React from 'react';
import { Spin } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const SpinBlock = ({ blockId, content, properties, methods }) => (
  <Spin
    id={blockId}
    className={methods.makeCssClass([
      { textAlign: 'center', width: '100%', padding: '80px 0' },
      properties.style,
    ])}
    delay={properties.delay}
    indicator={content.indicator && content.indicator()}
    size={properties.size}
    spinning={properties.spinning}
    tip={properties.tip}
    wrapperClassName={methods.makeCssClass(properties.wrapperStyle)}
  >
    {content.content && content.content()}
  </Spin>
);

SpinBlock.defaultProps = blockDefaultProps;

export default SpinBlock;
