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

import { useState } from 'react';
import { type } from '@lowdefy/helpers';

const checkedValue = (value) => ({
  // eslint-disable-next-line no-nested-ternary
  file: type.isObject(value?.file)
    ? value.file
    : type.isObject(value?.fileList?.[0])
      ? value.fileList[0]
      : null,
  fileList: type.isArray(value?.fileList) ? value.fileList : [],
});

const useFileList = ({ methods, multiple, value = {} }) => {
  const [state, setState] = useState(checkedValue(value));
  const setValue = (stateValue) => {
    setState(checkedValue(stateValue));
  };
  const setFileList = async ({ event, file, percent }) => {
    if (!file) {
      throw new Error('File is undefined in useFileList');
    }
    // destruct the file object to avoid the file object being mutated.
    const { bucket, key, lastModified, name, size, status, type, uid } = file;
    const fileObj = {
      bucket,
      key,
      lastModified,
      name,
      percent: percent ?? file.percent ?? 0,
      size,
      status,
      type,
      uid,
      url: file instanceof Blob || file instanceof File ? URL.createObjectURL(file) : null,
    };
    let nextState = { file: fileObj, fileList: [...state.fileList] };

    switch (event) {
      case 'onProgress':
        fileObj.status = 'uploading';
        fileObj.percent = percent ?? fileObj.percent;
        nextState.fileList = multiple !== false ? [fileObj, ...state.fileList] : [fileObj];
        break;
      case 'onSuccess':
        fileObj.status = 'done';
        fileObj.percent = 100;
        nextState.fileList = multiple !== false ? [fileObj, ...state.fileList] : [fileObj];
        break;
      case 'onRemove':
        fileObj.status = 'removed';
        nextState.fileList = state.fileList.filter((f) => f.uid !== fileObj.uid);
        break;
      default: // onError
        fileObj.status = 'error';
        nextState.fileList = multiple !== false ? [fileObj, ...state.fileList] : [fileObj];
        break;
    }
    await methods.triggerEvent({ name: event, event: nextState });
    setState(nextState);
    methods.setValue(nextState);
  };
  return [state, setFileList, setValue];
};

export default useFileList;
