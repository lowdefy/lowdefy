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

import { applyArrayIndices, get, serializer, swap, type } from '@lowdefy/helpers';
import Events from './Events.js';
import Areas from './Areas.js';

class Block {
  constructor(
    areaContext,
    {
      id,
      blockId,
      events,
      layout,
      loading,
      properties,
      required,
      skeleton,
      style,
      validate,
      visible,
      type,
      areas,
    }
  ) {
    this.areaContext = areaContext;
    this.idPattern = id;
    this.blockIdPattern = blockId;
    this.id = applyArrayIndices(areaContext.arrayIndices, this.idPattern);
    this.blockId = applyArrayIndices(areaContext.arrayIndices, this.blockIdPattern);

    this.events = type.isNone(events) ? {} : events;
    this.layout = type.isNone(layout) ? {} : layout;
    this.loading = type.isNone(loading) ? false : loading;
    this.properties = type.isNone(properties) ? {} : properties;
    this.required = type.isNone(required) ? false : required;
    this.skeleton = type.isNone(skeleton) ? null : skeleton;
    this.style = type.isNone(style) ? {} : style;
    this.validate = type.isNone(validate) ? [] : validate;
    this.visible = type.isNone(visible) ? true : visible;
    this.type = type;
    this.areas = areas;
    this.areasLayout = type.isNone(areas)
      ? {}
      : Object.keys(this.areas).forEach((key) => {
          // eslint-disable-next-line no-unused-vars
          const { blocks, ...areaLayout } = this.areas[key];
          this.areasLayout[key] = { ...areaLayout };
        });
    this.areasLayoutEval = {};
    this.layoutEval = {};
    this.loadingEval = {};
    this.propertiesEval = {};
    this.requiredEval = {};
    this.skeletonEval = {};
    this.styleEval = {};
    this.validationEval = {};
    this.visibleEval = {};

    try {
      this.meta = areaContext.context._internal.lowdefy._internal.blockComponents[type].meta;
    } catch (error) {
      throw new Error(
        `Block type ${type} not found at ${this.blockId}. Check your plugins to make sure the block is installed. For more info, see https://docs.lowdefy.com/plugins.`
      );
    }
    if (
      this.meta?.category !== 'container' &&
      this.meta?.category !== 'display' &&
      this.meta?.category !== 'input' &&
      this.meta?.category !== 'list'
    ) {
      throw new Error(
        `Block type ${type}.meta.category must be either "container", "display", "input" or "list".`
      );
    }

    this.methods = {};

    // bind to current instance
    this.registerMethod = this.registerMethod.bind(this);
    this.triggerEvent = this.triggerEvent.bind(this);
    this.registerEvent = this.registerEvent.bind(this);
    this.reset = this.reset.bind(this);
    this.initBlockContainer = this.initBlockContainer.bind(this);

    // TODO: input and list block categories

    this.Events = new Events({
      arrayIndices: areaContext.arrayIndices,
      block: this,
      context: areaContext.context,
    });
  }

  registerMethod(methodName, method) {
    this.methods[methodName] = method;
  }
  triggerEvent() {
    this.Events.triggerEvent();
  }
  registerEvent() {
    this.Events.registerEvent();
  }

  reset(initWithState) {
    this.update = true;
    this.showValidation = false;
    if (this.meta.category === 'container') {
      this.initBlockContainer(initWithState);
    }
    // TODO: input and list block categories
  }

  initBlockContainer(initState) {
    //TODO: Rename subBlocks to area?
    if (!type.isArray(this.subBlocks)) {
      this.subBlocks = [];
    }
    if (!this.subBlocks[0]) {
      this.subBlocks.push(new Areas(this.areaContext.arrayIndices, this.areas, initState));
    } else {
      this.subBlocks[0].reset(initState);
    }
  }

  recEval(visibleParent, repeat) {
    const beforeVisible = this.visibleEval ? this.visibleEval.output : true;
    if (visibleParent === false) {
      this.visibleEval.output = false;
    } else {
      this.visibleEval = this.areaContext.context._internal.parser.parse({
        input: this.visible,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
    }
    if (beforeVisible !== this.visibleEval.output) {
      repeat.result = true;
    }

    // only evaluate visible blocks
    if (this.visibleEval.output !== false) {
      this.propertiesEval = this.areaContext.context._internal.parser.parse({
        input: this.properties,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      this.requiredEval = this.areaContext.context._internal.parser.parse({
        input: this.required,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      const requiredValidation = {
        pass: { _not: { _type: 'none' } },
        status: 'error',
        message: type.isString(this.requiredEval.output)
          ? this.requiredEval.output
          : 'This field is required',
      };
      const validation =
        this.requiredEval.output === false ? this.validate : [...this.validate, requiredValidation];

      this.validationEval = {
        output: {
          status: null,
          errors: [],
          warnings: [],
        },
        errors: [],
      };
      let validationError = false;
      let validationWarning = false;
      validation.forEach((test) => {
        const parsed = this.areaContext.context._internal.parser.parse({
          input: test,
          location: this.blockId,
          arrayIndices: this.areaContext.arrayIndices,
        });
        // for parser errors
        if (parsed.errors.length > 0) {
          this.validationEval.output.errors.push(parsed.output.message);
          this.validationEval.errors.push(parsed.errors);
          validationError = true;
          return;
        }
        // failed validation
        if (!parsed.output.pass) {
          // no status indication on validation tests defaults to error
          if (!test.status || test.status === 'error') {
            this.validationEval.output.errors.push(parsed.output.message);
            validationError = true;
          }
          if (test.status === 'warning') {
            this.validationEval.output.warnings.push(parsed.output.message);
            validationWarning = true;
          }
        }
      });
      if (validation.length > 0) {
        this.validationEval.output.status = 'success';
      }
      if (validationWarning) {
        this.validationEval.output.status = 'warning';
      }
      if (validationError && this.showValidation) {
        this.validationEval.output.status = 'error';
      }

      this.styleEval = this.areaContext.context._internal.parser.parse({
        input: this.style,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      this.layoutEval = this.areaContext.context._internal.parser.parse({
        input: this.layout,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      this.loadingEval = this.areaContext.context._internal.parser.parse({
        input: this.loading,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      this.skeletonEval = this.areaContext.context._internal.parser.parse({
        input: this.skeleton,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });
      this.areasLayoutEval = this.areaContext.context._internal.parser.parse({
        input: this.areasLayout,
        location: this.blockId,
        arrayIndices: this.areaContext.arrayIndices,
      });

      if (this.meta.category === 'container' || this.meta.category === 'list') {
        if (this.subBlocks?.length > 0) {
          this.subBlocks.forEach((areaClass) => {
            repeat = areaClass.recEval(this.visibleEval.output) || repeat;
          });
        }
      }
    }
  }
}

export default Block;
