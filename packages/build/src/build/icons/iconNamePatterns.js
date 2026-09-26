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

// The three icon name forms. Lowercase belongs to semantic names only, so a
// Lucide kebab name (Lucide's "delete" is a backspace key) never shadows the
// semantic "delete"; Lucide's own names are PascalCase.
const semanticNamePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const setNamePattern = /^[A-Z][A-Za-z0-9]*$/;
const qualifiedNamePattern = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*):([A-Z][A-Za-z0-9]*)$/;

// Detection only, for migration messages: the pack prefixes of every
// react-icons 5.6.0 pack Lowdefy 6 bundled, and stale Ant Design icon names.
const reactIconsNamePattern =
  /^(Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9]\w*$/;
const antDesignNamePattern = /^[A-Z][A-Za-z0-9]*(Outlined|Filled|TwoTone)$/;

export {
  antDesignNamePattern,
  qualifiedNamePattern,
  reactIconsNamePattern,
  semanticNamePattern,
  setNamePattern,
};
