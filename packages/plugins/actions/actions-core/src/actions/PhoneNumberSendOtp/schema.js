export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the phone-number send-OTP method.',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: {
        type: 'string',
        description: 'Phone number to send the OTP to, in E.164 format (e.g. "+27831234567").',
      },
    },
  },
};
