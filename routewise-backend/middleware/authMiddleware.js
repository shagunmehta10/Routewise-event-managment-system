import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL = new URL(`${process.env.NEON_AUTH_URL}/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(JWKS_URL);

/**
 * Middleware to verify Neon Auth JWT tokens
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.JWT_ISSUER,
      // audience: process.env.JWT_AUDIENCE, // Optional: uncomment if audience check is strictly required
    });

    // Attach user info to request
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};
