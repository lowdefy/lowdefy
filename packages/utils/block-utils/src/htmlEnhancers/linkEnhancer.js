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

import isOn from './isOn.js';

// The page id pattern the build enforces (validateId).
const PAGE_ID_PATTERN = /^[A-Za-z0-9\-_/:]+$/;

function preparePageLink({ element, registration, targets }) {
  const pageId = element.getAttribute('data-page-id');
  if (!PAGE_ID_PATTERN.test(pageId)) {
    console.warn(`data-page-id="${pageId}" is not a valid page id, so the link was not set.`);
    return;
  }
  // One object for both the href and the click, so a middle click and a plain
  // click open the same URL.
  const urlQuery = Object.fromEntries(
    new URLSearchParams(element.getAttribute('data-url-query') ?? '')
  );
  element.setAttribute(
    'href',
    registration.createHref({ pathname: `/${pageId}`, query: urlQuery })
  );
  targets.set(element, { pageId, urlQuery });
}

// An app-relative href: it starts with "/" and resolves to this origin. Parsing
// (not a prefix test) catches "//host" and the tabs or newlines the URL parser
// strips. A fragment stays a normal link, because the router cannot carry one.
function prepareAppLink({ element, registration, targets }) {
  const href = element.getAttribute('href');
  if (!href.startsWith('/')) return;
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin || url.hash !== '') return;
  const query = url.search.slice(1);
  element.setAttribute('href', registration.createHref({ pathname: url.pathname, query }));
  targets.set(element, { url: `${url.pathname}${url.search}` });
}

function isPlainClick(event) {
  return (
    !event.isDefaultPrevented() &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

// data-page-id turns an <a> into an in-app link: a real href (with basePath)
// for the browser, and client-side navigation on a plain click. data-link does
// the same for an existing app-relative href, and data-new-tab opens any link
// in a new tab.
const linkEnhancer = {
  name: 'link',
  attributes: ['data-page-id', 'data-link', 'data-new-tab'],
  prepare({ registration, select }) {
    const targets = new Map();
    select('[data-page-id]').forEach((element) => {
      if (element.tagName !== 'A') {
        console.warn(
          `data-page-id="${element.getAttribute(
            'data-page-id'
          )}" is only supported on <a> elements.`
        );
        return;
      }
      preparePageLink({ element, registration, targets });
    });
    select('a[href][data-link]').forEach((element) => {
      if (element.hasAttribute('data-page-id') || !isOn(element, 'data-link')) return;
      prepareAppLink({ element, registration, targets });
    });
    select('a[href][data-new-tab]').forEach((element) => {
      if (!isOn(element, 'data-new-tab')) return;
      // DOMPurify strips target from the input; it is set here on the clean tree.
      element.setAttribute('target', '_blank');
      const rel = new Set((element.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      element.setAttribute('rel', [...rel].join(' '));
    });
    return { targets };
  },
  onClick({ event, host }) {
    if (!isPlainClick(event)) return;
    const anchor = host.closestInRoot(event, 'a[href]');
    if (!anchor || anchor.getAttribute('target') === '_blank') return;
    const target = host.prepared.link.targets.get(anchor);
    if (!target) return;
    event.preventDefault();
    host.registration.link(target);
  },
};

export default linkEnhancer;
