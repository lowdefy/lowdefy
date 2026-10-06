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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';
import findMissingPathParams from '../buildRoutes/findMissingPathParams.js';
import routeHasPlaceholders from '../buildRoutes/routeHasPlaceholders.js';

function isOperator(value) {
  const keys = Object.keys(value).filter((key) => !key.startsWith('~'));
  return keys.length === 1 && keys[0].startsWith('_');
}

function formatNames(names) {
  return names.map((name) => `"${name}"`).join(', ');
}

// A Link action with a static pageId. Its pathParams are checked here unless
// an operator computes them; a value an operator computes counts as given.
function checkLinkAction({ ref, route, context }) {
  const { action, pageId, sourcePageId } = ref;
  if (action.skip === true) {
    return;
  }
  const pathParams = type.isObject(action.params) ? action.params.pathParams : undefined;
  if (type.isObject(pathParams) && isOperator(pathParams)) {
    return;
  }
  const missing = findMissingPathParams({ route, pathParams });
  if (missing.length === 0) {
    return;
  }
  const names = formatNames(missing);
  collectExceptions(
    context,
    new ConfigError(
      `Link action "${action.id}" on page "${sourcePageId}" links to page "${pageId}" without path params ${names}. Page "${pageId}" has path "${route.path}", so the link's pathParams must give every placeholder a value.`,
      { configKey: action['~k'] }
    )
  );
}

// An HTML data-page-id link. Its data-path-params are checked here unless the
// HTML builds them at runtime.
function checkHtmlLink({ ref, route, pageId, context }) {
  if (ref.pathParamsDynamic === true) {
    return;
  }
  const missing = findMissingPathParams({ route, pathParams: ref.pathParams });
  if (missing.length === 0) {
    return;
  }
  const names = formatNames(missing);
  const example = `data-path-params='{"${missing[0]}":"..."}'`;
  collectExceptions(
    context,
    new ConfigError(
      `data-page-id="${ref.pageId}" on page "${pageId}" links without path params ${names}. Page "${ref.pageId}" has path "${route.path}", so the link's data-path-params must give every placeholder a value, like ${example}.`,
      { configKey: ref.configKey }
    )
  );
}

// The paths of the pages this page's collected links target (Link actions
// with a static pageId, HTML data-page-id links, Dynamic block link
// policies), for each target that declares a path, so the client can build
// those URLs. Static links to a page with placeholders must give each one a
// value.
function buildLinkPaths({ page, linkRefs, context }) {
  const linkPaths = {};
  for (const ref of linkRefs) {
    const route = context.routes.find((candidate) => candidate.pageId === ref.pageId);
    if (type.isUndefined(route) || route.path === route.pageId) {
      continue;
    }
    linkPaths[ref.pageId] = route.path;
    if (!routeHasPlaceholders({ route })) {
      continue;
    }
    if (ref.html === true) {
      checkHtmlLink({ ref, route, pageId: page.pageId, context });
    } else if (ref.action.type === 'Link') {
      checkLinkAction({ ref, route, context });
    }
  }
  // linkPaths has no config of its own, so it takes the page's key: the
  // final addKeys pass then gives it no keyMap entry of its own.
  setNonEnumerableProperty(linkPaths, '~k', page['~k']);
  page.linkPaths = linkPaths;
  return page;
}

export default buildLinkPaths;
