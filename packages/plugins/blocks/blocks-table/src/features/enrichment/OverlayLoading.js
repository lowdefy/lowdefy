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
import { Drawer, Modal } from 'antd';

import PopoverLoadingContent from '../../core/PopoverLoadingContent.js';

// The Suspense fallback of an enrichment overlay that loads on first use (D17, as the table's
// popovers): the drawer or dialog opens at once, where and as large as the real one, with a
// spinner inside until its code arrives. Closing it closes the overlay that was opening.
function OverlayLoading({ api, kind, mask = true, name, size, title }) {
  const close = () => api.actions.closeOverlay({ name });
  if (kind === 'modal') {
    return (
      <Modal footer={null} onCancel={close} open title={title} width={size}>
        <PopoverLoadingContent />
      </Modal>
    );
  }
  return (
    <Drawer
      mask={mask}
      onClose={close}
      open
      rootClassName="lf-enrich-drawer"
      size={size}
      title={title}
    >
      <PopoverLoadingContent />
    </Drawer>
  );
}

export default OverlayLoading;
