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
import withTheme from '../withTheme.js';

function renderIcon({ blockId, classNames, events, Icon, properties, slot, styles }) {
  if (type.isNone(properties)) {
    return undefined;
  }
  return (
    <Icon
      blockId={`${blockId}_${slot}`}
      classNames={{ element: classNames }}
      events={events}
      properties={properties}
      styles={{ element: styles }}
    />
  );
}

function getCollapsible({ blockId, classNames, collapsible, events, Icon, styles }) {
  if (type.isNone(collapsible)) {
    return undefined;
  }
  const icon = collapsible.icon ?? {};
  return {
    motion: collapsible.motion,
    icon: {
      start: renderIcon({
        blockId,
        classNames: classNames.collapseIcon,
        events,
        Icon,
        properties: icon.start,
        slot: 'collapseIcon_start',
        styles: styles.collapseIcon,
      }),
      end: renderIcon({
        blockId,
        classNames: classNames.collapseIcon,
        events,
        Icon,
        properties: icon.end,
        slot: 'collapseIcon_end',
        styles: styles.collapseIcon,
      }),
    },
  };
}

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
  return (
    <Splitter
      id={blockId}
      className={classNames.element}
      classNames={{ panel: classNames.panel, dragger: classNames.dragger }}
      style={styles.element}
      styles={{ panel: styles.panel, dragger: styles.dragger }}
      collapsible={getCollapsible({
        blockId,
        classNames,
        collapsible: properties.collapsible,
        events,
        Icon,
        styles,
      })}
      destroyOnHidden={properties.destroyOnHidden}
      draggerIcon={renderIcon({
        blockId,
        classNames: classNames.draggerIcon,
        events,
        Icon,
        properties: properties.draggerIcon,
        slot: 'draggerIcon',
        styles: styles.draggerIcon,
      })}
      // antd 6 renamed `layout` to `orientation`; Lowdefy keeps both properties.
      orientation={properties.orientation ?? properties.layout}
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
