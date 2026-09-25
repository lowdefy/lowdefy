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
import { fireEvent, render, screen } from '@testing-library/react';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';

function HtmlOverlay({ content, kind }) {
  return <div data-testid={`overlay-${kind}`}>{content}</div>;
}

// jsdom has no layout; these stand in for a clipped and an unclipped element.
function setSize(element, { clientHeight, scrollHeight }) {
  Object.defineProperty(element, 'clientHeight', { value: clientHeight, configurable: true });
  Object.defineProperty(element, 'scrollHeight', { value: scrollHeight, configurable: true });
}

beforeEach(() => {
  registerHtmlEnhancements({ HtmlOverlay, Icon: () => null, icons: {} });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

test('a clipped data-truncate element shows its full text in a tooltip on hover', () => {
  const { container } = render(
    <HtmlComponent html="<div data-truncate>A long   title that does not fit</div>" />
  );
  const element = container.querySelector('[data-truncate]');
  setSize(element, { clientHeight: 20, scrollHeight: 60 });
  fireEvent.mouseOver(element);
  expect(screen.getByTestId('overlay-tooltip').textContent).toBe('A long title that does not fit');
  fireEvent.mouseOut(element, { relatedTarget: document.body });
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
});

test('text that fits shows no tooltip', () => {
  const { container } = render(<HtmlComponent html='<div data-truncate="2">Short</div>' />);
  const element = container.querySelector('[data-truncate]');
  setSize(element, { clientHeight: 20, scrollHeight: 20 });
  fireEvent.mouseOver(element);
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
});

test('a title or a data-tooltip wins over the truncation tooltip', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<div id="a" data-truncate title="Native">Long text</div><div id="b" data-truncate data-tooltip="Mine">Long text</div>'
    />
  );
  ['#a', '#b'].forEach((selector) => {
    setSize(container.querySelector(selector), { clientHeight: 20, scrollHeight: 60 });
  });
  fireEvent.mouseOver(container.querySelector('#a'));
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
  fireEvent.mouseOver(container.querySelector('#b'));
  expect(screen.getByTestId('overlay-tooltip').textContent).toBe('Mine');
});

test('a link inside a clipped element shows the tooltip on focus', () => {
  const { container } = render(
    <HtmlComponent html='<div data-truncate><a href="#x">A long link text</a></div>' />
  );
  setSize(container.querySelector('[data-truncate]'), { clientHeight: 20, scrollHeight: 60 });
  fireEvent.focus(container.querySelector('a'));
  expect(screen.getByTestId('overlay-tooltip').textContent).toBe('A long link text');
});

test('a data-truncate value that is not 1 to 6 is reported', () => {
  render(<HtmlComponent html='<div data-truncate="10">x</div>' />);
  expect(console.warn).toHaveBeenCalledWith(
    'data-truncate="10" is not a line count from 1 to 6, so it was ignored.'
  );
});

test('data-truncate on a table cell or list item is reported', () => {
  render(
    <HtmlComponent
      div={true}
      html="<table><tbody><tr><td data-truncate>x</td></tr></tbody></table>"
    />
  );
  expect(console.warn).toHaveBeenCalledWith(
    'data-truncate on a <td> breaks its table or list layout. Truncate a <div> inside it instead.'
  );
});

test('the truncation tooltip skips avatar initials', () => {
  registerHtmlEnhancements({ HtmlOverlay, Icon: () => null, icons: {}, getLocale: () => 'en-US' });
  const { container } = render(
    <HtmlComponent html='<div data-truncate><span data-avatar="Jane Doe"></span> Jane Doe wrote a long note</div>' />
  );
  const element = container.querySelector('[data-truncate]');
  setSize(element, { clientHeight: 20, scrollHeight: 60 });
  fireEvent.mouseOver(element);
  expect(screen.getByTestId('overlay-tooltip').textContent).toBe('Jane Doe wrote a long note');
});

test('an empty data-tooltip opens nothing', () => {
  const { container } = render(<HtmlComponent html='<span data-tooltip="">x</span>' />);
  fireEvent.mouseOver(container.querySelector('[data-tooltip]'));
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
});

test('an unknown data-tone is reported and a known one in any case is not', () => {
  render(
    <HtmlComponent
      div={true}
      html='<span data-tone="Secondary">a</span><span data-tone="red">b</span>'
    />
  );
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect(console.warn).toHaveBeenCalledWith(
    'data-tone="red" is not a text tone (secondary, tertiary, quaternary, success, warning, error, info), so it was ignored.'
  );
});
