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
import { fireEvent, render } from '@testing-library/react';

import avatarColor from '../format/avatarColor.js';
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
  registerHtmlEnhancements(registration);
});

afterEach(() => {
  registerHtmlEnhancements(null);
});

test('data-avatar renders initials in the same seeded colour as grid avatar cells', () => {
  const { container } = render(
    <HtmlComponent html='<span data-avatar="jane van der Merwe"></span>' />
  );
  const avatar = container.querySelector('[data-avatar]');
  expect(avatar.textContent).toBe('JV');
  expect(avatar.style.getPropertyValue('--lf-avatar-color')).toBe(
    avatarColor('jane van der Merwe')
  );
});

test('an avatar next to the name is decorative, and one on its own is named', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<p><span id="a" data-avatar="Jane Doe"></span> Jane Doe</p><p><span id="b" data-avatar="Sam Smith"></span></p><p><span id="c" data-avatar="Kim Lee" aria-label="Owner"></span></p>'
    />
  );
  expect(container.querySelector('#a').getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('#a').hasAttribute('role')).toBe(false);
  expect(container.querySelector('#b').getAttribute('role')).toBe('img');
  expect(container.querySelector('#b').getAttribute('aria-label')).toBe('Sam Smith');
  expect(container.querySelector('#c').getAttribute('aria-label')).toBe('Owner');
  expect(container.querySelector('#c').hasAttribute('aria-hidden')).toBe(false);
});

test('an image avatar that fails to load is replaced by initials', () => {
  const { container } = render(
    <HtmlComponent html='<span><img data-avatar="Jane Doe" data-avatar-shape="square" src="https://example.com/jane.png"></span>' />
  );
  const image = container.querySelector('img');
  // jsdom never loads images; mark this one as still loading.
  expect(image.getAttribute('alt')).toBe('Jane Doe');
  fireEvent.error(image);
  expect(image.hidden).toBe(true);
  const fallback = image.nextElementSibling;
  expect(fallback.getAttribute('data-avatar')).toBe('Jane Doe');
  expect(fallback.getAttribute('data-avatar-shape')).toBe('square');
  expect(fallback.textContent).toBe('JD');
});

test('an image avatar without a src shows initials straight away', () => {
  const { container } = render(
    <HtmlComponent html='<p><img data-avatar="Jane Doe" src=""> Jane Doe</p>' />
  );
  const image = container.querySelector('img');
  expect(image.hidden).toBe(true);
  expect(image.getAttribute('alt')).toBe('');
  expect(image.nextElementSibling.textContent).toBe('JD');
});
