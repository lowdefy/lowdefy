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

import React, { useState, useEffect } from 'react';
import { get } from '@lowdefy/helpers';
import { Layout } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';

import { getDarkMode } from '../headerActions.js';
import withTheme from '../withTheme.js';

const Sider = Layout.Sider;

// Mirrors antd's own trigger arrows so the collapse trigger draws with the app's icons.
function getTriggerIconName({ collapsed, collapsedWidth, reverseArrow }) {
  if (Number.parseFloat(String(collapsedWidth)) === 0) {
    return 'menu';
  }
  if (collapsed !== Boolean(reverseArrow)) {
    return 'chevron-right';
  }
  return 'chevron-left';
}

const triggerSetOpen = async ({ state, setOpen, methods, rename }) => {
  if (!state) {
    await methods.triggerEvent({ name: get(rename, 'events.onClose', { default: 'onClose' }) });
  }
  if (state) {
    await methods.triggerEvent({ name: get(rename, 'events.onOpen', { default: 'onOpen' }) });
  }
  setOpen(state);
};

const SiderBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  properties,
  content,
  methods,
  onCollapse,
  rename,
  styles = {},
}) => {
  const [openState, setOpen] = useState(!properties.initialCollapsed);
  // Sync internal state when the parent (e.g. PageSidebarLayout) changes
  // `initialCollapsed` after mount — typically because a hydration-time read
  // from localStorage restored a value different from the SSR default.
  useEffect(() => {
    setOpen(!properties.initialCollapsed);
  }, [properties.initialCollapsed]);
  useEffect(() => {
    methods.registerMethod(get(rename, 'methods.toggleOpen', { default: 'toggleOpen' }), () =>
      triggerSetOpen({ state: !openState, setOpen, methods, rename })
    );
    methods.registerMethod(get(rename, 'methods.setOpen', { default: 'setOpen' }), ({ open }) =>
      triggerSetOpen({ state: !!open, setOpen, methods, rename })
    );
  });
  return (
    <Sider
      id={blockId}
      className={classNames.element ? `${classNames.element} hide-on-print` : 'hide-on-print'}
      classNames={{ body: classNames.body }}
      // antd only applies its defaults to undefined props; a null (an unset module var
      // property, say) would be written into the width styles as "null".
      breakpoint={properties.breakpoint ?? undefined}
      collapsed={!openState}
      collapsedWidth={properties.collapsedWidth ?? undefined}
      collapsible={properties.collapsible}
      reverseArrow={properties.reverseArrow}
      theme={properties.theme ?? (getDarkMode() ? 'dark' : 'light')}
      style={{
        overflow: 'auto',
        background: 'var(--ant-color-bg-container)',
        ...styles.element,
      }}
      styles={{ body: styles.body }}
      trigger={
        <Icon
          blockId={`${blockId}_trigger_icon`}
          properties={{
            name: getTriggerIconName({
              collapsed: !openState,
              collapsedWidth: properties.collapsedWidth ?? 80,
              reverseArrow: properties.reverseArrow,
            }),
            title: '',
          }}
        />
      }
      width={properties.width ?? undefined}
      onBreakpoint={(broken) => methods.triggerEvent({ name: 'onBreakpoint', event: { broken } })}
      onCollapse={(collapsed, collapseType) => {
        // Only the trigger toggles the sider here. A responsive collapse would override the
        // open state page layouts restore on mount, so breakpoints only fire onBreakpoint.
        if (collapseType !== 'clickTrigger') {
          return;
        }
        // Page layouts own the open state, so they toggle the sider through their own method.
        if (onCollapse) {
          onCollapse();
          return;
        }
        triggerSetOpen({ state: !collapsed, setOpen, methods, rename });
      }}
    >
      {content.content && content.content()}
    </Sider>
  );
};

export default withTheme('Layout', withBlockDefaults(SiderBlock));
