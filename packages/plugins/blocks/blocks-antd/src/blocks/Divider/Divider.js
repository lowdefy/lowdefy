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
import { Divider } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const DividerBlock = ({ blockId, properties, methods }) => (
  <Divider
    id={blockId}
    dashed={properties.dashed}
    orientation={properties.orientation}
    plain={properties.plain}
    style={properties.style}
    type={properties.type}
  >
    {renderHtml({ html: properties.title, methods })}
  </Divider>
);

DividerBlock.defaultProps = blockDefaultProps;
DividerBlock.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Divider/style.less'],
};

export default DividerBlock;
