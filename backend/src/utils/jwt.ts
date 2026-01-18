import jwt, { SignOptions } from 'jsonwebtoken';

// Simple JWT utility to avoid complex overload issues
export const signToken = (
  payload: object,
  secret: string,
  expiresIn: string | number = '24h',
): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};

// Generate JWT token for user
export const generateUserToken = (user: {
  id: number;
  phone: string;
  business_id: number;
  role: string;
}): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload = {
    id: user.id,
    phone: user.phone,
    business_id: user.business_id,
    role: user.role,
  };

  return signToken(payload, JWT_SECRET, process.env.JWT_EXPIRES_IN || '24h');
};

// Verify JWT token
export const verifyUserToken = (token: string): any => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  return verifyToken(token, JWT_SECRET);
};
