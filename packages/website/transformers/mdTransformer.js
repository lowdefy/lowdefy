// @Gerrie

export const mdTransformer = (markdownText) => {
  const regex = new RegExp('```ldf\\n([\\s\\S]*?)\\n```$', 'gm');
  let counter = 0;

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

  // return parsedMarkdown.filter((object) => !!object);

  return parsedMarkdown.filter((object) => !!object);
}

//____________________Original Function_______________________________//

// function mdTransformer(markdownText, vars) {
//   const regex = new RegExp('```ldf\\n([\\s\\S]*?)\\n```$', 'gm');
//   let counter = 0;
//
//   const parsedMarkdown = markdownText.split(regex).map((text, index) => {
//     if (text.trim() !== '') {
//       if (index % 2 !== 0) {
//         const splitText = text.split(':').map((text) => text.trim());
//         return Object.fromEntries([splitText]);
//       }
//       return {
//         id: `md_${++counter}`,
//         type: 'MarkdownWithCode',
//         properties: {
//           content: text.trim()
//         }
//       };
//     }
//   });
//
//   return parsedMarkdown.filter((object) => !!object);
// }
//
// module.exports = mdTransformer;

