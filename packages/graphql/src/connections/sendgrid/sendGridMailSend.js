import sendgrid from '@sendgrid/mail';
import Ajv from 'ajv';

const emailRegEx =
  '(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))';
const emailSchema = [
  {
    type: 'string',
    pattern: `^${emailRegEx}$`,
    examples: ['someone@example.org'],
    errorMessage: {
      pattern: 'Should be a valid email eg: someone@example.org',
    },
  },
  {
    type: 'string',
    pattern: `^(.+)<(${emailRegEx})>$`,
    examples: ['Name One <someone@example.org>'],
    errorMessage: {
      pattern: 'Should be a valid email eq: "Some One <someone@example.org>"',
    },
  },
  {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        examples: ['Some One'],
      },
      email: {
        pattern: `^${emailRegEx}$`,
        type: 'string',
        examples: ['someone@example.org'],
      },
    },
    errorMessage: {
      pattern:
        'Should be a valid email example: { name: "Some One", email: "someone@example.org" }',
    },
  },
];

const emailsSchema = {
  anyOf: [
    ...emailSchema,
    {
      type: 'array',
      items: {
        anyOf: emailSchema,
      },
    },
  ],
};

const oneRequestSchema = (templateId) => ({
  type: 'object',
  required: templateId ? ['to'] : ['to', 'subject'],
  properties: {
    to: {
      ...emailsSchema,
      description: 'Email address to send to.',
    },
    cc: {
      ...emailsSchema,
      description: 'Email address to cc in communication.',
    },
    bcc: {
      ...emailsSchema,
      description: 'Email address to bcc in communication.',
    },
    replyTo: {
      anyOf: emailSchema,
      description: 'Email address to reply to.',
    },
    subject: {
      type: 'string',
      description: 'Email subject.',
    },
    text: {
      type: 'string',
      description: 'Email message in plain text format.',
    },
    html: {
      type: 'string',
      description: 'Email message in html format.',
    },
    dynamicTemplateData: {
      type: 'object',
      description: 'SendGrid template data to render into email template.',
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
          },
          filename: {
            type: 'string',
            description: 'Name of the attachment file.',
          },
          type: {
            type: 'string',
            description: 'File type.',
          },
          disposition: { type: 'string' },
          contentId: { type: 'string' },
        },
      },
    },
    categories: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    sendAt: {
      type: 'integer',
    },
    templateId: {
      type: 'string',
      description: 'SendGrid email template ID to render email when sending.',
    },
  },
});

const requestSchema = (templateId) => ({
  anyOf: [
    oneRequestSchema(templateId),
    {
      type: 'array',
      items: oneRequestSchema(templateId),
    },
  ],
});

const connectionSchema = {
  type: 'object',
  required: ['apiKey', 'from'],
  properties: {
    from: {
      anyOf: emailSchema,
      description: 'Email address to send email from.',
    },
    apiKey: {
      type: 'string',
      description: 'SendGrid API key.',
    },
    templateId: {
      type: 'string',
      description: 'SendGrid email template ID to render email when sending.',
    },
    mailSettings: {
      type: 'object',
      properties: {
        sandboxMode: {
          type: 'object',
          properties: {
            enable: { type: 'boolean' },
          },
        },
      },
    },
  },
};

// https://sendgrid.api-docs.io/v3.0/how-to-use-the-sendgrid-v3-api/api-authentication
// https://github.com/sendgrid/sendgrid-nodejs/blob/master/docs/use-cases/README.md#email-use-cases

async function sendGridMailSend({ request, connection, context }) {
  const ajv = new Ajv({
    allErrors: true,
  });
  const validConnection = ajv.validate(connectionSchema, connection);
  if (!validConnection) {
    throw new context.ConfigurationError(
      `${ajv.errors.map(
        (err) => ` SendGridMail 'connection${err.dataPath.replace(/\//g, '.')}' - ${err.message}`
      )}`
    );
  }
  const { apiKey, from, templateId, mailSettings } = connection;
  const validRequest = ajv.validate(requestSchema(templateId), request);
  if (!validRequest) {
    throw new context.ConfigurationError(
      `${ajv.errors.map(
        (err) => ` SendGridMail 'request${err.dataPath.replace(/\//g, '.')}' - ${err.message}`
      )}`
    );
  }
  const {
    to,
    cc,
    bcc,
    replyTo,
    subject,
    text,
    html,
    dynamicTemplateData,
    attachments,
    categories,
    sendAt,
    batchId,
  } = request;

  sendgrid.setApiKey(apiKey);
  const msg = {
    to,
    cc,
    bcc,
    from,
    replyTo,
    subject,
    text,
    html,
    templateId,
    dynamicTemplateData,
    attachments,
    categories,
    sendAt,
    batchId,
    mailSettings,
  };
  try {
    await sendgrid.send(msg);
  } catch (err) {
    throw new context.RequestError(
      `${
        (err.response &&
          err.response.body.errors.map(
            (error) => `field: '${error.field}', message: '${error.message}'`
          )) ||
        JSON.stringify(err)
      }`
    );
  }
  return { response: 'Mail sent successfully' };
}

export default sendGridMailSend;
