/*
  Copyright 2020-2021 Lowdefy, Inc

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

function setupLink({ routeHistory, windowContext, rootContext }) {
  const sameOriginLink = (path, newTab) => {
    if (newTab) {
      windowContext.open(`${windowContext.location.origin}${path}`, '_blank').focus();
    } else {
      routeHistory.push(`${windowContext.location.origin}${path}`);
    }
  };
  const newOriginLink = (path, newTab) => {
    if (newTab) {
      windowContext.open(path, '_blank').focus();
    } else {
      windowContext.location.href = path;
    }
  };
  return createLink({ sameOriginLink, newOriginLink, rootContext });
}

export default setupLink;
