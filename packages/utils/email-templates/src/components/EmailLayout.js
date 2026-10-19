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
import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from '@react-email/components';
import { type } from '@lowdefy/helpers';

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const bodyStyle = {
  backgroundColor: '#f5f5f5',
  fontFamily,
  margin: 0,
  padding: '24px 0',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '32px',
};

const companyNameStyle = {
  color: '#111111',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '24px',
  margin: 0,
};

const signatureStyle = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
  whiteSpace: 'pre-line',
};

const footerStyle = {
  color: '#8c8c8c',
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
};

function EmailLayout({ theme = {}, preview, children }) {
  const hasHeader = !type.isNone(theme.logo) || !type.isNone(theme.companyName);
  return (
    <Html>
      <Head />
      {!type.isNone(preview) && preview !== '' ? <Preview>{preview}</Preview> : null}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {hasHeader ? (
            <Section style={{ marginBottom: '24px' }}>
              {!type.isNone(theme.logo) ? (
                <Img src={theme.logo} alt={theme.companyName ?? ''} height="40" />
              ) : (
                <Text style={companyNameStyle}>{theme.companyName}</Text>
              )}
            </Section>
          ) : null}
          <Section>{children}</Section>
          {!type.isNone(theme.signature) ? (
            <Section>
              <Text style={signatureStyle}>{theme.signature}</Text>
            </Section>
          ) : null}
          {!type.isNone(theme.footer) ? (
            <Section>
              <Hr style={{ borderColor: '#f0f0f0', margin: '16px 0' }} />
              <Text style={footerStyle}>{theme.footer}</Text>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;
