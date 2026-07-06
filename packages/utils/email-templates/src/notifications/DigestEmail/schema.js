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
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Notification Schema - DigestEmail',
  type: 'object',
  additionalProperties: false,
  required: ['subject'],
  properties: {
    subject: {
      type: 'string',
      description: 'Email subject line.',
      errorMessage: {
        type: 'DigestEmail property "subject" should be a string.',
      },
    },
    title: {
      type: 'string',
      description: 'Heading shown at the top of the email content.',
      errorMessage: {
        type: 'DigestEmail property "title" should be a string.',
      },
    },
    intro: {
      type: 'string',
      description: 'Introduction shown above the digest items, rendered as markdown.',
      errorMessage: {
        type: 'DigestEmail property "intro" should be a string.',
      },
    },
    button: {
      type: 'object',
      description: 'Call to action button. The href is resolved from links.button.',
      additionalProperties: false,
      properties: {
        label: {
          type: 'string',
          description: 'Button label.',
          errorMessage: {
            type: 'DigestEmail property "button.label" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'DigestEmail property "button" should be an object with property "label".',
      },
    },
  },
  errorMessage: {
    type: 'DigestEmail properties should be an object.',
    required: {
      subject: 'DigestEmail property "subject" is required.',
    },
  },
};
