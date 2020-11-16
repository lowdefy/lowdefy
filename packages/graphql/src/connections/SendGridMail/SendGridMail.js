import schema from './SendGridMailSchema.json';
import SendGridMailSend from './SendGridMailSend/SendGridMailSend';

export default {
  schema,
  requests: {
    SendGridMailSend,
  },
};
