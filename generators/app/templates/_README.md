# <%= name %> OpenAPI Specification
[![Build Status](https://travis-ci.org/<%= repo %>.svg?branch=master)](https://travis-ci.org/<%= repo %>)

## Post-generate steps

1. Setup [Travis](https://docs.travis-ci.com/user/getting-started/#To-get-started-with-Travis-CI)(**note**: you already have `.travis.yml` file).
2. You need to [create access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) and when you will be presented with `Select scopes` section you need to check `public_repo`. Than use token value as value of  [Travis enviroment variable](https://docs.travis-ci.com/user/environment-variables/#Defining-Variables-in-Repository-Settings) named `GH_TOKEN`.
2. Make a test commit to trigger CI: `git commit --allow-empty -m "Test Travis CI" && git push`
3. If you setup everything right than <%= ghPagesBaseUrl %> will lead to your new docs.
4. [Optional] You can setup [custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/)(just create `web/CNAME` file)
5. Start writing/editing your OpenAPI spec and this [tutorial](https://apihandyman.io/writing-openapi-swagger-specification-tutorial-part-2-the-basics/) is a good starting point.
6. [Optional] If you documenting public API please consider adding it into [APIs.guru](https://APIs.guru) directory using [this form](https://apis.guru/add-api/).
7. Delete this section :smile:

## Links

- Documentation(ReDoc): <%= ghPagesBaseUrl %>
<% if (installSwaggerUI) { -%>
- SwaggerUI: <%= ghPagesBaseUrl %>swagger-ui/
<% } -%>
- Look full spec:
    + JSON <%= ghPagesBaseUrl %>swagger.json
    + YAML <%= ghPagesBaseUrl %>swagger.yaml
- Preview spec version for branch `<branch>`: <%= ghPagesBaseUrl %>preview/`branch`

**Warning:** All above links will updated only after Travis CI finish deploy

## Development
### Installing

1. Install [Node JS](https://nodejs.org/)
2. Clone repo and `cd`
    + Run `npm install`

### Usage

1. Run `npm start`
2. Checkout console output to see where local server is started. You can use all links (except preview) by replacing <%= ghPagesBaseUrl %> with url from this message: `Server started <url>`.
3. Make changes using your favorite editor or `swagger-editor` (look for URL in console output).
4. All changes are applied on your local server, moreover all documentation pages will be automagically refreshed in browser.
5. When you finish with your changes you can run tests using this command: `npm test`
6. Share you changes with the rest of the world by commiting it :smile:
