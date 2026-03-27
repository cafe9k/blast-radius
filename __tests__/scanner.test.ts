import { describe, it, expect } from 'vitest';
import { scanFiles } from '../src/analyzer/scanner.js';
import path from 'path';

describe('Scanner', () => {
  it('should scan files with include patterns', async () => {
    const testDir = path.join(__dirname, 'fixtures/simple-project');
    const files = await scanFiles(testDir, {
      include: ['**/*.{ts,tsx}'],
      exclude: ['node_modules/**'],
    });
    
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toHaveProperty('path');
    expect(files[0]).toHaveProperty('absolutePath');
    expect(files[0]).toHaveProperty('extension');
  });
  
  it('should exclude files matching exclude patterns', async () => {
    const testDir = path.join(__dirname, 'fixtures/simple-project');
    const files = await scanFiles(testDir, {
      include: ['**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    });
    
    const testFiles = files.filter(f => 
      f.path.includes('.test.') || f.path.includes('.spec.')
    );
    
    expect(testFiles.length).toBe(0);
  });
});
