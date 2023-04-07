# How to use references

When starting a new Lowdefy application, your app is simple, uncomplicated and easy to navigate between pages, blocks, requests and actions. Unfortunately as with any software application, as you add more functionality, your app code start to grow to thousands of lines of code. When writing an app using conventional tools like javascript, you'd deal with this complexity by splitting your app into methods, files and folders. A experienced programmer will make design choices to best abstract portions of the code to make the app more understandable and maintainable.

With Lowdefy the built configuration is served in one giant JSON blob. you can do the same by splitting portions of your Lowdefy config into separate files and folders, and stich them together and ... _`To Be Continued`_

Until the continuation happens here is an example app that uses `_ref`

https://github.com/lowdefy/lowdefy-example-crud

In https://github.com/lowdefy/lowdefy-example-crud/blob/main/lowdefy.yaml line 58 

```
  - _ref: pages/brands/brands.yaml
```
and line 63
```
  - _ref: pages/products/products.yaml
```

There is a reference to a separate file. This is even further subdivided in the products page which have sub `_ref` on line 152
```
      - _ref: pages/products/components/product_list.yaml
```


