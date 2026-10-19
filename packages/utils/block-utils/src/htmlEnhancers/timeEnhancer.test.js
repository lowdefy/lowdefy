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
import { act, render } from '@testing-library/react';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';

const MESSAGES = {
  'client.copy': 'Copy',
  'client.copyValue': 'Copy: {value}',
  'client.copied': 'Copied',
  'client.copyFailed': 'Copy failed',
};

function Icon({ properties }) {
  return <svg data-testid={`icon-${properties.name}`} />;
}

const registration = {
  createHref: ({ pathname }) => pathname,
  getLocale: () => 'en-US',
  HtmlOverlay: () => null,
  Icon,
  icons: { check: () => null, copy: () => null },
  link: () => undefined,
  translate: (key, values) => MESSAGES[key].replace('{value}', values?.value ?? ''),
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-25T12:00:00Z'));
  registerHtmlEnhancements(registration);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
  jest.useRealTimers();
});

function renderTime(html) {
  const { container, rerender, unmount } = render(<HtmlComponent html={html} />);
  return { element: container.querySelector('[data-time]'), rerender, unmount };
}

test('data-time="relative" shows the time from now with the absolute time as a tooltip', () => {
  const { element } = renderTime(
    '<time datetime="2026-09-25T09:00:00Z" data-time="relative">earlier</time>'
  );
  expect(element.textContent).toBe('3 hours ago');
  expect(element.getAttribute('data-tooltip')).toMatch(/^Sep 25, 2026/);
});

test('relative times update on one shared timer and stop updating after unmount', () => {
  const { element, unmount } = renderTime(
    '<time datetime="2026-09-25T11:59:30Z" data-time="relative"></time>'
  );
  expect(element.textContent).toBe('a few seconds ago');
  act(() => {
    jest.advanceTimersByTime(60000);
  });
  expect(element.textContent).toBe('2 minutes ago');
  expect(jest.getTimerCount()).toBe(1);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test('a relative time keeps an author tooltip or title and adds no second one', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<time id="a" datetime="2026-09-25T09:00:00Z" data-time="relative" data-tooltip="Mine"></time><time id="b" datetime="2026-09-25T09:00:00Z" data-time="relative" title="Native"></time>'
    />
  );
  expect(container.querySelector('#a').getAttribute('data-tooltip')).toBe('Mine');
  expect(container.querySelector('#b').hasAttribute('data-tooltip')).toBe(false);
});

test('named styles use Intl in the app locale', () => {
  expect(
    renderTime('<time datetime="2026-01-05T15:30:00" data-time="date"></time>').element.textContent
  ).toBe('Jan 5, 2026');
  expect(
    renderTime('<time datetime="2026-01-05T15:30:00" data-time="datetime"></time>').element
      .textContent
  ).toBe('Jan 5, 2026, 3:30 PM');
  expect(
    renderTime('<time datetime="2026-01-05T15:30:00" data-time></time>').element.textContent
  ).toBe('Jan 5, 2026, 3:30 PM');
  expect(
    renderTime('<time datetime="2026-01-05T15:30:00" data-time="time"></time>').element.textContent
  ).toBe('3:30 PM');
});

test('any other value is a dayjs format', () => {
  expect(
    renderTime('<time datetime="2026-01-05T15:30:00" data-time="D MMM YYYY"></time>').element
      .textContent
  ).toBe('5 Jan 2026');
});

test('the value can be the element text, and 12 or more digits are epoch milliseconds', () => {
  const { element } = renderTime('<time data-time="YYYY-MM-DD">2026-01-05T15:30:00</time>');
  expect(element.textContent).toBe('2026-01-05');
  expect(element.getAttribute('datetime')).toBe(new Date('2026-01-05T15:30:00').toISOString());
  expect(renderTime('<span data-time="YYYY">1767225600000</span>').element.textContent).toBe(
    '2026'
  );
  expect(renderTime('<span data-time="YYYY-MM-DD">20240105</span>').element.textContent).toBe(
    '2024-01-05'
  );
});

test('a value that is not a date is left as it is with a warning', () => {
  expect(renderTime('<span data-time="date">soon</span>').element.textContent).toBe('soon');
  expect(console.warn).toHaveBeenCalledWith(
    'data-time could not read "soon" as a date, so the text was left as it is.'
  );
});
