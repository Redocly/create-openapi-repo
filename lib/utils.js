const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const gitUrlParse = require("git-url-parse");
const { execSync } = require('child_process');

const mkdirp = require("mkdirp");

function provisionPaths(file) {
  const src = path.resolve(__dirname, "../template/", file);
  const target = path.resolve(process.cwd(), file);
  return { src, target };
}

exports.validateSpecFileName = fileName => {
  if (!fs.existsSync(fileName)) {
    return chalk.red(`File ${chalk.blue(fileName)} does not exist`);
  }
  try {
    const file = yaml.safeLoad(fs.readFileSync(fileName, "utf8"));
  } catch (e) {
    return chalk.red(e.message);
  }

  if (!file.swagger || !file.openapi) {
    return chalk.red("File is not valid OpenAPI specification");
  }
  return true;
};

exports.getCurrentGitHubRepo = () => {
  try {
    var remoteUrl = execSync("git config --get remote.origin.url").toString();
    var parsedUrl = gitUrlParse(remoteUrl.trim());
    if (parsedUrl.owner && parsedUrl.name) {
      return parsedUrl.owner + "/" + parsedUrl.name;
    }
  } catch (e) {}
  return undefined;
};

exports.copy = async file => {
  const { src, target } = provisionPaths(file);
  mkdirp.sync(path.dirname(target));
  var rd = fs.createReadStream(src);
  var wr = fs.createWriteStream(target);

  try {
    return await new Promise(function(resolve, reject) {
      rd.on("error", reject);
      wr.on("error", reject);
      wr.on("finish", resolve);
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
  const res = await ejs.renderFile(src + ".ejs", data);
  fs.writeFileSync(target, res);
};

exports.getGhPagesBaseUrl = repo => {
  const [user, name] = repo.split("/");
  // TODO: support CNAME
  var url = user.toLowerCase() + ".github.io";
  if (name !== url) {
    url += "/" + name;
  }
  return "https://" + url + "/";
};

function copyDirSync(srcDir, targetDir) {
  const list = fs.readdirSync(srcDir);
  list.forEach(file => {
    let src = srcDir + "/" + file;
    let dst = targetDir + "/" + file;
    var stat = fs.statSync(src);
    if (stat && stat.isDirectory()) {
      try {
        fs.mkdirSync(dst);
      } catch (e) {
        console.log("Directory already exists: " + dst);
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
