/*
  Copyright 2020 Lowdefy, Inc

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

import React, { useState } from 'react';
import YAML from 'js-yaml';
import { stubBlockProps, blockDefaultProps, BlockSchemaErrors } from '@lowdefy/block-tools';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import vs2015 from 'react-syntax-highlighter/dist/esm/styles/hljs/vs2015';

SyntaxHighlighter.registerLanguage('yaml', yaml);
const logger = console.log;

const Examples = ({ type, Component }) => {
  const [showYaml, toggelYaml] = useState(true);
  // duplicate imported yaml to be mutabile
  const examples = JSON.parse(JSON.stringify(require(`./examples/${type}.yaml`)));
  const meta = require(`../src/blocks/${type}/${type}.json`);
  Component.defaultProps = blockDefaultProps;
  return (
    <div>
      <h1>{type}</h1>
      <div>
        Render YAML:{' '}
        <input type="checkbox" checked={showYaml} onChange={() => toggelYaml(!showYaml)} />
      </div>
      {(examples || []).map((block) => {
        const exYaml = YAML.safeDump(block, {
          // sortKeys: true,
          noRefs: true,
        });
        const props = stubBlockProps({ block, meta, logger });
        return (
          <div key={block.id}>
            <h4 style={{ borderTop: '1px solid #b1b1b1', padding: 10, margin: 10 }}>
              {type} {block.id}
            </h4>
            <div style={{ display: 'flex' }}>
              {showYaml && (
                <div style={{ minWidth: '30%' }}>
                  <SyntaxHighlighter language="yaml" style={vs2015} showLineNumbers={true}>
                    {exYaml}
                  </SyntaxHighlighter>
                  <BlockSchemaErrors schemaErrors={props.schemaErrors} />
                </div>
              )}
              <div style={{ ...{ padding: 20, width: '100%' }, ...block.style }}>
                <Component {...props} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Examples;
