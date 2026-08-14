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

import { createLink } from '@lowdefy/engine';

function setupLink(lowdefy) {
  const { router } = lowdefy._internal;
  const { window } = lowdefy._internal.globals;
  const backLink = () => router.back();
  const disabledLink = () => {};
  // `href` wins over `url`, and is used verbatim — the same precedence the anchor
  // renderer applies (createLinkComponent.js). createLink only ever sets one of
  // them, and it gives `url` a protocol before we see it while leaving `href`
  // untouched, which is what makes `href` the way to link somewhere `url` cannot
  // reach: a root-relative path, a fragment, a scheme-less same-origin target.
  // urlQuery is not appended to an `href` for that reason — it is passed through
  // as written, query string included.
  const newOriginLink = ({ href, url, query, newTab }) => {
    const target = href ?? `${url}${query ? `?${query}` : ''}`;
    if (newTab) {
      const handle = window.open(target, '_blank');
      if (!handle) {
        lowdefy._internal.displayMessage({
          content: lowdefy._internal.translate('client.popupBlocked'),
          status: 'info',
          duration: 10,
        });
        return;
      }
      return handle.focus();
    }
    return window.location.assign(target);
  };
  const sameOriginLink = ({ newTab, pathname, query, setInput }) => {
    if (newTab) {
      return window
        .open(
          `${window.location.origin}${lowdefy.basePath}${pathname}${query ? `?${query}` : ''}`,
          '_blank'
        )
        .focus();
    } else {
      setInput();
      return router.push({
        pathname,
        query,
      });
    }
  };
  const noLink = () => {
    throw new Error(`Invalid Link.`);
  };
  return createLink({ backLink, disabledLink, lowdefy, newOriginLink, noLink, sameOriginLink });
}

export default setupLink;
