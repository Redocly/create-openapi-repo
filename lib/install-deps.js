const spawn = require('cross-spawn');

exports.installDeps = (toolsVersion = '') => {
  const command = 'npm';
  const args = ['install', '--save', '--loglevel', 'error', `@redocly/openapi-cli${toolsVersion}`];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`
        });
        return;
      }
      resolve();
    });
  });
};
