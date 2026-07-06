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
import { Text } from '@react-email/components';
import { type } from '@lowdefy/helpers';

const quoteContainerStyle = {
  borderLeft: '3px solid #d9d9d9',
  margin: '0 0 16px 0',
  padding: '4px 0 4px 12px',
};

const quoteTextStyle = {
  color: '#595959',
  fontSize: '14px',
  fontStyle: 'italic',
  lineHeight: '22px',
  margin: 0,
};

const quoteAuthorStyle = {
  color: '#8c8c8c',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '4px 0 0 0',
};

function QuoteBlock({ text, author }) {
  if (type.isNone(text) || text === '') {
    return null;
  }
  return (
    <div style={quoteContainerStyle}>
      <Text style={quoteTextStyle}>{text}</Text>
      {!type.isNone(author) && author !== '' ? (
        <Text style={quoteAuthorStyle}>— {author}</Text>
      ) : null}
    </div>
  );
}

export default QuoteBlock;
