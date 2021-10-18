import importUmd from './importUmd.js';
import vfs from './vfs_fonts.js';
const pdfMake = await importUmd(`https://unpkg.com/pdfmake@0.1.71/build/pdfmake.min.js`);
const pdfMakeFn = async (context, filename, docDefinition, tableLayouts, fonts) => {
  await pdfMake.createPdf(docDefinition, tableLayouts, fonts, vfs).download(filename);
};
window.lowdefy.registerJsAction('pdfMake', pdfMakeFn);
