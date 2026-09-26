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
import { ConfigProvider } from 'antd';

// Icon keys for a ConfigProvider around the page tree, so antd's own chrome
// draws with the app's icon set. Tag is left out: a context closeIcon makes
// every Tag closable (antd's useClosable), so the Tag block passes its own.
function createAntdIconConfig({ Icon }) {
  function chromeIcon(name, properties) {
    return <Icon properties={{ name, title: '', ...properties }} />;
  }

  // antd renders a function menu.expandIcon as a component, so it is created
  // once here to keep its identity, and it adds the expand-icon class itself.
  function MenuExpandIcon({ isOpen }) {
    const { getPrefixCls } = React.useContext(ConfigProvider.ConfigContext);
    return (
      <Icon
        className={`${getPrefixCls('menu')}-submenu-expand-icon`}
        properties={{ name: 'chevron-down', rotate: isOpen ? 180 : 0, title: '' }}
      />
    );
  }

  const closeIcon = chromeIcon('close');
  return {
    alert: {
      closeIcon,
      errorIcon: chromeIcon('error'),
      infoIcon: chromeIcon('info'),
      successIcon: chromeIcon('success'),
      warningIcon: chromeIcon('warning'),
    },
    breadcrumb: { dropdownIcon: chromeIcon('chevron-down') },
    button: { loadingIcon: chromeIcon('loading', { spin: true }) },
    collapse: {
      expandIcon: ({ isActive }) => chromeIcon('chevron-right', { rotate: isActive ? 90 : 0 }),
    },
    datePicker: { suffixIcon: chromeIcon('calendar') },
    drawer: { closeIcon },
    menu: { expandIcon: MenuExpandIcon },
    modal: { closeIcon },
    tabs: { moreIcon: chromeIcon('more') },
    timePicker: { suffixIcon: chromeIcon('clock') },
    tour: { closeIcon },
    treeSelect: { switcherIcon: chromeIcon('chevron-down') },
  };
}

export default createAntdIconConfig;
