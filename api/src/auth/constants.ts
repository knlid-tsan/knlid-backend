const FALLBACK_SECRET = 'dev-secret';

if (!process.env.JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET not set, using insecure default — set it in production',
  );
}

export const JWT_SECRET = process.env.JWT_SECRET ?? FALLBACK_SECRET;
