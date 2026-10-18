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
import { jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { ThemeContext } from '@lowdefy/client-native';

import Frame from './Frame.js';

// The native tabs as plain elements that keep their props, so a test reads the tab bar.
jest.mock('expo-router/native-tabs', () => {
  const { createElement } = jest.requireActual('react');
  const element = (name) => (props) => createElement(name, props, props.children);
  const NativeTabs = element('NativeTabs');
  NativeTabs.Trigger = element('Trigger');
  NativeTabs.Trigger.Icon = element('TriggerIcon');
  NativeTabs.Trigger.Label = ({ children }) => createElement('TriggerLabel', { label: children });
  return { NativeTabs };
});

jest.mock('expo-router', () => ({ router: {}, Stack: () => null }));

const mockState = {};
jest.mock('../ShellContext.js', () => ({
  useSessionState: () => mockState,
  useShell: () => ({ session: { takeHomeRequest: () => false } }),
}));

function findAll(node, predicate, found = []) {
  if (node === null || typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  (node.children ?? []).forEach((child) => findAll(child, predicate, found));
  return found;
}

const inbox = { node: [['path', { d: 'M1 1' }]] };
const tokens = { colorCell: '#FFFFFF', colorLabel: '#000000', colorTint: '#0A72D8' };

test('native tab bar items take SF Symbols, the search role and the theme tint', async () => {
  mockState.homeRequests = 0;
  mockState.root = {
    menus: {
      tabs: [
        { pageId: 'my-work', title: 'My work', icon: 'Inbox', iconData: inbox },
        { pageId: 'tasks', title: 'Tasks', icon: 'SquareCheck', sfSymbol: 'checklist' },
        { pageId: 'search', title: 'Search', icon: 'search', role: 'search' },
      ],
    },
  };
  const view = await render(
    <ThemeContext.Provider value={{ isDark: false, preference: 'system', tokens }}>
      <Frame />
    </ThemeContext.Provider>
  );
  const tabBar = findAll(view.root, (node) => node.type === 'NativeTabs')[0];
  expect(tabBar.props.tintColor).toBe('#0A72D8');
  expect(tabBar.props.iconColor).toEqual({ selected: '#0A72D8' });
  expect(tabBar.props.blurEffect).toBe('systemChromeMaterialLight');
  const triggers = findAll(view.root, (node) => node.type === 'Trigger');
  expect(triggers.map((trigger) => [trigger.props.name, trigger.props.hidden])).toEqual([
    ['(t0)', false],
    ['(t1)', false],
    ['(t2)', false],
    ['(t3)', true],
    ['(t4)', true],
  ]);
  expect(triggers[2].props.role).toBe('search');
  const labels = findAll(view.root, (node) => node.type === 'TriggerLabel');
  expect(labels.slice(0, 3).map((label) => label.props.label)).toEqual([
    'My work',
    'Tasks',
    'Search',
  ]);
  const icons = findAll(view.root, (node) => node.type === 'TriggerIcon');
  expect(icons.map((icon) => icon.props.sf)).toEqual(['tray', 'checklist', 'magnifyingglass']);
});
