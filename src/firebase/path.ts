export function assertPathSegment(name: string, value: string): void {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} must be a non-empty string`);
  }
  if (value.includes('/')) {
    throw new Error(`${name} must not include '/'`);
  }
}

