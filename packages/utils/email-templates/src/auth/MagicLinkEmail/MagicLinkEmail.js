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
import { Heading, Link, Text } from '@react-email/components';

import CtaButton from '../../components/CtaButton.js';
import EmailLayout from '../../components/EmailLayout.js';

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

// The same destination as the button, in plain sight. Locked-down mail clients
// strip or rewrite button markup, and some people copy links by hand rather
// than clicking - the URL has to be readable, and long enough to wrap.
const fallbackTextStyle = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  wordBreak: 'break-all',
};

function MagicLinkEmail({ properties = {}, data = {}, theme = {}, links = {} }) {
  return (
    <EmailLayout theme={theme}>
      <Heading as="h2" style={headingStyle}>
        Sign in to your account
      </Heading>
      <Text style={textStyle}>
        Click the button below to sign in. The link will expire shortly, so please use it soon, and
        do not forward this email - anyone with the link can sign in as you.
      </Text>
      <CtaButton label="Sign in" href={properties.url} theme={theme} />
      <Text style={fallbackTextStyle}>
        If the button does not work, copy this link into your browser:
        <br />
        <Link href={properties.url}>{properties.url}</Link>
      </Text>
    </EmailLayout>
  );
}

MagicLinkEmail.subject = 'Your sign-in link';

export default MagicLinkEmail;
