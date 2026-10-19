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

import endpointIdPattern from '../endpointIdPattern.js';

const endpointIdRegex = new RegExp(endpointIdPattern);
const toolNameRegex = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const printableAsciiRegex = /^[\x21-\x7e]*$/;

function isUnsafeToolPath(path) {
  // Printable ASCII only, before and after percent-decoding. A URL parser strips tabs and
  // newlines without a word (".\t." becomes ".."), and a server may fold other whitespace or
  // unicode lookalikes ("\uff0e\uff0e") into dots, so none of them can be in a path.
  if (!printableAsciiRegex.test(path)) return true;
  // A scheme ("https:") or a network path ("//host") would name another host; a query or
  // fragment belongs in `query`; "." and ".." segments, also percent-encoded, would climb
  // out of the tool's base URL.
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(path)) return true;
  if (path.startsWith('//') || path.includes('\\')) return true;
  if (/[?#]/.test(path)) return true;
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return true;
  }
  if (!printableAsciiRegex.test(decoded)) return true;
  return decoded
    .split('/')
    .some((segment) => segment === '..' || segment === '.' || segment.includes('\\'));
}

// The /call/ path a TregCall reaches, and how errors name it. The schema checks these
// shapes too; they are checked again here because this path decides which upstream
// receives the team's credentials, and whether custom tools are allowed is a connection
// setting the request schema can not see.
function resolveCallPath({ request, connection }) {
  if (type.isString(request.endpoint)) {
    if (!endpointIdRegex.test(request.endpoint)) {
      throw new Error(
        `TregCall "endpoint" should be a treg endpoint id, such as "treg.people.email.find". Received ${JSON.stringify(
          request.endpoint
        )}. Upstream URLs are not accepted.`
      );
    }
    return { path: `/call/${request.endpoint}`, target: `"${request.endpoint}"` };
  }
  if (connection.allowCustomTools !== true) {
    throw new Error(
      'TregCall can only call a custom tool when the connection sets "allowCustomTools: true".'
    );
  }
  if (!type.isString(request.tool) || !toolNameRegex.test(request.tool)) {
    throw new Error(
      `TregCall "tool" should be a tool name. Received ${JSON.stringify(request.tool)}.`
    );
  }
  if (!type.isString(request.path) || isUnsafeToolPath(request.path)) {
    throw new Error(
      `TregCall "path" should be a path on the tool's API, with no scheme, host, query, "..", whitespace, control characters or non-ASCII characters. Received ${JSON.stringify(
        request.path
      )}.`
    );
  }
  const path = request.path.replace(/^\/+/, '');
  return { path: `/call/${request.tool}/${path}`, target: `tool "${request.tool}"` };
}

export default resolveCallPath;
