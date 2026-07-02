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

import { jest } from '@jest/globals';

import writeStepImports from './writeStepImports.js';

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeStepImports always writes plugins/steps.js even when no steps are used', async () => {
  const components = { imports: { steps: [] } };
  const context = { writeBuildArtifact: mockWriteBuildArtifact };
  await writeStepImports({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/steps.js', 'export default {\n  };');
});

test('writeStepImports writes imports for auth step types', async () => {
  const components = {
    imports: {
      steps: [
        {
          package: '@lowdefy/plugin-better-auth',
          originalTypeName: 'BanUser',
          typeName: 'BanUser',
        },
      ],
    },
  };
  const context = { writeBuildArtifact: mockWriteBuildArtifact };
  await writeStepImports({ components, context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/steps.js',
    "import { BanUser as BanUser } from '@lowdefy/plugin-better-auth/steps';\nexport default {\n  BanUser,\n  };"
  );
});
