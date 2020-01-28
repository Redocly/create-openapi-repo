const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process');

const ejs = require('ejs');
// const gitUrlParse = require('git-url-parse');
const chalk = require('chalk');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');

function provisionPaths(file, openapiDir) {
  const src = path.resolve(__dirname, '../template/', file);
  let target;
  if (openapiDir) {
    target = path.resolve(openapiDir, file.replace(/^openapi\//, ''));
  } else {
    target = path.resolve(file);
  }

  return { src, target };
}

exports.OPENAPI3_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

exports.OPENAPI3_COMPONENTS = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'headers',
  'requestBodies',
  'links',
  'callbacks',
  'securitySchemes'
];

exports.validateDefinitionFileName = fileName => {
  if (!fs.existsSync(fileName)) {
    return chalk.red(`File ${chalk.blue(fileName)} does not exist`);
  }
  let file;
  try {
    file = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  } catch (e) {
    return chalk.red(e.message);
  }

  if (file.swagger) {
    return chalk.red('OpenAPI 2 is not supported by this tool');
  }

  if (!file.openapi) {
    return chalk.red('File does not conform to the OpenAPI Specification');
  }
  return true;
};

// exports.getCurrentGitHubRepo = () => {
//   try {
//     const remoteUrl = execSync('git config --get remote.origin.url').toString();
//     const parsedUrl = gitUrlParse(remoteUrl.trim());
//     if (parsedUrl.owner && parsedUrl.name) {
//       return parsedUrl.owner + '/' + parsedUrl.name;
//     }
//   } catch (e) {}
//   return undefined;
// };

exports.copy = async (file, openAPIDir) => {
  const { src, target } = provisionPaths(file, openAPIDir);
  mkdirp.sync(path.dirname(target));
  const rd = fs.createReadStream(src);
  const wr = fs.createWriteStream(target);

  try {
    return await new Promise(function(resolve, reject) {
      rd.on('error', reject);
      wr.on('error', reject);
      wr.on('finish', resolve);
      rd.pipe(wr);
    });
  } catch (error) {
    rd.destroy();
    wr.end();
    throw error;
  }
};

exports.render = async (file, data, openAPIDir) => {
  const { src, target } = provisionPaths(file, openAPIDir);
  const res = await ejs.renderFile(src + '.ejs', data);
  fs.writeFileSync(target, res);
};

// exports.getGhPagesBaseUrl = repo => {
//   const [user, name] = repo.split('/');
//   // TODO: support CNAME
//   let url = user.toLowerCase() + '.github.io';
//   if (name !== url) {
//     url += '/' + name;
//   }
//   return 'https://' + url + '/';
// };

function copyDirSync(srcDir, targetDir) {
  const list = fs.readdirSync(srcDir);
  list.forEach(file => {
    const src = srcDir + '/' + file;
    const dst = targetDir + '/' + file;
    const stat = fs.statSync(src);
    if (stat && stat.isDirectory()) {
      try {
        fs.mkdirSync(dst);
      } catch (e) {
        console.log('Directory already exists: ' + dst);
      }
      copyDirSync(src, dst);
    } else {
      try {
        fs.writeFileSync(dst, fs.readFileSync(src));
      } catch (e) {
        console.log("Couldn't copy file: " + dst);
      }
    }
  });
}

exports.copyDirSync = (dir, openapiDir) => {
  const { src: srcDir, target: targetDir } = provisionPaths(dir, openapiDir);
  mkdirp.sync(targetDir);
  copyDirSync(srcDir, targetDir);
};

exports.copyDirToSync = (dir, to) => {
  const { src: srcDir } = provisionPaths(dir);
  mkdirp.sync(to);
  copyDirSync(srcDir, to);
};

exports.readYaml = filename => {
  return yaml.safeLoad(fs.readFileSync(filename, 'utf-8'), {
    filename
  });
};

exports.writeYaml = (data, filename) => {
  return fs.writeFileSync(filename, yaml.safeDump(data));
};

exports.traverseFolderDeep = function traverseFolderDeep(folder, callback) {
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) return;
  const files = fs.readdirSync(folder);
  for (const f of files) {
    const filename = path.join(folder, f);
    if (fs.statSync(filename).isDirectory()) {
      traverseFolderDeep(filename, callback);
    } else {
      callback(filename);
    }
  }
};

exports.replace$Refs = function replace$Refs(obj, relativeFrom, componentFiles = {}) {
  crawl(obj, node => {
    if (node.$ref && typeof node.$ref === 'string' && node.$ref.startsWith('#/components/')) {
      replace(node, '$ref');
    } else if (
      node.discriminator &&
      node.discriminator.mapping &&
      typeof node.discriminator.mapping === 'object'
    ) {
      for (const name of Object.keys(node.discriminator.mapping)) {
        if (
          typeof node.discriminator.mapping[name] === 'string' &&
          node.discriminator.mapping[name].startsWith('#/components/')
        ) {
          replace(node.discriminator.mapping, name);
        }
      }
    }
  });

  function replace(node, key) {
    const name = node[key].split('/').pop();
    const groupName = node[key].split('/')[2];

    if (!componentFiles[groupName] || !componentFiles[groupName][name]) {
      return;
    }

    let filename = path.relative(relativeFrom, componentFiles[groupName][name].filename);

    if (!filename.startsWith('.')) {
      filename = '.' + path.sep + filename;
    }

    node[key] = filename;
  }
};

exports.implicitlyReferenceDiscriminator = function implicitlyReferenceDiscriminator(
  obj,
  defName,
  filename,
  schemaFiles,
) {
  if (!obj.discriminator) return;

  const defPtr = `#/components/schemas/${defName}`;
  const implicitMapping = {};
  for (const [name, { inherits, filename: parentFilename }] of Object.entries(schemaFiles)) {
    if (inherits.indexOf(defPtr) > -1) {
      const res = path.relative(path.dirname(filename), parentFilename);
      implicitMapping[name] = res.startsWith('.') ? res : '.' + path.sep + res;
    }
  }

  if (!Object.keys(implicitMapping).length) return;

  const mapping = obj.discriminator.mapping = obj.discriminator.mapping || {};
  for (const name of Object.keys(implicitMapping)) {
    if (mapping[name] && mapping[name] !== implicitMapping[name]) {
      console.warn(
        chalk.yellow(
          `warning: explicit mapping overlaps with local mapping entry ${chalk.red(
            name
          )} at ${chalk.blue(filename)}, Check manually, please`
        )
      );
    }
    mapping[name] = implicitMapping[name];
  }
};

function crawl(object, visitor) {
  if (typeof object !== 'object' || object == null) {
    return;
  }
  for (const key of Object.keys(object)) {
    visitor(object, key);
    crawl(object[key], visitor);
  }
}
