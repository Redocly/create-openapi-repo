const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ejs = require('ejs');
const gitUrlParse = require('git-url-parse');
const chalk = require('chalk');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');

function provisionPaths(file) {
  const src = path.resolve(__dirname, '../template/', file);
  const target = path.resolve(process.cwd(), file);
  return { src, target };
}

exports.validateSpecFileName = fileName => {
  if (!fs.existsSync(fileName)) {
    return chalk.red(`File ${chalk.blue(fileName)} does not exist`);
  }
  let file;
  try {
    file = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
  } catch (e) {
    return chalk.red(e.message);
  }

  if (!file.swagger && !file.openapi) {
    return chalk.red('File is not valid OpenAPI specification');
  }
  return true;
};

exports.getCurrentGitHubRepo = () => {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url').toString();
    const parsedUrl = gitUrlParse(remoteUrl.trim());
    if (parsedUrl.owner && parsedUrl.name) {
      return parsedUrl.owner + '/' + parsedUrl.name;
    }
  } catch (e) {}
  return undefined;
};

exports.copy = async file => {
  const { src, target } = provisionPaths(file);
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

exports.render = async (file, data) => {
  const { src, target } = provisionPaths(file);
  const res = await ejs.renderFile(src + '.ejs', data);
  fs.writeFileSync(target, res);
};

exports.getGhPagesBaseUrl = repo => {
  const [user, name] = repo.split('/');
  // TODO: support CNAME
  let url = user.toLowerCase() + '.github.io';
  if (name !== url) {
    url += '/' + name;
  }
  return 'https://' + url + '/';
};

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
        console.log("Could't copy file: " + dst);
      }
    }
  });
}

exports.copyDirSync = dir => {
  const { src: srcDir, target: targetDir } = provisionPaths(dir);
  mkdirp.sync(targetDir);
  copyDirSync(srcDir, targetDir);
};
