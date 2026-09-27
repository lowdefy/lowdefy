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
import { type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getCollapsible from './getCollapsible.js';
import withTheme from '../withTheme.js';
import './style.css';

const SplitterBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  content,
  events,
  methods,
  properties,
  styles = {},
}) => {
  const panels = properties.panels ?? [];
  // antd 6 renamed `layout` to `orientation`; Lowdefy keeps both properties.
  const orientation = properties.orientation ?? properties.layout;
  return (
    <Splitter
      id={blockId}
      className={classNames.element}
      classNames={{ panel: classNames.panel, dragger: classNames.dragger }}
      style={styles.element}
      // antd reads the dragger style from `default` and `active` keys, and only applies `default`.
      styles={{ panel: styles.panel, dragger: { default: styles.dragger } }}
      collapsible={getCollapsible({
        blockId,
        classNames,
        collapsible: properties.collapsible,
        events,
        Icon,
        orientation,
        styles,
      })}
      destroyOnHidden={properties.destroyOnHidden}
      draggerIcon={
        type.isNone(properties.draggerIcon) ? undefined : (
          <Icon
            blockId={`${blockId}_draggerIcon`}
            classNames={{ element: classNames.draggerIcon }}
            events={events}
            properties={properties.draggerIcon}
            styles={{ element: styles.draggerIcon }}
          />
        )
      }
      orientation={orientation}
      lazy={properties.lazy}
      onDraggerDoubleClick={(index) => {
        methods.triggerEvent({ name: 'onDraggerDoubleClick', event: { index } });
      }}
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
          destroyOnHidden={panel.destroyOnHidden}
          resizable={panel.resizable}
        >
          {content[panel.key] && content[panel.key]()}
        </Splitter.Panel>
      ))}
    </Splitter>
  );
};

export default withTheme('Splitter', withBlockDefaults(SplitterBlock));
