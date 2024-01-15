/*
  Copyright 2020-2024 Lowdefy, Inc

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
  title: 'Lowdefy Request Schema - SendGridMailSend',
  type: 'object',
  definitions: {
    email: {
      anyOf: [
        {
          type: 'string',
          examples: ['someone@example.org', 'Name One <someone@example.org>'],
          errorMessage: {
            type: 'SendGridMailSend request property "{{ dataPath }}" should be a string.',
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
                type: 'SendGridMailSend request property "{{ dataPath }}" should be a string.',
              },
            },
            email: {
              type: 'string',
              examples: ['someone@example.org'],
              errorMessage: {
                type: 'SendGridMailSend request property "{{ dataPath }}" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'SendGridMailSend request property "{{ dataPath }}" should be an object with properties "name" and "email".',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SendGridMailSend request property "{{ dataPath }}" should be an email address, or an object with properties "name" and "email".',
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
            type: 'SendGridMailSend request property "{{ dataPath }}" should be a list of email addresses',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SendGridMailSend request property "{{ dataPath }}" should be an email address, or a list of email addresses.',
      },
    },
    oneRequest: {
      type: 'object',
      required: ['to'],
      properties: {
        to: {
          $ref: '#/definitions/emails',
          description: 'Email address to send to.',
        },
        cc: {
          $ref: '#/definitions/emails',
          description: 'Email address to cc in communication.',
        },
        bcc: {
          $ref: '#/definitions/emails',
          description: 'Email address to bcc in communication.',
        },
        replyTo: {
          $ref: '#/definitions/emails',
          description: 'Email address to reply to.',
        },
        subject: {
          type: 'string',
          description: 'Email subject.',
          errorMessage: {
            type: 'SendGridMailSend request property "subject" should be a string.',
          },
        },
        text: {
          type: 'string',
          description: 'Email message in plain text format.',
          errorMessage: {
            type: 'SendGridMailSend request property "text" should be a string.',
          },
        },
        html: {
          type: 'string',
          description: 'Email message in html format.',
          errorMessage: {
            type: 'SendGridMailSend request property "html" should be a string.',
          },
        },
        dynamicTemplateData: {
          type: 'object',
          description: 'SendGrid template data to render into email template.',
          errorMessage: {
            type: 'SendGridMailSend request property "dynamicTemplateData" should be an object.',
          },
        },
        attachments: {
          type: 'array',
          description: 'List of email attachments to include with email.',
          items: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Base 64 encoded attachment content.',
                errorMessage: {
                  type: 'SendGridMailSend request property "content" should be a string.',
                },
              },
              filename: {
                type: 'string',
                description: 'Name of the attachment file.',
                errorMessage: {
                  type: 'SendGridMailSend request property "filename" should be a string.',
                },
              },
              type: {
                type: 'string',
                description:
                  "The mime type of the content you are attaching. For example, 'text/plain' or 'text/html'.",
                errorMessage: {
                  type: 'SendGridMailSend request property "type" should be a string.',
                },
              },
              disposition: {
                type: 'string',
                errorMessage: {
                  type: 'SendGridMailSend request property "disposition" should be a string.',
                },
              },
              contentId: {
                type: 'string',
                errorMessage: {
                  type: 'SendGridMailSend request property "contentId" should be a string.',
                },
              },
            },
            errorMessage: {
              type: 'SendGridMailSend request property "attachments" should be an array of objects.',
            },
          },
          errorMessage: {
            type: 'SendGridMailSend request property "attachments" should be an array.',
          },
        },
        categories: {
          type: 'array',
          items: {
            type: 'string',
            errorMessage: {
              type: 'SendGridMailSend request property "categories" should be an array of strings.',
            },
          },
          errorMessage: {
            type: 'SendGridMailSend request property "categories" should be an array.',
          },
        },
        sendAt: {
          type: 'integer',
          description:
            "A unix timestamp allowing you to specify when you want your email to be delivered. You can't schedule more than 72 hours in advance.",
        },
        templateId: {
          type: 'string',
          description: 'SendGrid email template ID to render email when sending.',
        },
      },
      errorMessage: {
        required: {
          to: 'SendGridMailSend request should have required property "to".',
        },
      },
    },
  },
  anyOf: [
    {
      $ref: '#/definitions/oneRequest',
    },
    {
      type: 'array',
      items: {
        $ref: '#/definitions/oneRequest',
      },
    },
  ],
  errorMessage: {
    anyOf:
      'SendGridMailSend request properties should be an object or a array describing emails to send.',
  },
};
