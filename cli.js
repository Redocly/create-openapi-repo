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

const swaggerRepo = require('swagger-repo');

const {
  copy,
  copyDirSync,
  render,
  getGhPagesBaseUrl,
  validateSpecFileName,
  getCurrentGitHubRepo
} = require('./lib/utils');

const { installDeps } = require('./lib/install-deps');

const REDOCLY_RC = '.redoclyrc';

async function ask() {
  console.log('Welcome to the ' + chalk.green('OpenAPI-Repo') + ' generator!');

  const { haveSpec } = await prompt({
    type: 'confirm',
    name: 'haveSpec',
    message: 'Do you already have OpenAPI/Swagger spec for your API?',
    default: false
  });

  let specFileName;
  let defaultSpecVersion;
  if (haveSpec) {
    specFileName = (await prompt({
      type: 'input',
      name: 'specFileName',
      message: 'Please specify the path to the OpenAPI spec (local file):',
      validate(fileName) {
        return validateSpecFileName(fileName);
      }
    })).specFileName;
  } else {
    defaultSpecVersion =
      (await prompt({
        type: 'list',
        choices: ['OpenAPI 3', 'OpenAPI 2'],
        name: 'version',
        message: 'Select OpenAPI version:',
        validate(fileName) {
          return validateSpecFileName(fileName);
        }
      })).version === 'OpenAPI 3'
        ? '3.0.0'
        : '2.0';
  }

  let spec;
  if (haveSpec) {
    spec = yaml.safeLoad(fs.readFileSync(specFileName, 'utf8'));
  }

  const { apiTitle } = await prompt({
    type: 'input',
    name: 'apiTitle',
    message: 'API Name:',
    default: haveSpec ? spec.title : undefined,
    validate: i => (i.length > 0 ? true : `API Name can't be empty`)
  });

  const { splitSpec } = await prompt({
    type: 'confirm',
    name: 'splitSpec',
    message: `Split spec into separate files: paths/*, definitions/* ${chalk.yellow(
      '[Experimental]'
    )}?`,
    default: true
  });

  const { codeSamples } = await prompt({
    type: 'confirm',
    name: 'codeSamples',
    message: `Prepare manual code samples folder?`,
    default: true
  });

  const { swaggerUI } = await prompt({
    type: 'confirm',
    name: 'swaggerUI',
    message: `Install SwaggerUI?`,
    default: false
  });

  const { travis } = await prompt({
    type: 'confirm',
    name: 'travis',
    message: `Set up Travis CI?`,
    default: true
  });

  let repo;
  if (travis) {
    repo = (await prompt({
      type: 'input',
      name: 'repo',
      message: `Specify name of GitHub repo in format ${chalk.blue('User/Repo')}:`,
      default: getCurrentGitHubRepo,
      validate: function(input) {
        return input.indexOf('/') > 0 ? true : 'Repo Name must contain "/"';
      }
    })).repo;
  }

  return {
    specFileName,
    apiTitle,
    splitSpec,
    codeSamples,
    swaggerUI,
    travis,
    repo,
    oasVersion: (defaultSpecVersion || spec.openapi || spec.swagger).toString()
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
    `${chalk.green('Success!')} Created ${chalk.green(path.basename(root))} at ${chalk.blue(root)}
Inside that directory, you can run several commands:
  
  ${chalk.blue(`npm start`)}
    Starts the development server.

  ${chalk.blue(`npm run build`)}
    Bundles the spec and prepares ${chalk.blue('web_deploy')} folder with static assets. 

  ${chalk.blue(`npm test`)}
    Validates the spec.
  
  ${chalk.blue(`npm run gh-pages`)}
    Deploys docs to GitHub Pages. You don't need to run it manually if you have Travis CI configured.

We suggest that you begin by typing:

  ${chalk.blue('cd')} ${path.basename(root)}
  ${chalk.blue('npm start')}` + (travisNote ? '\n\n' + travisNote : '')
  );
}

async function run() {
  const specRoot = process.argv[2];

  if (!specRoot) {
    console.log(`Please specify the spec directory:
  ${chalk.blue('create-openapi-repo')} <spec-directory>

For example:
  ${chalk.blue('create-openapi-repo')} test-api-repo`);

    process.exit(1);
  }

  if (fs.existsSync(specRoot) && fs.existsSync(path.join(specRoot, REDOCLY_RC))) {
    console.log(`The directory ${chalk.green(specRoot)} already contains ${chalk.green(REDOCLY_RC)}

Choose another directory or remove contents.
`);
    process.exit(1);
  }

  if (!fs.existsSync(specRoot)) {
    fs.mkdirSync(specRoot);
  }

  const opts = await ask();

  const data = {
    ...opts,
    packageName: slugify(opts.apiTitle).toLowerCase(),
    ghPagesBaseUrl: opts.repo ? getGhPagesBaseUrl(opts.repo) : undefined
  };

  let { specFileName } = opts;
  if (!specFileName) {
    specFileName = require.resolve(
      opts.oasVersion.startsWith('3.') ? 'openapi-template/openapi.yaml' : 'openapi-template'
    );
  }

  process.chdir(specRoot);

  console.log(`\nCreating a new OpenAPI repo in ${chalk.blue(path.resolve('.'))}\n`);
  await render('.gitignore', {});
  await copy('LICENSE');
  await render('package.json', data);
  await render('README.md', data);
  await copy('spec/README.md');

  if (opts.splitSpec) {
    if (opts.oasVersion.startsWith('3.')) {
      copyDirSync('spec/components');
    } else {
      copyDirSync('spec/definitions');
    }
    copyDirSync('spec/paths');
  }

  if (opts.codeSamples) {
    copyDirSync('spec/code_samples');
  }

  if (opts.travis) {
    await copy('.travis.yml');
  }

  copyDirSync('web');

  swaggerRepo.syncWithSpec(fs.readFileSync(specFileName).toString());

  fs.writeFileSync(REDOCLY_RC, yaml.safeDump(opts, { skipInvalid: true }));

  console.log('Installing packages. This might take a couple of minutes.\n');

  await installDeps('@^2.0.0-rc.6');
  console.log();

  try {
    execSync(`git init`, { stdio: 'inherit' });
    execSync(`git add . && git commit -m "Initial commit from create-openapi-repo"`);
  } catch (e) {
    // skip error
  }

  printSuccess(opts, path.resolve('.'));
}

try {
  run();
} catch (e) {
  console.log(e);
}
