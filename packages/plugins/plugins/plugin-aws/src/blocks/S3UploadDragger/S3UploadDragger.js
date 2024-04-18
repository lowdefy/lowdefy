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

import React, { useEffect } from 'react';
import { Upload } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

import useFileList from '../utils/useFileList.js';
import getS3Upload from '../utils/getS3Upload.js';
import getOnPaste from '../utils/getOnPaste.js';

const { Dragger } = Upload;

const S3UploadDragger = ({ blockId, methods, properties, value }) => {
  const [state, loadFileList, setFileList, removeFile, setValue] = useFileList({
    properties,
    methods,
    value,
  });
  const s3UploadRequest = getS3Upload({ methods, setFileList });
  const onPaste = getOnPaste({ s3UploadRequest, properties });
  useEffect(() => {
    methods.registerEvent({
      name: '__getS3PostPolicy',
      actions: [
        {
          id: '__getS3PostPolicy',
          type: 'Request',
          params: [properties.s3PostPolicyRequestId],
        },
      ],
    });
  }, []);
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(state)) {
      setValue(value);
    }
  }, [value]);
  useEffect(() => {
    methods.registerMethod('uploadFromPaste', async () => {
      await onPaste();
    });
  }, [onPaste]);
  return (
    <div id={blockId} onPaste={onPaste}>
      <Dragger
        accept={properties.accept ?? '*'}
        beforeUpload={loadFileList}
        className={methods.makeCssClass([properties.style])}
        customRequest={s3UploadRequest}
        disabled={properties.disabled}
        fileList={state.fileList}
        maxCount={properties.maxCount}
        multiple={!properties.singleFile} // Allows selection of multiple files at once, does not block multiple uploads
        onRemove={removeFile}
        showUploadList={properties.showUploadList}
        onChange={() => {
          methods.triggerEvent({ name: 'onChange' });
        }}
      >
        <div className="ant-upload-hint">
          {renderHtml({
            html: properties.title ?? 'Click or drag to add a file.',
            methods,
          })}
        </div>
      </Dragger>
    </div>
  );
};

S3UploadDragger.defaultProps = blockDefaultProps;
S3UploadDragger.meta = {
  valueType: 'object',
  category: 'input',
  icons: [],
  styles: ['blocks/S3UploadDragger/style.less'],
};

export default S3UploadDragger;
