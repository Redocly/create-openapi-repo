# <%= name %> API Spec
<% if (travis) { %>[![Build Status](https://travis-ci.org/<%= repo %>.svg?branch=master)](https://travis-ci.org/<%= repo %>)<% } %>

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
- Import spec by URL in editor, online or local (you should uncheck "Use CORS proxy" in the model)

## Tests

Run command from project root directory:

```bash
npm test
```
