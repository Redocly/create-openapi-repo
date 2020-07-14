#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const prompt = inquirer.createPromptModule();
const yaml = require('js-yaml');
const slugify = require('slugify');
const { execSync } = require('child_process');

const argv = require('yargs-parser')(process.argv.slice(2));

const {
  copy,
  copyDirSync,
  copyDirToSync,
  render,
  validateDefinitionFileName,
  readYaml
} = require('./lib/utils');

const { installDeps } = require('./lib/install-deps');

const migrate = require('./lib/migrate-2-3');
const splitDefinition = require('./lib/split-definition');

const OLD_REDOCLY_RC = 'redocly.yaml';
const REDOCLY_YAML = '.redocly.yaml';

async function ask(openapiRoot, docsRoot) {
  console.log('Welcome to the ' + chalk.green('OpenAPI-Repo') + ' generator!');

  const { haveDefinition } = await prompt({
    type: 'confirm',
    name: 'haveDefinition',
    message: 'Do you already have an OpenAPI/Swagger 3.0 definition for your API?',
    default: false
  });

  let definitionFileName;
  if (haveDefinition) {
    definitionFileName = (
      await prompt({
        type: 'input',
        name: 'definitionFileName',
        message: 'Please specify the path to the OpenAPI definition (local file):',
        validate(fileName) {
          return validateDefinitionFileName(fileName);
        }
      })
    ).definitionFileName;
  }

  let openapi;
  if (haveDefinition) {
    openapi = yaml.safeLoad(fs.readFileSync(definitionFileName, 'utf8'));
  }

  const { apiTitle } = await prompt({
    type: 'input',
    name: 'apiTitle',
    message: 'API Name:',
    default: haveDefinition ? openapi.info && openapi.info.title : undefined,
    validate: i => (i.length > 0 ? true : `API Name can't be empty`)
  });

  const { codeSamples } = haveDefinition
    ? { codeSamples: false }
    : await prompt({
        type: 'confirm',
        name: 'codeSamples',
        message: `Prepare manual code samples folder?`,
        default: true
      });

  let repo;

  const { proceed } = await prompt({
    type: 'confirm',
    name: 'proceed',
    message:
      `The following folders will be created: ${chalk.blue(openapiRoot)} and ${chalk.blue(
        docsRoot
      )}\n` +
      `You can change them by running ${chalk.blue(
        'create-openapi-repo <openapiDir> <docsDir>'
      )}\nProceed?`,
    default: true
  });

  return {
    definitionFileName,
    apiTitle,
    codeSamples,
    repo,
    proceed
  };
}

function printSuccess(opts, root) {
  let travisNote = '';
  if (opts.travis) {
    travisNote = `⚠️  We generated ${chalk.blue('.travis')} for you. Follow steps from ${chalk.blue(
      'README.md'
    )} to finish Travis CI setup`;
  }

  console.log(
    `\n\n${chalk.green('Success!')} Created ${chalk.green(path.basename(root))} folder.
You can run several commands:

  ${chalk.blue(`npm start`)}
    Starts the development server.

  ${chalk.blue(`npm run build`)}
    Bundles the definition.

  ${chalk.blue(`npm test`)}
    Validates the definition.

We suggest that you begin by typing:

  ${chalk.blue('npm start')}` + (travisNote ? '\n\n' + travisNote : '')
  );
}

async function run() {
  if (argv.migrate23) {
    await migrate();
    return;
  }
  if (argv.version) {
    console.log(require('./package.json').version);
    return;
  }

  const openapiRoot = argv._[0] || 'openapi';
  const docsRoot = argv._[1] || 'docs';

  if (fs.existsSync(path.join(OLD_REDOCLY_RC))) {
    console.log(`The current directory already contains ${chalk.green(OLD_REDOCLY_RC)}

Choose another directory or remove contents.
`);
    process.exit(1);
  }

  if (fs.existsSync(path.join(REDOCLY_YAML))) {
    console.log(`The current directory already contains ${chalk.green(REDOCLY_YAML)}

Choose another directory or remove contents.
`);
    process.exit(1);
  }

  const opts = await ask(openapiRoot, docsRoot);

  if (!opts.proceed) {
    return;
  }

  if (!fs.existsSync(openapiRoot)) {
    fs.mkdirSync(openapiRoot);
  }

  const data = {
    ...opts,
    packageName: slugify(opts.apiTitle).toLowerCase()
  };

  let { definitionFileName } = opts;
  if (!definitionFileName) {
    definitionFileName = require.resolve('openapi-template/openapi.yaml');
  }

  console.log(`\nCreating a new OpenAPI repo in ${chalk.blue(path.resolve('.'))}\n`);

  await render('.gitignore', {});
  await copy('LICENSE');
  await render('package.json', data);
  await render('README.md', data);
  await copy('openapi/README.md', openapiRoot);

  await render('.redocly.yaml', {
    mainDefinitionFile: path.posix.join(openapiRoot, 'openapi.yaml')
  });

  copyDirSync('openapi/components', openapiRoot);
  copyDirSync('openapi/paths', openapiRoot);

  if (opts.codeSamples) {
    copyDirSync('openapi/code_samples', openapiRoot);
  }

  copyDirToSync('docs', docsRoot);

  splitDefinition(readYaml(definitionFileName), openapiRoot);

  console.log('Installing packages. This might take a couple of minutes.\n');

  await installDeps();
  console.log();

  try {
    execSync(`git init`, { stdio: 'inherit' });
    execSync(`git add . && git commit -m "Initial commit from create-openapi-repo"`);
  } catch (e) {
    // skip error
  }

  printSuccess(opts, openapiRoot);
}

try {
  run();
} catch (e) {
  console.log(e);
}
