async function page(request, reply) {
  // TODO: Maybe we read page here and redirect to 404 if we need to
  // const { pageId } = request.params;
  let indexHtml = '<head></head><body><h1>Hello</h1></body>';
  // indexHtml = indexHtml.replace(/__LOWDEFY_PAGE_ID__/g, pageId);
  reply.type('text/html');
  reply.send(indexHtml);
}

export default page;

// const serveIndex = async (req, res) => {
//   if (!indexHtml || development) {
//     indexHtml = await readFile(path.resolve(shellDirectory, 'index.html'));
//     let appConfig = await readFile(path.resolve(buildDirectory, 'app.json'));
//     appConfig = JSON.parse(appConfig);
//     indexHtml = indexHtml.replace(
//       '<!-- __LOWDEFY_APP_HEAD_HTML__ -->',
//       get(appConfig, 'html.appendHead', { default: '' })
//     );
//     indexHtml = indexHtml.replace(
//       '<!-- __LOWDEFY_APP_BODY_HTML__ -->',
//       get(appConfig, 'html.appendBody', { default: '' })
//     );
//     indexHtml = indexHtml.replace(/__LOWDEFY_SERVER_BASE_PATH__/g, serverBasePath);
//   }
//   res.send(indexHtml);
// };
