import fs from 'fs';
import os from 'os';
import path from 'path';
import { hasValidImageSignature } from './testContent.controller';

describe('admin image upload validation', () => {
  const tempFiles: string[] = [];
  afterEach(() => tempFiles.splice(0).forEach((file) => { if (fs.existsSync(file)) fs.unlinkSync(file); }));
  function file(bytes: Buffer) { const target = path.join(os.tmpdir(), `my-inner-image-${Date.now()}-${Math.random()}`); fs.writeFileSync(target, bytes); tempFiles.push(target); return target; }
  it('accepts a real PNG signature', () => expect(hasValidImageSignature(file(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png')).toBe(true));
  it('rejects text renamed as an image', () => expect(hasValidImageSignature(file(Buffer.from('not an image')), 'image/png')).toBe(false));
  it('rejects a valid signature paired with the wrong MIME type', () => expect(hasValidImageSignature(file(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/jpeg')).toBe(false));
});
