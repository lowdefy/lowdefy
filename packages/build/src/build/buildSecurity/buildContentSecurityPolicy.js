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

// The server adds a fresh 'nonce-<n>' to these directives on every page render, and the
// page's own websocket origin to connect-src when the app has websockets.
const NONCE_DIRECTIVES = ['script-src', 'style-src'];

function getDefaultDirectives() {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    // antd's own style tags take the nonce, but parts of antd cannot: the scroll lock a
    // Modal or Drawer adds is a <style> element without one, and TextArea autosize and
    // Watermark set style attributes. With a nonce here those would be blocked, so styles
    // allow 'unsafe-inline' (which also leaves the nonce off style-src, see below).
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    // The browser posts Lowdefy usage telemetry to api.lowdefy.net (see createLogUsage in
    // the server's client code).
    'connect-src': ["'self'", 'https://api.lowdefy.net'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'self'"],
  };
}

// A source is written into the header as is, so a space, ";" or "," inside one would
// start another source or directive.
function validateSource({ directive, source, configKey }) {
  if (!type.isString(source) || source === '' || /[\s;,]/.test(source)) {
    throw new ConfigError(
      `App "config.security.contentSecurityPolicy.directives.${directive}" sources should be non-empty strings without spaces, ";" or ",".`,
      { received: source, configKey }
    );
  }
}

function addDirectiveSources({ directives, directive, sources, configKey }) {
  if (!/^[a-z][a-z-]*$/.test(directive)) {
    throw new ConfigError(
      'App "config.security.contentSecurityPolicy.directives" keys should be directive names in lowercase, like "script-src".',
      { received: directive, configKey }
    );
  }
  if (!type.isArray(sources)) {
    throw new ConfigError(
      `App "config.security.contentSecurityPolicy.directives.${directive}" should be an array of source strings.`,
      { received: sources, configKey }
    );
  }
  sources.forEach((source) => validateSource({ directive, source, configKey }));
  // 'none' only means anything alone, so a directive the app adds sources to drops it.
  const existing = (directives[directive] ?? []).filter(
    (source) => sources.length === 0 || source !== "'none'"
  );
  directives[directive] = [...new Set([...existing, ...sources])];
}

function buildContentSecurityPolicy({ contentSecurityPolicy, hasWebsockets, configKey }) {
  if (type.isUndefined(contentSecurityPolicy) || contentSecurityPolicy === false) {
    return null;
  }
  if (contentSecurityPolicy !== true && !type.isObject(contentSecurityPolicy)) {
    throw new ConfigError(
      'App "config.security.contentSecurityPolicy" should be true, false or an object.',
      { received: contentSecurityPolicy, configKey }
    );
  }
  const options = contentSecurityPolicy === true ? {} : contentSecurityPolicy;
  const optionsKey = options['~k'] ?? configKey;
  if (!type.isUndefined(options.reportOnly) && !type.isBoolean(options.reportOnly)) {
    throw new ConfigError(
      'App "config.security.contentSecurityPolicy.reportOnly" should be a boolean.',
      { received: options.reportOnly, configKey: optionsKey }
    );
  }
  if (!type.isUndefined(options.directives) && !type.isObject(options.directives)) {
    throw new ConfigError(
      'App "config.security.contentSecurityPolicy.directives" should be an object.',
      { received: options.directives, configKey: optionsKey }
    );
  }

  const directives = getDefaultDirectives();
  Object.entries(options.directives ?? {}).forEach(([directive, sources]) => {
    addDirectiveSources({
      directives,
      directive,
      sources,
      configKey: options.directives['~k'] ?? optionsKey,
    });
  });

  return {
    reportOnly: options.reportOnly === true,
    directives,
    // Browsers ignore 'unsafe-inline' in a directive that also has a nonce, so an app that
    // allows inline code in a directive gets no nonce there.
    nonceDirectives: NONCE_DIRECTIVES.filter(
      (directive) => !directives[directive].includes("'unsafe-inline'")
    ),
    websockets: hasWebsockets,
  };
}

export default buildContentSecurityPolicy;
