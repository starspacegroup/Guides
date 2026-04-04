import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MINIMUM_NODE_VERSION = '20.18.1';

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Node version alignment', () => {
  it('declares the runtime floor in package metadata', () => {
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      engines?: { node?: string; };
    };

    expect(packageJson.engines?.node).toBe(`>=${MINIMUM_NODE_VERSION}`);
  });

  it('pins CI to a compatible Node version', () => {
    const ciWorkflow = readWorkspaceFile('.github/workflows/ci.yml');
    const nodeVersionMatch = ciWorkflow.match(/NODE_VERSION:\s*'([^']+)'/);

    expect(nodeVersionMatch?.[1]).toBe(MINIMUM_NODE_VERSION);
  });
});