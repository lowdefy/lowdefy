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
import { getPossibleOperators } from '@lowdefy/operators';

import findEmbeddedUrls from './findEmbeddedUrls.js';
import isAllowedUrl from './isAllowedUrl.js';
import isUnderState from './isUnderState.js';

// How the client uses a URL value, for values no schema marks. A block schema
// marks its URL-valued properties with urlKind (collectSchemaKinds), whatever they
// are called, and opts a URL-named property out with urlKind: false; every
// other value (action params, style, unmarked properties, including every
// property of a block that marks none) is judged by these key names. url and
// href navigate, and the engine's link resolver reads a colon-less url as https.
const URL_KEY_KINDS = {
  action: 'src',
  cover: 'src',
  href: 'href',
  image: 'src',
  poster: 'src',
  src: 'src',
  srcMobile: 'src',
  srcSet: 'srcSet',
  url: 'url',
};
const HTML_TAG = /<[a-zA-Z/!]/;

function joinPath(path, key) {
  return path ? `${path}.${key}` : `${key}`;
}

function getUrlKind({ key, path, walk }) {
  if (walk.urlKinds?.has(path)) {
    return walk.urlKinds.get(path);
  }
  return URL_KEY_KINDS[key] ?? null;
}

function listUrls({ value, urlKind }) {
  // srcSet lists "url descriptor" pairs.
  if (urlKind === 'srcSet') return value.split(',').map((entry) => entry.trim().split(/\s+/)[0]);
  return [value];
}

// Which URLs a string can carry depends on how its block draws it (textKind,
// from the block schema). A value is a URL where it is used as a link (a URL
// key or urlKind mark, judged whole above); text and HTML a block draws are no
// link and render no markdown, so a whole value, a markdown target or a
// protocol-relative word in them is words. HTML can carry a style attribute
// only when the policy allows tags. A value no schema marks may be drawn as
// markdown, a style or a link the schema does not mark, so every scan applies.
function getUrlScans({ textKind, policy }) {
  if (textKind === 'text') {
    return { wholeValue: false, markdown: false, css: false };
  }
  if (textKind === 'html') {
    return { wholeValue: false, markdown: false, css: policy.html === true };
  }
  return { wholeValue: true, markdown: true, css: true };
}

function checkString({ value, key, path, walk }) {
  const { errors, policy, routes } = walk;
  // Data is stored or sent, never drawn or followed by the content, so every
  // string in it is text.
  if (walk.isData) {
    return;
  }
  const textKind = walk.textKinds?.get(path) ?? null;
  // A string drawn as escaped text shows tag syntax as written.
  if (!policy.html && textKind !== 'text' && HTML_TAG.test(value)) {
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
  const urlKind = getUrlKind({ key, path, walk });
  if (urlKind !== null) {
    listUrls({ value, urlKind }).forEach((url) => {
      const allowed = isAllowedUrl({
        value: url,
        policy,
        navigation: urlKind === 'url' || urlKind === 'href',
        schemeless: urlKind === 'url',
        routes,
      });
      if (!allowed) {
        // A URL in a list (an array item) has no key of its own.
        const label = key === null ? 'URL' : `"${key}" value`;
        errors.push({
          path,
          rule: 'policy.urls',
          message: `${label} "${url}" is not a page or origin dynamic blocks policy "${policy.id}" allows.`,
        });
      }
    });
    return;
  }
  // A URL value was judged whole above; other strings are searched.
  findEmbeddedUrls({ value, ...getUrlScans({ textKind, policy }) }).forEach((url) => {
    if (!isAllowedUrl({ value: url, policy, navigation: false, schemeless: false, routes })) {
      errors.push({
        path,
        rule: 'policy.urls',
        message: `URL "${url}" is not an origin dynamic blocks policy "${policy.id}" allows.`,
      });
    }
  });
}

// A _state read may only name a literal key under the policy's state, so
// content cannot read other page state and send it on (a CallAPI payload).
function isAllowedStateRead({ params, state }) {
  if (type.isString(params)) {
    return isUnderState({ key: params, state });
  }
  return (
    type.isObject(params) &&
    params.all !== true &&
    type.isString(params.key) &&
    isUnderState({ key: params.key, state })
  );
}

// The state key a _state read names, or null when it is not a literal key
// (only a policy without a state path allows that).
function getStateReadKey(params) {
  if (type.isString(params)) return params;
  if (type.isObject(params) && params.all !== true && type.isString(params.key)) {
    return params.key;
  }
  return null;
}

function checkOperators({ value, key, path, walk }) {
  const { clientOperators, errors, policy } = walk;
  const possible = getPossibleOperators({ value, operators: clientOperators });
  possible.forEach(({ key: operatorKey, operator }) => {
    if (!policy.operators.includes(operator)) {
      errors.push({
        path,
        rule: 'policy.operators',
        message: `Operator "${operator}" is not in dynamic blocks policy "${policy.id}" operators.`,
      });
    }
    if (
      operator === '_state' &&
      !type.isNone(policy.state) &&
      !isAllowedStateRead({ params: value[operatorKey], state: policy.state })
    ) {
      errors.push({
        path,
        rule: 'policy.state',
        message: `_state must read a literal key under "${policy.state}", the state dynamic blocks policy "${policy.id}" allows.`,
      });
    }
    // Content may draw what it reads, so a read of state it fills with data
    // is judged against those keys once the walk has found them all.
    if (operator === '_state' && !walk.isData && !walk.undrawn) {
      walk.drawnStateReads.push({ path, key: getStateReadKey(value[operatorKey]) });
    }
  });
  // The client would compute this value at render time, where the policy
  // cannot see it. In data nothing is a URL or a page link.
  if (walk.isData) {
    return;
  }
  const urlKind = getUrlKind({ key, path, walk });
  if (possible.length > 0 && (urlKind !== null || key === 'pageId')) {
    // A URL in a list (an array item) has no key of its own.
    const label = key === null ? 'A URL' : `"${key}"`;
    errors.push({
      path,
      rule: key === 'pageId' ? 'policy.links' : 'policy.urls',
      message: `${label} must be a literal string under dynamic blocks policy "${policy.id}", not an operator.`,
    });
  }
}

// Walks any config value: every operator must be allowed, _state reads must stay
// under the policy's state, URL-valued and pageId values must be literal and
// allowed, and strings must obey the html rule. walk carries the policy, the
// app's client operators, the error list and, inside block properties, the URL
// and text kinds the block's schema marks (by path). Under a value marked
// textKind 'data', and in walk.isData (SetState values), only the operator
// rules apply: the content stores the value and never draws or follows it.
// walk.undrawn marks a value the content sends or tests but never draws (a
// CallAPI payload, a condition), where a _state read draws nothing.
function checkValue({ value, key = null, path, walk: parentWalk }) {
  const walk =
    !parentWalk.isData && parentWalk.textKinds?.get(path) === 'data'
      ? { ...parentWalk, isData: true }
      : parentWalk;
  if (type.isString(value)) {
    checkString({ value, key, path, walk });
    return;
  }
  if (type.isArray(value)) {
    value.forEach((item, index) => checkValue({ value: item, path: joinPath(path, index), walk }));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  checkOperators({ value, key, path, walk });
  Object.keys(value).forEach((childKey) => {
    if (childKey.startsWith('~')) return;
    checkValue({ value: value[childKey], key: childKey, path: joinPath(path, childKey), walk });
  });
}

export default checkValue;
