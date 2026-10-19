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
import { Heading } from '@react-email/components';
import { type } from '@lowdefy/helpers';

import ActionList from '../../components/ActionList.js';
import CtaButton from '../../components/CtaButton.js';
import EmailLayout from '../../components/EmailLayout.js';
import MarkdownContent from '../../components/MarkdownContent.js';
import MetadataTable from '../../components/MetadataTable.js';
import QuoteBlock from '../../components/QuoteBlock.js';
import schema from './schema.js';

const headingStyle = {
  color: '#111111',
  fontSize: '20px',
  lineHeight: '28px',
  margin: '0 0 16px 0',
};

function NotificationEmail({ properties = {}, data = {}, theme = {}, links = {} }) {
  return (
    <EmailLayout theme={theme} preview={properties.preview}>
      {!type.isNone(properties.title) && properties.title !== '' ? (
        <Heading as="h2" style={headingStyle}>
          {properties.title}
        </Heading>
      ) : null}
      <MarkdownContent markdown={properties.message} theme={theme} />
      <MetadataTable metadata={properties.metadata} />
      <QuoteBlock text={properties.quote?.text} author={properties.quote?.author} />
      <ActionList actions={data.actions} theme={theme} />
      <CtaButton label={properties.button?.label} href={links?.button} theme={theme} />
    </EmailLayout>
  );
}

NotificationEmail.schema = schema;
NotificationEmail.markdownProperties = ['message'];
NotificationEmail.dataKeys = ['actions'];

export default NotificationEmail;
