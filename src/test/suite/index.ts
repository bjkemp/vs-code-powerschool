import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(testsRoot: string): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    reporter: 'spec',
    timeout: 10000,
  });

  try {
    // Find all test files
    const files = await glob('**/*.test.js', {
      cwd: testsRoot,
      absolute: false,
      nodir: true,
    });

    // Add files to the test suite
    for (const f of files) {
      mocha.addFile(path.resolve(testsRoot, f));
    }

    // Run the mocha tests
    const failures = await new Promise<number>((resolve) => {
      mocha.run(resolve);
    });

    if (failures > 0) {
      throw new Error(`${failures} tests failed.`);
    }
  } catch (err) {
    console.error('Failed to run tests:', err);
    throw err;
  }
}