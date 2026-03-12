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
import { Flex } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const FlexBlock = ({ blockId, classNames = {}, content, properties, styles = {} }) => (
  <Flex
    id={blockId}
    className={classNames.element}
    style={styles.element}
    vertical={properties.vertical}
    wrap={properties.wrap}
    justify={properties.justify}
    align={properties.align}
    gap={properties.gap}
    flex={properties.flex}
    component={properties.component}
  >
    {content.content && content.content()}
  </Flex>
);

export default withTheme('Flex', withBlockDefaults(FlexBlock));
