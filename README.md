# generator-openapi-repo [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Yeoman generator for OpenAPI(fka Swagger) repo to help you share spec for your API

## Why?
There are a few advantages in hosting your API specification + docs on GitHub:
 - Community engagement (PR's and issues)
 - Hosting on GitHub pages (perfect uptime, CDN, Jekyll, custom domains with CNAME)
 - Advertisment in the GitHub community
 - Revision history, branching, CI
 - Fast on-boarding time (everyone knows how to use GitHub :smile:)

## Features
This generator helps to create a GitHub repo with the following features:
 - Possibility to split a big Swagger spec into smaller files and bundle it for deployment
 - Continuous integration/deployment on Travis
 - Code samples as separate files
 - Swagger spec is validated after each commit
 - Swagger spec + ReDoc deployed to Github Pages (you can use a custom domain)
 - Live editing in your editor or `swagger-editor` :heart_eyes:
 ![live editing](./live-edit.gif)

## Installation

We assume you already have [node.js](https://nodejs.org/) installed.

- First, install [Yeoman](http://yeoman.io) and `generator-openapi-repo`:
```bash
npm install -g yo
npm install -g generator-openapi-repo
```
- Then [create GitHub repo](https://help.github.com/articles/create-a-repo/#create-a-new-repository-on-github) where your OpenAPI spec will live.
- [Clone your repo](https://help.github.com/articles/cloning-a-repository/) and execute the following command inside it:
```bash
yo openapi-repo
```
-  Commit and push your changes to the GitHub and follow instruction from `README.md` of your newly created repo.
**Note**: don't forget to commit the `.yo-rc.json` file, it contains all answers gave to yeoman, and they are reused during the update procedure.

## Updating an existing project
  - First make sure you have committed everything or have a backup
  - Run `yo openapi-repo` over the project again
  - `yo` will ask you for each file if you want to overwrite
  - For those files you haven't edited, just say yes
  - For the other ones, type `d` for diff and see what's changed

[npm-image]: https://badge.fury.io/js/generator-openapi-repo.svg
[npm-url]: https://npmjs.org/package/generator-openapi-repo
[daviddm-image]: https://david-dm.org/Rebilly/generator-openapi-repo.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Rebilly/generator-openapi-repo
