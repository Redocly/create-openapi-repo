# <%= name %> OpenAPI Specification
[![Build Status](https://travis-ci.org/<%= repo %>.svg?branch=master)](https://travis-ci.org/<%= repo %>)

## Post-generate steps

1. Setup [Travis](https://docs.travis-ci.com/user/getting-started/#To-get-started-with-Travis-CI)(**note**: you already have `.travis.yml` file).
2. Make a test commit to trigger CI. For example
3. If you setup everything right you <%= ghPagesBaseUrl %> will lead to your new docs
4. [Optional] You can setup [custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/)(just create `web/CNAME` file)
5. Start writing/editing your OpenAPI spec and this [tutorial](https://apihandyman.io/writing-openapi-swagger-specification-tutorial-part-2-the-basics/) is a good starting point. 
6. [Optional] If you documenting public API please consider adding it into [APIs.guru](https://APIs.guru) directory using [this form](https://apis.guru/add-api/).
7. Delete this section :smile:

## Installing

1. Install [Node JS](https://nodejs.org/)
2. Clone repo and `cd`
    + Run `npm install`

## Usage

- Run `npm start`
- Look full spec:
    + JSON [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json)
    + YAML [http://localhost:3000/swagger.yaml](http://localhost:3000/swagger.yaml)  (may not be fully functional)
<% if (installSwaggerUI) { %>- Browse Swagger UI:
    + JSON [http://localhost:3000/swagger-ui/?url=http://localhost:3000/swagger.json](http://localhost:3000/?url=http://localhost:3000/swagger.json)
    + YAML [http://localhost:3000/swagger-ui/?url=http://localhost:3000/swagger.yaml](http://localhost:3000/?url=http://localhost:3000/swagger.yaml)  (may not be fully functional)
<% } %>- Browse ReDoc: [http://localhost:3000/](http://localhost:3000/)
- Preview spec version for branch `<branch>` (**doesn't work locally**): [http://<%= ghRepoUser %>.github.io/<%= ghRepoName %>/preview/&lt;branch&gt;](http://<%= ghRepoUser %>.github.io/<%= ghRepoName %>/preview/branch)
**!** Branch preview is not available until Travis CI deploy it
- Import spec by URL in editor, online or local (you should uncheck "Use CORS proxy" in the model)

## Tests

Run command from project root directory:

```bash
npm test
```
