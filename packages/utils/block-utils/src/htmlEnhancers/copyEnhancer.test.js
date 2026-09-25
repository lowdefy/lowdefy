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
import { act, fireEvent, render, screen } from '@testing-library/react';

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

const writeText = jest.fn();

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  registerHtmlEnhancements(registration);
});

afterEach(() => {
  registerHtmlEnhancements(null);
});

async function clickCopy(button) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

test('data-copy copies the element text and announces it', async () => {
  const { container } = render(<HtmlComponent html="<code data-copy>sk_live_42</code>" />);
  const button = container.querySelector('[data-lf-copy] button');
  expect(button.getAttribute('aria-label')).toBe('Copy');
  expect(button.getAttribute('data-tooltip')).toBe('Copy');
  expect(screen.getByTestId('icon-copy')).toBeDefined();
  await clickCopy(button);
  expect(writeText).toHaveBeenCalledWith('sk_live_42');
  expect(container.querySelector('[role="status"]').textContent).toBe('Copied');
  expect(screen.getByTestId('icon-check')).toBeDefined();
});

test('a copy value that differs from the text is shown in the label', async () => {
  const { container } = render(<HtmlComponent html='<span data-copy="42">Ticket #42</span>' />);
  const button = container.querySelector('[data-lf-copy] button');
  expect(button.getAttribute('aria-label')).toBe('Copy: 42');
  await clickCopy(button);
  expect(writeText).toHaveBeenCalledWith('42');
});

test('a failed copy is announced', async () => {
  writeText.mockRejectedValue(new Error('denied'));
  const { container } = render(<HtmlComponent html="<code data-copy>abc</code>" />);
  await clickCopy(container.querySelector('[data-lf-copy] button'));
  expect(container.querySelector('[role="status"]').textContent).toBe('Copy failed');
});

test('a copy click does not reach data-event, links or row handlers around it', async () => {
  const onDataEvent = jest.fn();
  const onRowClick = jest.fn();
  const { container } = render(
    <div onClick={onRowClick}>
      <HtmlComponent
        html='<span data-event="onRow"><code data-copy>abc</code></span>'
        onDataEvent={onDataEvent}
      />
    </div>
  );
  await clickCopy(container.querySelector('[data-lf-copy] button'));
  expect(writeText).toHaveBeenCalledWith('abc');
  expect(onDataEvent).not.toHaveBeenCalled();
  expect(onRowClick).not.toHaveBeenCalled();
});

test('the button goes after a link or button instead of inside it', () => {
  const { container } = render(
    <HtmlComponent html='<p><a href="https://example.com" data-copy>example.com</a></p>' />
  );
  const anchor = container.querySelector('a');
  expect(anchor.querySelector('button')).toBeNull();
  expect(anchor.nextElementSibling.matches('[data-lf-copy]')).toBe(true);
});

test('copy runs after the text writers and skips avatar initials', async () => {
  const { container } = render(
    <HtmlComponent html='<span data-copy><span data-avatar="Jane Doe"></span> <span data-format="currency" data-currency="USD">12</span></span>' />
  );
  await clickCopy(container.querySelector('[data-lf-copy] button'));
  expect(writeText).toHaveBeenCalledWith('$12.00');
});

test('data-copy="false" adds no button', () => {
  const { container } = render(<HtmlComponent html='<code data-copy="false">abc</code>' />);
  expect(container.querySelector('[data-lf-copy]')).toBeNull();
});

test('the hover tooltip of the button uses the overlay like any data-tooltip', () => {
  const HtmlOverlay = ({ content }) => <div data-testid="overlay">{content}</div>;
  registerHtmlEnhancements({ ...registration, HtmlOverlay });
  const { container } = render(<HtmlComponent html="<code data-copy>abc</code>" />);
  fireEvent.mouseOver(container.querySelector('[data-lf-copy] button'));
  expect(screen.getByTestId('overlay').textContent).toBe('Copy');
});
