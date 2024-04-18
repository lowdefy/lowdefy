/* eslint-disable no-param-reassign */

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

import { type } from '@lowdefy/helpers';
import getPageRoles from './getPageRoles.js';
import getProtectedPages from './getProtectedPages.js';

function buildPageAuth({ components }) {
  const protectedPages = getProtectedPages({ components });
  const pageRoles = getPageRoles({ components });
  let configPublicPages = [];
  if (type.isArray(components.auth.pages.public)) {
    configPublicPages = components.auth.pages.public;
  }

  (components.pages || []).forEach((page) => {
    if (pageRoles[page.id]) {
      if (configPublicPages.includes(page.id)) {
        throw new Error(
          `Page "${page.id}" is both protected by roles ${JSON.stringify(
            pageRoles[page.id]
          )} and public.`
        );
      }
      page.auth = {
        public: false,
        roles: pageRoles[page.id],
      };
    } else if (protectedPages.includes(page.id)) {
      page.auth = {
        public: false,
      };
    } else {
      page.auth = {
        public: true,
      };
    }
  });

  return components;
}

export default buildPageAuth;
