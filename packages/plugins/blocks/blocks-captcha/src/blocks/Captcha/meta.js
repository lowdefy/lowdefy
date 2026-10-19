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

export default {
  category: 'input',
  icons: [],
  valueType: 'string',
  events: {
    onSuccess: 'Trigger actions when the captcha challenge succeeds and a token is minted.',
    onExpire:
      'Trigger actions when the minted token expires - the block value is cleared so a late submit fails with a clear missing-token error.',
    onError: 'Trigger actions when the captcha provider reports an error.',
  },
  methods: {
    reset:
      'Clears the block value and mints a fresh token. Tokens are single-use - call from onError of the auth action for retries.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      provider: {
        type: 'string',
        enum: ['cloudflare-turnstile'],
        default: 'cloudflare-turnstile',
        description:
          'Captcha provider to render. Normally fed from the auth config projection: { _build.authConfig: captcha.provider }.',
      },
      siteKey: {
        type: 'string',
        description:
          'The provider site key - public, rendered into the page. Normally fed from the auth config projection: { _build.authConfig: captcha.siteKey }.',
      },
      theme: {
        type: 'string',
        enum: ['auto', 'light', 'dark'],
        default: 'auto',
        description: 'Widget theme.',
      },
      size: {
        type: 'string',
        enum: ['normal', 'compact', 'flexible'],
        default: 'normal',
        description: 'Widget size.',
      },
    },
  },
};
