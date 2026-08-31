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
import { Button, Section } from '@react-email/components';
import { type } from '@lowdefy/helpers';

import defaultTheme from '../defaultTheme.js';

function CtaButton({ label, href, theme }) {
  if (type.isNone(label) || label === '' || type.isNone(href) || href === '') {
    return null;
  }
  return (
    <Section style={{ margin: '8px 0 16px 0' }}>
      <Button
        href={href}
        style={{
          backgroundColor: theme?.primaryColor ?? defaultTheme.primaryColor,
          borderRadius: '6px',
          color: '#ffffff',
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '10px 24px',
          textDecoration: 'none',
        }}
      >
        {label}
      </Button>
    </Section>
  );
}

export default CtaButton;
