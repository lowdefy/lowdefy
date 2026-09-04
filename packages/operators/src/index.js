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

import compileExpression from './compileExpression/compileExpression.js';
import emitOperatorClosures, { hasOperators } from './closures/emitOperatorClosures.js';
import evaluateClosures from './closures/evaluateClosures.js';
import evaluateWebClosures from './closures/evaluateWebClosures.js';
import evaluateOperators, { hasDynamicMarker, hasDynChild } from './evaluateOperators.js';
import getFromArray from './getFromArray.js';
import getFromObject from './getFromObject.js';
import isExpression from './compileExpression/isExpression.js';
import ServerParser from './serverParser.js';
import runClass from './runClass.js';
import runInstance from './runInstance.js';
import stampPosition from './compileExpression/stampPosition.js';
import unescapeExpression from './compileExpression/unescapeExpression.js';
import WebParser from './webParser.js';

export {
  compileExpression,
  emitOperatorClosures,
  evaluateClosures,
  evaluateWebClosures,
  hasOperators,
  evaluateOperators,
  hasDynamicMarker,
  hasDynChild,
  getFromArray,
  getFromObject,
  isExpression,
  ServerParser,
  runClass,
  runInstance,
  stampPosition,
  unescapeExpression,
  WebParser,
};
