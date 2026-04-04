import { describe, expect, it } from 'vitest';
import wranglerConfig from '../../wrangler.toml?raw';

describe('Cloudflare Pages configuration', () => {
  it('enables nodejs_compat for the generated worker bundle', () => {
    expect(wranglerConfig).toMatch(/compatibility_flags\s*=\s*\[(?:.|\r?\n)*"nodejs_compat"(?:.|\r?\n)*\]/);
  });

  it('does not require an unused R2 bucket binding at deploy time', () => {
    expect(wranglerConfig).not.toMatch(/\[\[r2_buckets\]\]/);
    expect(wranglerConfig).not.toMatch(/bucket_name\s*=\s*"guides-files"/);
  });
});