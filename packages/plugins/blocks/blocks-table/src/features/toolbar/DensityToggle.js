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
import { Button, Segmented } from 'antd';

const OPTIONS = [
  { label: 'Compact', value: 'compact' },
  { label: 'Default', value: 'default' },
  { label: 'Comfortable', value: 'comfortable' },
];

// Row density, and the view's Wrap toggle (text-like columns wrap onto several lines).
function DensityToggle({ api }) {
  const { wrap } = api.state;
  return (
    <>
      <Segmented
        aria-label="Row density"
        data-lf-toolbar-density=""
        onChange={(density) => api.updateSlice('density', () => density, { cause: 'density' })}
        options={OPTIONS}
        size="small"
        value={api.state.density}
      />
      <Button
        aria-pressed={wrap}
        data-lf-toolbar-wrap=""
        onClick={() => api.updateSlice('wrap', (current) => !current, { cause: 'wrap' })}
        size="small"
        type={wrap ? 'primary' : 'default'}
      >
        Wrap
      </Button>
    </>
  );
}

export default DensityToggle;
