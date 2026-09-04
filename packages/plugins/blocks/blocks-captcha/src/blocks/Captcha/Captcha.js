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

import React, { useEffect, useRef } from 'react';
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise;

// The provider script loads once per page from the provider's CDN - apps
// behind a strict CSP allowlist challenges.cloudflare.com.
function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Allow a later mount to retry the load after a transient failure.
        turnstileScriptPromise = undefined;
        reject(new Error('Failed to load the Cloudflare Turnstile script.'));
      };
      document.head.appendChild(script);
    });
  }
  return turnstileScriptPromise;
}

// Renders the provider's widget and writes the minted token into state under
// the blockId. Tokens are single-use and short-lived: expiry clears the value
// so a late submit fails with a clear missing-token error rather than a
// confusing invalid-token one, and the reset method mints a fresh token for
// retries. The block is provider-agnostic in config (properties normally fed
// from the _build.authConfig projection) and dispatches on provider
// internally - cloudflare-turnstile is the only provider at launch.
function CaptchaBlock({ blockId, classNames, methods, properties, styles }) {
  const containerRef = useRef();
  const widgetIdRef = useRef();

  const provider = properties.provider ?? 'cloudflare-turnstile';
  if (provider !== 'cloudflare-turnstile') {
    throw new Error(
      `Captcha block does not support provider "${provider}". Supported providers are: "cloudflare-turnstile".`
    );
  }
  if (!properties.siteKey) {
    throw new Error(
      'Captcha block requires a "siteKey" property. Set it from the auth config projection: { _build.authConfig: captcha.siteKey }.'
    );
  }

  useEffect(() => {
    methods.registerMethod('reset', () => {
      methods.setValue(null);
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    });

    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: properties.siteKey,
          theme: properties.theme ?? 'auto',
          size: properties.size ?? 'normal',
          callback: (token) => {
            methods.setValue(token);
            methods.triggerEvent({ name: 'onSuccess', event: { token } });
          },
          'expired-callback': () => {
            methods.setValue(null);
            methods.triggerEvent({ name: 'onExpire', event: {} });
          },
          'error-callback': (errorCode) => {
            methods.setValue(null);
            methods.triggerEvent({ name: 'onError', event: { errorCode } });
          },
        });
      })
      .catch((error) => {
        methods.triggerEvent({ name: 'onError', event: { errorCode: error.message } });
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, []);

  return <div {...blockRootProps({ blockId, classNames, styles })} ref={containerRef} />;
}

CaptchaBlock.meta = {
  category: 'input',
  icons: [],
  styles: [],
};

export default withBlockDefaults(CaptchaBlock);
