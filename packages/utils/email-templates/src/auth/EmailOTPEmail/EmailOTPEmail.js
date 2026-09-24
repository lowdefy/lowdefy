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

import React from 'react';
import { Heading, Text } from '@react-email/components';

import EmailLayout from '../../components/EmailLayout.js';
import OtpCode from '../../components/OtpCode.js';

const headingStyle = {
  color: '#111111',
  fontSize: '20px',
  lineHeight: '28px',
  margin: '0 0 16px 0',
};

const textStyle = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
};

function EmailOTPEmail({ properties = {}, data = {}, theme = {}, links = {} }) {
  return (
    <EmailLayout theme={theme}>
      <Heading as="h2" style={headingStyle}>
        Your sign-in code
      </Heading>
      <Text style={textStyle}>Enter this code on the sign-in page to continue.</Text>
      <OtpCode otp={properties.otp} expiresIn={properties.expiresIn} />
    </EmailLayout>
  );
}

EmailOTPEmail.subject = 'Your sign-in code';

export default EmailOTPEmail;
