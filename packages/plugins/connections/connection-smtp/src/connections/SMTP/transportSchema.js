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

// Common nodemailer transport property definitions, shared as a schema seam
// so other packages can document SMTP transport options without redefining them.
// Pure passthrough documentation - nodemailer validates transport options itself.
export default {
  host: {
    type: 'string',
    description: 'Hostname or IP address of the SMTP server to connect to.',
    errorMessage: {
      type: 'SMTP connection property "host" should be a string.',
    },
  },
  port: {
    type: 'integer',
    description:
      'Port to connect to. Defaults to 587 if secure is false, or 465 if secure is true.',
    errorMessage: {
      type: 'SMTP connection property "port" should be an integer.',
    },
  },
  secure: {
    type: 'boolean',
    description: 'If true, the connection will use TLS when connecting to the server.',
    errorMessage: {
      type: 'SMTP connection property "secure" should be a boolean.',
    },
  },
  auth: {
    type: 'object',
    description: 'Authentication credentials for the SMTP server.',
    properties: {
      user: {
        type: 'string',
        description: 'Username to authenticate with.',
        errorMessage: {
          type: 'SMTP connection property "auth.user" should be a string.',
        },
      },
      pass: {
        type: 'string',
        description: 'Password to authenticate with.',
        errorMessage: {
          type: 'SMTP connection property "auth.pass" should be a string.',
        },
      },
    },
    errorMessage: {
      type: 'SMTP connection property "auth" should be an object.',
    },
  },
};
