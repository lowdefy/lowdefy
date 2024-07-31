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

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const globSync = require('glob').globSync;

// Function to convert a single YAML file to JSON
function convertYamlToJson(filePath) {
  try {
    const yamlContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = yaml.load(yamlContent);
    const fileName = filePath
      .split('/')
      .pop()
      .replace(/\.yaml$/, '.json');
    const syntaxesPath = path.join(process.cwd(), 'out', 'syntaxes');
    if (!fs.existsSync(syntaxesPath)) {
      fs.mkdirSync(syntaxesPath, { recursive: true });
    }
    fs.writeFileSync(path.join(syntaxesPath, fileName), JSON.stringify(jsonData, null, 2), 'utf8');
  } catch (error) {
    throw Error(`Error converting ${filePath}: ${error.message}`);
  }
}

function copyJsonFile(filePath) {
  try {
    const fileName = filePath.split('/').pop();
    const syntaxesPath = path.join(process.cwd(), 'out', 'syntaxes');
    if (!fs.existsSync(syntaxesPath)) {
      fs.mkdirSync(syntaxesPath, { recursive: true });
    }
    fs.copyFileSync(filePath, path.join(syntaxesPath, fileName));
  } catch (error) {
    throw Error(`Error copying ${filePath}: ${error.message}`);
  }
}

function transpileSyntaxes() {
  const yamlFiles = globSync('syntaxes/*.yaml');
  const jsonFiles = globSync('syntaxes/*.json');
  yamlFiles.forEach((file) => convertYamlToJson(file));
  jsonFiles.forEach((file) => copyJsonFile(file));
}

transpileSyntaxes();
