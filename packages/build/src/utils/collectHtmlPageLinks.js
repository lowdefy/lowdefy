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

// data-page-id attribute values inside HTML strings or JS sources: any case,
// optional whitespace around =, quoted or unquoted. In JSON text a double quote
// inside a string is escaped (data-page-id=\"home\"). The value must end at a
// quote, whitespace or >, so a templated value ("tasks-{{ id }}") is skipped.
const dataPageIdRegex = /data-page-id\s*=\s*(?:\\?["'])?([A-Za-z0-9\-_/:]+)(?=\\?["']|[\s>]|$)/gi;

// data-path-params holds a JSON object. Single-quoted, its double quotes are
// escaped in JSON text; double-quoted, they are written as &quot;.
const dataPathParamsRegex = /data-path-params\s*=\s*(?:'([^']*)'|\\"(.*?)\\")/i;

function decodeEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// The attribute text of the element a data-page-id match sits in.
function elementText({ json, index }) {
  let start = json.lastIndexOf('<', index);
  // A ">" after the last "<" means the match is not inside a tag.
  if (start === -1 || json.indexOf('>', start) < index) {
    start = index;
  }
  const end = json.indexOf('>', index);
  return json.slice(start, end === -1 ? json.length : end);
}

// The element's data-path-params: absent (undefined), a JSON object written in
// the markup, or dynamic when it is built at runtime (templated or not JSON).
function readPathParams({ text }) {
  const match = text.match(dataPathParamsRegex);
  if (match === null) {
    return { pathParams: undefined, pathParamsDynamic: false };
  }
  try {
    const attribute = decodeEntities(JSON.parse(`"${match[1] ?? match[2]}"`));
    const pathParams = JSON.parse(attribute);
    if (type.isObject(pathParams)) {
      return { pathParams, pathParamsDynamic: false };
    }
  } catch {
    // A value that is not JSON in the config is written when the HTML renders.
  }
  return { pathParams: undefined, pathParamsDynamic: true };
}

// Each distinct in-app HTML link in JSON text: the data-page-id and the
// data-path-params of the same element.
function collectHtmlPageLinks({ json }) {
  const links = new Map();
  for (const match of json.matchAll(dataPageIdRegex)) {
    const text = elementText({ json, index: match.index });
    const link = { pageId: match[1], ...readPathParams({ text }) };
    links.set(JSON.stringify(link), link);
  }
  return [...links.values()];
}

export default collectHtmlPageLinks;
