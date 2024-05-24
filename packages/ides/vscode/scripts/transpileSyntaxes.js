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
