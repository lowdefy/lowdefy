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

import { expect, test, vi } from 'vitest';

import createViewRouter from './createViewRouter.js';

test('createViewRouter starts at the view address, with basePath on the pathname only', () => {
  const router = createViewRouter({ basePath: '/base', path: '/tickets/12?tab=notes' });
  expect(router.basePath).toBe('/base');
  expect(router.getLocation()).toEqual({
    path: 'tickets/12',
    pathname: '/base/tickets/12',
    search: '?tab=notes',
  });
});

test('createViewRouter gives an empty path at the app root', () => {
  const router = createViewRouter({ path: '/' });
  expect(router.getLocation()).toEqual({ path: '', pathname: '/', search: '' });
});

test('createViewRouter push moves to the new location and tells subscribers', async () => {
  const router = createViewRouter({ path: '/tickets' });
  const listener = vi.fn();
  router.subscribe(listener);
  await router.push({ pathname: '/tickets/12', query: { tab: 'notes', page: 2 } });
  const location = { path: 'tickets/12', pathname: '/tickets/12', search: '?tab=notes&page=2' };
  expect(router.getLocation()).toEqual(location);
  expect(listener).toHaveBeenCalledWith(location);
});

test('createViewRouter takes the query as a string or leaves it out', async () => {
  const router = createViewRouter({ path: '/tickets?old=1' });
  await router.push({ pathname: '/tickets', query: 'status=open' });
  expect(router.getLocation().search).toBe('?status=open');
  await router.push({ pathname: '/tickets' });
  expect(router.getLocation().search).toBe('');
  await router.push({ pathname: '/tickets', query: {} });
  expect(router.getLocation().search).toBe('');
});

test('createViewRouter back returns to the entry before a push', async () => {
  const router = createViewRouter({ path: '/tickets?status=open' });
  await router.push({ pathname: '/tickets/12' });
  const listener = vi.fn();
  router.subscribe(listener);
  router.back();
  expect(router.getLocation()).toEqual({
    path: 'tickets',
    pathname: '/tickets',
    search: '?status=open',
  });
  expect(listener).toHaveBeenCalledTimes(1);
});

test('createViewRouter back does nothing on the first entry', () => {
  const router = createViewRouter({ path: '/tickets' });
  const listener = vi.fn();
  router.subscribe(listener);
  router.back();
  expect(router.getLocation().path).toBe('tickets');
  expect(listener).not.toHaveBeenCalled();
});

test('createViewRouter replace swaps the current entry, so back skips it', async () => {
  const router = createViewRouter({ path: '/tickets' });
  await router.push({ pathname: '/tickets/12' });
  await router.replace({ pathname: '/tickets/13' });
  expect(router.getLocation().path).toBe('tickets/13');
  router.back();
  expect(router.getLocation().path).toBe('tickets');
});

test('createViewRouter push after back drops the entries ahead', async () => {
  const router = createViewRouter({ path: '/a' });
  await router.push({ pathname: '/b' });
  router.back();
  await router.push({ pathname: '/c' });
  router.back();
  expect(router.getLocation().path).toBe('a');
});

test('createViewRouter forceReload navigates without touching the frame', async () => {
  const router = createViewRouter({ path: '/tickets' });
  const listener = vi.fn();
  router.subscribe(listener);
  await router.push({ forceReload: true, pathname: '/tickets/12' });
  expect(router.getLocation().path).toBe('tickets/12');
  expect(listener).toHaveBeenCalledTimes(1);
});

test('createViewRouter stops telling a listener that unsubscribed', async () => {
  const router = createViewRouter({ path: '/tickets' });
  const listener = vi.fn();
  const unsubscribe = router.subscribe(listener);
  unsubscribe();
  await router.push({ pathname: '/tickets/12' });
  expect(listener).not.toHaveBeenCalled();
});
