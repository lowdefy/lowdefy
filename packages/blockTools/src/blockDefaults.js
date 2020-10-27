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

import React from 'react';
import makeCssClass from './makeCssClass';

const noMethod = () => undefined;

const defaultMethods = (methods) => ({
  makeCssClass,
  callAction: methods.callAction || noMethod,
  registerAction: methods.registerAction || noMethod,
  registerMethod: methods.registerMethod || noMethod,
  ...methods,
});

const blockDefaults = (Comp) => {
  return ({
    actions,
    blockId,
    Components,
    content,
    list,
    menus,
    methods,
    properties,
    user,
    validate,
    ...props
  }) => (
    <Comp
      {...props}
      actions={actions || {}}
      blockId={blockId || `blockId_${Math.floor(Math.random() * 16777215).toString(16)}`}
      methods={defaultMethods(methods || {})}
      Components={Components || {}}
      content={content || {}}
      list={list || []}
      menus={menus || []}
      properties={properties || {}}
      user={user || {}}
      validate={validate || []}
    />
  );
};

export default blockDefaults;
