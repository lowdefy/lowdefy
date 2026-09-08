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
  title: 'Lowdefy Notification Schema - AlertEmail',
  type: 'object',
  additionalProperties: false,
  required: ['subject'],
  properties: {
    subject: {
      type: 'string',
      description: 'Email subject line.',
      errorMessage: {
        type: 'AlertEmail property "subject" should be a string.',
      },
    },
    tone: {
      type: 'string',
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
      description: 'Alert tone, sets the accent color of the banner.',
      errorMessage: {
        type: 'AlertEmail property "tone" should be a string.',
        enum: 'AlertEmail property "tone" should be one of "info", "success", "warning" or "error".',
      },
    },
    title: {
      type: 'string',
      description: 'Heading shown at the top of the email content.',
      errorMessage: {
        type: 'AlertEmail property "title" should be a string.',
      },
    },
    message: {
      type: 'string',
      description: 'Main email message, rendered as markdown.',
      errorMessage: {
        type: 'AlertEmail property "message" should be a string.',
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
              type: 'AlertEmail property "metadata.label" should be a string.',
            },
          },
          value: {
            type: 'string',
            description: 'Metadata row value.',
            errorMessage: {
              type: 'AlertEmail property "metadata.value" should be a string.',
            },
          },
        },
        errorMessage: {
          type: 'AlertEmail property "metadata" items should be objects with properties "label" and "value".',
        },
      },
      errorMessage: {
        type: 'AlertEmail property "metadata" should be an array.',
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
            type: 'AlertEmail property "button.label" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'AlertEmail property "button" should be an object with property "label".',
      },
    },
  },
  errorMessage: {
    type: 'AlertEmail properties should be an object.',
    required: {
      subject: 'AlertEmail property "subject" is required.',
    },
  },
};
