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

// The block definition's properties, shared with the page definition. A page is a
// block plus the page-only keys below; JSON Schema additionalProperties: false
// cannot see through allOf, so both definitions are built from one object here.
const blockProperties = {
  '~r': {},
  '~l': {},
  id: {
    type: 'string',
    errorMessage: {
      type: 'Block "id" should be a string.',
    },
  },
  type: {
    type: 'string',
    errorMessage: {
      type: 'Block "type" should be a string.',
    },
  },
  field: {
    type: 'string',
    errorMessage: {
      type: 'Block "field" should be a string.',
    },
  },
  properties: {
    type: 'object',
  },
  props: {
    type: 'object',
    description:
      'Values for the props of the component named by "type", keyed by prop name. Only meaningful when the block type is a component declared under "components:"; the build inlines them wherever the body wrote { _prop: name }.',
    errorMessage: {
      type: 'Block "props" should be an object mapping component prop names to values.',
    },
  },
  layout: {
    type: 'object',
    errorMessage: {
      type: 'Block "layout" should be an object.',
    },
  },
  skeleton: {
    type: 'object',
    errorMessage: {
      type: 'Block "skeleton" should be an object.',
    },
  },
  style: {
    type: 'object',
    errorMessage: {
      type: 'Block "style" should be an object.',
    },
  },
  class: {
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
      {
        type: 'object',
        additionalProperties: {
          oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        },
      },
    ],
    errorMessage: {
      type: 'Block "class" should be a string, array of strings, or object.',
    },
  },
  // Any type: a boolean literal or an operator evaluated per render.
  visible: {
    description:
      'Whether the block renders. A boolean, or an operator that evaluates to one on every render. A hidden block keeps its state value; it is not unmounted from state.',
  },
  loading: {},
  blocks: {
    type: 'array',
    items: {
      $ref: '#/definitions/block',
    },
    errorMessage: {
      type: 'Block "blocks" should be an array.',
    },
  },
  requests: {
    type: 'array',
    items: {
      $ref: '#/definitions/request',
    },
    errorMessage: {
      type: 'Block "requests" should be an array.',
    },
  },
  required: {},
  validate: {
    type: 'array',
    items: {
      type: 'object',
      errorMessage: {
        type: 'Block "validate" should be an array of objects.',
      },
    },
    errorMessage: {
      type: 'Block "validate" should be an array.',
    },
  },
  events: {
    type: 'object',
    patternProperties: {
      '^.*$': {
        anyOf: [
          {
            type: 'array',
            items: {
              $ref: '#/definitions/actionOrControl',
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              '~r': {},
              '~l': {},
              try: {
                type: 'array',
                items: {
                  $ref: '#/definitions/actionOrControl',
                },
              },
              catch: {
                type: 'array',
                items: {
                  $ref: '#/definitions/actionOrControl',
                },
              },
              debounce: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  '~r': {},
                  '~l': {},
                  immediate: {
                    type: 'boolean',
                    errorMessage: {
                      type: 'Event "debounce.immediate" should be an boolean.',
                    },
                  },
                  ms: {
                    type: 'number',
                    errorMessage: {
                      type: 'Event "debounce.ms" should be a number.',
                    },
                  },
                },
              },
              shortcut: {
                anyOf: [
                  {
                    type: 'string',
                    errorMessage: {
                      type: 'Event "shortcut" should be a string.',
                    },
                  },
                  {
                    type: 'array',
                    items: { type: 'string' },
                    errorMessage: {
                      type: 'Event "shortcut" should be a string or array of strings.',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    errorMessage: {
      type: 'Block "events" should be an object.',
    },
  },
  slots: {
    type: 'object',
    patternProperties: {
      '^.*$': {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            items: {
              $ref: '#/definitions/block',
            },
            errorMessage: {
              type: 'Block "slots.{slotKey}.blocks" should be an array.',
            },
          },
        },
        errorMessage: {
          type: 'Block "slots.{slotKey}" should be an object.',
        },
      },
    },
    errorMessage: {
      type: 'Block "slots" should be an object.',
    },
  },
  areas: {
    type: 'object',
    patternProperties: {
      '^.*$': {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            items: {
              $ref: '#/definitions/block',
            },
            errorMessage: {
              type: 'Block "areas.{areaKey}.blocks" should be an array.',
            },
          },
        },
        errorMessage: {
          type: 'Block "areas.{areaKey}" should be an object.',
        },
      },
    },
    errorMessage: {
      type: 'Block "areas" should be an object.',
    },
  },
};

const pageProperties = {
  '~snapshotIgnore': {
    type: 'array',
    items: {
      type: 'string',
    },
    description:
      'State paths a journey snapshot leaves out, so a value that changes on every run (a timestamp, a generated id) does not make the snapshot differ. "$" matches any array index. Page only.',
    errorMessage: {
      type: 'Block "~snapshotIgnore" should be an array of state path strings.',
    },
  },
  subscriptions: {
    type: 'array',
    items: {
      $ref: '#/definitions/subscription',
    },
    errorMessage: {
      type: 'Page "subscriptions" should be an array.',
    },
  },
  state: {
    type: 'object',
    patternProperties: {
      '^.*$': {
        type: 'object',
        errorMessage: {
          type: 'Page "state" contract entries should be JSON schema objects, keyed by dotted state path.',
        },
      },
    },
    description:
      'The page state contract: a JSON Schema fragment per dotted state path. The build checks every _state reference on the page against it, so a mistyped path is a build error instead of an undefined at runtime. This is a build-time shape contract - "required" and "validate" on an input block are the separate, user-facing runtime validation. Page only.',
    errorMessage: {
      type: 'Page "state" should be an object mapping dotted state paths to JSON schema fragments.',
    },
  },
};

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'http://lowdefy.com/appSchema.json',
  type: 'object',
  title: 'Lowdefy App Schema',
  definitions: {
    action: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        async: {
          type: 'boolean',
          errorMessage: {
            type: 'Action "async" should be a boolean.',
          },
        },
        id: {
          type: 'string',
          errorMessage: {
            type: 'Action "id" should be a string.',
          },
        },
        messages: {},
        params: {},
        skip: {},
        type: {
          type: 'string',
          errorMessage: {
            type: 'Action "type" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'Action should be an object.',
        required: {
          id: 'Action should have required property "id".',
          type: 'Action should have required property "type".',
        },
      },
    },
    actionOrControl: {
      anyOf: [
        { $ref: '#/definitions/action' },
        { $ref: '#/definitions/controlIf' },
        { $ref: '#/definitions/controlSwitch' },
        { $ref: '#/definitions/controlReturn' },
      ],
    },
    controlIf: {
      type: 'object',
      additionalProperties: false,
      required: [':if', ':then'],
      properties: {
        '~r': {},
        '~l': {},
        ':if': {},
        ':then': {
          type: 'array',
          items: {
            $ref: '#/definitions/actionOrControl',
          },
          errorMessage: {
            type: 'Control ":then" should be an array of actions.',
          },
        },
        ':else': {
          type: 'array',
          items: {
            $ref: '#/definitions/actionOrControl',
          },
          errorMessage: {
            type: 'Control ":else" should be an array of actions.',
          },
        },
      },
      errorMessage: {
        type: 'Control ":if" should be an object.',
        required: {
          ':then': 'Control ":if" should have required property ":then".',
        },
      },
    },
    controlReturn: {
      type: 'object',
      additionalProperties: false,
      required: [':return'],
      properties: {
        '~r': {},
        '~l': {},
        ':return': {},
      },
      errorMessage: {
        type: 'Control ":return" should be an object.',
      },
    },
    controlSwitch: {
      type: 'object',
      additionalProperties: false,
      required: [':switch'],
      properties: {
        '~r': {},
        '~l': {},
        ':switch': {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: [':case', ':then'],
            properties: {
              '~r': {},
              '~l': {},
              ':case': {},
              ':then': {
                type: 'array',
                items: {
                  $ref: '#/definitions/actionOrControl',
                },
                errorMessage: {
                  type: 'Control ":then" should be an array of actions.',
                },
              },
            },
            errorMessage: {
              type: 'Control ":switch" cases should be objects.',
              required: {
                ':case': 'Control ":switch" case should have required property ":case".',
                ':then': 'Control ":switch" case should have required property ":then".',
              },
            },
          },
          errorMessage: {
            type: 'Control ":switch" should be an array of case objects.',
          },
        },
        ':default': {
          type: 'array',
          items: {
            $ref: '#/definitions/actionOrControl',
          },
          errorMessage: {
            type: 'Control ":default" should be an array of actions.',
          },
        },
      },
      errorMessage: {
        type: 'Control ":switch" should be an object.',
      },
    },
    agent: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'connectionId'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Agent "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Agent "type" should be a string.',
          },
        },
        connectionId: {
          type: 'string',
          errorMessage: {
            type: 'Agent "connectionId" should be a string.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Agent "properties" should be an object.',
          },
        },
        tools: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                required: ['endpointId'],
                properties: {
                  endpointId: { type: 'string' },
                  name: { type: 'string' },
                  confirm: {
                    const: true,
                  },
                },
                additionalProperties: false,
              },
            ],
          },
          errorMessage: {
            type: 'Agent "tools" should be an array.',
          },
        },
        mcp: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  connectionId: { type: 'string' },
                  url: { type: 'string' },
                  transport: {
                    type: 'string',
                    enum: ['http', 'sse', 'stdio'],
                    default: 'http',
                  },
                  headers: { type: 'object' },
                  command: { type: 'string' },
                  args: { type: 'array', items: { type: 'string' } },
                  env: { type: 'object' },
                  confirm: { const: true },
                },
                additionalProperties: false,
              },
            ],
          },
          errorMessage: {
            type: 'Agent "mcp" should be an array.',
          },
        },
        hooks: {
          type: 'object',
          properties: {
            onStart: { type: 'array', items: { type: 'string' } },
            onStepStart: { type: 'array', items: { type: 'string' } },
            onToolCallStart: { type: 'array', items: { type: 'string' } },
            onToolCallFinish: { type: 'array', items: { type: 'string' } },
            onStepFinish: { type: 'array', items: { type: 'string' } },
            onFinish: { type: 'array', items: { type: 'string' } },
          },
          errorMessage: {
            type: 'Agent "hooks" should be an object.',
          },
        },
        agents: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              {
                type: 'object',
                required: ['agentId'],
                properties: {
                  agentId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  inputSchema: { type: 'object' },
                },
                additionalProperties: false,
              },
            ],
          },
          errorMessage: {
            type: 'Agent "agents" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'Agent should be an object.',
        required: {
          id: 'Agent should have required property "id".',
          type: 'Agent should have required property "type".',
          connectionId: 'Agent should have required property "connectionId".',
        },
      },
    },
    app: {
      type: 'object',
      additionalProperties: false,
      properties: {
        '~r': {},
        '~l': {},
        email: {
          type: 'object',
          errorMessage: {
            type: 'App "app.email" should be an object.',
          },
          properties: {
            logo: {
              type: 'string',
              errorMessage: {
                type: 'App "app.email.logo" should be a string.',
              },
            },
            companyName: {
              type: 'string',
              errorMessage: {
                type: 'App "app.email.companyName" should be a string.',
              },
            },
            primaryColor: {
              type: 'string',
              errorMessage: {
                type: 'App "app.email.primaryColor" should be a string.',
              },
            },
            signature: {
              type: 'string',
              errorMessage: {
                type: 'App "app.email.signature" should be a string.',
              },
            },
            footer: {
              type: 'string',
              errorMessage: {
                type: 'App "app.email.footer" should be a string.',
              },
            },
          },
        },
        html: {
          type: 'object',
          errorMessage: {
            type: 'App "app.html" should be an object.',
          },
          properties: {
            appendBody: {
              type: 'string',
              errorMessage: {
                type: 'App "app.html.appendBody" should be a string.',
              },
            },
            appendHead: {
              type: 'string',
              errorMessage: {
                type: 'App "app.html.appendHead" should be a string.',
              },
            },
          },
        },
      },
    },
    authConfig: {
      type: 'object',
      additionalProperties: false,
      errorMessage: {
        type: 'App "auth" should be an object.',
        additionalProperties:
          'App "auth" contains an unknown property. Auth keys are registered explicitly; check for typos.',
      },
      properties: {
        '~r': {},
        '~l': {},
        database: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'type'],
          properties: {
            '~r': {},
            '~l': {},
            id: {
              type: 'string',
              errorMessage: {
                type: 'Auth "database.id" should be a string.',
              },
            },
            type: {
              type: 'string',
              errorMessage: {
                type: 'Auth "database.type" should be a string.',
              },
            },
            properties: {
              type: 'object',
              errorMessage: {
                type: 'Auth "database.properties" should be an object.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "database" should be an object.',
            required: {
              id: 'Auth "database" should have required property "id".',
              type: 'Auth "database" should have required property "type".',
            },
          },
        },
        secret: {
          type: 'object',
          errorMessage: {
            type: 'Auth "secret" should be a _secret operator reference.',
          },
        },
        emailAndPassword: {
          type: 'object',
          additionalProperties: false,
          required: ['enabled'],
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "emailAndPassword.enabled" should be a boolean.',
              },
            },
            requireEmailVerification: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "emailAndPassword.requireEmailVerification" should be a boolean.',
              },
            },
            minPasswordLength: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "emailAndPassword.minPasswordLength" should be an integer.',
              },
            },
            disableSignUp: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "emailAndPassword.disableSignUp" should be a boolean.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "emailAndPassword" should be an object.',
            required: {
              enabled: 'Auth "emailAndPassword" should have required property "enabled".',
            },
          },
        },
        magicLink: {
          type: 'object',
          additionalProperties: false,
          required: ['enabled'],
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "magicLink.enabled" should be a boolean.',
              },
            },
            expiresIn: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "magicLink.expiresIn" should be an integer (seconds).',
              },
            },
            disableSignUp: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "magicLink.disableSignUp" should be a boolean.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "magicLink" should be an object.',
            required: {
              enabled: 'Auth "magicLink" should have required property "enabled".',
            },
          },
        },
        // Auth email references an SMTP connection by id — the connection owns
        // "from", "replyTo", the transport, and the delivery filter. There is
        // no inline transport shape; the runtime reads only connectionId and
        // templates (createSendEmail / renderAuthEmail).
        email: {
          type: 'object',
          additionalProperties: false,
          required: ['connectionId'],
          properties: {
            '~r': {},
            '~l': {},
            connectionId: {
              type: 'string',
              errorMessage: {
                type: 'Auth "email.connectionId" should be a string — the id of an SMTP connection in "connections".',
              },
            },
            templates: {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                verifyEmail: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "email.templates.verifyEmail" should be a string — a notification id from "notifications".',
                  },
                },
                resetPassword: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "email.templates.resetPassword" should be a string — a notification id from "notifications".',
                  },
                },
                magicLink: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "email.templates.magicLink" should be a string — a notification id from "notifications".',
                  },
                },
                invitation: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "email.templates.invitation" should be a string — a notification id from "notifications".',
                  },
                },
              },
              errorMessage: {
                type: 'Auth "email.templates" should be an object mapping auth email flows (verifyEmail, resetPassword, magicLink, invitation) to notification ids.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "email" should be an object.',
            required: {
              connectionId:
                'Auth "email" should have required property "connectionId" — the id of an SMTP connection in "connections". The old inline "from"/"provider" transport shape moved onto the SMTP connection.',
            },
            additionalProperties:
              'Auth "email" should only have properties "connectionId" and "templates". The old inline "from"/"provider" transport shape moved onto the SMTP connection referenced by "connectionId".',
          },
        },
        providers: {
          type: 'array',
          errorMessage: {
            type: 'Auth "providers" should be an array.',
          },
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'type'],
            properties: {
              '~r': {},
              '~l': {},
              id: {
                type: 'string',
                errorMessage: {
                  type: 'Auth provider "id" should be a string.',
                },
              },
              type: {
                type: 'string',
                errorMessage: {
                  type: 'Auth provider "type" should be a string.',
                },
              },
              properties: {
                type: 'object',
                errorMessage: {
                  type: 'Auth provider "properties" should be an object.',
                },
              },
              twoFactorTrusted: {
                type: 'boolean',
                description:
                  'Skip the engine two-factor challenge for sign-ins through this provider, because the IdP is trusted to have enforced MFA itself. Declared, not verified - the engine cannot confirm what the IdP enforced and checks nothing. Unrelated to account.accountLinking.trustedProviders, which is about trusting the provider email claim.',
                errorMessage: {
                  type: 'Auth provider "twoFactorTrusted" should be a boolean.',
                },
              },
            },
            errorMessage: {
              type: 'Auth provider should be an object.',
              required: {
                id: 'Auth provider should have required property "id".',
                type: 'Auth provider should have required property "type".',
              },
            },
          },
        },
        roles: {
          type: 'array',
          errorMessage: {
            type: 'Auth "roles" should be an array.',
          },
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id'],
            properties: {
              '~r': {},
              '~l': {},
              id: {
                type: 'string',
                errorMessage: {
                  type: 'Auth "roles[].id" should be a string.',
                },
              },
              label: {
                type: 'string',
                errorMessage: {
                  type: 'Auth "roles[].label" should be a string.',
                },
              },
              description: {
                type: 'string',
                errorMessage: {
                  type: 'Auth "roles[].description" should be a string.',
                },
              },
            },
            errorMessage: {
              type: 'Auth role entry should be an object.',
              additionalProperties:
                'Auth role entry has an unknown property. Allowed: "id", "label", "description".',
              required: {
                id: 'Auth role entries should have required property "id".',
              },
            },
          },
        },
        session: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            expiresIn: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "session.expiresIn" should be an integer (seconds).',
              },
            },
            updateAge: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "session.updateAge" should be an integer (seconds).',
              },
            },
            cookieCache: {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                enabled: {
                  type: 'boolean',
                  errorMessage: {
                    type: 'Auth "session.cookieCache.enabled" should be a boolean.',
                  },
                },
                maxAge: {
                  type: 'integer',
                  errorMessage: {
                    type: 'Auth "session.cookieCache.maxAge" should be an integer (seconds).',
                  },
                },
              },
              errorMessage: {
                type: 'Auth "session.cookieCache" should be an object.',
              },
            },
            crossSubDomainCookies: {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                enabled: {
                  type: 'boolean',
                  errorMessage: {
                    type: 'Auth "session.crossSubDomainCookies.enabled" should be a boolean.',
                  },
                },
                domain: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "session.crossSubDomainCookies.domain" should be a string.',
                  },
                },
              },
              errorMessage: {
                type: 'Auth "session.crossSubDomainCookies" should be an object.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "session" should be an object.',
          },
        },
        account: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            accountLinking: {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                enabled: {
                  type: 'boolean',
                  errorMessage: {
                    type: 'Auth "account.accountLinking.enabled" should be a boolean.',
                  },
                },
                trustedProviders: {
                  type: 'array',
                  items: {
                    type: 'string',
                    errorMessage: {
                      type: 'Auth "account.accountLinking.trustedProviders" should be an array of provider ids.',
                    },
                  },
                  errorMessage: {
                    type: 'Auth "account.accountLinking.trustedProviders" should be an array of provider ids.',
                  },
                },
              },
              errorMessage: {
                type: 'Auth "account.accountLinking" should be an object.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "account" should be an object.',
          },
        },
        rateLimit: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "rateLimit.enabled" should be a boolean.',
              },
            },
            window: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "rateLimit.window" should be an integer (seconds).',
              },
            },
            max: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "rateLimit.max" should be an integer.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "rateLimit" should be an object.',
          },
        },
        twoFactor: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "twoFactor.enabled" should be a boolean.',
              },
            },
            required: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "twoFactor.required" should be a boolean.',
              },
            },
            trustDevice: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "twoFactor.trustDevice" should be a boolean.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "twoFactor" should be an object.',
          },
        },
        oauthProvider: {
          type: 'object',
          additionalProperties: false,
          required: ['consentPage'],
          properties: {
            '~r': {},
            '~l': {},
            consentPage: {
              type: 'string',
              description:
                'Lowdefy page id of the OAuth consent page the authorization flow redirects to.',
              errorMessage: {
                type: 'Auth "oauthProvider.consentPage" should be a string.',
              },
            },
            dynamicClientRegistration: {
              type: 'boolean',
              description:
                'Allow unregistered MCP clients to self-register (RFC 7591). Off by default; pre-registered clients are the primary path.',
              errorMessage: {
                type: 'Auth "oauthProvider.dynamicClientRegistration" should be a boolean.',
              },
            },
            postLoginPage: {
              type: 'string',
              description:
                'Lowdefy page id of the page where a signed-in user chooses the organization an MCP authorization acts in. Shown after login and before consent; required under the "tenant" organizations policy.',
              errorMessage: {
                type: 'Auth "oauthProvider.postLoginPage" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "oauthProvider" should be an object.',
            required: {
              consentPage: 'Auth "oauthProvider" should have required property "consentPage".',
            },
            additionalProperties:
              'Auth "oauthProvider" contains an unknown property. The known properties are "consentPage", "postLoginPage" and "dynamicClientRegistration".',
          },
        },
        passkey: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "passkey.enabled" should be a boolean.',
              },
            },
            rpId: {
              type: 'string',
              errorMessage: {
                type: 'Auth "passkey.rpId" should be a string.',
              },
            },
            rpName: {
              type: 'string',
              errorMessage: {
                type: 'Auth "passkey.rpName" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "passkey" should be an object.',
          },
        },
        phoneNumber: {
          type: 'object',
          additionalProperties: false,
          required: ['enabled'],
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "phoneNumber.enabled" should be a boolean.',
              },
            },
            otpLength: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "phoneNumber.otpLength" should be an integer.',
              },
            },
            expiresIn: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "phoneNumber.expiresIn" should be an integer (seconds).',
              },
            },
            allowedAttempts: {
              type: 'integer',
              errorMessage: {
                type: 'Auth "phoneNumber.allowedAttempts" should be an integer.',
              },
            },
            requireVerification: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "phoneNumber.requireVerification" should be a boolean.',
              },
            },
            signUpOnVerification: {
              type: 'object',
              additionalProperties: false,
              required: ['tempEmailDomain'],
              properties: {
                '~r': {},
                '~l': {},
                tempEmailDomain: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth "phoneNumber.signUpOnVerification.tempEmailDomain" should be a string.',
                  },
                },
              },
              errorMessage: {
                type: 'Auth "phoneNumber.signUpOnVerification" should be an object.',
                required: {
                  tempEmailDomain:
                    'Auth "phoneNumber.signUpOnVerification" should have required property "tempEmailDomain". Temp emails land in "user.email", so name a domain the app controls (or a reserved non-routable one) - there is no default.',
                },
              },
            },
          },
          errorMessage: {
            type: 'Auth "phoneNumber" should be an object.',
            additionalProperties:
              'Auth "phoneNumber" contains an unknown property. The known properties are "enabled", "otpLength", "expiresIn", "allowedAttempts", "requireVerification" and "signUpOnVerification".',
            required: {
              enabled: 'Auth "phoneNumber" should have required property "enabled".',
            },
          },
        },
        captcha: {
          type: 'object',
          additionalProperties: false,
          required: ['enabled', 'provider', 'siteKey', 'secretKey'],
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              errorMessage: {
                type: 'Auth "captcha.enabled" should be a boolean.',
              },
            },
            provider: {
              type: 'string',
              enum: ['cloudflare-turnstile'],
              errorMessage: {
                type: 'Auth "captcha.provider" should be a string.',
                enum: 'Auth "captcha.provider" should be "cloudflare-turnstile".',
              },
            },
            siteKey: {
              type: 'string',
              errorMessage: {
                type: 'Auth "captcha.siteKey" should be a plain string. The site key is public - every browser reads it from the page - and must not be a _secret operator reference, so the build can project it to Captcha blocks.',
              },
            },
            secretKey: {
              type: 'object',
              errorMessage: {
                type: 'Auth "captcha.secretKey" should be a _secret operator reference.',
              },
            },
            endpoints: {
              type: 'array',
              // An empty array would silently fall back to BetterAuth's
              // static default set inside the plugin - refuse the middle:
              // name the endpoints or omit the key for the computed set.
              minItems: 1,
              errorMessage: {
                type: 'Auth "captcha.endpoints" should be an array of strings.',
                minItems:
                  'Auth "captcha.endpoints" should have at least one endpoint. Omit the key to protect the computed default set, or set "enabled: false" to disable captcha.',
              },
              items: {
                type: 'string',
                errorMessage: {
                  type: 'Auth "captcha.endpoints.$" should be a string.',
                },
              },
            },
          },
          errorMessage: {
            type: 'Auth "captcha" should be an object.',
            additionalProperties:
              'Auth "captcha" contains an unknown property. The known properties are "enabled", "provider", "siteKey", "secretKey" and "endpoints".',
            required: {
              enabled: 'Auth "captcha" should have required property "enabled".',
              provider: 'Auth "captcha" should have required property "provider".',
              siteKey: 'Auth "captcha" should have required property "siteKey".',
              secretKey: 'Auth "captcha" should have required property "secretKey".',
            },
          },
        },
        pages: {
          type: 'object',
          additionalProperties: false,
          errorMessage: {
            type: 'App "config.auth.pages" should be an object.',
          },
          properties: {
            '~r': {},
            '~l': {},
            protected: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.pages.protected.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Page ids for which authentication is required. When specified, all unspecified pages will be public.',
                errorMessage: {
                  type: 'App "auth.pages.protected.$" should be an array of strings.',
                },
              },
            },
            public: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.pages.public.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Page ids for which authentication is not required. When specified, all unspecified pages will be protected.',
                errorMessage: {
                  type: 'App "auth.pages.public.$" should be an array of strings.',
                },
              },
            },
            roles: {
              type: 'object',
              description:
                'Role names mapped to the page id patterns (picomatch) they gate. Matched against the app role names on "_user.roles". A module contributes no role gates of its own: the app gates a whole module entry with one pattern per instance, matching the entry id prefix the build scopes its page ids with (user-admin: ["user-admin/**"]).',
              patternProperties: {
                '^.*$': {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  errorMessage: {
                    type: 'App "auth.pages.roles.[role]" should be an array of strings.',
                  },
                },
              },
              errorMessage: {
                type: 'App "auth.pages.roles" should be an object.',
              },
            },
          },
        },
        api: {
          type: 'object',
          additionalProperties: false,
          errorMessage: {
            type: 'App "config.auth.api" should be an object.',
          },
          properties: {
            '~r': {},
            '~l': {},
            protected: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.api.protected.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Api endpoint ids for which authentication is required. When specified, all unspecified api endpoints will be public.',
                errorMessage: {
                  type: 'App "auth.api.protected.$" should be an array of strings.',
                },
              },
            },
            public: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.api.public.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Api endpoint ids for which authentication is not required. When specified, all unspecified api endpoints will be protected.',
                errorMessage: {
                  type: 'App "auth.api.public.$" should be an array of strings.',
                },
              },
            },
            roles: {
              type: 'object',
              description:
                'Role names mapped to the api endpoint id patterns (picomatch) they gate. Matched against the app role names on "_user.roles". A module contributes no role gates of its own: the app gates a whole module entry with one pattern per instance, matching the entry id prefix the build scopes its endpoint ids with (user-admin: ["user-admin/**"]).',
              patternProperties: {
                '^.*$': {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  errorMessage: {
                    type: 'App "auth.api.roles.[role]" should be an array of strings.',
                  },
                },
              },
              errorMessage: {
                type: 'App "auth.api.roles" should be an object.',
              },
            },
          },
        },
        websockets: {
          type: 'object',
          additionalProperties: false,
          errorMessage: {
            type: 'App "config.auth.websockets" should be an object.',
          },
          properties: {
            '~r': {},
            '~l': {},
            protected: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.websockets.protected.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Websocket ids for which authentication is required. When specified, all unspecified websockets will be public.',
                errorMessage: {
                  type: 'App "auth.websockets.protected.$" should be an array of strings.',
                },
              },
            },
            public: {
              type: ['array', 'boolean'],
              errorMessage: {
                type: 'App "auth.websockets.public.$" should be an array of strings.',
              },
              items: {
                type: 'string',
                description:
                  'Websocket ids for which authentication is not required. When specified, all unspecified websockets will be protected.',
                errorMessage: {
                  type: 'App "auth.websockets.public.$" should be an array of strings.',
                },
              },
            },
            roles: {
              type: 'object',
              patternProperties: {
                '^.*$': {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  errorMessage: {
                    type: 'App "auth.websockets.roles.[role]" should be an array of strings.',
                  },
                },
              },
              errorMessage: {
                type: 'App "auth.websockets.roles" should be an object.',
              },
            },
          },
        },
        authPages: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            signIn: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.signIn" should be a string.',
              },
            },
            signUp: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.signUp" should be a string.',
              },
            },
            error: {
              type: 'string',
              description: 'Error code passed in query string as ?error=',
              errorMessage: {
                type: 'Auth "authPages.error" should be a string.',
              },
            },
            forgotPassword: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.forgotPassword" should be a string.',
              },
            },
            resetPassword: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.resetPassword" should be a string.',
              },
            },
            verifyEmail: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.verifyEmail" should be a string.',
              },
            },
            twoFactor: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.twoFactor" should be a string.',
              },
            },
            twoFactorEnrol: {
              type: 'string',
              description:
                'Protected page where an unenrolled user registers a second factor. Unlike every other authPages role, this one does NOT imply public - the user arriving here holds a valid session.',
              errorMessage: {
                type: 'Auth "authPages.twoFactorEnrol" should be a string.',
              },
            },
            acceptInvitation: {
              type: 'string',
              errorMessage: {
                type: 'Auth "authPages.acceptInvitation" should be a string.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "authPages" should be an object.',
          },
        },
        hooks: {
          type: 'array',
          errorMessage: {
            type: 'Auth "hooks" should be an array.',
          },
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'point', 'endpointId'],
            properties: {
              '~r': {},
              '~l': {},
              id: {
                type: 'string',
                errorMessage: {
                  type: 'Auth hook "id" should be a string.',
                },
              },
              point: {
                type: 'string',
                errorMessage: {
                  type: 'Auth hook "point" should be a string.',
                },
              },
              endpointId: {
                type: 'string',
                errorMessage: {
                  type: 'Auth hook "endpointId" should be a string.',
                },
              },
            },
            errorMessage: {
              type: 'Auth hook should be an object.',
              required: {
                id: 'Auth hook should have required property "id".',
                point: 'Auth hook should have required property "point".',
                endpointId: 'Auth hook should have required property "endpointId".',
              },
            },
          },
        },
        strategies: {
          type: 'array',
          errorMessage: {
            type: 'Auth "strategies" should be an array.',
          },
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'type'],
            properties: {
              '~r': {},
              '~l': {},
              id: {
                type: 'string',
                errorMessage: {
                  type: 'Auth strategy "id" should be a string.',
                },
              },
              type: {
                type: 'string',
                errorMessage: {
                  type: 'Auth strategy "type" should be a string.',
                },
              },
              properties: {
                type: 'object',
                errorMessage: {
                  type: 'Auth strategy "properties" should be an object.',
                },
              },
              roles: {
                type: 'array',
                items: {
                  type: 'string',
                  errorMessage: {
                    type: 'Auth strategy "roles" should be an array of role names.',
                  },
                },
                errorMessage: {
                  type: 'Auth strategy "roles" should be an array of role names.',
                },
              },
              attributes: {
                type: 'object',
                errorMessage: {
                  type: 'Auth strategy "attributes" should be an object.',
                },
              },
            },
            errorMessage: {
              type: 'Auth strategy should be an object.',
              required: {
                id: 'Auth strategy should have required property "id".',
                type: 'Auth strategy should have required property "type".',
              },
            },
          },
        },
        organizations: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            policy: {
              type: 'string',
              enum: ['pinned', 'tenant'],
              errorMessage: {
                type: 'Auth "organizations.policy" should be a string.',
                enum: 'Auth "organizations.policy" should be "pinned" or "tenant".',
              },
            },
            org: {
              type: 'string',
              description:
                'Organization slug the deployment pins as the active organization. Under the "pinned" policy the slug is the organization\'s id. Renaming it strands the existing membership: the startup ensure is by slug, so a rename mints a fresh organization rather than renaming one, and every member row still points at the old id.',
              errorMessage: {
                type: 'Auth "organizations.org" should be a string.',
              },
            },
            signup: {
              type: 'string',
              description:
                'Whether the deployment admits uninvited sign-ups. Valid under both policies: "invite-only" refuses sign-ups without an invitation; "open" admits everyone.',
              enum: ['invite-only', 'open'],
              errorMessage: {
                type: 'Auth "organizations.signup" should be a string.',
                enum: 'Auth "organizations.signup" should be "invite-only" or "open".',
              },
            },
            create: {
              type: 'string',
              enum: ['auto', 'operator'],
              errorMessage: {
                type: 'Auth "organizations.create" should be a string.',
                enum: 'Auth "organizations.create" should be "auto" or "operator".',
              },
            },
            invitationExpiresIn: {
              type: 'integer',
              minimum: 60,
              description:
                'How long an organization invitation stays acceptable, in seconds. Defaults to 48 hours (172800). Re-sending an invitation refreshes its expiry.',
              errorMessage: {
                type: 'Auth "organizations.invitationExpiresIn" should be an integer number of seconds.',
                minimum: 'Auth "organizations.invitationExpiresIn" should be at least 60 seconds.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "organizations" should be an object.',
            additionalProperties:
              'Auth "organizations" contains an unknown property. The known properties are "policy", "org", "signup", "create" and "invitationExpiresIn".',
          },
        },
        dev: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            browserUser: {
              type: 'string',
              minLength: 1,
              description:
                'The name of the "dev.users" entry the developer\'s own browser is signed in as, bypassing login for the whole dev server. Dev server only; the LOWDEFY_DEV_USER environment variable takes precedence.',
              errorMessage: {
                type: 'Auth "dev.browserUser" should be the name of a "dev.users" entry.',
                minLength: 'Auth "dev.browserUser" should be the name of a "dev.users" entry.',
              },
            },
            mockUser: {
              type: 'object',
              description:
                'Deprecated - declare the caller under "dev.users" and select it with "dev.browserUser". Mock user injected as a pre-resolved caller in the dev server. Roles are authoritative.',
            },
            users: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  '~r': {},
                  '~l': {},
                  id: {
                    type: 'string',
                    description:
                      'The caller id, the field BetterAuth resolves a session subject to. Not "sub".',
                    errorMessage: { type: 'Auth "dev.users" entry "id" should be a string.' },
                  },
                  name: {
                    type: 'string',
                    errorMessage: { type: 'Auth "dev.users" entry "name" should be a string.' },
                  },
                  email: {
                    type: 'string',
                    errorMessage: { type: 'Auth "dev.users" entry "email" should be a string.' },
                  },
                  roles: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                      "The caller's roles. Authoritative - page and endpoint authorization reads them directly.",
                    errorMessage: {
                      type: 'Auth "dev.users" entry "roles" should be an array of role name strings, eg. roles: [admin].',
                    },
                  },
                  organizationId: {
                    type: 'string',
                    description:
                      'The organization the caller belongs to, in Lowdefy config spelling.',
                    errorMessage: {
                      type: 'Auth "dev.users" entry "organizationId" should be a string.',
                    },
                  },
                  organization_id: {
                    type: 'string',
                    description:
                      'The organization the caller belongs to, in the tenant field spelling the app data uses.',
                    errorMessage: {
                      type: 'Auth "dev.users" entry "organization_id" should be a string.',
                    },
                  },
                  attributes: {
                    type: 'object',
                    errorMessage: {
                      type: 'Auth "dev.users" entry "attributes" should be an object.',
                    },
                  },
                  profile: {
                    type: 'object',
                    errorMessage: { type: 'Auth "dev.users" entry "profile" should be an object.' },
                  },
                },
                errorMessage: {
                  type: 'Auth "dev.users" entries should be objects.',
                  additionalProperties:
                    'Auth "dev.users" entry has an unknown property. The known properties are "id", "name", "email", "roles", "organizationId", "organization_id", "attributes" and "profile".',
                },
              },
              description:
                'Named user fixtures for dev tooling. Each key is a name that the dev server\'s headless tools accept as their "user" parameter. Dev server only.',
              errorMessage: {
                type: 'Auth "dev.users" should be an object.',
              },
            },
          },
          errorMessage: {
            type: 'Auth "dev" should be an object.',
          },
        },
      },
    },
    mcp: {
      type: 'object',
      additionalProperties: false,
      properties: {
        '~r': {},
        '~l': {},
        name: {
          type: 'string',
          errorMessage: {
            type: 'MCP "name" should be a string.',
          },
        },
        version: {
          type: 'string',
          errorMessage: {
            type: 'MCP "version" should be a string.',
          },
        },
        // Server branding advertised in the initialize result's serverInfo
        // (MCP Implementation: title, websiteUrl, icons). Clients that render
        // a connector card prefer these over guessing from the host's favicon.
        title: {
          type: 'string',
          errorMessage: {
            type: 'MCP "title" should be a string.',
          },
        },
        websiteUrl: {
          type: 'string',
          errorMessage: {
            type: 'MCP "websiteUrl" should be a string.',
          },
        },
        icons: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['src'],
            properties: {
              '~r': {},
              '~l': {},
              src: {
                type: 'string',
                errorMessage: {
                  type: 'MCP icon "src" should be a string.',
                },
              },
              mimeType: {
                type: 'string',
                errorMessage: {
                  type: 'MCP icon "mimeType" should be a string.',
                },
              },
              sizes: {
                type: 'array',
                items: { type: 'string' },
                errorMessage: {
                  type: 'MCP icon "sizes" should be an array of strings like "512x512".',
                },
              },
              theme: {
                type: 'string',
                enum: ['light', 'dark'],
                errorMessage: {
                  type: 'MCP icon "theme" should be a string.',
                  enum: 'MCP icon "theme" should be "light" or "dark".',
                },
              },
            },
            errorMessage: {
              type: 'MCP "icons" items should be objects with a "src" property.',
              required: {
                src: 'MCP icon should have required property "src".',
              },
              additionalProperties:
                'MCP icon contains an unknown property. The known properties are "src", "mimeType", "sizes" and "theme".',
            },
          },
          errorMessage: {
            type: 'MCP "icons" should be an array.',
          },
        },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'scope'],
            properties: {
              '~r': {},
              '~l': {},
              id: {
                type: 'string',
                errorMessage: {
                  type: 'MCP endpoint "id" should be a string.',
                },
              },
              scope: {
                type: 'string',
                // Closed vocabulary - apps cannot mint their own scopes.
                enum: ['mcp:read', 'mcp:write'],
                errorMessage: {
                  type: 'MCP endpoint "scope" should be a string.',
                  enum: 'MCP endpoint "scope" should be "mcp:read" or "mcp:write".',
                },
              },
            },
            errorMessage: {
              type: 'MCP "endpoints" items should be objects with "id" and "scope" properties.',
              required: {
                id: 'MCP endpoint should have required property "id".',
                scope:
                  'MCP endpoint should have required property "scope". Set "mcp:read" or "mcp:write".',
              },
              additionalProperties:
                'MCP endpoint contains an unknown property. The known properties are "id" and "scope".',
            },
          },
          errorMessage: {
            type: 'MCP "endpoints" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'App "mcp" should be an object.',
        additionalProperties:
          'App "mcp" contains an unknown property. The known properties are "name", "version", "title", "websiteUrl", "icons" and "endpoints".',
      },
    },
    block: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: blockProperties,
      errorMessage: {
        type: 'Block should be an object.',
        required: {
          id: 'Block should have required property "id".',
          type: 'Block should have required property "type".',
        },
      },
    },
    page: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: { ...blockProperties, ...pageProperties },
      errorMessage: {
        type: 'Page should be an object.',
        required: {
          id: 'Page should have required property "id".',
          type: 'Page should have required property "type".',
        },
      },
    },
    component: {
      type: 'object',
      additionalProperties: false,
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Component "id" should be a string.',
          },
        },
        props: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: {
                type: 'string',
                enum: ['string', 'number', 'integer', 'boolean', 'object', 'array', 'date', 'null'],
                errorMessage: {
                  type: 'Component prop "type" should be a string.',
                  enum: 'Component prop "type" should be one of "string", "number", "integer", "boolean", "object", "array", "date" or "null".',
                },
              },
              required: {
                type: 'boolean',
                errorMessage: { type: 'Component prop "required" should be a boolean.' },
              },
              default: {},
              description: {
                type: 'string',
                errorMessage: { type: 'Component prop "description" should be a string.' },
              },
              '~r': {},
              '~l': {},
            },
            errorMessage: {
              type: 'Component prop definition should be an object with "type", "required", "default" and "description".',
              additionalProperties:
                'Component prop definition has an unknown key. Valid keys: type, required, default, description.',
            },
          },
          description:
            'The props the component takes, keyed by prop name. Each value declares the prop: { type, required, default, description }. A use site passes values under "props:"; the build inlines each value wherever the body wrote { _prop: name }. There is no runtime _prop operator.',
          errorMessage: {
            type: 'Component "props" should be an object mapping prop names to prop definitions ({ type, required, default, description }).',
          },
        },
        slots: {
          type: 'array',
          items: { type: 'string' },
          description:
            'The named block-tree slots the component accepts. A use site fills a slot under "slots:"; the build places the filler wherever the body wrote { _slot: name }.',
          errorMessage: {
            type: 'Component "slots" should be an array of slot name strings.',
          },
        },
        blocks: {
          type: 'array',
          items: {
            $ref: '#/definitions/block',
          },
          description:
            'The component body: the block tree inserted at every use site, with every { _prop } and { _slot } marker resolved at build against that use.',
          errorMessage: {
            type: 'Component "blocks" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'Component should be an object.',
        required: {
          id: 'Component should have required property "id".',
        },
      },
    },
    endpoint: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Api endpoint "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Api endpoint "type" should be a string.',
          },
        },
        description: {
          type: 'string',
          errorMessage: {
            type: 'Api endpoint "description" should be a string.',
          },
        },
        payloadSchema: {
          type: 'object',
          description:
            'JSON Schema the request payload must satisfy. A payload that does not match is rejected before the routine runs. Cannot be combined with "webhook", which receives the raw { body, query, headers } envelope instead.',
          errorMessage: {
            type: 'Api endpoint "payloadSchema" should be an object.',
          },
        },
        responseSchema: {
          type: 'object',
          description:
            'JSON Schema describing what the endpoint returns. The build checks _actions and _step response paths against it and it is published as the MCP tool outputSchema; unlike payloadSchema it does not reject a response at runtime, it raises a dev notice.',
          errorMessage: {
            type: 'Api endpoint "responseSchema" should be an object.',
          },
        },
        routine: {
          anyOf: [
            {
              type: 'array',
              errorMessage: {
                type: 'Api endpoint "routine" should be an array or object.',
              },
            },
            {
              type: 'object',
              errorMessage: {
                type: 'Api endpoint "routine" should be an array or object.',
              },
            },
          ],
        },
        async: {
          type: 'boolean',
          description:
            'Run the endpoint routine in the background. The endpoint returns { accepted: true } immediately and the routine runs after the response (kept alive via the platform request context on Vercel fluid compute, still bounded by the function maxDuration); the outcome is observable only through logs and whatever the routine writes.',
          errorMessage: {
            type: 'Api endpoint "async" should be a boolean.',
          },
        },
        webhook: {
          anyOf: [
            { type: 'boolean' },
            {
              type: 'object',
              properties: {
                // The verify request plugin runs as a gate against the raw
                // request before the routine; on success the run earns trust
                // (context.system). Its concrete config surface (connectionId,
                // type, properties) is request-plugin scope, so it is not
                // constrained further here.
                verify: { type: 'object' },
              },
            },
          ],
          description:
            'Make this endpoint a third-party webhook receiver (SNS, Event Grid, Stripe, ...). It stays on the standard POST /api/endpoints/<endpointId> route but takes the request RAW: the routine receives { body, query, headers } as payload (no { payload } envelope) and its return value is sent back verbatim as the response body — webhook handshakes require exact response shapes. The transport is public, so the run starts untrusted; set webhook to { verify: <request plugin> } to earn trust (a system context) when the verifier passes the provider signature/secret check before the routine runs. A bare `true` runs untrusted throughout, so any nested protected CallApi fails closed.',
          errorMessage: {
            _: 'Api endpoint "webhook" should be a boolean or an object with a "verify" request plugin.',
          },
        },
        runAs: {
          type: 'object',
          additionalProperties: false,
          required: ['organizationId'],
          properties: {
            // Any type: a literal id or an operator (_step, _user, _secret, ...).
            // The build refuses _payload and _state sources (validateRunAs).
            organizationId: {},
          },
          description:
            'Run this endpoint scoped to an organization. The tenant wall filters and stamps as if a member of that organization made the call, so caller-less chains (schedules, detached calls, webhooks) stay walled instead of needing tenant: none.',
          errorMessage: {
            type: 'Api endpoint "runAs" should be an object with an "organizationId".',
            required: {
              organizationId: 'Api endpoint "runAs" should be an object with an "organizationId".',
            },
            additionalProperties: 'Api endpoint "runAs" only accepts "organizationId".',
          },
        },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['cron'],
            properties: {
              cron: {
                type: 'string',
                errorMessage: {
                  type: 'Api endpoint "schedules[].cron" should be a cron expression string.',
                },
              },
              payload: {
                type: 'object',
                errorMessage: {
                  type: 'Api endpoint "schedules[].payload" should be an object.',
                },
              },
            },
            errorMessage: {
              type: 'Api endpoint "schedules[]" should be an object.',
              required: {
                cron: 'Api endpoint schedule should have required property "cron".',
              },
            },
          },
          errorMessage: {
            type: 'Api endpoint "schedules" should be an array.',
          },
        },
      },
    },
    websocket: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Websocket "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Websocket "type" should be a string.',
          },
        },
        connectionId: {
          type: 'string',
          errorMessage: {
            type: 'Websocket "connectionId" should be a string.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Websocket "properties" should be an object.',
          },
        },
        tenant: {
          const: 'none',
          errorMessage: {
            const:
              'Websocket "tenant" only accepts "none" — the tenant wall is declared on the connection, and "none" is the explicit opt-out at the point of use. ("authored" is aggregation-only; change streams are always scoped mechanically.)',
          },
        },
      },
      errorMessage: {
        type: 'Websocket should be an object.',
        required: {
          id: 'Websocket should have required property "id".',
          type: 'Websocket should have required property "type".',
        },
      },
    },
    notification: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Notification "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Notification "type" should be a string.',
          },
        },
        theme: {
          type: 'object',
          errorMessage: {
            type: 'Notification "theme" should be an object.',
          },
        },
        testData: {
          type: 'object',
          errorMessage: {
            type: 'Notification "testData" should be an object.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Notification "properties" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'Notification should be an object.',
        required: {
          id: 'Notification should have required property "id".',
          type: 'Notification should have required property "type".',
        },
      },
    },
    subscription: {
      type: 'object',
      additionalProperties: false,
      required: ['websocketId'],
      properties: {
        '~r': {},
        '~l': {},
        websocketId: {
          type: 'string',
          errorMessage: {
            type: 'Subscription "websocketId" should be a string.',
          },
        },
        payload: {
          type: 'object',
          errorMessage: {
            type: 'Subscription "payload" should be an object.',
          },
        },
        events: {
          type: 'object',
          errorMessage: {
            type: 'Subscription "events" should be an object.',
          },
        },
        client: {
          type: 'object',
          additionalProperties: false,
          properties: {
            '~r': {},
            '~l': {},
            maxMessages: {
              type: 'integer',
              minimum: 1,
              errorMessage: {
                type: 'Subscription "client.maxMessages" should be a positive integer.',
              },
            },
            throttleRender: {
              type: 'number',
              errorMessage: {
                type: 'Subscription "client.throttleRender" should be a number.',
              },
            },
          },
          errorMessage: {
            type: 'Subscription "client" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'Subscription should be an object.',
        required: {
          websocketId: 'Subscription should have required property "websocketId".',
        },
      },
    },
    collectionField: {
      oneOf: [
        { type: 'string' },
        { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string' } },
        {
          type: 'object',
          additionalProperties: false,
          // An empty object is a field declared with no type, no enum and no
          // required flag - it counts as declared for relation targets and for
          // write validation while validating nothing.
          minProperties: 1,
          properties: {
            type: { type: 'string' },
            enum: { type: 'array', minItems: 1 },
            items: { $ref: '#/definitions/collectionField' },
            properties: {
              type: 'object',
              additionalProperties: { $ref: '#/definitions/collectionField' },
            },
            required: { type: 'boolean' },
            description: { type: 'string' },
            pii: {
              type: 'boolean',
              description:
                'Marks the field as personal data. Consumed by the journey recorder, log redaction and fixture export; declared once, read by every consumer.',
            },
            '~k': {},
            '~r': {},
            '~l': {},
          },
        },
      ],
      description:
        'The declared shape of one collection field: a type name ("string", "number", "integer", "boolean", "date", "object", "array"), a one-element [type] array for a list of that type, or an object with "type", "enum", "items", "properties", "description" and "pii". Prefer the collection-level "required" array to a per-field "required: true".',
      errorMessage: {
        oneOf:
          'Collection field should be a type name (string, number, integer, boolean, date, object, array), a one-element [type] array, or an object with "type", "enum", "items", "properties", "description" or "pii".',
      },
    },
    collection: {
      type: 'object',
      additionalProperties: false,
      properties: {
        '~k': {},
        '~r': {},
        '~l': {},
        tenant: {
          type: 'string',
          minLength: 1,
          pattern: '^[^.]+$',
          description:
            'How the collection is walled: "shared" for a collection every tenant reads, or the name of the top-level field that carries the tenant id, eg. organization_id.',
          errorMessage: {
            type: 'Collection "tenant" should be "shared" or a tenant field name, eg. organization_id.',
            minLength:
              'Collection "tenant" should be "shared" or a tenant field name, eg. organization_id.',
            pattern:
              'Collection "tenant" should be "shared" or a top-level tenant field name (no dots).',
          },
        },
        fields: {
          type: 'object',
          additionalProperties: { $ref: '#/definitions/collectionField' },
          description:
            'The fields the collection holds, keyed by field name. Declaring a field does not create it - see lowdefy migrate.',
          errorMessage: {
            type: 'Collection "fields" should be an object of field name to type.',
          },
        },
        relations: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            pattern: '^[^.]+\\.[^.]+.*$',
            errorMessage: {
              type: 'Collection relation should be a "<collection>.<field>" string.',
              pattern: 'Collection relation should be a "<collection>.<field>" string.',
            },
          },
          description:
            'Fields of this collection that reference another collection, keyed by field name, each naming its target as "<collection>.<field>".',
          errorMessage: {
            type: 'Collection "relations" should be an object of field name to "<collection>.<field>".',
          },
        },
        required: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          description:
            'The names of the fields a document must carry (the JSON Schema array form). A per-field "required: true" is accepted for one release and folded into this array with a build warning.',
          errorMessage: {
            type: 'Collection "required" should be an array of field names.',
          },
        },
        indexes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['keys'],
            properties: {
              keys: { type: 'object' },
              options: { type: 'object' },
              '~k': {},
              '~r': {},
              '~l': {},
            },
            errorMessage: {
              type: 'Collection index should be an object with "keys" and optional "options".',
              required: {
                keys: 'Collection index should have required property "keys".',
              },
              additionalProperties:
                'Collection index accepts only "keys" and "options". Declaring an index does not create it - see lowdefy migrate.',
            },
          },
          description:
            "The indexes the collection is expected to have, each { keys, options } in the driver's own shape. Declaring an index does not create it - see lowdefy migrate.",
          errorMessage: {
            type: 'Collection "indexes" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'Collection should be an object.',
        additionalProperties:
          'Collection has an unknown key. Valid keys: tenant, fields, required, relations, indexes.',
      },
    },
    connection: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Connection "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Connection "type" should be a string.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Connection "properties" should be an object.',
          },
        },
        tenant: {
          description:
            'How the connection is walled: "shared" for data every tenant reads, or the name of the top-level field that carries the tenant id, eg. organization_id — the same bare-string grammar collections use. The { field: <name> } object form is deprecated. Under auth.organizations.policy: tenant a scoping-capable connection is scoped by default and declares only its exception.',
          oneOf: [
            {
              type: 'string',
              minLength: 1,
              pattern: '^[^.]+$',
            },
            {
              type: 'object',
              additionalProperties: false,
              required: ['field'],
              properties: {
                field: {
                  type: 'string',
                  minLength: 1,
                  pattern: '^[^.]+$',
                },
              },
            },
          ],
          errorMessage: {
            oneOf:
              'Connection "tenant" should be "shared" or a top-level tenant field name (non-empty, no dots), eg. tenant: organization_id — under auth.organizations.policy: tenant a scoping-capable connection is scoped by default, and declares only its exception. The { field: <name> } object form is deprecated.',
          },
        },
      },
      errorMessage: {
        type: 'Connection should be an object.',
        required: {
          id: 'Connection should have required property "id".',
          type: 'Connection should have required property "type".',
        },
      },
    },
    menu: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Menu "id" should be a string.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Menu "properties" should be an object.',
          },
        },
        links: {
          type: 'array',
          items: {
            $ref: '#/definitions/menuItem',
          },
          errorMessage: {
            type: 'Menu "links" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'Menu should be an object.',
        required: {
          id: 'Menu should have required property "id".',
        },
      },
    },
    menuGroup: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'MenuGroup "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'MenuGroup "type" should be a string.',
          },
        },
        style: {
          errorMessage: {
            type: 'MenuGroup "style" should be an object, string, or array.',
          },
        },
        class: {
          errorMessage: {
            type: 'MenuGroup "class" should be a string, array, or object.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'MenuGroup "properties" should be an object.',
          },
        },
        links: {
          type: 'array',
          items: {
            $ref: '#/definitions/menuItem',
          },
          errorMessage: {
            type: 'MenuGroup "links" should be an array.',
          },
        },
      },
      errorMessage: {
        type: 'MenuGroup should be an object.',
        required: {
          id: 'MenuGroup should have required property "id".',
          type: 'MenuGroup should have required property "type".',
        },
      },
    },
    menuDivider: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'MenuDivider "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'MenuDivider "type" should be a string.',
          },
        },
        style: {
          errorMessage: {
            type: 'MenuDivider "style" should be an object, string, or array.',
          },
        },
        class: {
          errorMessage: {
            type: 'MenuDivider "class" should be a string, array, or object.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'MenuDivider "properties" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'MenuDivider should be an object.',
        required: {
          id: 'MenuDivider should have required property "id".',
          type: 'MenuDivider should have required property "type".',
        },
      },
    },
    menuItem: {
      anyOf: [
        {
          $ref: '#/definitions/menuDivider',
        },
        {
          $ref: '#/definitions/menuGroup',
        },
        {
          $ref: '#/definitions/menuLink',
        },
      ],
    },
    menuLink: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'MenuLink "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'MenuLink "type" should be a string.',
          },
        },
        pageId: {
          type: 'string',
          errorMessage: {
            type: 'MenuLink "pageId" should be a string.',
          },
        },
        url: {
          type: 'string',
          errorMessage: {
            type: 'MenuLink "url" should be a string.',
          },
        },
        urlQuery: {
          type: 'object',
          errorMessage: {
            type: 'MenuLink "urlQuery" should be an object.',
          },
        },
        input: {
          type: 'object',
          errorMessage: {
            type: 'MenuLink "input" should be an object.',
          },
        },
        style: {
          errorMessage: {
            type: 'MenuLink "style" should be an object, string, or array.',
          },
        },
        class: {
          errorMessage: {
            type: 'MenuLink "class" should be a string, array, or object.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'MenuLink "properties" should be an object.',
          },
        },
      },
      errorMessage: {
        type: 'MenuLink should be an object.',
        required: {
          id: 'MenuLink should have required property "id".',
          type: 'MenuLink should have required property "type".',
        },
      },
    },
    plugin: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'version'],
      properties: {
        '~r': {},
        '~l': {},
        name: {
          type: 'string',
          errorMessage: {
            type: 'Plugin "name" should be a string.',
          },
        },
        version: {
          type: 'string',
          errorMessage: {
            type: 'Plugin "version" should be a string.',
          },
        },
        typePrefix: {
          type: 'string',
          errorMessage: {
            type: 'Plugin "typePrefix" should be a string.',
          },
        },
      },
      errorMessage: {
        type: 'Plugin should be an object.',
        required: {
          name: 'Plugin should have required property "name".',
          version: 'Plugin should have required property "version".',
        },
      },
    },
    request: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'type', 'connectionId'],
      properties: {
        '~r': {},
        '~l': {},
        id: {
          type: 'string',
          errorMessage: {
            type: 'Request "id" should be a string.',
          },
        },
        type: {
          type: 'string',
          errorMessage: {
            type: 'Request "type" should be a string.',
          },
        },
        connectionId: {
          type: 'string',
          errorMessage: {
            type: 'Request "connectionId" should be a string.',
          },
        },
        payload: {
          type: 'object',
          errorMessage: {
            type: 'Request "payload" should be an object.',
          },
        },
        properties: {
          type: 'object',
          errorMessage: {
            type: 'Request "properties" should be an object.',
          },
        },
        tenant: {
          enum: ['none', 'authored'],
          errorMessage: {
            enum: 'Request "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection; "none" is the explicit request-level opt-out and "authored" declares the request authors its own tenant clause (audited at runtime).',
          },
        },
      },
      errorMessage: {
        type: 'Request should be an object.',
        required: {
          id: 'Request should have required property "id".',
          type: 'Request should have required property "type".',
          connectionId: 'Request should have required property "connectionId".',
        },
      },
    },
  },
  additionalProperties: false,
  required: ['lowdefy'],
  properties: {
    '~r': {},
    '~l': {},
    name: {
      type: 'string',
      errorMessage: {
        type: 'App "name" should be a string.',
      },
    },
    lowdefy: {
      type: 'string',
      errorMessage: {
        type: 'Lowdefy version in field "lowdefy" should be a string.',
      },
    },
    license: {
      type: 'string',
      errorMessage: {
        type: 'App "license" should be a string.',
      },
    },
    version: {
      type: 'string',
      errorMessage: {
        type: 'App "version" should be a string.',
      },
    },
    slug: {
      type: 'string',
      pattern: '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
      errorMessage: {
        type: 'App "slug" should be a string.',
        pattern:
          'App "slug" must be kebab-case: lowercase letters and digits, hyphen-separated, starting with a letter, no leading/trailing/consecutive hyphens, no underscores.',
      },
    },
    description: {
      type: 'string',
      errorMessage: {
        type: 'App "description" should be a string.',
      },
    },
    app: {
      $ref: '#/definitions/app',
    },
    auth: {
      $ref: '#/definitions/authConfig',
    },
    mcp: {
      $ref: '#/definitions/mcp',
    },
    cli: {
      type: 'object',
      errorMessage: {
        type: 'App "cli" should be an object.',
      },
    },
    config: {
      type: 'object',
      errorMessage: {
        type: 'App "config" should be an object.',
      },
      additionalProperties: false,
      properties: {
        '~r': {},
        '~l': {},
        experimental: {
          type: 'object',
          additionalProperties: false,
          description:
            'Opt in to config surfaces whose behaviour may still change within a minor release.',
          properties: {
            '~r': {},
            '~l': {},
            archetypes: {
              type: 'boolean',
              description:
                'Enable page archetypes such as ListPage while their expansion may still change within a minor release.',
              errorMessage: {
                type: 'App "config.experimental.archetypes" should be a boolean.',
              },
            },
            perPageImports: {
              type: 'boolean',
              description:
                'Code-split block, action and operator packages per page in production builds. Defaults to true; set to false to serve every type from the app-wide barrels.',
              errorMessage: {
                type: 'App "config.experimental.perPageImports" should be a boolean.',
              },
            },
          },
          errorMessage: {
            type: 'App "config.experimental" should be an object.',
            additionalProperties:
              'App "config.experimental" contains an unknown property. The known properties are "archetypes" and "perPageImports".',
          },
        },
        basePath: {
          type: 'string',
          description: 'App base path to apply to all routes. Base path must start with "/".',
          errorMessage: {
            type: 'App "config.basePath" should be a string.',
          },
        },
        vercel: {
          type: 'object',
          additionalProperties: false,
          description:
            'Vercel deployment function settings, applied by the CLI vercelOutput assembly.',
          errorMessage: {
            type: 'App "config.vercel" should be an object.',
          },
          properties: {
            maxDuration: {
              type: 'number',
              minimum: 1,
              description:
                'Maximum function execution time in seconds for the deployed serverless function. Defaults to 60. Plan limits apply (Vercel rejects over-limit values at deploy).',
              errorMessage: {
                type: 'App "config.vercel.maxDuration" should be a number.',
              },
            },
            memory: {
              type: 'number',
              description: 'Function memory in MB. Omit to use the Vercel default.',
              errorMessage: {
                type: 'App "config.vercel.memory" should be a number.',
              },
            },
          },
        },
        requestTimeout: {
          type: 'number',
          minimum: 0,
          description:
            'Maximum time in milliseconds a request may run before the server returns a timeout. Protects against hung upstream calls (database, SMTP, external APIs) running to the platform function limit — important on serverless hosts billed by duration. Defaults to 30000 (30s). Set to 0 to disable. Agent streaming routes are exempt.',
          errorMessage: {
            type: 'App "config.requestTimeout" should be a number.',
          },
        },
        migrations: {
          type: 'object',
          additionalProperties: false,
          description:
            'Settings for `lowdefy migrate` and the serving migration preflight. Migrations are discovered from the migrations/ directory and recorded in the per-stage ledger file .lowdefy/migrations/<stage>.json; this block only configures the run-on-deploy behaviour.',
          errorMessage: {
            type: 'App "config.migrations" should be an object.',
          },
          properties: {
            '~k': {},
            '~r': {},
            '~l': {},
            preflight: {
              type: 'boolean',
              description:
                'When true (the default), the server refuses to serve while the build index lists any migration the stage ledger does not record as applied, naming the pending migrations. Set to false to opt out (e.g. when the deploy pipeline manages ordering, or new code is deployed ahead of the migration).',
              errorMessage: {
                type: 'App "config.migrations.preflight" should be a boolean.',
              },
            },
          },
        },
        feedback: {
          type: 'object',
          additionalProperties: false,
          description:
            'In-app feedback reports from end users. When enabled, a signed-in user presses Cmd/Ctrl+/ and sends a short report; the server emits one "feedback_submitted" wide event carrying the text, the page, the url and the journey session_id of the tab, so the recorded journey that led to the report can be pulled with lowdefy_prod_trace({ session_id }). Off unless enabled.',
          errorMessage: {
            type: 'App "config.feedback" should be an object.',
            additionalProperties:
              'App "config.feedback" contains an unknown property. The known properties are "enabled" and "roles".',
          },
          properties: {
            '~k': {},
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              description:
                'Set to true to accept feedback reports at POST /api/feedback and offer the in-app affordance. Reports are always signed - an unauthenticated caller is refused.',
              errorMessage: {
                type: 'App "config.feedback.enabled" should be a boolean.',
              },
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Roles allowed to send feedback. A caller holding any one of them is accepted. Omitted or empty means every signed-in user may report.',
              errorMessage: {
                type: 'App "config.feedback.roles" should be an array of strings.',
              },
            },
          },
        },
        ops: {
          type: 'object',
          additionalProperties: false,
          description:
            'Production telemetry query tools in the dev MCP (lowdefy_prod_errors, lowdefy_prod_trace, lowdefy_prod_slow, lowdefy_prod_repro). They read the app log sink into an AI agent context and are already gated on read-only sink credentials and a loopback dev server; this is the app-level kill switch.',
          errorMessage: {
            type: 'App "config.ops" should be an object.',
            additionalProperties:
              'App "config.ops" contains an unknown property. The known properties are "enabled".',
          },
          properties: {
            '~k': {},
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              description:
                'Set to false to refuse the dev MCP ops query tools for this app, whatever credentials the developer has. Recommended for apps whose connections are tenant-walled.',
              errorMessage: {
                type: 'App "config.ops.enabled" should be a boolean.',
              },
            },
          },
        },
        homePageId: {
          type: 'string',
          description:
            'Page id to use as homepage. When visiting home route "/", the router will redirect to this page. If not provided, the first page in default or first menu will be used as the homePageId.',
          errorMessage: {
            type: 'App "config.homePageId" should be a string.',
          },
        },
        i18n: {
          type: 'object',
          additionalProperties: false,
          required: ['defaultLocale', 'locales'],
          properties: {
            '~k': {},
            '~r': {},
            '~l': {},
            defaultLocale: {
              type: 'string',
              description:
                'BCP 47 locale code used when no user preference or browser match is available.',
            },
            locales: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['code'],
                properties: {
                  '~k': {},
                  '~r': {},
                  '~l': {},
                  code: {
                    type: 'string',
                    description: 'BCP 47 locale code (e.g. "en-US", "de-DE").',
                  },
                  label: {
                    type: 'string',
                    description: 'Human-readable label for language pickers.',
                  },
                  antd: {
                    type: 'string',
                    description:
                      'Ant Design locale module name (e.g. "en_US"). Loaded from antd/locale/{name}.',
                  },
                  dayjs: {
                    type: 'string',
                    description: 'Dayjs locale id (e.g. "en", "zh-cn").',
                  },
                },
              },
            },
            messages: {
              type: 'object',
              description:
                'Translation messages keyed by locale code. Each locale maps to an object of { key: ICU MessageFormat string }.',
              additionalProperties: {
                type: 'object',
              },
            },
          },
          errorMessage: {
            type: 'App "config.i18n" should be an object.',
            required: {
              defaultLocale: 'App "config.i18n" requires "defaultLocale".',
              locales: 'App "config.i18n" requires a "locales" array.',
            },
          },
        },
      },
    },
    theme: {
      type: 'object',
      additionalProperties: false,
      properties: {
        antd: {
          type: 'object',
          description:
            'Ant Design theme configuration (token, components, algorithm, lightToken, darkToken, lightComponents, darkComponents). Merged after "mode", "density" and "radius", so an explicit token always wins.',
          errorMessage: {
            type: 'App "theme.antd" should be an object.',
          },
        },
        tailwind: {
          type: 'object',
          errorMessage: {
            type: 'App "theme.tailwind" should be an object.',
          },
        },
        mode: {
          type: 'string',
          enum: ['system', 'light', 'dark'],
          description:
            'Color mode. "system" follows the OS prefers-color-scheme and updates live (default), "light" forces light mode, "dark" applies the antd dark algorithm.',
          errorMessage: {
            type: 'App "theme.mode" should be a string.',
            enum: 'App "theme.mode" should be one of "system", "light" or "dark".',
          },
        },
        density: {
          type: 'string',
          enum: ['default', 'compact'],
          description:
            'UI density. "compact" applies the antd compact algorithm, which reduces control heights, paddings and font sizes. Composes with dark mode.',
          errorMessage: {
            type: 'App "theme.density" should be a string.',
            enum: 'App "theme.density" should be one of "default" or "compact".',
          },
        },
        radius: {
          type: 'number',
          minimum: 0,
          description:
            'Base corner radius in pixels, applied as the antd "borderRadius" token. All derived radius tokens follow from it.',
          errorMessage: {
            type: 'App "theme.radius" should be a number.',
            minimum: 'App "theme.radius" should be greater than or equal to 0.',
          },
        },
        darkMode: {
          type: 'string',
          enum: ['system', 'light', 'dark'],
          description:
            'Deprecated alias for "theme.mode". Dark mode behavior. "system" follows OS preference (default), "light" forces light mode, "dark" forces dark mode.',
          errorMessage: {
            type: 'App "theme.darkMode" should be a string.',
            enum: 'App "theme.darkMode" should be one of "system", "light" or "dark".',
          },
        },
      },
      errorMessage: {
        type: 'App "theme" should be an object.',
        additionalProperties:
          'App "theme" contains an unknown property. The known properties are "mode", "density", "radius", "antd", "tailwind" and "darkMode".',
      },
    },
    plugins: {
      type: 'array',
      items: {
        $ref: '#/definitions/plugin',
      },
      errorMessage: {
        type: 'App "plugins" should be an array.',
      },
    },
    global: {
      type: 'object',
      errorMessage: {
        type: 'App "global" should be an object.',
      },
    },
    agents: {
      type: 'array',
      items: {
        $ref: '#/definitions/agent',
      },
      errorMessage: {
        type: 'App "agents" should be an array.',
      },
    },
    connections: {
      type: 'array',
      items: {
        $ref: '#/definitions/connection',
      },
      errorMessage: {
        type: 'App "connections" should be an array.',
      },
    },
    collections: {
      type: 'object',
      description:
        "Optional declaration of the collections the app's connections address - tenancy, fields, relations and indexes - keyed by collection name. Written to build/collections.json.",
      additionalProperties: {
        $ref: '#/definitions/collection',
      },
      errorMessage: {
        type: 'App "collections" should be an object of collection name to declaration.',
      },
    },
    api: {
      type: 'array',
      items: {
        $ref: '#/definitions/endpoint',
      },
      errorMessage: {
        type: 'App "api" should be an array.',
      },
    },
    websockets: {
      type: 'array',
      items: {
        $ref: '#/definitions/websocket',
      },
      errorMessage: {
        type: 'App "websockets" should be an array.',
      },
    },
    notifications: {
      type: 'array',
      items: {
        $ref: '#/definitions/notification',
      },
      errorMessage: {
        type: 'App "notifications" should be an array.',
      },
    },
    menus: {
      type: 'array',
      items: {
        $ref: '#/definitions/menu',
      },
      errorMessage: {
        type: 'App "menus" should be an array.',
      },
    },
    pages: {
      type: 'array',
      items: {
        $ref: '#/definitions/page',
      },
      errorMessage: {
        type: 'App "pages" should be an array.',
      },
    },
    components: {
      description:
        'Reusable block trees declared once and used as block types. A map keyed by component id (the array form with an "id" per entry still builds, but warns).',
      anyOf: [
        {
          type: 'object',
          additionalProperties: {
            $ref: '#/definitions/component',
          },
        },
        {
          type: 'array',
          items: {
            $ref: '#/definitions/component',
          },
        },
      ],
      errorMessage: {
        anyOf: 'App "components" should be a map of component definitions keyed by id.',
      },
    },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'source'],
        properties: {
          '~r': {},
          '~l': {},
          id: {
            type: 'string',
            errorMessage: {
              type: 'Module "id" should be a string.',
            },
          },
          source: {
            type: 'string',
            errorMessage: {
              type: 'Module "source" should be a string.',
            },
          },
          vars: {
            type: 'object',
            errorMessage: {
              type: 'Module "vars" should be an object.',
            },
          },
          connections: {
            type: 'object',
            errorMessage: {
              type: 'Module "connections" should be an object.',
            },
          },
          dependencies: {
            type: 'object',
            additionalProperties: { type: 'string' },
            errorMessage: {
              type: 'Module "dependencies" should be an object with string values.',
            },
          },
        },
        additionalProperties: false,
        errorMessage: {
          type: 'Module should be an object.',
          required: {
            id: 'Module should have required property "id".',
            source: 'Module should have required property "source".',
          },
        },
      },
      errorMessage: {
        type: 'App "modules" should be an array.',
      },
    },
    logger: {
      type: 'object',
      additionalProperties: false,
      errorMessage: {
        type: 'App "logger" should be an object.',
      },
      properties: {
        '~r': {},
        '~l': {},
        events: {
          anyOf: [
            {
              type: 'string',
              enum: ['errors', 'all'],
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                level: {
                  type: 'string',
                  enum: ['errors', 'all'],
                },
                sample_rate: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                },
                identity: {
                  type: 'boolean',
                },
              },
            },
          ],
          errorMessage:
            'App "logger.events" should be "errors", "all", or an object with "level" ("errors" or "all"), "sample_rate" (a number between 0 and 1) and "identity" (a boolean).',
        },
        journeys: {
          type: 'object',
          additionalProperties: false,
          description:
            'The recorded journey corpus. The client records one trace event per completed block event and beacons it to /api/journey, which emits it as a "journey_event" wide event.',
          properties: {
            '~r': {},
            '~l': {},
            enabled: {
              type: 'boolean',
              description: 'Record user journeys. Default true.',
              errorMessage: {
                type: 'App "logger.journeys.enabled" should be a boolean.',
              },
            },
            sample_rate: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description:
                'Share of sessions recorded, 0 to 1, decided once per session so a recorded session is complete. Default 0.05; the dev server records every session.',
              errorMessage: {
                type: 'App "logger.journeys.sample_rate" should be a number between 0 and 1.',
                minimum: 'App "logger.journeys.sample_rate" should be a number between 0 and 1.',
                maximum: 'App "logger.journeys.sample_rate" should be a number between 0 and 1.',
              },
            },
          },
          errorMessage: {
            type: 'App "logger.journeys" should be an object.',
            additionalProperties:
              'App "logger.journeys" has an unknown key. Valid keys: enabled, sample_rate.',
          },
        },
        monitors: {
          type: 'object',
          additionalProperties: false,
          description:
            'App-wide defaults for the monitor definitions the build writes to build/monitors.json. There is no per-monitor surface.',
          properties: {
            '~r': {},
            '~l': {},
            defaults: {
              type: 'object',
              additionalProperties: false,
              properties: {
                '~r': {},
                '~l': {},
                error_rate: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description:
                    'Error-rate threshold (0 to 1) for endpoint, request and connection rules. Default 0.05.',
                },
                p95_ms: {
                  type: 'number',
                  exclusiveMinimum: 0,
                  description:
                    'p95 duration threshold in milliseconds for page request rules. Default 2000.',
                },
              },
              errorMessage: {
                type: 'App "logger.monitors.defaults" should be an object.',
                additionalProperties:
                  'App "logger.monitors.defaults" has an unknown key. Valid keys: error_rate, p95_ms.',
              },
            },
          },
          errorMessage: {
            type: 'App "logger.monitors" should be an object.',
            additionalProperties: 'App "logger.monitors" has an unknown key. Valid keys: defaults.',
          },
        },
        otlp: {
          type: 'object',
          additionalProperties: false,
          required: ['endpoint'],
          errorMessage: {
            type: 'App "logger.otlp" should be an object.',
            required: {
              endpoint: 'App "logger.otlp" should have required property "endpoint".',
            },
          },
          properties: {
            '~r': {},
            '~l': {},
            endpoint: {
              type: 'string',
              format: 'uri',
              description:
                'The OTLP/HTTP logs endpoint log lines are POSTed to as OTLP JSON, for example "https://api.axiom.co/v1/traces".',
              errorMessage: {
                type: 'App "logger.otlp.endpoint" should be a string.',
                format: 'App "logger.otlp.endpoint" should be a valid URL.',
              },
            },
            headers: {
              type: 'object',
              description:
                'Headers sent with every export request, typically an authorization header. A value may be a "_secret" operator, which is resolved on the server when the logger is created.',
              additionalProperties: {
                anyOf: [{ type: 'string' }, { type: 'object' }],
              },
              errorMessage: {
                type: 'App "logger.otlp.headers" should be an object.',
                additionalProperties:
                  'App "logger.otlp.headers" values should be strings or a "_secret" operator.',
              },
            },
            resource: {
              type: 'object',
              description:
                'Additional OpenTelemetry resource attributes sent with every batch, beside the app name, version and git sha.',
              additionalProperties: {
                type: 'string',
              },
              errorMessage: {
                type: 'App "logger.otlp.resource" should be an object.',
                additionalProperties: 'App "logger.otlp.resource" values should be strings.',
              },
            },
            batch: {
              type: 'object',
              additionalProperties: false,
              description: 'Batching settings for the OTLP exporter.',
              errorMessage: {
                type: 'App "logger.otlp.batch" should be an object.',
              },
              properties: {
                '~r': {},
                '~l': {},
                size: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Number of buffered log lines that triggers an export. Default 50.',
                  errorMessage: {
                    type: 'App "logger.otlp.batch.size" should be an integer greater than 0.',
                    minimum: 'App "logger.otlp.batch.size" should be an integer greater than 0.',
                  },
                },
                flush_ms: {
                  type: 'integer',
                  minimum: 1,
                  description:
                    'Milliseconds a buffered log line waits before it is exported. Default 2000.',
                  errorMessage: {
                    type: 'App "logger.otlp.batch.flush_ms" should be an integer greater than 0.',
                    minimum:
                      'App "logger.otlp.batch.flush_ms" should be an integer greater than 0.',
                  },
                },
              },
            },
          },
        },
        sentry: {
          type: 'object',
          additionalProperties: false,
          errorMessage: {
            type: 'App "logger.sentry" should be an object.',
          },
          properties: {
            '~r': {},
            '~l': {},
            client: {
              type: 'boolean',
              errorMessage: {
                type: 'App "logger.sentry.client" should be a boolean.',
              },
            },
            server: {
              type: 'boolean',
              errorMessage: {
                type: 'App "logger.sentry.server" should be a boolean.',
              },
            },
            tracesSampleRate: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              errorMessage: {
                type: 'App "logger.sentry.tracesSampleRate" should be a number between 0 and 1.',
              },
            },
            replaysSessionSampleRate: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              errorMessage: {
                type: 'App "logger.sentry.replaysSessionSampleRate" should be a number between 0 and 1.',
              },
            },
            replaysOnErrorSampleRate: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              errorMessage: {
                type: 'App "logger.sentry.replaysOnErrorSampleRate" should be a number between 0 and 1.',
              },
            },
            feedback: {
              type: 'boolean',
              errorMessage: {
                type: 'App "logger.sentry.feedback" should be a boolean.',
              },
            },
            environment: {
              type: 'string',
              errorMessage: {
                type: 'App "logger.sentry.environment" should be a string.',
              },
            },
            userFields: {
              type: 'array',
              items: {
                type: 'string',
              },
              errorMessage: {
                type: 'App "logger.sentry.userFields" should be an array of strings.',
              },
            },
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'Lowdefy configuration should be an object.',
    required: {
      lowdefy: 'Lowdefy configuration should have required property "lowdefy".',
    },
  },
};
