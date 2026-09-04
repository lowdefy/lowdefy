# Custom HTML

> SECURITY WARNING: Custom HTML can execute JavaScript inside your Lowdefy app. Insecure code can expose your app or data. Since Lowdefy doesn't validate your custom code, make sure that you only load trusted code.

It is possible to extend the functionality of a Lowdefy app by loading custom code (HTML, CSS and JavaScript) into the HTML `head` and `body` of all pages. This can be useful for executing third party code such as Google Analytics, Intercom, etc. However, if the goal is to extend the functionality of your Lowdefy app with custom blocks, operators, actions or requests, use [plugins](/plugins).

The content loaded into the `head` and `body` tag can be any valid HTML. Be sure to only load trusted code into your app, as this code will be able to execute JavaScript on all pages of your Lowdefy app, which could expose you app or data to security vulnerabilities. Your own code can also be hosted from the [Lowdefy public folder](/hosting-files).

## Schema to load custom code

- `app.html.appendHead: string`: Any valid HTML content can be loaded just before the `</head>` tag of the page.
- `app.html.appendBody: string`: Any valid HTML content can be loaded just before the `</body>` tag of the page.

Most often it is convenient to abstract this HTML out to a separate file using the [`_ref`](/_ref) operator.

> __Warning__: Code imported using `appendHead` or `appendBody` will be loaded, and can execute JavaScript on every page of your Lowdefy app.

#### Examples

###### Loading third party code snippet like Google Analytics:

To add [Google Analytics](/https://developers.google.com/analytics/devguides/collection/analyticsjs) to a Lowdefy app, the `lowdefy.yaml` can be setup with:

```yaml
name: google-analytics-example
lowdefy: 5.5.1
# ...
app:
  html:
    appendHead: |
      <!-- Google Analytics -->
      <script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

      ga('create', 'UA-XXXXX-Y', 'auto');
      ga('send', 'pageview');
      </script>
      <!-- End Google Analytics -->
# ...
```
