import { describe, expect, it } from 'vitest';
import ciWorkflowSource from '../../.github/workflows/ci.yml?raw';
import packageJsonSource from '../../package.json?raw';

const MINIMUM_NODE_VERSION = '20.18.1';

describe('Node version alignment', () => {
  it('declares the runtime floor in package metadata', () => {
    const packageJson = JSON.parse(packageJsonSource) as {
      engines?: { node?: string; };
    };

    expect(packageJson.engines?.node).toBe(`>=${MINIMUM_NODE_VERSION}`);
  });

  it('pins CI to a compatible Node version', () => {
    const nodeVersionMatch = ciWorkflowSource.match(/NODE_VERSION:\s*'([^']+)'/);

    expect(nodeVersionMatch?.[1]).toBe(MINIMUM_NODE_VERSION);
  });
});