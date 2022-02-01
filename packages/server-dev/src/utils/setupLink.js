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

function setupLink({ lowdefy }) {
  const { router, window } = lowdefy._internal;
  const sameOriginLink = (path, newTab) => {
    if (newTab) {
      return window.open(`${window.location.origin}${lowdefy.basePath}${path}`, '_blank').focus();
    } else {
      // Next handles the basePath here.
      return router.push({
        pathname: path,
        // TODO: Do we handle urlQuery as a param here?
        // query: {},
      });
    }
  };
  const newOriginLink = (path, newTab) => {
    if (newTab) {
      return window.open(path, '_blank').focus();
    } else {
      return (window.location.href = path);
    }
  };
  const backLink = () => window.history.back();
  return createLink({ backLink, lowdefy, newOriginLink, sameOriginLink });
}

export default setupLink;
