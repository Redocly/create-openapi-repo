'use strict';
const yeoman = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const yaml = require('node-yaml');
const execSync = require('child_process').execSync;
const fs = require('fs');

module.exports = yeoman.Base.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.green('OpenAPI-Repo') + ' generator!'
    ));

    const defaults = {
      redocVersion: 'latest',
      travis: true,
      samples: true,
      installSwaggerUI: true,
      packageName: ''
    };
    var swagger = {};
    if (this.fs.exists(this.destinationPath('spec/swagger.yaml'))) {
      swagger = yaml.readSync(this.destinationPath('spec/swagger.yaml'));
    }
    swagger.info = swagger.info || {};
    swagger.info.contact = swagger.info.contact || {};

    defaults.name = swagger.title || this.appname;
    defaults.description = swagger.info.description || '';
    defaults.version = swagger.info.version || '1.0.0';
    defaults.email = swagger.info.contact.email || this.user.git.email();
    defaults.username = swagger.info.contact.name || this.user.git.name();

    var packg = {};
    if (this.fs.exists(this.destinationPath('package.json'))) {
      packg = JSON.parse(fs.readFileSync(this.destinationPath('package.json')));
    }
    defaults.specVersion = packg && packg.version || '0.0.0';

    var remoteUrl = '';
    var ghRepoName;
    try {
      remoteUrl = execSync('git remote -v');
    } catch (e) {}
    var match = remoteUrl.toString().match(
      /origin\s+(?:git@github\.com:|(?:https?|git):\/\/(?:.+@)?github\.com\/)(\S+)\.git?/
    );
    if (match && match.length > 0) {
      ghRepoName = match[1];
      defaults.repo = ghRepoName;
    }

    var config = this.config.getAll();
    Object.assign(defaults, config);

    var prompts = [{
      type: 'input',
      name: 'name',
      message: 'Your API name (without API)',
      default: defaults.name
    }, {
      type: 'input',
      name: 'description',
      message: 'Short description',
      default: defaults.description
    }, {
      type: 'input',
      name: 'version',
      message: 'API version',
      default: defaults.version
    }, {
      type: 'input',
      name: 'email',
      message: 'Contact email',
      default: defaults.email
    }, {
      type: 'input',
      name: 'username',
      message: 'Author name',
      default: defaults.username
    }, {
      type: 'input',
      name: 'redocVersion',
      message: 'ReDoc version to use (e.g. v0.9.0)',
      default: defaults.redocVersion
    }, {
      type: 'confirm',
      name: 'travis',
      message: 'Setup CI on Travis',
      default: defaults.travis
    }, {
      when: function (props) {
        return props.travis;
      },
      type: 'input',
      name: 'repo',
      message: chalk.yellow('Specify name of GitHub repo in format: User/Repo\n') +
        chalk.yellow('? ') + 'GitHub Repository?',
      default: defaults.repo,
      validate: function (input) {
        return input.indexOf('/') > 0 ? true : 'Repo Name must contain "/"';
      }
    }, {
      type: 'input',
      name: 'packageName',
      message: 'Package name',
      default: defaults.packageName
    }, {
      type: 'input',
      name: 'specVersion',
      message: 'Spec version',
      default: defaults.specVersion
    }, {
      type: 'confirm',
      name: 'samples',
      message: 'Prepare code samples',
      default: defaults.confirm
    }, {
      type: 'confirm',
      name: 'installSwaggerUI',
      message: 'Install SwaggerUI',
      default: defaults.installSwaggerUI
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
      console.log(props);
      this.config.set(props);
      this.config.save();
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
      if (this.props.travis) {
        this.fs.copy(
          this.templatePath('_.travis.yml'),
          this.destinationPath('.travis.yml')
        );
      }
    },
    scripts: function () {
      this.fs.copyTpl(
        this.templatePath('_gulpfile.js'),
        this.destinationPath('gulpfile.js'), this.props
      );
      this.fs.copy(
        this.templatePath('_scripts/build.js'),
        this.destinationPath('scripts/build.js')
      );
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
