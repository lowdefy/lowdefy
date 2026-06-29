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
import { type } from '@lowdefy/helpers';

import { createUrl, parsePageId } from './url.js';

// Replaces next/link for the contract used by @lowdefy/client's
// createLinkComponent: href as { pathname, query } or string, replace,
// scroll, onClick fired before navigation. Modified clicks (new tab,
// middle click, download) fall through to native browser handling.
// An optional prefetch(pageId) warms the target page's config on hover/focus.
function createLinkComponent({ router, prefetch }) {
  function Link({ children, href, onClick, replace, scroll, ...props }) {
    const hrefObject = type.isString(href) ? { pathname: href } : href ?? {};
    const { pathname, query } = hrefObject;
    const url = createUrl({ basePath: router.basePath, pathname, query });

    function handlePrefetch() {
      if (!prefetch) return;
      const pageId = parsePageId(url, router.basePath);
      if (pageId) prefetch(pageId);
    }

    function handleClick(event) {
      if (onClick) {
        onClick(event);
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        props.target === '_blank'
      ) {
        return;
      }
      event.preventDefault();
      if (replace) {
        router.replace({ pathname, query, scroll });
      } else {
        router.push({ pathname, query, scroll });
      }
    }

    return (
      <a
        {...props}
        href={url}
        onClick={handleClick}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
      >
        {children}
      </a>
    );
  }
  return Link;
}

export default createLinkComponent;
