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
  title: 'Lowdefy Connection Schema - SendGridMail',
  type: 'object',
  definitions: {
    email: {
      anyOf: [
        {
          type: 'string',
          examples: ['someone@example.org', 'Name One <someone@example.org>'],
          errorMessage: {
            type: 'SendGridMail connection property "{{ instancePath }}" should be a string.',
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
                type: 'SendGridMail connection property "{{ instancePath }}" should be a string.',
              },
            },
            email: {
              type: 'string',
              examples: ['someone@example.org'],
              errorMessage: {
                type: 'SendGridMail connection property "{{ instancePath }}" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'SendGridMail connection property "{{ instancePath }}" should be an object with properties "name" and "email".',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SendGridMail connection property "{{ instancePath }}" should be an email address, or an object with properties "name" and "email".',
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
            type: 'SendGridMail connection property "{{ instancePath }}" should be a list of email addresses',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SendGridMail connection property "{{ instancePath }}" should be an email address, or a list of email addresses.',
      },
    },
  },
  required: ['apiKey', 'from'],
  properties: {
    from: {
      $ref: '#/definitions/emails',
      description: 'Email address to send email from.',
    },
    apiKey: {
      type: 'string',
      description: 'SendGrid API key.',
      errorMessage: {
        type: 'SendGridMail connection property "apiKey" should be a string.',
      },
    },
    replyTo: {
      $ref: '#/definitions/emails',
      description: 'Default email address to reply to.',
    },
    templateId: {
      type: 'string',
      description: 'SendGrid email template ID to render email when sending.',
      errorMessage: {
        type: 'SendGridMail connection property "templateId" should be a string.',
      },
    },
    filter: {
      type: ['object', 'null'],
      description: 'Filter to restrict or redirect the recipients of outgoing mail.',
      additionalProperties: false,
      properties: {
        replaceAddress: {
          type: ['string', 'null'],
          description: 'Replace all "to" recipients with this address and drop cc and bcc.',
          errorMessage: {
            type: 'SendGridMail connection property "filter.replaceAddress" should be a string.',
          },
        },
        allowlist: {
          type: ['array', 'null'],
          description: 'List of domains allowed to receive mail.',
          items: {
            type: 'string',
            errorMessage: {
              type: 'SendGridMail connection property "filter.allowlist" should be a list of domain strings.',
            },
          },
          errorMessage: {
            type: 'SendGridMail connection property "filter.allowlist" should be an array.',
          },
        },
        regex: {
          type: ['string', 'null'],
          description:
            'Regular expression an email address must match to receive mail.',
          errorMessage: {
            type: 'SendGridMail connection property "filter.regex" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'SendGridMail connection property "filter" should be an object.',
      },
    },
    mailSettings: {
      type: 'object',
      properties: {
        sandboxMode: {
          type: 'object',
          properties: {
            enable: {
              type: 'boolean',
              errorMessage: {
                type: 'SendGridMail connection property "mailSettings.sandboxMode.enable" should be a boolean.',
              },
            },
          },
          errorMessage: {
            type: 'SendGridMail connection property "mailSettings.sandboxMode" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'SendGridMail connection property "mailSettings" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'SendGridMail connection properties should be an object.',
    required: {
      apiKey: 'SendGridMail connection should have required property "apiKey".',
      from: 'SendGridMail connection should have required property "from".',
    },
  },
};
