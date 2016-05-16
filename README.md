# generator-openapi-repo [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Yeoman generator for OpenAPI(fka Swagger) repo to help you share spec for your API

## Installation

First, install [Yeoman](http://yeoman.io) and generator-openapi-repo using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-openapi-repo
```

Then generate your new project:

```bash
yo openapi-repo
```

## Updating existing project
  - First make sure you have committed everything or have a backup
  - just run `yo openapi-repo` over the project again
  - `yo` will ask you for each file if you want to overwrite
  - for those files you haven't edited, just say yes
  - for the other ones, type d for diff and see what's changed



[npm-image]: https://badge.fury.io/js/generator-openapi-repo.svg
[npm-url]: https://npmjs.org/package/generator-openapi-repo
[daviddm-image]: https://david-dm.org/Rebilly/generator-openapi-repo.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Rebilly/generator-openapi-repo
