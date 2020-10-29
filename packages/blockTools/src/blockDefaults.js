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

import makeCssClass from './makeCssClass';

const noMethod = () => undefined;

const defaultMethods = (methods) => ({
  makeCssClass,
  callAction: methods.callAction || noMethod,
  registerAction: methods.registerAction || noMethod,
  registerMethod: methods.registerMethod || noMethod,
  ...methods,
});

const blockDefaults = (props = {}) => ({
  ...props,
  actions: props.actions || {},
  blockId: props.id || props.blockId || 'undefined_id',
  content: props.content || {},
  list: props.list || [],
  menus: props.menus || [],
  methods: defaultMethods(props.methods || {}),
  properties: props.properties || {},
  user: props.user || {},
  validate: props.validate || [],
});

export default blockDefaults;
