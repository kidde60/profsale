// middleware/apiVersion.ts - API versioning middleware
import { Request, Response, NextFunction } from 'express';

const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

/**
 * Extract API version from URL path
 */
export const extractApiVersion = (req: Request, res: Response, next: NextFunction): void => {
  const pathParts = req.path.split('/').filter(Boolean);
  
  // Check if first path segment is a version (v1, v2, etc.)
  const potentialVersion = pathParts[0];
  
  if (potentialVersion && potentialVersion.startsWith('v') && SUPPORTED_VERSIONS.includes(potentialVersion)) {
    req.apiVersion = potentialVersion;
  } else {
    req.apiVersion = DEFAULT_VERSION;
  }
  
  next();
};

/**
 * Validate API version from header
 */
export const validateApiVersionHeader = (req: Request, res: Response, next: NextFunction): void => {
  const apiVersion = req.headers['api-version'] as string;
  
  if (apiVersion && !SUPPORTED_VERSIONS.includes(apiVersion)) {
    res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      supportedVersions: SUPPORTED_VERSIONS,
      currentVersion: DEFAULT_VERSION,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Header version takes precedence over path version
  if (apiVersion) {
    req.apiVersion = apiVersion;
  }
  
  next();
};

/**
 * Deprecation warning for old API versions
 */
export const deprecationWarning = (deprecatedVersion: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.apiVersion === deprecatedVersion) {
      res.setHeader('X-API-Deprecation', 'true');
      res.setHeader('X-API-Deprecation-Date', '2025-01-01');
      res.setHeader('X-API-Sunset', '2025-06-01');
      res.setHeader('X-API-Recommended-Version', 'v2');
      res.setHeader('Warning', '299 - "Deprecated API Version"');
    }
    
    next();
  };
};

/**
 * Version-specific response headers
 */
export const addVersionHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('API-Version', req.apiVersion || DEFAULT_VERSION);
  res.setHeader('API-Supported-Versions', SUPPORTED_VERSIONS.join(', '));
  
  next();
};

/**
 * Redirect old version to new version (optional)
 */
export const redirectOldVersion = (oldVersion: string, newVersion: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.apiVersion === oldVersion) {
      const newPath = req.path.replace(`/${oldVersion}`, `/${newVersion}`);
      
      // 301 Permanent Redirect for deprecated versions
      res.redirect(301, newPath);
      return;
    }
    
    next();
  };
};

export default {
  extractApiVersion,
  validateApiVersionHeader,
  deprecationWarning,
  addVersionHeaders,
  redirectOldVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION,
};
