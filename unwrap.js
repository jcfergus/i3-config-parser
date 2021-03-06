const fse = require('fs-extra');
const { join } = require('path');

const TARGET = './dist';

fse.readdirSync(TARGET).forEach((file) => {
  const entry = join(TARGET, file);
  const output = join(__dirname, file);

  if (fse.existsSync(output)) {
    throw new Error(
      `Can't unwrap dist. File already ${file} exists in root folder.`,
    );
  }

  fse.copySync(entry, output);
});
