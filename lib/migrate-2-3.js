const yaml = require('js-yaml');
const fs = require('fs');
const { basename, dirname, extname, join, relative, resolve, sep } = require('path');

const mkdirp = require('mkdirp');

const inquirer = require('inquirer');
const chalk = require('chalk');

const {
  readYaml,
  writeYaml,
  traverseFolderDeep,
  replace$Refs,
  implicitlyReferenceDiscriminator,
  OPENAPI3_COMPONENTS,
  OPENAPI3_METHODS
} = require('./utils');

const prompt = inquirer.createPromptModule();

let paths = {};

let securitySchemes = {};
let codeSamplesLangs;

module.exports = async function migrate() {
  const schemaFiles = {};
  paths = {};
  securitySchemes = {};

  console.log('Starting create-openapi-repo migration tool...');
  if (
    !fs.existsSync('redocly.yaml') ||
    !fs.existsSync('spec') ||
    !fs.statSync('spec').isDirectory()
  ) {
    console.warn(
      chalk.yellow(
        'create-openapi-repo v2 not detected. Make sure you run migration script from the root of your repository'
      )
    );
    process.exit(1);
  }

  const { proceed } = await prompt({
    type: 'confirm',
    name: 'proceed',
    message: chalk.yellow(
      'Please, make sure you have a back-up. Migration may loose some data. Proceed?'
    ),
    default: false
  });

  if (!proceed) {
    return;
  }

  console.log('Loading schemas info...');
  traverseFolderDeep('spec/components/schemas', filename => {
    if (!filename.endsWith('.yaml')) return;
    const name = basename(filename, '.yaml');
    if (schemaFiles[name]) {
      throw new Error('Conflict schema name: ' + name);
    }

    const data = readYaml(filename);
    let inherits = [];
    if (data.allOf) {
      inherits = data.allOf.map(s => s.$ref).filter(Boolean);
    }
    schemaFiles[name] = {
      filename,
      inherits
    };
  });

  console.log('Loading code samples...');
  try {
    codeSamplesLangs = fs.readdirSync('spec/code_samples');
  } catch (e) {
    codeSamplesLangs = [];
  }

  const pathsFiles = fs.readdirSync('spec/paths');
  console.log('Updating paths...');
  for (const file of pathsFiles) {
    if (!file.endsWith('.yaml')) continue;
    const encodedPath = basename(file, '.yaml');
    const path = encodedPath.replace(/@/g, '/');
    paths['/' + path] = {
      $ref: './' + join('paths', file)
    };

    const pathData = readYaml(join('spec/paths', file));
    replace$Refs(pathData, 'spec/paths', 'spec/components', schemaFiles);

    injectCodeSamples(pathData, encodedPath, codeSamplesLangs);
    writeYaml(pathData, join('spec/paths', file));
  }

  console.log('Updating schemas...');
  for (const componentGroup of OPENAPI3_COMPONENTS) {
    const componentDir = join('spec', 'components', componentGroup);
    traverseFolderDeep(componentDir, filename => {
      if (!filename.endsWith('.yaml')) {
        return;
      }
      const componentData = readYaml(filename);
      let currentRelative = relative(dirname(filename), componentDir);
      if (!currentRelative.startsWith('.')) {
        currentRelative = '.' + sep + currentRelative;
      }

      const compName = basename(filename, extname(filename));

      if (componentGroup === 'schemas') {
        implicitlyReferenceDiscriminator(
          componentData,
          basename(filename, extname(filename)),
          filename,
          schemaFiles,
        );
      }
      replace$Refs(componentData, dirname(filename), 'spec/components', schemaFiles);
      writeYaml(componentData, filename);

      if (componentGroup === 'securitySchemes') {
        securitySchemes[compName] = { $ref: relative('spec', filename) };
      }
    });
  }

  console.log('Rename directory "spec" to "openapi"...');
  let openapiDir = 'spec';
  if (fs.existsSync('openapi')) {
    console.warn(
      chalk.yellow(
        'WARNING: Failed to rename directory "spec" to "openapi". Directory "openapi" already exists'
      )
    );
  } else {
    fs.renameSync('spec', 'openapi');
    openapiDir = 'openapi';
  }

  console.log('Remove redocly.yaml');
  fs.unlinkSync('redocly.yaml');

  console.log('Create default .redocly.yaml');
  let redocConfig;
  if (fs.existsSync('web/redoc-config.yaml')) {
    redocConfig = readYaml('web/redoc-config.yaml');
    fs.unlinkSync('web/redoc-config.yaml');
    delete redocConfig.redocURL;
    delete delete redocConfig.redocExport;
  }

  const mdDescription = redocConfig.unstable_externalDescription;
  delete redocConfig.unstable_externalDescription;

  const cliConfig = {
    apiDefinitions: {
      main: `${openapiDir}/openapi.yaml`
    },
    lint: {
      rules: {
        'no-unused-schemas': 'warning'
      }
    },
    referenceDocs: redocConfig
  };

  if (fs.existsSync(`${openapiDir}/plugins`)) {
    console.warn(
      chalk.red(
        `${chalk.bold('WARNING!')} You were using plugins. They can't be migrated automatically`
      )
    );
    console.warn(
      chalk.yellow(
        `Use openapi-cli transformers feature. Precreating ${chalk.blue(
          'tranformers'
        )} directory...`
      )
    );
    mkdirp.sync('transformers');
    fs.writeFileSync(
      'transformers/index.js',
      '// require transfomers here and export them as an array below\n\n module.exports = [];\n'
    );
    cliConfig.lint.transformers = './transformers/index.js';
    console.log(chalk.yellow(`${chalk.blue(`${openapiDir}/plugins`)} folder not removed`));
  }

  writeYaml(cliConfig, '.redocly.yaml');

  if (mdDescription) {
    console.log(
      chalk.yellow('Updating entrypoint openapi.yaml..., formatting and comments will be lost')
    );
    const openapi = readYaml(`${openapiDir}/openapi.yaml`);
    openapi.info = openapi.info || {};
    openapi.info.description = {
      $ref: relative(resolve(openapiDir), resolve('web', mdDescription))
    };

    openapi.paths = paths;
    if (Object.keys(securitySchemes).length > 0) {
      openapi.components = { securitySchemes };
    }
    writeYaml(openapi, `${openapiDir}/openapi.yaml`);
  } else {
    const appendStr =
      (Object.keys(securitySchemes).length > 0
        ? yaml.safeDump({ components: { securitySchemes } }) + '\n'
        : '') + yaml.safeDump({ paths });

    console.log('Updating entrypoint openapi.yaml...');
    appendToFile(`${openapiDir}/openapi.yaml`, appendStr, '\n\n');
  }

  migratePackageJson();

  printFinalInstructions();

  console.log('All done!');
};

function printFinalInstructions() {
  console.log(`
Automatic migration completed succesfully 🎉

To finish, update dependencies by running:

  ${chalk.blue(`yarn install`)}

After that verify your migration by running:

  ${chalk.blue(`npm test`)}

We use new validation tool now, so there are changes it can find new issues in your definition.
Fix them or disable or make warnings corresponding rules.
See example in ${chalk.blue(`.redocly.yaml`)} and on openapi-cli GitHub page.
`);
}

function migratePackageJson() {
  console.log('Updating package.json...');

  const packageJson = readYaml('package.json');
  packageJson.dependencies = packageJson.dependencies || {};
  delete packageJson.dependencies['swagger-repo'];
  packageJson.dependencies['@redocly/openapi-cli'] = '^0.7.0';

  packageJson.scripts = packageJson.scripts || {};

  if (packageJson.scripts.start.indexOf('swagger-repo serve') > -1) {
    packageJson.scripts.start = 'openapi preview-docs';
  } else {
    console.log(
      chalk.yellow(
        `Warning: can't migrate "start" script. Use "openapi preview-docs" to preview docs`
      )
    );
  }

  if (packageJson.scripts.build.indexOf('swagger-repo build') > -1) {
    packageJson.scripts.build = 'openapi bundle -o dist';
    appendToFile('.gitignore', '# OpenAPI output bundles folder\ndist', '\n\n');
  } else {
    console.log(
      chalk.yellow(
        `Warning: can't migrate "build" script. Use "openapi bundle -o dist" to bundle definitions`
      )
    );
  }

  if (packageJson.scripts.test.indexOf('swagger-repo validate') > -1) {
    packageJson.scripts.test = 'openapi validate';
  } else {
    console.log(
      chalk.yellow(
        `Warning: can't migrate "test" script. Use "openapi validate" to validate your API definitions`
      )
    );
  }

  if (packageJson.scripts['gh-pages'].indexOf('swagger-repo gh-pages') > -1) {
    packageJson.scripts['gh-pages'] = 'echo "Not implemented"';
  }

  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

function appendToFile(filename, str, separator = '\n') {
  const contents = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf-8') + separator : '';
  fs.writeFileSync(filename, contents + str);
}

function injectCodeSamples(pathData, encodedPathName, langs) {
  if (!langs.length) return;

  for (const lang of langs) {
    const samplesDir = join('spec', 'code_samples', lang, encodedPathName);
    if (!fs.existsSync(samplesDir)) continue;

    const samples = fs.readdirSync(samplesDir);

    for (const op of OPENAPI3_METHODS) {
      if (!pathData[op]) continue;

      const sampleFile = samples.find(file => basename(file, extname(file)) === op);
      if (!sampleFile) continue;

      pathData[op]['x-code-samples'] = pathData[op]['x-code-samples'] || [];
      pathData[op]['x-code-samples'].push({
        lang,
        source: {
          $ref: join('..', 'code_samples', lang, encodedPathName, sampleFile)
        }
      });
    }
  }
}
