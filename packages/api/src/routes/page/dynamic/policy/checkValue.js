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

import { getOperatorType, type } from '@lowdefy/helpers';

import findEmbeddedUrls from './findEmbeddedUrls.js';
import isAllowedUrl from './isAllowedUrl.js';

// Keys whose value the client uses as a URL. href and url navigate; the rest load.
const NAVIGATION_KEYS = new Set(['href', 'url']);
const URL_KEYS = new Set([
  'action',
  'cover',
  'href',
  'image',
  'poster',
  'src',
  'srcMobile',
  'srcSet',
  'url',
]);
const HTML_TAG = /<[a-zA-Z/!]/;

function joinPath(path, key) {
  return path ? `${path}.${key}` : `${key}`;
}

function keyedUrls({ value, key }) {
  if (!URL_KEYS.has(key)) return [];
  // srcSet lists "url descriptor" pairs.
  if (key === 'srcSet') return value.split(',').map((entry) => entry.trim().split(/\s+/)[0]);
  return [value];
}

function checkString({ value, key, path, policy, errors }) {
  if (!policy.html && HTML_TAG.test(value)) {
    errors.push({
      path,
      rule: 'policy.html',
      message: `String contains HTML tag syntax. Dynamic blocks policy "${policy.id}" does not allow HTML.`,
    });
  }
  if (key === 'pageId' && !policy.links.pages.includes(value)) {
    errors.push({
      path,
      rule: 'policy.links',
      message: `Page "${value}" is not in dynamic blocks policy "${policy.id}" links.pages.`,
    });
  }
  keyedUrls({ value, key }).forEach((url) => {
    const allowed = isAllowedUrl({
      value: url,
      policy,
      navigation: NAVIGATION_KEYS.has(key),
      schemeless: key === 'url',
    });
    if (!allowed) {
      errors.push({
        path,
        rule: 'policy.urls',
        message: `"${key}" value "${url}" is not a page or origin dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  });
  // A URL key's value was judged whole above; other strings are searched.
  const embeddedUrls = URL_KEYS.has(key) ? [] : findEmbeddedUrls(value);
  embeddedUrls.forEach((url) => {
    if (!isAllowedUrl({ value: url, policy, navigation: false, schemeless: false })) {
      errors.push({
        path,
        rule: 'policy.urls',
        message: `URL "${url}" is not an origin dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  });
}

// Walks any config value: every operator must be allowed, URL-valued and
// pageId keys must be literal and allowed, and strings must obey the html rule.
function checkValue({ value, key = null, path, policy, errors }) {
  if (type.isString(value)) {
    checkString({ value, key, path, policy, errors });
    return;
  }
  if (type.isArray(value)) {
    value.forEach((item, index) =>
      checkValue({ value: item, path: joinPath(path, index), policy, errors })
    );
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  const operator = getOperatorType(value);
  if (operator !== null) {
    if (!policy.operators.includes(operator)) {
      errors.push({
        path,
        rule: 'policy.operators',
        message: `Operator "${operator}" is not in dynamic blocks policy "${policy.id}" operators.`,
      });
    }
    // The client would compute this value at render time, where the policy
    // cannot see it.
    if (URL_KEYS.has(key) || key === 'pageId') {
      errors.push({
        path,
        rule: key === 'pageId' ? 'policy.links' : 'policy.urls',
        message: `"${key}" must be a literal string under dynamic blocks policy "${policy.id}", not an operator.`,
      });
    }
  }
  Object.keys(value).forEach((childKey) => {
    if (childKey.startsWith('~')) return;
    checkValue({
      value: value[childKey],
      key: childKey,
      path: joinPath(path, childKey),
      policy,
      errors,
    });
  });
}

export default checkValue;
