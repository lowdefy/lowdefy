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

function extractPageContent(page) {
  const texts = [];
  texts.push(page.properties?.title ?? page.id);
  function walkBlock(block) {
    if (!block) return;
    texts.push(block.id);
    const props = block.properties ?? {};
    if (props.content) texts.push(props.content);
    if (props.title) texts.push(props.title);
    if (props.description) texts.push(props.description);
    if (props.placeholder) texts.push(props.placeholder);
    if (props.label) texts.push(props.label);
    if (Array.isArray(props.items)) {
      props.items.forEach((item) => {
        if (item.title) texts.push(item.title);
        if (item.description) texts.push(item.description);
      });
    }
    if (Array.isArray(props.options)) {
      props.options.forEach((option) => {
        if (option.label) texts.push(option.label);
      });
    }
    // Recurse into nested blocks
    (block.blocks ?? []).forEach(walkBlock);
    // Recurse into areas (legacy) and slots
    Object.values(block.areas ?? {}).forEach((area) => {
      (area.blocks ?? []).forEach(walkBlock);
    });
    Object.values(block.slots ?? {}).forEach((slot) => {
      (slot.blocks ?? []).forEach(walkBlock);
    });
  }

  (page.blocks ?? []).forEach(walkBlock);
  return texts.filter(Boolean).join('\n');
}

export default extractPageContent;
