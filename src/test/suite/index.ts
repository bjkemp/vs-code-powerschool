import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

const mocha = new Mocha({
  ui: 'tdd',
  color: true
});

export async function run(testsRoot: string, options: Mocha.MochaOptions): Promise<void> {
  try {
    const files = await glob('**/.test.js', { cwd: testsRoot }); // Changed glob pattern

    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    await new Promise<void>((resolve, reject) => {
      mocha.run(failures => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    }); 
  } catch (err) {
    console.error(err);
    throw err; // Re-throw the error for better error handling
  }
}