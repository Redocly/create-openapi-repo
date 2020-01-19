# create-openapi-repo

[![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

> Generate an organized multi-file OpenAPI repository.

<center>

<img src="./logo.png" width="500px"/>

</center>

## Who?
You! Hello.  Do you need to write or contribute to an OpenAPI definition?  If so, read on...

## What?
We recommend a docs-like-code approach to OpenAPI definitions:
- Write it using your favorite text-editor or IDE (we love VSCode).
- Organize it into multiple files and folders to make it easy to navigate.
- Store it using source control (such as GitHub).
- Continuously validate it using our free [openapi-cli tool](https://github.com/redocly/openapi-cli) or our free continuous validation service (coming soon).
- Bundle it (for a smaller footprint to use in other tools or for tools that do not support a multi-file format).

## Why?
There are a few advantages in hosting your API definition on GitHub:
 - Community engagement (PR's and issues -- if you have a public repo)
 - Advertisment in the GitHub community
 - Hosting on GitHub pages (perfect uptime, CDN, Jekyll, custom domains with CNAME)
 - Revision history, branching, CI
 - Review and approval workflows using Pull Requests
 - Fast on-boarding time (developers and tech writers know how to use GitHub :smile:)
 - Fully compatible with Redocly API Reference too

 There are also some advantages to a multi-file YAML format OpenAPI definition:
 - Reuse schema objects to keep things DRY (don't repeat yourself) 
 - Smaller diffs compared to JSON (especially for markdown descriptions)
 - Easier to navigate
 - Easier to edit with confidence

## Features
This generator helps to create a GitHub repo with the following features:
 - Split a big (or small) OpenAPI definition into smaller files organized into folders
 - Bundle it into a single file for deployment
 - Continuous integration/deployment on Travis or Redocly Workflows
 - Code samples as separate files
 - Automate deployment of your OpenAPI definition and docs
 - OpenAPI definition is validated after each commit
 - Live editing in your editor of choice :heart_eyes:

## Structure

You will have a structure similar to this:
```
    ├── .redocly.yaml
    ├── LICENSE
    ├── README.md
    ├── docs
    │   ├── favicon.png
    │   └── index.html
    ├── openapi
    │   ├── README.md
    │   ├── code_samples
    │   │   ├── C#
    │   │   │   └── echo
    │   │   │       └── post.cs
    │   │   ├── PHP
    │   │   │   └── echo
    │   │   │       └── post.php
    │   │   └── README.md
    │   ├── components
    │   │   └── README.md
    │   └── paths
    │       └── README.md
    └── package.json
```

However, you can adjust it to any structure you prefer.

The `openapi` folder is where your OpenAPI definition will live.  Inside there, and the sub-folders, there are `README.md` files to help guide you further. This is also where your entrypoint `openapi.yaml` will live.

The `components` folder is where you will organize sub-folders such as `schema` to define your schema.

The `paths` folder is where you will organize your paths. There will be a 'README.md' file in there with suggestions for how to organize it into specially named files (or folders) that use an `@` in place of a `/` (because files cannot have a `/` character in them).  You will also be able to use path parameters by wrapping them in curly braces `{example}`.

The `.redocly.yaml` file is a universal configuration for various Redocly tools including the lint tool and reference doc engine.

## Commands

The generated repository includes installing a dependency for our `openapi-cli` tool which supports commands such as `validate`, `bundle`, and more.  There are scripted shortcuts defined in the repository's `package.json`.  


## Examples of generated repositories
- https://github.com/Rebilly/RebillyAPI
- https://github.com/thingful/openapi-spec
- https://github.com/TwineHealth/TwineDeveloperDocs

## How to generate your repository

We assume you already have [node.js](https://nodejs.org/) installed.

- Install `create-openapi-repo` globally:
```bash
npm install -g create-openapi-repo
```
or use [`npx`](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b):

We'll use `npx` in this example.  However, remove `npx` if you installed it globally.

```bash
npx create-openapi-repo
```

You will be presented with some questions. You can create a new definition or use an existing definition to initialize your project.

Please note, if you do start a new one, remember to [create a GitHub repo](https://help.github.com/articles/create-a-repo/#create-a-new-repository-on-github) where your OpenAPI definition will live.

If you use the prior version of this generated repository, please read the following upgrade instructions.

#### Upgrading from a prior version

Migrate your repository from a previous structure of OpenAPI repo to this newer structure with our migration tool. 

Run this in the root folder of your repo.

```bash
npx create-openapi-repo --migrate-2-3
```

Note: the migration tool does not migrate plugins automatically. You would need to manually add them to the `transformers` folder. 

## Support

Thank you for wanting to support us. Here are some ideas how to support us:

* Star us
* Tell a friend or colleague about us (or Tweet about us)
* Write an article about it (and let us know) -- open an issue to let us know, with the link.
* Consider our commercial products if are looking for automation to ease the docs-like code workflow, hosting along with conveniences like custom domains, access controls and previews, API reference documentation, or a full developer portal:  https://redoc.ly

[npm-image]: https://badge.fury.io/js/generator-openapi-repo.svg
[npm-url]: https://npmjs.org/package/generator-openapi-repo
[daviddm-image]: https://david-dm.org/Rebilly/generator-openapi-repo.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Rebilly/generator-openapi-repo
