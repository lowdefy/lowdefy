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

import { serializer, type } from '@lowdefy/helpers';

import interpolateProperties from './interpolate/interpolateProperties.js';
import resolveLink from './resolveLink.js';

function buildPreviewProps({ Template, config }) {
  const testData = config.testData ?? {};
  const properties = interpolateProperties({
    properties: config.properties,
    data: testData,
    markdownProperties: Template.markdownProperties,
  });
  const links = {};
  Object.keys(testData.links ?? {}).forEach((key) => {
    links[key] = resolveLink(testData.links[key]);
  });
  const data = serializer.copy(testData);
  (Template.dataKeys ?? []).forEach((key) => {
    (type.isArray(data[key]) ? data[key] : []).forEach((item) => {
      if (type.isObject(item) && !type.isNone(item.link)) {
        item.link = resolveLink(item.link);
      }
    });
  });
  return { properties, data, theme: config.theme, links };
}

export default buildPreviewProps;
