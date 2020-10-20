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

import { get, type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import JSON5 from 'json5';
import YAML from 'js-yaml';
import { v1 as uuid } from 'uuid';

import getFileExtension, { getFileSubExtension } from '../utils/files/getFileExtension';

function getRefPath(refDefinition) {
  if (type.isObject(refDefinition) && refDefinition.path) {
    return refDefinition.path;
  }
  if (type.isString(refDefinition)) {
    return refDefinition;
  }
  return null;
}

function getRefVars(refDefinition) {
  if (type.isObject(refDefinition) && refDefinition.vars) {
    return refDefinition.vars;
  }
  return {};
}

function makeRefDefinition(refDefinition) {
  return {
    // uuid is overkill but it is already in bundle
    id: uuid(),
    path: getRefPath(refDefinition),
    vars: getRefVars(refDefinition),
    original: refDefinition,
  };
}

function getRefsFromFile(fileContent) {
  const foundRefs = [];
  const reviver = (key, value) => {
    if (type.isObject(value)) {
      if (!type.isUndefined(value._ref)) {
        const def = makeRefDefinition(value._ref);
        foundRefs.push(def);
        return {
          _ref: def,
        };
      }
    }
    return value;
  };
  const fileContentBuiltRefs = JSON.stringify(JSON.parse(fileContent, reviver));
  return { foundRefs, fileContentBuiltRefs };
}

function parseNunjucks(fileContent, vars, path) {
  const template = nunjucksFunction(JSON.parse(fileContent));
  const templated = template(vars);
  const subExt = getFileSubExtension(path);
  if (subExt === 'yaml' || subExt === 'yml') {
    return JSON.stringify(YAML.safeLoad(templated));
  }
  if (subExt === 'json') {
    return JSON.stringify(JSON5.parse(templated));
  }
  return JSON.stringify(templated);
}

function refReviver(key, value) {
  if (type.isObject(value)) {
    if (!type.isUndefined(value._ref)) {
      return this.parsedFiles[value._ref.id];
    }
    if (value._var) {
      if (type.isObject(value._var) && type.isString(value._var.name)) {
        return JSON.parse(
          JSON.stringify(get(this.vars, value._var.name, { default: value._var.default || null }))
        );
      }
      return JSON.parse(JSON.stringify(get(this.vars, value._var, { default: null })));
    }
  }
  return value;
}

class RefBuilder {
  constructor({ context }) {
    this.rootPath = 'lowdefy.yaml';
    this.configLoader = context.configLoader;
    this.refContent = {};
    this.MAX_RECURSION_DEPTH = context.MAX_RECURSION_DEPTH || 20;
  }

  async getFileContent(path) {
    const file = await this.configLoader.load(path);
    if (!file) {
      throw new Error(`File "${path}" not found.`);
    }
    return file;
  }

  async build() {
    return this.recursiveParseFile({
      path: this.rootPath,
      vars: {},
      count: 0,
    });
  }

  async recursiveParseFile({ path, count, vars }) {
    if (count > this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `Maximum recursion depth of references exceeded. Only ${this.MAX_RECURSION_DEPTH} consecutive references are allowed`
      );
    }
    let fileContent = await this.getFileContent(path);
    if (getFileExtension(path) === 'njk') {
      fileContent = parseNunjucks(fileContent, vars, path);
    }
    const { foundRefs, fileContentBuiltRefs } = getRefsFromFile(fileContent);
    const parsedFiles = {};

    // Since we can have references in the variables of a reference, we need to first parse
    // the deeper nodes, so we can use those parsed files in references higher in the tree.
    // To do this, since foundRefs is an array of ref definitions that are in order of the
    // deepest nodes first we for loop over over foundRefs one by one, awaiting each result.

    // eslint-disable-next-line no-restricted-syntax
    for (const refDef of foundRefs.values()) {
      if (refDef.path === null) {
        throw new Error(
          `Invalid _ref definition ${JSON.stringify(refDef.original)} at file ${path}`
        );
      }
      // eslint-disable-next-line no-await-in-loop
      parsedFiles[refDef.id] = await this.recursiveParseFile({
        path: refDef.path,
        // Parse vars before passing down to parse new file
        vars: JSON.parse(JSON.stringify(refDef.vars), refReviver.bind({ parsedFiles, vars })),
        count: count + 1,
      });
    }
    return JSON.parse(fileContentBuiltRefs, refReviver.bind({ parsedFiles, vars }));
  }
}

async function buildRefs({ context }) {
  const builder = new RefBuilder({ context });
  const components = await builder.build();
  await context.logger.info('Built References');
  return components;
}

export default buildRefs;
