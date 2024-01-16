/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { render, waitFor } from '@testing-library/react';
import { type } from '@lowdefy/helpers';

import mockBlock from './mockBlock.js';

const runRenderTests = ({
  Block,
  examples,
  logger,
  reset = () => null,
  schema,
  testConfig,
  validationsExamples,
}) => {
  const { before, methods, getProps } = mockBlock({ meta: Block.meta, logger, schema });

  beforeEach(() => {
    reset();
    before();
  });

  examples.forEach((ex) => {
    const values = [type.enforceType(Block.meta.valueType, null)];
    if (!type.isNone(ex.value)) {
      values.push(ex.value);
    }
    if (type.isArray(testConfig.values)) {
      values.push(...testConfig.values);
    }
    values.forEach((value, v) => {
      test(`Render ${ex.id} - value[${v}]`, async () => {
        // create shell to setup react hooks with getProps before render;
        const Shell = () => <Block {...getProps(ex)} value={value} methods={methods} />;
        const { container } = render(<Shell />);
        await waitFor(() => expect(container.firstChild).toMatchSnapshot());
      });

      if (testConfig?.validation) {
        (validationsExamples || []).forEach((validationEx) => {
          test(`Render validation.status = ${validationEx.status} ${ex.id} - value[${v}]`, async () => {
            // create shell to setup react hooks with getProps before render;
            const Shell = () => (
              <Block {...getProps(ex)} value={value} methods={methods} validation={validationEx} />
            );
            const { container } = render(<Shell />);
            await waitFor(() => expect(container.firstChild).toMatchSnapshot());
          });
        });
      }

      if (testConfig?.required) {
        test(`Render required = true ${ex.id} - value[${v}]`, async () => {
          // create shell to setup react hooks with getProps before render;
          const Shell = () => <Block {...getProps(ex)} value={value} methods={methods} required />;
          const { container } = render(<Shell />);
          await waitFor(() => expect(container.firstChild).toMatchSnapshot());
        });
      }
    });
  });
};

export default runRenderTests;
