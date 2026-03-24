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

import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import { renderHeaderActions, registerDarkModeMethod } from '../headerActions.js';

const Header = Layout.Header;

const HeaderBlock = ({
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge } = {},
  content,
  events = {},
  methods = {},
  properties = {},
  styles = {},
}) => {
  useEffect(() => {
    if (properties.darkModeToggle && methods.registerEvent) {
      registerDarkModeMethod(methods);
    }
  });

  const hasActions =
    !type.isNone(properties.notifications) ||
    !type.isNone(properties.profile) ||
    properties.darkModeToggle;

  return (
    <Header
      id={blockId}
      className={classNames.element ? `${classNames.element} hide-on-print` : 'hide-on-print'}
      style={{
        display: 'flex',
        alignItems: 'center',
        ...styles.element,
      }}
    >
      {content.content && content.content({ flex: '1 1 auto', minWidth: 0, alignItems: 'center' })}
      {hasActions &&
        renderHeaderActions({
          blockId,
          classNames,
          styles,
          properties,
          methods,
          events,
          components: { Icon, Link, ShortcutBadge },
        })}
    </Header>
  );
};

export default withBlockDefaults(HeaderBlock);
