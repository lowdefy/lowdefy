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
import { Section, Text } from '@react-email/components';
import { type } from '@lowdefy/helpers';

import defaultTheme from '../defaultTheme.js';

const titleStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  lineHeight: '22px',
  margin: 0,
};

const messageStyle = {
  color: '#595959',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '2px 0 0 0',
};

function ActionList({ actions, theme }) {
  if (!type.isArray(actions) || actions.length === 0) {
    return null;
  }
  const linkColor = theme?.primaryColor ?? defaultTheme.primaryColor;
  return (
    <Section style={{ margin: '0 0 16px 0' }}>
      {actions.map((action, index) => (
        <div key={index} style={{ margin: '0 0 12px 0' }}>
          <Text style={titleStyle}>
            <a href={action.link} target="_blank" style={{ color: linkColor }} rel="noreferrer">
              {action.title}
            </a>
          </Text>
          {!type.isNone(action.message) && action.message !== '' ? (
            <Text style={messageStyle}>{action.message}</Text>
          ) : null}
        </div>
      ))}
    </Section>
  );
}

export default ActionList;
