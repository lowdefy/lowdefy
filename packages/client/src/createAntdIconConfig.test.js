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
import { render } from '@testing-library/react';
import { Alert, Collapse, ConfigProvider, Tag, theme } from 'antd';

import createAntdIconConfig from './createAntdIconConfig.js';

function Icon({ className, properties }) {
  return (
    <i
      className={className}
      data-name={properties.name}
      data-rotate={properties.rotate}
      data-spin={properties.spin}
      data-title={properties.title}
    />
  );
}

test('createAntdIconConfig sets the D9 chrome icons by semantic name', () => {
  const config = createAntdIconConfig({ Icon });
  const names = {
    'alert.closeIcon': config.alert.closeIcon.props.properties.name,
    'alert.errorIcon': config.alert.errorIcon.props.properties.name,
    'alert.infoIcon': config.alert.infoIcon.props.properties.name,
    'alert.successIcon': config.alert.successIcon.props.properties.name,
    'alert.warningIcon': config.alert.warningIcon.props.properties.name,
    'breadcrumb.dropdownIcon': config.breadcrumb.dropdownIcon.props.properties.name,
    'button.loadingIcon': config.button.loadingIcon.props.properties.name,
    'datePicker.suffixIcon': config.datePicker.suffixIcon.props.properties.name,
    'drawer.closeIcon': config.drawer.closeIcon.props.properties.name,
    'modal.closeIcon': config.modal.closeIcon.props.properties.name,
    'tabs.moreIcon': config.tabs.moreIcon.props.properties.name,
    'timePicker.suffixIcon': config.timePicker.suffixIcon.props.properties.name,
    'tour.closeIcon': config.tour.closeIcon.props.properties.name,
    'treeSelect.switcherIcon': config.treeSelect.switcherIcon.props.properties.name,
  };
  expect(names).toEqual({
    'alert.closeIcon': 'close',
    'alert.errorIcon': 'error',
    'alert.infoIcon': 'info',
    'alert.successIcon': 'success',
    'alert.warningIcon': 'warning',
    'breadcrumb.dropdownIcon': 'chevron-down',
    'button.loadingIcon': 'loading',
    'datePicker.suffixIcon': 'calendar',
    'drawer.closeIcon': 'close',
    'modal.closeIcon': 'close',
    'tabs.moreIcon': 'more',
    'timePicker.suffixIcon': 'clock',
    'tour.closeIcon': 'close',
    'treeSelect.switcherIcon': 'chevron-down',
  });
  expect(config.button.loadingIcon.props.properties.spin).toBe(true);
  expect(config.modal.closeIcon.props.properties.title).toBe('');
});

test('createAntdIconConfig leaves Tag out, because a context closeIcon makes every Tag closable', () => {
  const config = createAntdIconConfig({ Icon });
  expect(config.tag).toBeUndefined();
});

test('createAntdIconConfig collapse expandIcon rotates chevron-right when the panel is active', () => {
  const config = createAntdIconConfig({ Icon });
  const closed = config.collapse.expandIcon({ isActive: false });
  const open = config.collapse.expandIcon({ isActive: true });
  expect(closed.props.properties).toEqual({ name: 'chevron-right', rotate: 0, title: '' });
  expect(open.props.properties).toEqual({ name: 'chevron-right', rotate: 90, title: '' });
});

test('createAntdIconConfig menu expandIcon rotates chevron-down by isOpen and adds the antd class', () => {
  const config = createAntdIconConfig({ Icon });
  const MenuExpandIcon = config.menu.expandIcon;
  const { container, rerender } = render(<MenuExpandIcon isOpen={false} />);
  const icon = container.firstChild;
  expect(icon.getAttribute('class')).toBe('ant-menu-submenu-expand-icon');
  expect(icon.getAttribute('data-name')).toBe('chevron-down');
  expect(icon.getAttribute('data-rotate')).toBe('0');
  rerender(<MenuExpandIcon isOpen={true} />);
  expect(container.firstChild.getAttribute('data-rotate')).toBe('180');
});

test('createAntdIconConfig in a nested ConfigProvider keeps the parent theme and locale', () => {
  const config = createAntdIconConfig({ Icon });
  let token;
  let locale;
  function Probe() {
    token = theme.useToken().token;
    locale = React.useContext(ConfigProvider.ConfigContext).locale;
    return null;
  }
  render(
    <ConfigProvider locale={{ locale: 'test' }} theme={{ token: { colorPrimary: '#ff0000' } }}>
      <ConfigProvider {...config}>
        <Probe />
      </ConfigProvider>
    </ConfigProvider>
  );
  expect(token.colorPrimary).toBe('#ff0000');
  expect(locale.locale).toBe('test');
});

test('createAntdIconConfig icons reach antd Alert and Collapse, and plain Tags stay unclosable', () => {
  const config = createAntdIconConfig({ Icon });
  const { container } = render(
    <ConfigProvider {...config}>
      <Alert closable showIcon title="Saved" type="success" />
      <Collapse
        defaultActiveKey={['1']}
        items={[
          { key: '1', label: 'Open', children: 'Content' },
          { key: '2', label: 'Closed', children: 'Content' },
        ]}
      />
      <Tag>Plain</Tag>
    </ConfigProvider>
  );
  const alert = container.querySelector('.ant-alert');
  expect(
    [...alert.querySelectorAll('i')].map((element) => element.getAttribute('data-name'))
  ).toEqual(['success', 'close']);
  const arrows = container.querySelectorAll('.ant-collapse-arrow');
  expect([...arrows].map((element) => element.getAttribute('data-rotate'))).toEqual(['90', '0']);
  expect(container.querySelector('.ant-tag i')).toBe(null);
});
