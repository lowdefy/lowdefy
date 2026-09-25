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
import { act, fireEvent, render } from '@testing-library/react';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';

const link = jest.fn();

// Stands in for the client's createUrl with basePath /base.
function createHref({ pathname, query }) {
  const search = new URLSearchParams(query).toString();
  return `/base${pathname}${search ? `?${search}` : ''}`;
}

beforeEach(() => {
  link.mockReset();
  registerHtmlEnhancements({
    createHref,
    HtmlOverlay: () => null,
    Icon: () => null,
    icons: {},
    link,
  });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

function click(element, init = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  act(() => {
    element.dispatchEvent(event);
  });
  return event;
}

test('data-page-id sets an href with basePath and an encoded query', () => {
  const { container } = render(
    <HtmlComponent html='<a data-page-id="contacts" data-url-query="?_id=4 2&amp;tab=a">Jane</a>' />
  );
  expect(container.querySelector('a').getAttribute('href')).toBe('/base/contacts?_id=4+2&tab=a');
  expect(container.firstChild.hasAttribute('data-lf-html')).toBe(true);
});

test('a plain click on a data-page-id link navigates with link like the Link action', () => {
  const { container } = render(
    <HtmlComponent html='<a data-page-id="contacts" data-url-query="_id=42">Jane</a>' />
  );
  const event = click(container.querySelector('a'));
  expect(event.defaultPrevented).toBe(true);
  expect(link).toHaveBeenCalledWith({ pageId: 'contacts', urlQuery: { _id: '42' } });
});

test('the href and the click use the same query when a key repeats', () => {
  const { container } = render(
    <HtmlComponent html='<a data-page-id="list" data-url-query="tag=a&amp;tag=b">List</a>' />
  );
  expect(container.querySelector('a').getAttribute('href')).toBe('/base/list?tag=b');
  click(container.querySelector('a'));
  expect(link).toHaveBeenCalledWith({ pageId: 'list', urlQuery: { tag: 'b' } });
});

test('modified, middle and new-tab clicks are left to the browser', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<a id="a" data-page-id="contacts">a</a><a id="b" data-page-id="report" data-new-tab>b</a>'
    />
  );
  const a = container.querySelector('#a');
  expect(click(a, { metaKey: true }).defaultPrevented).toBe(false);
  expect(click(a, { ctrlKey: true }).defaultPrevented).toBe(false);
  expect(click(a, { shiftKey: true }).defaultPrevented).toBe(false);
  expect(click(a, { button: 1 }).defaultPrevented).toBe(false);
  const b = container.querySelector('#b');
  expect(b.getAttribute('target')).toBe('_blank');
  expect(b.getAttribute('rel')).toBe('noopener noreferrer');
  expect(click(b).defaultPrevented).toBe(false);
  expect(link).not.toHaveBeenCalled();
});

test('an invalid page id or a non-anchor element is left alone with a warning', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<a id="a" data-page-id="bad id">a</a><span id="s" data-page-id="home">s</span>'
    />
  );
  expect(container.querySelector('#a').hasAttribute('href')).toBe(false);
  expect(container.querySelector('#s').hasAttribute('href')).toBe(false);
  expect(console.warn).toHaveBeenCalledWith(
    'data-page-id="bad id" is not a valid page id, so the link was not set.'
  );
  expect(console.warn).toHaveBeenCalledWith(
    'data-page-id="home" is only supported on <a> elements.'
  );
  click(container.querySelector('#a'));
  expect(link).not.toHaveBeenCalled();
});

test('data-link routes an app-relative href once through basePath and leaves other hrefs alone', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<a id="a" href="/tickets-view?_id=42" data-link>a</a><a id="b" href="https://example.com/x" data-link>b</a><a id="c" href="//evil.example/x" data-link>c</a><a id="d" href="/docs#part" data-link>d</a><a id="e" href="/x" data-link="false">e</a><a id="f" href="/&#9;/evil.example/x" data-link>f</a>'
    />
  );
  expect(container.querySelector('#a').getAttribute('href')).toBe('/base/tickets-view?_id=42');
  expect(click(container.querySelector('#a')).defaultPrevented).toBe(true);
  expect(link).toHaveBeenCalledWith({ url: '/tickets-view?_id=42' });
  ['#b', '#c', '#d', '#e', '#f'].forEach((selector) => {
    const anchor = container.querySelector(selector);
    expect(anchor.getAttribute('href').startsWith('/base')).toBe(false);
    expect(click(anchor).defaultPrevented).toBe(false);
  });
  expect(link).toHaveBeenCalledTimes(1);
});

test('data-new-tab opens any link in a new tab and keeps an author rel', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<a id="a" href="https://example.com" rel="external" data-new-tab>a</a><a id="b" href="https://example.com" data-new-tab="false">b</a>'
    />
  );
  expect(container.querySelector('#a').getAttribute('target')).toBe('_blank');
  expect(container.querySelector('#a').getAttribute('rel')).toBe('external noopener noreferrer');
  expect(container.querySelector('#b').hasAttribute('target')).toBe(false);
});

test('a data-event on a data-page-id link fires the event and does not navigate', () => {
  const onDataEvent = jest.fn();
  const { container } = render(
    <HtmlComponent
      html='<a data-page-id="contacts" data-event="onOpen" data-id="1">Jane</a>'
      onDataEvent={onDataEvent}
    />
  );
  click(container.querySelector('a'));
  expect(onDataEvent).toHaveBeenCalledWith({
    name: 'onOpen',
    event: { page_id: 'contacts', id: '1' },
  });
  expect(link).not.toHaveBeenCalled();
});

test('a link inside popover content navigates through the nested HtmlComponent', () => {
  registerHtmlEnhancements({
    createHref,
    HtmlOverlay: ({ content }) => <div data-testid="overlay">{content}</div>,
    Icon: () => null,
    icons: {},
    link,
  });
  const { container, getByTestId } = render(
    <HtmlComponent html='<span data-popover="p">More</span><div data-popover-content="p" hidden><a data-page-id="report">Report</a></div>' />
  );
  // The hidden source is left alone.
  expect(container.querySelector('[data-popover-content] a').hasAttribute('href')).toBe(false);
  fireEvent.click(container.querySelector('[data-popover]'));
  const anchor = getByTestId('overlay').querySelector('a');
  expect(anchor.getAttribute('href')).toBe('/base/report');
  click(anchor);
  expect(link).toHaveBeenCalledWith({ pageId: 'report', urlQuery: {} });
});
