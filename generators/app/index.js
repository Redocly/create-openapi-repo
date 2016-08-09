'use strict';

const _ = require('lodash');
const yeoman = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const yaml = require('node-yaml');
const execSync = require('child_process').execSync;
const fs = require('fs');
const updateNotifier = require('update-notifier');
const gitUrlParse = require("git-url-parse");
const slug = require('slug');
const pkg = require('../../package.json');

function getCurrentGitHubRepo() {
  try {
    var remoteUrl = execSync('git config --get remote.origin.url').toString();
    var parsedUrl = gitUrlParse(remoteUrl.trim());
    if (parsedUrl.owner && parsedUrl.name)
      return parsedUrl.owner + '/' + parsedUrl.name;
  } catch (e) {}
  return undefined;
}

function getGhPagesBaseUrl(user, repo) {
  // TODO: support CNAME
  var url = user + '.github.io';
  if (repo !== url)
    url += '/' + repo;
  return 'https://' + url + '/';
}

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.green('OpenAPI-Repo') + ' generator!'
    ));

    updateNotifier({pkg}).notify();

    const defaults = {
      redocVersion: 'latest',
      samples: true,
      installSwaggerUI: true
    };

    var swagger = null;
    if (this.fs.exists(this.destinationPath('spec/swagger.yaml'))) {
      swagger = yaml.readSync(this.destinationPath('spec/swagger.yaml'));
    }

    var config = this.config.getAll();
    Object.assign(defaults, config);

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'Your API name (without API)',
      default: () => {
        return _.get(swagger, 'info.title') || this.appname;
      }
    }, {
      type: 'input',
      name: 'redocVersion',
      message: 'ReDoc version to use (e.g. v0.9.0)',
      default: defaults.redocVersion
    }, {
      type: 'input',
      name: 'repo',
      message: chalk.yellow('Specify name of GitHub repo in format: User/Repo\n') +
        chalk.yellow('? ') + 'GitHub Repository?',
      default: getCurrentGitHubRepo,
      validate: function (input) {
        return input.indexOf('/') > 0 ? true : 'Repo Name must contain "/"';
      }
    }, {
      type: 'confirm',
      name: 'samples',
      message: 'Prepare code samples',
      default: defaults.samples
    }, {
      type: 'confirm',
      name: 'installSwaggerUI',
      message: 'Install SwaggerUI',
      default: defaults.installSwaggerUI
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
      this.config.set(props);
      this.config.save();

      this.props.ghRepoUser = this.props.repo.split('/')[0];
      this.props.ghRepoName = this.props.repo.split('/')[1];

      this.props.npmVersion = '0.0.1';
      this.props.npmName = slug(this.props.name) + '-openapi-spec';
      if (this.fs.exists(this.destinationPath('package.json'))) {
        var npmPackage = JSON.parse(fs.readFileSync(this.destinationPath('package.json')));
        if (npmPackage.version)
          this.props.npmVersion = npmPackage.version;
        if (npmPackage.name)
          this.props.npmName = npmPackage.name;
      }

      this.props.ghPagesBaseUrl = getGhPagesBaseUrl(this.props.ghRepoUser, this.props.ghRepoName);
    }.bind(this));
  },

  writing: {
    config: function () {
      this.fs.copy(
        this.templatePath('_.gitignore'),
        this.destinationPath('.gitignore')
      );
      if (!this.fs.exists(this.destinationPath('LICENSE'))) {
        this.fs.copy(
          this.templatePath('_LICENSE'),
          this.destinationPath('LICENSE')
        );
      }
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'), this.props
      );
      this.fs.copyTpl(
        this.templatePath('_README.md'),
        this.destinationPath('README.md'), this.props
      );
      this.fs.copyTpl(
        this.templatePath('_.travis.yml'),
        this.destinationPath('.travis.yml'), this.props
      );
    },
    scripts: function () {
      this.fs.copy(
        this.templatePath('_gulpfile.js'),
        this.destinationPath('gulpfile.js')
      );
      this.fs.copyTpl(
        this.templatePath('_scripts/build.js'),
        this.destinationPath('scripts/build.js'), this.props
      );

      if (this.props.travis) {
        this.fs.copy(
          this.templatePath('_scripts/deploy-branch.js'),
          this.destinationPath('scripts/deploy-branch.js')
        );
      }
      // delete old build.sh
      this.fs.delete(this.destinationPath('scripts/build.sh'));
    },
    web: function () {
      this.fs.copyTpl(
        this.templatePath('_web/index.html'),
        this.destinationPath('web/index.html'), this.props
      );
    },
    mainswagger: function () {
      if (this.fs.exists(this.destinationPath('spec/swagger.yaml'))) {
        return;
      }
      this.fs.copyTpl(
        this.templatePath('_spec/swagger.yaml'),
        this.destinationPath('spec/swagger.yaml'), this.props
      );
      this.fs.copy(this.templatePath('_spec/README.md'),
        this.destinationPath('spec/README.md')
      );

      this.fs.copy(this.templatePath('_spec/paths/pet.yaml'),
        this.destinationPath('spec/paths/pet.yaml')
      );
      this.fs.copy(this.templatePath('_spec/paths/README.md'),
        this.destinationPath('spec/paths/README.md')
      );
      this.fs.copy(this.templatePath('_spec/definitions/Pet.yaml'),
        this.destinationPath('spec/definitions/Pet.yaml')
      );
      this.fs.copy(this.templatePath('_spec/definitions/README.md'),
        this.destinationPath('spec/definitions/README.md')
      );
    },
    samples: function () {
      if (!this.props.samples) {
        return;
      }
      if (this.fs.exists(this.destinationPath('spec/code_samples/README.md'))) {
        return;
      }
      this.bulkDirectory('_spec/code_samples', 'spec/code_samples');
    }
  },

  install: function () {
    this.config.save();
    this.installDependencies({
      bower: false
    });
  }
});
