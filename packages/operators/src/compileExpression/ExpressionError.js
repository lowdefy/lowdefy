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

// Internal error thrown by the tokenizer/parser/emitter. It carries the column
// within the expression (1-based) so compileExpression can build a full message.
// The build layer converts this to a ConfigError with checkSlug 'expression'
// and the scalar's file position; keeping the compiler free of @lowdefy/errors
// concerns is not the goal (errors is already a dependency) — a dedicated class
// lets compileExpression distinguish its own parse failures from anything else.
class ExpressionError extends Error {
  constructor(message, { column } = {}) {
    super(message);
    this.name = 'ExpressionError';
    this.column = column ?? null;
  }
}

export default ExpressionError;
