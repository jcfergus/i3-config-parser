const fse = require('fs-extra');
const { join } = require('path');

const TARGET = './dist';

fse.readdirSync(TARGET).forEach((file) => {
  const output = join(__dirname, file);

  if (fse.existsSync(output)) {
    fse.removeSync(output);
  }
});
