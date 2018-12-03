const spawn = require("cross-spawn");

exports.installDeps = opts => {
  const command = "npm";
  const args = [
    "install",
    "--save",
    "--loglevel",
    "error",
    "swagger-repo"
  ].concat(opts.travis ? ["deploy-to-gh-pages"] : []);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`
        });
        return;
      }
      resolve();
    });
  });
};
