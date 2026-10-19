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

import createLinkComponent from './createLinkComponent.js';

function RouterLink({ children, href, id }) {
  return (
    <a id={id} data-router-link="true" href={href.pathname}>
      {children}
    </a>
  );
}

function setup() {
  const lowdefy = {
    basePath: '',
    inputs: {},
    linkPaths: {},
    pagePaths: {},
    pathMemory: new Map(),
    _internal: {
      globals: { window: { location: { origin: 'http://localhost' } } },
      translate: (key) => key,
    },
  };
  return createLinkComponent(lowdefy, RouterLink);
}

test('a Link with a safe href renders an anchor with that href', () => {
  const Link = setup();
  const { container } = render(
    <Link id="link" href="mailto:someone@example.com">
      Mail
    </Link>
  );
  const anchor = container.querySelector('#link');
  expect(anchor.tagName).toBe('A');
  expect(anchor.getAttribute('href')).toBe('mailto:someone@example.com');
});

test('a Link with an href of another scheme renders a span without an href', () => {
  const Link = setup();
  const { container } = render(
    <Link id="link" href="javascript:alert(1)" pageId="reports">
      Go
    </Link>
  );
  const element = container.querySelector('#link');
  expect(element.tagName).toBe('SPAN');
  expect(element.hasAttribute('href')).toBe(false);
  expect(element.textContent).toBe('Go');
  expect(container.querySelector('a')).toBeNull();
});
