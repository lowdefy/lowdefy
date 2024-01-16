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
import { blockDefaultProps } from '@lowdefy/block-utils';
import Box from '../Box/Box.js';

const List = ({ blockId, events, list, methods, properties }) => {
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
  }, []);
  return (
    <Box
      blockId={blockId}
      events={events}
      properties={{
        style: {
          ...(properties.direction
            ? {
                display: 'flex',
                flexDirection: properties.direction,
                flexWrap: properties.wrap ? properties.wrap : 'wrap',
                overflow: properties.scroll ? 'auto' : 'visible',
              }
            : {}),
          ...properties.style,
        },
      }}
      methods={methods}
      content={{
        content: () => list.map((item) => item.content()),
      }}
    />
  );
};

List.defaultProps = blockDefaultProps;
List.meta = {
  category: 'list',
  valueType: 'array',
  icons: [],
  styles: [],
};

export default List;
