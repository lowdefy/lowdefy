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
import { render, fireEvent } from '@testing-library/react';

import createLinkComponent from './Link.js';

function setup({ basePath = '' } = {}) {
  const router = {
    basePath,
    push: jest.fn(),
    replace: jest.fn(),
  };
  const Link = createLinkComponent({ router });
  return { Link, router };
}

test('renders an anchor with the resolved href including basePath and query', () => {
  const { Link } = setup({ basePath: '/admin' });
  const { container } = render(
    <Link href={{ pathname: '/page-1', query: 'a=1' }} id="link-1">
      Go
    </Link>
  );
  const a = container.querySelector('a');
  expect(a.getAttribute('href')).toBe('/admin/page-1?a=1');
  expect(a.textContent).toBe('Go');
});

test('click calls router.push with pathname, query and scroll, and prevents default', () => {
  const { Link, router } = setup();
  const { container } = render(
    <Link href={{ pathname: '/page-1', query: 'a=1' }} scroll={true}>
      Go
    </Link>
  );
  fireEvent.click(container.querySelector('a'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/page-1', query: 'a=1', scroll: true });
  expect(router.replace).not.toHaveBeenCalled();
});

test('replace prop routes through router.replace', () => {
  const { Link, router } = setup();
  const { container } = render(
    <Link href={{ pathname: '/page-2' }} replace>
      Go
    </Link>
  );
  fireEvent.click(container.querySelector('a'));
  expect(router.replace).toHaveBeenCalledWith({
    pathname: '/page-2',
    query: undefined,
    scroll: undefined,
  });
  expect(router.push).not.toHaveBeenCalled();
});

test('onClick fires before navigation', () => {
  const order = [];
  const { Link, router } = setup();
  router.push.mockImplementation(() => order.push('push'));
  const { container } = render(
    <Link href={{ pathname: '/page-1' }} onClick={() => order.push('onClick')}>
      Go
    </Link>
  );
  fireEvent.click(container.querySelector('a'));
  expect(order).toEqual(['onClick', 'push']);
});

test('modified clicks fall through to the browser', () => {
  const { Link, router } = setup();
  const { container } = render(<Link href={{ pathname: '/page-1' }}>Go</Link>);
  const a = container.querySelector('a');
  fireEvent.click(a, { ctrlKey: true });
  fireEvent.click(a, { metaKey: true });
  fireEvent.click(a, { shiftKey: true });
  fireEvent.click(a, { button: 1 });
  expect(router.push).not.toHaveBeenCalled();
});

test('onClick preventDefault cancels navigation', () => {
  const { Link, router } = setup();
  const { container } = render(
    <Link href={{ pathname: '/page-1' }} onClick={(e) => e.preventDefault()}>
      Go
    </Link>
  );
  fireEvent.click(container.querySelector('a'));
  expect(router.push).not.toHaveBeenCalled();
});

test('string href navigates by pathname', () => {
  const { Link, router } = setup();
  const { container } = render(<Link href="/page-3">Go</Link>);
  const a = container.querySelector('a');
  expect(a.getAttribute('href')).toBe('/page-3');
  fireEvent.click(a);
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/page-3',
    query: undefined,
    scroll: undefined,
  });
});

test('passes through anchor attributes', () => {
  const { Link } = setup();
  const { container } = render(
    <Link href={{ pathname: '/p' }} id="x" className="c" rel="nofollow" aria-label="lbl">
      Go
    </Link>
  );
  const a = container.querySelector('a');
  expect(a.id).toBe('x');
  expect(a.className).toBe('c');
  expect(a.rel).toBe('nofollow');
  expect(a.getAttribute('aria-label')).toBe('lbl');
});
