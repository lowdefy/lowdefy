/*
  Copyright 2020-2021 Lowdefy, Inc

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

const AllIcons = require('@ant-design/icons');
const fs = require('fs');
const promisify = require('util').promisify;

function isIcon(str) {
  return str.charAt(0).toUpperCase() === str.charAt(0);
}
const writeFile = promisify(fs.writeFile);

async function generate() {
  const allIcons = new Set();
  Object.keys(AllIcons).forEach(async (key) => {
    if (isIcon(key)) {
      allIcons.add(key);
      await writeFile(
        `./src/blocks/Icon/icons/${key}.js`,
        `/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { ${key} } from '@ant-design/icons';

const Comp = (props) => <${key} {...props} />;

export default Comp;
`
      );
    }
  });
  console.log('Json Icon Array for Schema');
  console.log('--------------------------');
  [...allIcons].forEach(async (key) => {
    console.log(`"${key}",`);
  });
  console.log('--------------------------');
  console.log('Yaml Icon Array for Docs');
  console.log('--------------------------');
  [...allIcons].forEach(async (key) => {
    console.log(`- { label: "${key}", value: "${key}" }`);
  });
}
generate();
