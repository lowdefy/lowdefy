<TITLE>
SendGridMailSend
</TITLE>

<DESCRIPTION>

### Properties

#### object

A `mail description`:
- `to: email | email[]`: __Required__ - Email address or addresses to send to.
- `cc: email | email[]`: Email address to cc in communication.
- `bcc: email | email[]`: Email address to bcc in communication.
- `replyTo: email | email[]`: Email address to reply to.
- `subject: string`: Email subject.
- `text: string`: Email message in plain text format.
- `html: string`: Email message in html format.
- `dynamicTemplateData: object`: SendGrid template data to render into email template.
- `sendAt: integer`: A unix timestamp allowing you to specify when you want your email to be delivered. You can't schedule more than 72 hours in advance.
- `attachments: object[]`: List of email attachments to include with email. See [SendGrid API-Reference](https://d2w67tjf43xwdp.cloudfront.net/Classroom/Build/Add_Content/attachments.html]).
  - `content: string`: __Required__ - Base 64 encoded attachment content.
  - `filename: string`: __Required__ - Name of the attachment file.
  - `type: string`: The mime type of the content you are attaching. For example, `text/plain` or `text/html`.

#### array

An array of `mail description` objects can also be provided.

</DESCRIPTION>

<CONNECTION>
SendGridMail
</CONNECTION>

<SCHEMA>

```js
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
```

</SCHEMA>

<EXAMPLES>

### Send a reminder email

```yaml
id: send_reminder
type: SendGridMailSend
connectionId: my_sendgrid
properties:
  to: Harry Potter <harry@example.org>
  subject: Reminder for Mr. Potter to water the 🌱
  text: |
    Hi Harry

    Please remember to water the magic plants today :)

    Thank you
```

</EXAMPLES>
