<TITLE>
SendGridMail
</TITLE>

<DESCRIPTION>

[SendGrid](https://sendgrid.com/) is a popular email API provider which allows you to easily setup a email service. The `SendGridMail` connection can be used to connect to an existing SendGrid API account.

The `SendGridMail` connector uses the [@sendgrid/mail](https://github.com/@sendgrid/mail) library.

In order to use the `SendGridMail` connector, you first need to create a [SendGrid](https://sendgrid.com/) account and setup an API key.

> Secrets like API keys should be stored using the [`_secret`](operators/secret.md) operator.

In order to send from your custom domain your will need to [authenticate your domain](https://app.sendgrid.com/settings/sender_auth) through SendGrid. See the [SendGrid Docs](https://sendgrid.com/docs) for help on getting started with SendGrid.

### Types

- `email: string | object`:  SendGrid accepts emails as either a `string` or an `object`.
  - `string`: Can be in the following format; `someone@example.org` or `Some One <someone@example.org>`.
  - `object`: With `name' and `email` properties, for example: `{"name": "Some One", "email": "someone@example.org"}`.

### Properties

- `apiKey: string`: __Required__ - SendGrid API key.
- `from: email`: __Required__ - Email address to send email from.
- `mailSettings: object`: SendGrid mail settings. See [SendGrid API-Reference](https://sendgrid.com/docs/api-reference/)
  - `sandboxMode: object`: SendGrid mail sandbox mode settings.
    - `enable: boolean`: Sandbox mode enabled when `true`.
- `templateId: string`: SendGrid email template ID to render email when sending.

</DESCRIPTION>

<REQUESTS>

- SendGridMailSend

</REQUESTS>

<SCHEMA>

```js
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
    templateId: {
      type: 'string',
      description: 'SendGrid email template ID to render email when sending.',
      errorMessage: {
        type: 'SendGridMail connection property "templateId" should be a string.',
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
```

</SCHEMA>

<EXAMPLES>

### Send a reminder email

```yaml
connections:
  - id: my_sendgrid
    type: SendGridMail
    properties:
      apiKey:
        _secret: SENDGRID_API_KEY
      from: reminders@example.org
```

</EXAMPLES>
