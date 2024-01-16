/*
  Copyright 2020-2024 Lowdefy, Inc

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
  const newOriginLink = ({ url, query, newTab }) => {
    if (newTab) {
      const handle = window.open(`${url}${query ? `?${query}` : ''}`, '_blank');
      if (!handle) {
        lowdefy._internal.displayMessage({
          content:
            'A popup blocker may be preventing the application from opening the page. Approve the popup to continue.',
          status: 'info',
          duration: 10,
        });
        return;
      }
      return handle.focus();
    }
    return window.location.assign(`${url}${query ? `?${query}` : ''}`);
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
