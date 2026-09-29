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
import { Alert, Modal } from 'antd';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

// The header menu Delete's confirmation. OK fires onColumnDelete and stays open, pending, until
// it resolves; a failure shows its message here.
function DeleteColumnConfirm({ api, deleting }) {
  const column = api.config.columnsByKey.get(deleting.key);
  const title = column ? htmlToText(column.title) : deleting.key;
  return (
    <Modal
      cancelButtonProps={{ disabled: deleting.status === 'saving' }}
      okButtonProps={{ danger: true, 'data-lf-delete-confirm': '' }}
      okText="Delete"
      onCancel={() => api.actions.closeOverlay({ name: 'deleting' })}
      onOk={() => api.actions.confirmDelete()}
      confirmLoading={deleting.status === 'saving'}
      open
      title="Delete column"
      width={420}
    >
      <div data-lf-delete-column={deleting.key}>
        <p>Delete the column “{title}”?</p>
        {deleting.error ? (
          <Alert data-lf-delete-error="" showIcon title={deleting.error} type="error" />
        ) : null}
      </div>
    </Modal>
  );
}

export default DeleteColumnConfirm;
