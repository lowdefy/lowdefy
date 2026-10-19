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
  title: 'Lowdefy Notification Schema - NotificationEmail',
  type: 'object',
  additionalProperties: false,
  required: ['subject'],
  properties: {
    subject: {
      type: 'string',
      description: 'Email subject line.',
      errorMessage: {
        type: 'NotificationEmail property "subject" should be a string.',
      },
    },
    title: {
      type: 'string',
      description: 'Heading shown at the top of the email content.',
      errorMessage: {
        type: 'NotificationEmail property "title" should be a string.',
      },
    },
    message: {
      type: 'string',
      description: 'Main email message, rendered as markdown.',
      errorMessage: {
        type: 'NotificationEmail property "message" should be a string.',
      },
    },
    preview: {
      type: 'string',
      description: 'Preview text shown in email client inbox listings.',
      errorMessage: {
        type: 'NotificationEmail property "preview" should be a string.',
      },
    },
    metadata: {
      type: 'array',
      description: 'List of label-value pairs rendered as a table.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          label: {
            type: 'string',
            description: 'Metadata row label.',
            errorMessage: {
              type: 'NotificationEmail property "metadata.label" should be a string.',
            },
          },
          value: {
            type: 'string',
            description: 'Metadata row value.',
            errorMessage: {
              type: 'NotificationEmail property "metadata.value" should be a string.',
            },
          },
        },
        errorMessage: {
          type: 'NotificationEmail property "metadata" items should be objects with properties "label" and "value".',
        },
      },
      errorMessage: {
        type: 'NotificationEmail property "metadata" should be an array.',
      },
    },
    quote: {
      type: 'object',
      description: 'Quoted content rendered as a quote block.',
      additionalProperties: false,
      properties: {
        text: {
          type: 'string',
          description: 'Quoted text.',
          errorMessage: {
            type: 'NotificationEmail property "quote.text" should be a string.',
          },
        },
        author: {
          type: 'string',
          description: 'Quote attribution.',
          errorMessage: {
            type: 'NotificationEmail property "quote.author" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'NotificationEmail property "quote" should be an object with properties "text" and "author".',
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
            type: 'NotificationEmail property "button.label" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'NotificationEmail property "button" should be an object with property "label".',
      },
    },
  },
  errorMessage: {
    type: 'NotificationEmail properties should be an object.',
    required: {
      subject: 'NotificationEmail property "subject" is required.',
    },
  },
};
