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
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the email one-time-code send method.',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address to send the sign-in code to.',
      },
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
