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
import { fireEvent, render } from '@testing-library/react';

const cleanup = jest.fn();
const onClick = jest.fn();
const prepare = jest.fn(({ select }) => ({
  cleanup,
  portals: select('[data-probe]').map((element, index) => ({
    element,
    key: `probe:${index}`,
    node: <b data-testid="probe-portal">portal</b>,
  })),
  seen: select('[data-probe]').length,
}));

jest.unstable_mockModule('./htmlEnhancers/htmlEnhancers.js', () => ({
  default: [{ name: 'probe', attributes: ['data-probe'], prepare, onClick }],
}));

const { default: HtmlComponent } = await import('./HtmlComponent.js');
const { default: registerHtmlEnhancements } = await import('./registerHtmlEnhancements.js');

beforeEach(() => {
  cleanup.mockClear();
  onClick.mockClear();
  prepare.mockClear();
  registerHtmlEnhancements({ HtmlOverlay: () => null, Icon: () => null, icons: {} });
});

afterEach(() => {
  registerHtmlEnhancements(null);
});

test('HtmlComponent runs registered enhancers, renders their portals and marks the root', () => {
  const { container, getByTestId } = render(<HtmlComponent html='<i data-probe="1"></i>' />);
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(container.firstChild.getAttribute('data-lf-html')).toBe('');
  expect(container.querySelector('[data-probe]').contains(getByTestId('probe-portal'))).toBe(true);
});

test('HtmlComponent passes clicks to enhancer handlers with the prepared data', () => {
  const { container } = render(<HtmlComponent html='<i data-probe="1">x</i>' />);
  fireEvent.click(container.querySelector('[data-probe]'));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick.mock.calls[0][0].host.prepared).toEqual({ probe: { seen: 1 } });
});

test('HtmlComponent calls enhancer cleanups when the HTML changes and on unmount', () => {
  const { rerender, unmount } = render(<HtmlComponent html='<i data-probe="1"></i>' />);
  expect(cleanup).not.toHaveBeenCalled();
  rerender(<HtmlComponent html='<i data-probe="2"></i>' />);
  expect(cleanup).toHaveBeenCalledTimes(1);
  rerender(<HtmlComponent html="<b>plain</b>" />);
  expect(cleanup).toHaveBeenCalledTimes(2);
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(2);
});

test('HtmlComponent does not run enhancers or mark the root for HTML without their attributes', () => {
  const { container } = render(<HtmlComponent html='<i data-testid="x"></i>' />);
  expect(prepare).not.toHaveBeenCalled();
  expect(container.firstChild.hasAttribute('data-lf-html')).toBe(false);
});

test('HtmlComponent calls cleanups on unmount', () => {
  const { unmount } = render(<HtmlComponent html='<i data-probe="1"></i>' />);
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
