import YAML from 'js-yaml';
import basic from './examples/basic.yaml';
import grid from './examples/grid.yaml';
import kanban from './examples/kanban.yaml';
import complex from './examples/complex.yaml';
import row from './examples/row.yaml';
import col from './examples/col.yaml';

const dumpYaml = (data) => {
  if (!data) {
    return '';
  }
  return YAML.safeDump(data, {
    // sortKeys: true,
    noRefs: true,
  });
};

const addBlocks = (acc, title, blocks) => {
  acc.push({
    id: 'grids',
    type: 'Markdown',
    properties: {
      content: title,
    },
  });
  (blocks || []).forEach((ex) => {
    acc.push({
      id: 'p',
      type: 'Markdown',
      properties: {
        content: `\`\`\`\`yaml
${dumpYaml(ex)}
`,
      },
    });
    acc.push(ex);
  });
};

const getEx = () => {
  const m = [];
  addBlocks(m, ' # Basic Layouts', basic);
  addBlocks(m, ' # Col Options', col);
  addBlocks(m, ' # Row Options', row);
  addBlocks(m, ' # Grid Layouts', grid);
  addBlocks(m, ' # Kanban Layouts', kanban);
  addBlocks(m, ' # Complex Layouts', complex);
  return m;
};

const examples = {
  id: 'page',
  type: 'Page',
  areas: {
    content: {
      blocks: [...getEx()],
    },
  },
};

export default examples;
