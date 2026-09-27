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
import { act, render, screen } from '@testing-library/react';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';

function Icon({ properties }) {
  return <svg data-testid={`icon-${properties.name}`} />;
}

// The page holds only its own icons; loadAllIcons adds the app's others.
function register({ added = {}, fail = false } = {}) {
  const icons = { edit: {} };
  const load = {};
  const loadAllIcons = jest.fn(() => {
    load.promise ??= new Promise((resolve, reject) => {
      load.settle = () => {
        if (fail) {
          reject(new Error('offline'));
          return;
        }
        Object.assign(icons, added);
        resolve();
      };
    });
    return load.promise;
  });
  registerHtmlEnhancements({ HtmlOverlay: () => null, Icon, icons, loadAllIcons });
  return { load, loadAllIcons };
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

test('data-icon with a name outside the page icons renders once every icon has loaded', async () => {
  const { load, loadAllIcons } = register({ added: { rocket: {} } });
  const { container } = render(
    <HtmlComponent html='<i data-icon="rocket"></i> Launch <i data-icon="edit"></i>' />
  );
  expect(screen.getByTestId('icon-edit')).toBeDefined();
  expect(screen.queryByTestId('icon-rocket')).toBeNull();
  await act(async () => load.settle());
  const placeholder = container.querySelector('[data-icon="rocket"]');
  expect(placeholder.contains(screen.getByTestId('icon-rocket'))).toBe(true);
  expect(placeholder.getAttribute('aria-hidden')).toBe('true');
  expect(loadAllIcons).toHaveBeenCalledTimes(1);
  expect(console.warn).not.toHaveBeenCalled();
});

test.each([
  ['every icon lacks it', {}],
  ['loading every icon fails', { fail: true }],
])('data-icon renders nothing and warns when %s', async (_, options) => {
  const { load } = register(options);
  const { container } = render(<HtmlComponent html='<i data-icon="status">x</i>' />);
  await act(async () => load.settle());
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelector('[data-icon]').hasAttribute('aria-hidden')).toBe(false);
  expect(console.warn).toHaveBeenCalledWith(
    'data-icon="status" is not a known icon, so nothing was rendered.'
  );
});
