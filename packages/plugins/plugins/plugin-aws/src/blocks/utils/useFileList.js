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

const useFileList = ({ properties, methods, value = {} }) => {
  const checkedValue = (value) => {
    let file = type.isObject(value?.file) ? value.file : null;
    if (!file && type.isObject(value?.fileList?.[0])) {
      file = value.fileList[0];
    }
    const fileList = type.isArray(value?.fileList) ? value.fileList : [];
    if (properties.singleFile === true) {
      fileList.splice(1);
    }
    if (type.isInt(properties.maxCount)) {
      fileList.splice(properties.maxCount);
    }
    return {
      file,
      fileList,
    };
  };

  const [state, setState] = useState(checkedValue(value));
  const setValue = (stateValue) => {
    setState(() => {
      return checkedValue(stateValue);
    });
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
    switch (event) {
      case 'onProgress':
        fileObj.status = 'uploading';
        fileObj.percent = percent ?? fileObj.percent;
        break;
      case 'onSuccess':
        fileObj.status = 'done';
        fileObj.percent = 100;
        break;
      case 'onRemove':
        fileObj.status = 'removed';
        break;
      default: // onError
        fileObj.status = 'error';
        break;
    }
    state.fileList.splice(
      state.fileList.findIndex((f) => f.uid === fileObj.uid),
      1,
      fileObj
    );
    const nextState = checkedValue({
      file: fileObj,
      fileList: state.fileList,
    });
    await methods.triggerEvent({ name: event, event: nextState });
    setValue(nextState);
    methods.setValue(nextState);
  };
  const loadFileList = (file, nextFiles) => {
    if (
      properties.singleFile === true &&
      nextFiles.filter((f) => type.isString(f.uid)).length > 1
    ) {
      return false;
    }
    if (
      type.isInt(properties.maxCount) &&
      nextFiles.filter((f) => type.isString(f.uid)).length > properties.maxCount
    ) {
      return false;
    }
    setValue({
      file,
      fileList: [...nextFiles, ...state.fileList],
    });
  };
  const removeFile = (file) => {
    state.fileList.splice(
      state.fileList.findIndex((f) => f.uid === file.uid),
      1
    );
    setValue(state);
    methods.setValue(state);
  };
  return [state, loadFileList, setFileList, removeFile, setValue];
};

export default useFileList;
