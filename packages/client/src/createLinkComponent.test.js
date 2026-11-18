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
import createRouterLink from './adapters/Link.js';
import createViewLowdefy from './test/createViewLowdefy.js';
import { afterEach, expect, test } from 'vitest';
import { fireEvent } from '@testing-library/react';

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

let stopCapture;

// The Link component as a view mounts it: on the view host, with the frame's
// links captured.
function setupView() {
  const { host, lowdefy, openLink, router } = createViewLowdefy();
  stopCapture = host.view.captureLinks();
  const RouterLink = createRouterLink({ origin: host.view.bridge.appOrigin, router });
  return { Link: createLinkComponent(lowdefy, RouterLink), openLink, router };
}

afterEach(() => {
  if (stopCapture) {
    stopCapture();
    stopCapture = undefined;
  }
});

test('in a view, a page Link has the app URL as its href and navigates in place on a click', () => {
  const { Link, openLink, router } = setupView();
  const { container } = render(
    <Link id="link" pageId="runs" urlQuery={{ state: 'open' }}>
      Runs
    </Link>
  );
  const anchor = container.querySelector('#link');
  expect(anchor.getAttribute('href')).toBe('https://app.example.com/base/runs?state=open');

  expect(fireEvent.click(anchor)).toBe(false);

  expect(router.getLocation()).toEqual({
    path: 'runs',
    pathname: '/base/runs',
    search: '?state=open',
  });
  expect(openLink).not.toHaveBeenCalled();
});

test('in a view, a modified click on a page Link opens the app URL in the browser', () => {
  const { Link, openLink, router } = setupView();
  const { container } = render(
    <Link id="link" pageId="runs">
      Runs
    </Link>
  );

  expect(fireEvent.click(container.querySelector('#link'), { metaKey: true })).toBe(false);

  expect(openLink.mock.calls).toEqual([[{ url: 'https://app.example.com/base/runs' }]]);
  expect(router.getLocation().pathname).toBe('/base/tickets/12');
});

test('in a view, a newTab page Link opens the app URL through the host', () => {
  const { Link, openLink, router } = setupView();
  const { container } = render(
    <Link id="link" pageId="runs" newTab>
      Runs
    </Link>
  );
  const anchor = container.querySelector('#link');
  expect(anchor.getAttribute('href')).toBe('https://app.example.com/base/runs');
  expect(anchor.getAttribute('target')).toBe('_blank');

  expect(fireEvent.click(anchor)).toBe(false);

  expect(openLink.mock.calls).toEqual([[{ url: 'https://app.example.com/base/runs' }]]);
  expect(router.getLocation().pathname).toBe('/base/tickets/12');
});

test('in a view, a Link to another origin opens through the host and the frame stays', () => {
  const { Link, openLink } = setupView();
  const { container } = render(
    <Link id="link" url="https://other.example.org/docs">
      Docs
    </Link>
  );

  expect(fireEvent.click(container.querySelector('#link'))).toBe(false);

  expect(openLink.mock.calls).toEqual([[{ url: 'https://other.example.org/docs' }]]);
});

test('in a view, a Link with an unsafe href renders no anchor to open', () => {
  const { Link, openLink } = setupView();
  const { container } = render(
    <Link id="link" href="javascript:alert(1)">
      Go
    </Link>
  );

  fireEvent.click(container.querySelector('#link'));

  expect(container.querySelector('a')).toBeNull();
  expect(openLink).not.toHaveBeenCalled();
});
