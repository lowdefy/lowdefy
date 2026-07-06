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
  title: 'Lowdefy Request Schema - SMTPMailSend',
  type: ['object', 'array'],
  definitions: {
    email: {
      anyOf: [
        {
          type: 'string',
          examples: ['someone@example.org', 'Name One <someone@example.org>'],
          errorMessage: {
            type: 'SMTPMailSend request property "{{ instancePath }}" should be a string.',
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
                type: 'SMTPMailSend request property "{{ instancePath }}" should be a string.',
              },
            },
            email: {
              type: 'string',
              examples: ['someone@example.org'],
              errorMessage: {
                type: 'SMTPMailSend request property "{{ instancePath }}" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'SMTPMailSend request property "{{ instancePath }}" should be an object with properties "name" and "email".',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SMTPMailSend request property "{{ instancePath }}" should be an email address, or an object with properties "name" and "email".',
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
            type: 'SMTPMailSend request property "{{ instancePath }}" should be a list of email addresses',
          },
        },
      ],
      errorMessage: {
        anyOf:
          'SMTPMailSend request property "{{ instancePath }}" should be an email address, or a list of email addresses.',
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
            type: 'SMTPMailSend request property "subject" should be a string.',
          },
        },
        text: {
          type: 'string',
          description: 'Email message in plain text format.',
          errorMessage: {
            type: 'SMTPMailSend request property "text" should be a string.',
          },
        },
        html: {
          type: 'string',
          description: 'Email message in html format.',
          errorMessage: {
            type: 'SMTPMailSend request property "html" should be a string.',
          },
        },
        attachments: {
          type: 'array',
          description: 'List of email attachments to include with email.',
          items: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Name of the attachment file.',
                errorMessage: {
                  type: 'SMTPMailSend request property "filename" should be a string.',
                },
              },
              content: {
                type: 'string',
                description: 'String content of the attachment.',
                errorMessage: {
                  type: 'SMTPMailSend request property "content" should be a string.',
                },
              },
              path: {
                type: 'string',
                description: 'File path or URL to stream the attachment from.',
                errorMessage: {
                  type: 'SMTPMailSend request property "path" should be a string.',
                },
              },
              contentType: {
                type: 'string',
                description:
                  "The mime type of the content you are attaching. For example, 'text/plain' or 'text/html'.",
                errorMessage: {
                  type: 'SMTPMailSend request property "contentType" should be a string.',
                },
              },
              encoding: {
                type: 'string',
                description:
                  "Encoding used to decode string content into a buffer. For example, 'base64' or 'hex'.",
                errorMessage: {
                  type: 'SMTPMailSend request property "encoding" should be a string.',
                },
              },
              cid: {
                type: 'string',
                description: 'Content id to reference the attachment as an embedded image in html.',
                errorMessage: {
                  type: 'SMTPMailSend request property "cid" should be a string.',
                },
              },
            },
            errorMessage: {
              type: 'SMTPMailSend request property "attachments" should be an array of objects.',
            },
          },
          errorMessage: {
            type: 'SMTPMailSend request property "attachments" should be an array.',
          },
        },
      },
      errorMessage: {
        required: {
          to: 'SMTPMailSend request should have required property "to".',
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
      'SMTPMailSend request properties should be an object or an array describing emails to send.',
  },
};
