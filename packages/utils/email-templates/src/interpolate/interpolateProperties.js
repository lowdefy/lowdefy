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

import { type } from '@lowdefy/helpers';
import { createEnvironment } from '@lowdefy/nunjucks';

import escapeMarkdownData from './escapeMarkdownData.js';
import unescapeMarkdown from './unescapeMarkdown.js';

// Autoescape is off because emails are not HTML sinks for plain properties like subject.
// Markdown fields are protected by escaping the interpolated data values instead.
const plainEnvironment = createEnvironment({ autoescape: false });
const markdownEnvironment = createEnvironment({ autoescape: false });

// The markdown filter marks a value as markdown the app wrote, so it renders as markdown.
// Markdown properties render against escaped data, so the filter undoes the escaping;
// plain properties render against raw data, so the filter leaves the value as it is.
plainEnvironment.addFilter('markdown', (value) => value);
markdownEnvironment.addFilter('markdown', (value) =>
  type.isString(value) ? unescapeMarkdown(value) : value
);

function interpolateValue({ value, path, data, escapedData, markdownProperties }) {
  if (type.isString(value)) {
    // Array indices are stripped so 'metadata.0.value' matches a 'metadata.value' entry.
    const dottedPath = path.filter((segment) => !/^\d+$/.test(segment)).join('.');
    if (markdownProperties.includes(dottedPath)) {
      return markdownEnvironment.renderString(value, escapedData);
    }
    return plainEnvironment.renderString(value, data);
  }
  if (type.isArray(value)) {
    return value.map((item, index) =>
      interpolateValue({
        value: item,
        path: [...path, String(index)],
        data,
        escapedData,
        markdownProperties,
      })
    );
  }
  if (type.isObject(value)) {
    const result = {};
    Object.keys(value).forEach((key) => {
      result[key] = interpolateValue({
        value: value[key],
        path: [...path, key],
        data,
        escapedData,
        markdownProperties,
      });
    });
    return result;
  }
  return value;
}

function interpolateProperties({ properties, data = {}, markdownProperties = [] }) {
  const escapedData = escapeMarkdownData(data);
  return interpolateValue({ value: properties, path: [], data, escapedData, markdownProperties });
}

export default interpolateProperties;
