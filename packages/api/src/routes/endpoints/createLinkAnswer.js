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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// A control character in a Location header would split or break the response.
function hasControlCharacter(value) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

const absoluteUrlPattern = /^https?:\/\/[^/]/i;

// A path on this origin. "//host" and "/\host" are refused: a browser reads both as another host.
function isOriginPath(value) {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

function isLinkTarget(value) {
  if (!type.isString(value) || value === '' || hasControlCharacter(value)) {
    return false;
  }
  return absoluteUrlPattern.test(value) || isOriginPath(value);
}

// The HTTP answer a link route sends, from the routine's outcome: a 302 to the URL the :return
// gives, or a status with no body. A browser loads the link as an image or a download, so a body
// would never be read. Any failure but a :reject or a failed ValidateSchema step answers 500
// with a fixed message, so nothing from the error reaches the caller. A :return that is not a
// link target is a config fault: it is logged as a ConfigError naming the endpoint.
async function createLinkAnswer(context, { endpointConfig, error, response, status }) {
  if (status === 'reject') {
    return { status: error.webhookStatus ?? 400 };
  }
  if (status === 'error' && error?.isInvalidRequest === true) {
    return { status: 400 };
  }
  if (status === 'error') {
    return { status: 500, body: { error: 'Link failed.' } };
  }
  if (!isLinkTarget(response)) {
    await context.handleError(
      new ConfigError(
        `Link endpoint "${endpointConfig.endpointId}" must return a URL: an absolute http(s) URL or a path starting with "/".`,
        { received: response, configKey: endpointConfig['~k'] }
      )
    );
    return { status: 500, body: { error: 'Link failed.' } };
  }
  return { status: 302, location: response };
}

export default createLinkAnswer;
