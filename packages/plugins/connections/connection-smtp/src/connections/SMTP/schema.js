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

import transportSchema from './transportSchema.js';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - SMTP',
  type: 'object',
  // nodemailer accepts many transport shapes - service, pool, url, tls pass through undeclared.
  additionalProperties: true,
  definitions: {
    email: {
      anyOf: [
        {
          type: 'string',
          examples: ['someone@example.org', 'Name One <someone@example.org>'],
          errorMessage: {
            type: 'SMTP connection property "{{ instancePath }}" should be a string.',
          },
        },
        {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              examples: ['Some One'],
              errorMessage: {
                type: 'SMTP connection property "{{ instancePath }}" should be a string.',
              },
            },
            email: {
              type: 'string',
              examples: ['someone@example.org'],
              errorMessage: {
                type: 'SMTP connection property "{{ instancePath }}" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'SMTP connection property "{{ instancePath }}" should be an object with properties "name" and "email".',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SMTP connection property "{{ instancePath }}" should be an email address, or an object with properties "name" and "email".',
      },
    },
    emails: {
      anyOf: [
        {
          $ref: '#/definitions/email',
        },
        {
          type: 'array',
          items: {
            $ref: '#/definitions/email',
          },
          errorMessage: {
            type: 'SMTP connection property "{{ instancePath }}" should be a list of email addresses',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SMTP connection property "{{ instancePath }}" should be an email address, or a list of email addresses.',
      },
    },
  },
  required: ['from'],
  properties: {
    ...transportSchema,
    from: {
      $ref: '#/definitions/emails',
      description: 'Email address to send email from.',
    },
    replyTo: {
      $ref: '#/definitions/emails',
      description: 'Default email address replies should be sent to.',
    },
    // null allowed on all filter values because they come from _secret;
    // unset secrets resolve null - an unset filter field is disabled.
    filter: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        replaceAddress: {
          type: ['string', 'null'],
        },
        allowlist: {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
        },
        regex: {
          type: ['string', 'null'],
        },
      },
    },
  },
  errorMessage: {
    type: 'SMTP connection properties should be an object.',
    required: {
      from: 'SMTP connection should have required property "from".',
    },
  },
};
