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

import { afterEach, expect, test, vi } from 'vitest';

import captureViewLinks from './captureViewLinks.js';

const base = 'https://app.example.com/base/tickets/12?tab=notes';

let stop;

function setup() {
  const openLink = vi.fn(async () => true);
  const openWindow = vi.fn(() => ({ closed: true }));
  stop = captureViewLinks({ getBase: () => base, openLink, openWindow, window });
  return { openLink, openWindow };
}

function addAnchor(attributes, text = 'Link') {
  const anchor = document.createElement('a');
  Object.entries(attributes).forEach(([name, value]) => anchor.setAttribute(name, value));
  anchor.textContent = text;
  document.body.appendChild(anchor);
  return anchor;
}

// Returns true when the frame would have followed the link itself. The test
// window then stops it, since jsdom cannot navigate.
function dispatch(element, event) {
  let followed;
  const afterAll = (dispatched) => {
    followed = !dispatched.defaultPrevented;
    dispatched.preventDefault();
  };
  window.addEventListener(event.type, afterAll, { once: true });
  element.dispatchEvent(event);
  return followed;
}

function click(element, init = {}) {
  return dispatch(
    element,
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, ...init })
  );
}

afterEach(() => {
  if (stop) {
    stop();
    stop = undefined;
  }
  document.body.innerHTML = '';
  delete window.navigation;
});

test('captureViewLinks opens a target="_blank" anchor through the host and stops the frame', () => {
  const { openLink } = setup();
  const followed = click(addAnchor({ href: 'https://other.example.org/docs', target: '_blank' }));
  expect(followed).toBe(false);
  expect(openLink).toHaveBeenCalledWith({ url: 'https://other.example.org/docs' });
});

test('captureViewLinks a link to another origin never navigates the frame', () => {
  const { openLink } = setup();
  const followed = click(addAnchor({ href: 'https://other.example.org/' }));
  expect(followed).toBe(false);
  expect(openLink).toHaveBeenCalledWith({ url: 'https://other.example.org/' });
});

test('captureViewLinks hands over an app link as written, to resolve on the app origin', () => {
  const { openLink } = setup();
  const anchor = addAnchor({ href: '/base/runs?state=open', target: '_blank' });
  // The frame itself reads the link as one on its own origin.
  expect(anchor.href).toBe('http://localhost/base/runs?state=open');
  expect(click(anchor)).toBe(false);
  expect(openLink).toHaveBeenCalledWith({ url: '/base/runs?state=open' });
});

test('captureViewLinks catches a click inside an anchor', () => {
  const { openLink } = setup();
  const anchor = addAnchor({ href: 'https://other.example.org/' });
  const inner = document.createElement('span');
  anchor.appendChild(inner);
  expect(click(inner)).toBe(false);
  expect(openLink).toHaveBeenCalledTimes(1);
});

test('captureViewLinks leaves a click a handler already took', () => {
  const { openLink } = setup();
  const anchor = addAnchor({ href: '/base/tickets/13' });
  anchor.addEventListener('click', (event) => event.preventDefault());
  click(anchor);
  expect(openLink).not.toHaveBeenCalled();
});

test('captureViewLinks opens a modified click on an in-app link in the browser', () => {
  const { openLink } = setup();
  const anchor = addAnchor({ href: '/base/tickets/13' });
  // As the Link component does: it navigates in place on a plain click only.
  anchor.addEventListener('click', (event) => {
    if (!event.metaKey) event.preventDefault();
  });
  expect(click(anchor, { metaKey: true })).toBe(false);
  expect(openLink).toHaveBeenCalledWith({ url: '/base/tickets/13' });
});

test('captureViewLinks opens a middle click in the browser and ignores a right click', () => {
  const { openLink } = setup();
  const anchor = addAnchor({ href: '/base/tickets/13' });
  const auxclick = (button) =>
    dispatch(anchor, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button }));
  expect(auxclick(2)).toBe(true);
  expect(openLink).not.toHaveBeenCalled();
  expect(auxclick(1)).toBe(false);
  expect(openLink).toHaveBeenCalledWith({ url: '/base/tickets/13' });
});

test('captureViewLinks stops a javascript, data or file anchor and opens nothing unsafe', () => {
  const { openLink } = setup();
  [
    'javascript:alert(1)',
    'data:text/html,x',
    'file:///etc/passwd',
    'ftp://files.example.org/a',
  ].forEach((href) => {
    expect(click(addAnchor({ href, target: '_blank' }))).toBe(false);
  });
  // What reaches openLink is refused there (getOpenLinkUrl); none is followed.
  openLink.mock.calls.forEach(([{ url }]) => {
    expect(url).not.toMatch(/^https?:/);
  });
});

test('captureViewLinks stops an anchor with an empty href, which would reload the frame', () => {
  setup();
  expect(click(addAnchor({ href: '' }))).toBe(false);
});

test('captureViewLinks leaves fragment, mail, phone and download links to the browser', () => {
  const { openLink } = setup();
  expect(click(addAnchor({ href: '#notes' }))).toBe(true);
  expect(click(addAnchor({ href: 'mailto:someone@example.com' }))).toBe(true);
  expect(click(addAnchor({ href: 'tel:+15550100' }))).toBe(true);
  expect(click(addAnchor({ href: 'blob:http://localhost/1', download: 'a.csv' }))).toBe(true);
  expect(openLink).not.toHaveBeenCalled();
});

test('captureViewLinks ignores a click outside an anchor and an anchor without an href', () => {
  const { openLink } = setup();
  const anchor = document.createElement('a');
  document.body.appendChild(anchor);
  expect(click(anchor)).toBe(true);
  expect(click(document.body)).toBe(true);
  expect(openLink).not.toHaveBeenCalled();
});

test('captureViewLinks replaces window.open while installed and puts it back', () => {
  const frameOpen = window.open;
  const { openWindow } = setup();
  expect(window.open).toBe(openWindow);
  window.open('https://other.example.org/', '_blank');
  expect(openWindow).toHaveBeenCalledWith('https://other.example.org/', '_blank');
  stop();
  expect(window.open).toBe(frameOpen);
});

test('captureViewLinks catches nothing once it is removed', () => {
  const { openLink } = setup();
  stop();
  expect(click(addAnchor({ href: 'https://other.example.org/', target: '_blank' }))).toBe(true);
  expect(openLink).not.toHaveBeenCalled();
});

test('captureViewLinks leaves a window.open another script installed since', () => {
  setup();
  const theirs = () => null;
  window.open = theirs;
  stop();
  expect(window.open).toBe(theirs);
});

function setupNavigation() {
  const listeners = new Set();
  window.navigation = {
    addEventListener: (name, listener) => listeners.add(listener),
    removeEventListener: (name, listener) => listeners.delete(listener),
  };
  const navigate = (event) => {
    const navigateEvent = {
      cancelable: true,
      downloadRequest: null,
      hashChange: false,
      navigationType: 'push',
      preventDefault: vi.fn(),
      ...event,
      destination: { sameDocument: false, ...event.destination },
    };
    listeners.forEach((listener) => listener(navigateEvent));
    return navigateEvent;
  };
  return { listeners, navigate };
}

test('captureViewLinks cancels a navigation of the frame to another origin and opens it', () => {
  const { navigate } = setupNavigation();
  const { openLink } = setup();
  const event = navigate({ destination: { url: 'https://other.example.org/phish' } });
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(openLink).toHaveBeenCalledWith({ url: 'https://other.example.org/phish' });
});

test('captureViewLinks reads a navigation on the frame origin as a path of the app', () => {
  const { navigate } = setupNavigation();
  const { openLink } = setup();
  const event = navigate({ destination: { url: 'http://localhost/base/runs?state=open#top' } });
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(openLink).toHaveBeenCalledWith({
    url: 'https://app.example.com/base/runs?state=open#top',
  });
});

test('captureViewLinks leaves same-document navigations, downloads, reloads and history moves', () => {
  const { navigate } = setupNavigation();
  const { openLink } = setup();
  const url = 'http://localhost/frame';
  const left = [
    navigate({ hashChange: true, destination: { url } }),
    navigate({ destination: { sameDocument: true, url } }),
    navigate({ downloadRequest: 'a.csv', destination: { url } }),
    navigate({ navigationType: 'reload', destination: { url } }),
    navigate({ navigationType: 'traverse', destination: { url } }),
    navigate({ cancelable: false, destination: { url: 'https://other.example.org/' } }),
  ];
  left.forEach((event) => {
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
  expect(openLink).not.toHaveBeenCalled();
});

test('captureViewLinks stops listening for navigations once it is removed', () => {
  const { listeners } = setupNavigation();
  setup();
  expect(listeners.size).toBe(1);
  stop();
  expect(listeners.size).toBe(0);
});
