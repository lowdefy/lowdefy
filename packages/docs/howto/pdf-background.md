## Background
Generating PDFs are often required in workflow applications where data needs to be parsed into a document. These type of documents can be anything from quotes or invoices to contracts or even recipes. Making these documents represent the latest data, or exactly match the desired formatting can be tricky and time consuming. Auto generated PDFs are a great solution.

> This how-to assumes that you are already running a Lowdefy app locally in dev mode. If not:
> 
> 1. Create a empty folder.
> 2. Open your terminal or cmd and cd to your empty folder.
> 3. Run npx lowdefy@latest init && npx lowdefy@latest dev to initialize and start your Lowdefy app development server.


## 1. Choosing an open-source PDF library
The power of open-source is mind blowing. There are a number of well tested, popular, free and easy to use libraries available to generate PDFs.
We'll use [pdfMake](https://github.com/bpampuch/pdfmake) for this example, due to its great documentation and simple configuration settings.
Below is a list of some popular alternatives:

-  [JsPDF](https://github.com/MrRio/jsPDF)
-  [PDFKit](https://github.com/foliojs/pdfkit)
-  [Puppeteer](https://github.com/puppeteer/puppeteer)
-  [PDF-lib](https://github.com/Hopding/pdf-lib)

> If you use open-source libraries to automate your business and save you time, please try to thank the maintainers by contributing where possible, or simply providing sponsorship. Sponsorship links are usually found in the project readme files.

## 2. Register a customer JavaScript Action
Lowdefy actions are triggered by page events, like onClick when a user clicks a button, or onEnter when the page loads. Lowdefy comes with a list of predefined actions, however, sometimes custom code is the best awnser. Let's create a custom action which will generate a PDF based on pdfMake config.

1. Create a public folder inside your Lowdefy working directory.
2. Since all content in the public folder is served by the Lowdefy server, simply create a pdfMake.js file inside the public folder.
3. Add this script to the file and save.

###### /public/modules/pdfMake.js
```js 

  import importUmd from './importUmd.js';
  import vfs from './vfs_fonts.js';
  const pdfMake = await importUmd(
    `https://cdn.jsdelivr.net/npm/pdfmake@0.2.2/build/pdfmake.min.js`
  );
  const pdfMakeFn = async (
    context,
    filename,
    docDefinition,
    tableLayouts,
    fonts
  ) => {
    await pdfMake
      .createPdf(docDefinition, tableLayouts, fonts, vfs)
      .download(filename);
  };
  window.lowdefy.registerJsAction('pdfMake', pdfMakeFn);

```
