# References and Templates

References and templates have the following use cases:
- Splitting out the config for readability and code navigation.
- Splitting out a piece of config in order to use the exact same config in multiple places.
- Using a reference with variables to make use of a shared piece of config with dynamic variables.
- Using a `.njk` file to create config files using the Nunjucks templating language.
- Using resolver and transformer functions to create Lowdefy config using Javascript functions.

## Using References to Improve Readability

References are made using the [`_ref`](/_ref) operator. If the referenced file has a `.yaml` or `.json` extension, the contents of the file will be parsed, else the file content is included as a string (this is useful for `.md` or `.html` files). As an example of splitting an app into logically distinct files, references can be used to write each page as a separate file:

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  _ref: pages/page1.yaml # Path to the referenced file. Always from the root of the project.
  _ref: pages/page1.yaml
```

## Using References as Templates for Improved Reusability

The `_ref` operator can take an argument called `vars`. This can be any data, and is passed down to later be accessed with the [`_var`](/_var) operator. By using vars, the referenced file can become a template, using the given variables. For example, a standard page template might be used for multiple pages in an app:

###### pages/page1.yaml
```yaml
_ref:
  path: templates/text_page.yaml
  vars:
    id: page1
    title: Page 1
    content:
      _ref: markdowns/content.md
```

###### markdowns/content.md
```yaml
Page content text.
```

###### templates/text_page.yaml
```yaml
id:
  _var: id
type: PageHeaderMenu
properties:
  title:
    _var: title
blocks:
  - id: content_card
    type: Card
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _var: title
      - id: content
        type: Markdown
        properties:
          content:
            _var: content
```

## Nunjucks Templating

Templating can be taken further by referencing [Nunjucks](https://mozilla.github.io/nunjucks/) template files. If a file ends with the `.njk` file extension, the file will first be hydrated as a Nunjucks template, using the `vars` as template variables. If the file ends with `.yaml.njk` or `.json.njk`, the output of the template will then be parsed. Nunjucks templates are useful since the template file does not need to be valid yaml before it is hydrated, and features like for-loops and if-statements can be used.

Templating is used extensively to create the Lowdefy docs (these docs are a Lowdefy app). You can look at how they are used [here](https://github.com/lowdefy/lowdefy/tree/main/packages/docs).

We can modify the example above to make use of nunjucks templating to allow us to add subsections to our page. This can be done as follows:

###### pages/page1.yaml
```yaml
_ref:
  path: templates/text_page.yaml.njk
  vars:
    id: page1
    title: Page 1
    content:
      _ref: markdowns/content.md
    subsections:
      - id: subsection1
        title: Subsection 1
        content: |
          Subsection 1 content text.
      - id: subsection2
        title: Subsection 2
        content: |
          Subsection 2 content text.
```

###### markdowns/content.md
```yaml
Page content text.
```

###### templates/text_page.yaml.njk
```yaml
id:
  _var: id
type: PageHeaderMenu
properties:
  title:
    _var: title
blocks:
  - id: content_card
    type: Card
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _var: title
      - id: content
        type: Markdown
        properties:
          content:
            _var: content
      {% if subsections %}
      {% for subsection in subsections %}
      - id: {{ subsection.id }}_title
        type: Title
        properties:
          content: {{ subsection.title }}
      - id: {{ subsection.id }}_content
        type: Markdown
        properties:
          content: {{ subsection.content }}
      {% endfor %}
      {% endif %}
```

### Required and optional vars

A `_var` read written as a string — `_var: title` — requires the var. If the `_ref` that loads the file does not supply `title`, the build fails with an error naming the var, the file that reads it, and the `_ref` that should have supplied it, together with the var names that `_ref` did supply. This catches a typo in a var name, which used to render the template with a silently missing value.

To read a var that a caller may legitimately leave out, write the object form with a `default`:

```yaml
properties:
  title:
    _var: title # required - the _ref must supply it
  subtitle:
    _var:
      key: subtitle
      default: null # optional - null when not supplied
```

Writing a `default` key is what makes a var optional, including `default: null`. `_var: { key: subtitle }` with no `default` key is required, exactly like the string form.

A var supplied as `null` (`vars: { subtitle: null }`) counts as supplied and does not fail the build — only a var the `_ref` never wrote at all is missing.

## Custom JavaScript Functions

The `_ref` operator can also be extended with custom JavaScript functions. A `resolver` function can be specified, which can overwrite the default way configuration files are read from the filesystem. A `transformer` function can be used to transform the value returned by the `_ref` operator.

### Resolver

This resolver function will first look for the configuration file in the current working directory, but if the file is not found it will be read from an adjacent "shared" directory. This pattern can be used to build apps that mostly use a shared configuration, with a few components that are customised per app.

###### resolvers/useLocalOrSharedConfig.js
```js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFilePromise = promisify(fs.readFile);

async function useLocalOrSharedConfig(refPath, vars, context) {
  let fileContent
  try {
    fileContent =  await readFilePromise(path.resolve(refPath), 'utf8');
    return fileContent;
  } catch (error) {
    if (error.code === 'ENOENT') {
      fileContent = readFilePromise(path.resolve('../shared', refPath), 'utf8');
      return fileContent;
    }
    throw error;
  }


}

module.exports = useLocalOrSharedConfig;
```

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

cli:
  refResolver: resolvers/useLocalOrSharedConfig.js

pages:
  - _ref: pages/local-page.yaml
  - _ref: pages/shared-page.yaml
```

### Transformer

This transformer adds a standard footer to each page:

###### transformers/addFooter.js
```js
function addFooter(page, vars) {
  const footer = {
    // ...
  };
  page.areas.footer = footer;
  return page;
}
module.exports = addFooter;
```

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  - _ref:
      path: pages/page1.yaml
      transformer: transformers/addFooter.js
```
