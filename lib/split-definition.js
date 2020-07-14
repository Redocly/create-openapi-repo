const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const chalk = require('chalk');
const isEqual = require('lodash.isequal');

const {
  writeYaml,
  readYaml,
  implicitlyReferenceDiscriminator,
  replace$Refs,
  traverseFolderDeep,
  OPENAPI3_COMPONENTS,
  OPENAPI3_METHODS
} = require('./utils');

function langToExt(lang) {
  return (
    {
      php: '.php',
      'c#': '.cs',
      shell: '.sh',
      curl: '.sh',
      bash: '.sh',
      javascript: '.js',
      js: '.js',
      python: '.py'
    }[lang.toLowerCase()] || '.txt'
  );
}

module.exports = function(openapi, openapiDir) {
  mkdirp.sync(openapiDir);
  const pathsDir = path.join(openapiDir, 'paths');
  mkdirp.sync(pathsDir);

  if (openapi.paths) {
    for (const oasPath of Object.keys(openapi.paths)) {
      const pathFile = path.join(pathsDir, pathToFilename(oasPath)) + '.yaml';
      const pathData = openapi.paths[oasPath];

      for (const method of OPENAPI3_METHODS) {
        const methodData = pathData[method];
        if (
          !methodData ||
          !methodData['x-code-samples'] ||
          !Array.isArray(methodData['x-code-samples'])
        ) {
          continue;
        }

        for (const sample of methodData['x-code-samples']) {
          if (sample.source && sample.source.$ref) continue;
          const sampleFileName = path.join(
            openapiDir,
            'code_samples',
            sample.lang,
            pathToFilename(oasPath),
            method + langToExt(sample.lang)
          );

          mkdirp.sync(path.dirname(sampleFileName));
          fs.writeFileSync(sampleFileName, sample.source);
          sample.source = {
            $ref: path.relative(pathsDir, sampleFileName)
          };
        }
      }

      writeYaml(pathData, pathFile);
      openapi.paths[oasPath] = {
        $ref: path.relative(openapiDir, pathFile)
      };
    }
  }

  const componentsDir = path.join(openapiDir, 'components');
  mkdirp.sync(componentsDir);

  const componentsFiles = {};

  if (openapi.components) {
    for (const componentType of OPENAPI3_COMPONENTS) {
      const compDir = path.join(componentsDir, componentType);
      if (openapi.components[componentType]) {
        mkdirp.sync(compDir);

        for (const componentName of Object.keys(openapi.components[componentType])) {
          const filename = path.join(compDir, componentName) + '.yaml';
          const componentData = openapi.components[componentType][componentName];
          if (fs.existsSync(filename) && isEqual(readYaml(filename), componentData)) {
            console.warn(
              chalk.yellow(
                `warning: conflict for ${componentName} - file already exists with different content: ${chalk.blue(
                  filename
                )} ... Skip.`
              )
            );
            continue;
          }
          writeYaml(componentData, filename);

          let inherits = [];
          if (componentType === 'schemas') {
            inherits = (componentData.allOf || []).map(s => s.$ref).filter(Boolean);
          }
          componentsFiles[componentType] = componentsFiles[componentType] || {};
          componentsFiles[componentType][componentName] = {
            inherits,
            filename
          };

          if (componentType !== 'securitySchemes') {
            // security schemas must referenced from components
            delete openapi.components[componentType][componentName];
          }
        }
        if (Object.keys(openapi.components[componentType]).length === 0) {
          delete openapi.components[componentType];
        }
      }
    }
    if (Object.keys(openapi.components).length === 0) {
      delete openapi.components;
    }
  }

  traverseFolderDeep(pathsDir, filename => {
    if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
      return;
    }
    const pathData = readYaml(filename);
    replace$Refs(pathData, pathsDir, componentsFiles);
    writeYaml(pathData, filename);
  });

  traverseFolderDeep(componentsDir, filename => {
    if (!filename.endsWith('.yaml') && !filename.endsWith('.yml')) {
      return;
    }
    const compData = readYaml(filename);
    replace$Refs(compData, path.dirname(filename), componentsFiles);
    implicitlyReferenceDiscriminator(
      compData,
      path.basename(filename, path.extname(filename)),
      filename,
      componentsFiles.schemas || {}
    );
    writeYaml(compData, filename);
  });

  replace$Refs(openapi, openapiDir, componentsFiles);
  writeYaml(openapi, path.join(openapiDir, 'openapi.yaml'));
};

function pathToFilename(path) {
  return path
    .replace(/~1/g, '/')
    .replace(/~0/g, '~')
    .substring(1)
    .replace(/\//g, '@');
}
