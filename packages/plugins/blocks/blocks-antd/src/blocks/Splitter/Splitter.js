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
import { Splitter } from 'antd';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const SplitterBlock = ({ blockId, classNames = {}, content, methods, properties, styles = {} }) => {
  const panels = properties.panels ?? [];
  return (
    <Splitter
      id={blockId}
      className={classNames.element}
      style={styles.element}
      layout={properties.orientation ?? properties.layout}
      lazy={properties.lazy}
      onResize={(sizes) => {
        methods.triggerEvent({ name: 'onResize', event: { sizes } });
      }}
      onResizeEnd={(sizes) => {
        methods.triggerEvent({ name: 'onResizeEnd', event: { sizes } });
      }}
      onResizeStart={(sizes) => {
        methods.triggerEvent({ name: 'onResizeStart', event: { sizes } });
      }}
      onCollapse={(collapsed, sizes) => {
        methods.triggerEvent({ name: 'onCollapse', event: { collapsed, sizes } });
      }}
    >
      {panels.map((panel) => (
        <Splitter.Panel
          key={panel.key}
          size={panel.size}
          min={panel.min}
          max={panel.max}
          defaultSize={panel.defaultSize}
          collapsible={panel.collapsible}
          resizable={panel.resizable}
        >
          {content[panel.key] && content[panel.key]()}
        </Splitter.Panel>
      ))}
    </Splitter>
  );
};

export default withTheme('Splitter', withBlockDefaults(SplitterBlock));
