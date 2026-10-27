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

import { type } from '@lowdefy/helpers';

function noop() {}

/**
 * The header options a Screen page's config gives before the page renders, in the shape a Screen
 * reports (client-native screen/Screen.js): the parts that size the bar (a large title, a search
 * field) and how it is drawn (a backgroundTint's clear bar), from literal properties. The Screen
 * reports its full options once it renders; these set the bar first, so the page's scroll view is
 * first laid out under the bar it will have. iOS keeps a large title collapsed when the page's
 * scroll view was laid out under a standard bar before the large title came.
 *
 * @param {Object} params
 * @param {Object} params.pageConfig The page config, as the server sends it.
 * @returns {Object|null} The options, or null for a page that is not a Screen.
 */
function getInitialScreenOptions({ pageConfig }) {
  if (pageConfig.type !== 'Screen') {
    return null;
  }
  const properties = pageConfig.properties ?? {};
  const headerSearch = properties.headerSearch;
  return {
    backgroundTint: !type.isNone(properties.backgroundTint),
    headerActions: [],
    headerBottom: false,
    headerLeft: undefined,
    headerRight: undefined,
    headerSearch: type.isObject(headerSearch)
      ? {
          autoFocus: false,
          hideWhenScrolling: headerSearch.hideWhenScrolling === true,
          onCancel: noop,
          onChangeText: noop,
          onSearch: noop,
          placeholder: type.isString(headerSearch.placeholder)
            ? headerSearch.placeholder
            : undefined,
        }
      : undefined,
    largeTitle: properties.largeTitle === true,
    presentation: type.isString(properties.presentation) ? properties.presentation : 'card',
    title: type.isString(properties.title) ? properties.title : undefined,
  };
}

export default getInitialScreenOptions;
