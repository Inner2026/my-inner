import { buildCorsOrigins } from './corsOrigins';

describe('buildCorsOrigins', () => {
  it('allows both the www and the bare domain', () => {
    expect(buildCorsOrigins('https://www.my-inner.com')).toEqual(['https://www.my-inner.com', 'https://my-inner.com']);
    expect(buildCorsOrigins('https://my-inner.com/')).toEqual(['https://my-inner.com', 'https://www.my-inner.com']);
  });
  it('supports a comma-separated list and leaves localhost alone', () => {
    expect(buildCorsOrigins('http://localhost:5173, https://my-inner.com')).toEqual(['http://localhost:5173', 'https://my-inner.com', 'https://www.my-inner.com']);
  });
});
