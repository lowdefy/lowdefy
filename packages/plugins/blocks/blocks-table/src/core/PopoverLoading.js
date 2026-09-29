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
import { Popover } from 'antd';

import PopoverLoadingContent from './PopoverLoadingContent.js';

const ANCHORS = {
  // The bottom edge of the header cell (the column filter and the header menu).
  header: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 0, pointerEvents: 'none' },
  // The table's top end corner, below the header (the column manager).
  corner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 'var(--lf-header-h)',
    pointerEvents: 'none',
  },
};

// The Suspense fallback of a popover that loads on first use (D17): the popover opens at once,
// where the real one will, with a spinner inside its frame until the code arrives. Closing it
// (click outside, Escape) closes the popover that was opening.
function PopoverLoading({ anchor, onClose, placement }) {
  return (
    <Popover
      arrow={false}
      content={<PopoverLoadingContent />}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      placement={placement}
      trigger={['click']}
    >
      <span style={ANCHORS[anchor]} />
    </Popover>
  );
}

export default PopoverLoading;
