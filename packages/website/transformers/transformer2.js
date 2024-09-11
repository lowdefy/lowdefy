//____________________Example Transformer_______________________________//

const transformer = (_, obj) => {
  const regex = new RegExp('```ldf\\n([\\s\\S]*?)\\n```$', 'gm');
  let counter = 0;

  const examples = {
    id: 'examples',
    type: 'Box',
    layout: {
      contentGutter: 16,
    },
    blocks: [],
  };
  const parsedMarkdown = markdownText.split(regex).map((text, index) => {
    if (text.trim() !== '') {
      if (index % 2 !== 0) {
        const splitText = text.split(':').map((text) => text.trim());
        return Object.fromEntries([splitText]);
      }
      return {
        id: `md_${++counter}`,
        type: 'MarkdownWithCode',
        properties: {
          content: text.trim()
        }
      };
    }
  });

  obj.examples.forEach((example, i) => {
    examples.blocks.push(parsedMarkdown);
    examples.blocks.push({
      id: `example_block_box_${i}`,
      type: 'Box',
      layout: {
        span: 12,
      },
      blocks: example.extra ? [example.block, example.extra] : [example.block],
    });
    //     examples.blocks.push({
    //       id: `example_config_box_${i}`,
    //       type: 'Box',
    //       layout: {
    //         span: 12,
    //       },
    //       blocks: [
    //         {
    //           id: `example_config_${i}`,
    //           type: 'MarkdownWithCode',
    //           properties: {
    //             content: {
    //               _nunjucks: {
    //                 template: `
    // \`\`\`yaml
    // {{ block | safe }}
    // \`\`\`
    // `,
    //                 on: {
    //                   block: {
    //                     '_yaml.stringify': [
    //                       { '_json.parse': JSON.stringify(example.block) },
    //                       { sortKeys: false },
    //                     ], // copy this object, build must make a copy
    //                   },
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       ],
    //     });
  });
  return examples;
};

export default transformer;
