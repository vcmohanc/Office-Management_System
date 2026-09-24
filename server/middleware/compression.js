import accepts from 'accepts';
import zlib from 'zlib';
import zstd from '@skhaz/zstd';

const MIN_LENGTH = 1024; // 1 KB
const COMPRESSIBLE_TYPE = /text|javascript|json|xml|svg|font/i;
const UNCOMPRESSIBLE_TYPE = /image|video|woff2|zip|pdf/i;

export const compressionMiddleware = (req, res, next) => {
  const accept = accepts(req);
  
  // Negotiate based on priority (zstd > br > gzip > identity).
  // When q-values tie, the first in this array wins.
  const method = accept.encoding(['zstd', 'br', 'gzip', 'identity']);

  if (!method || method === 'identity') {
    return next();
  }

  // Intercept res.send to compress payloads before they hit the network
  const originalSend = res.send;

  res.send = function (body) {
    // Only intercept once
    if (res.locals._compressed) {
      return originalSend.call(this, body);
    }
    res.locals._compressed = true;

    if (body === undefined || body === null) {
      return originalSend.call(this, body);
    }

    const contentType = res.get('Content-Type') || '';
    
    // Skip if type is explicitly uncompressible and not text-based
    if (UNCOMPRESSIBLE_TYPE.test(contentType) && !COMPRESSIBLE_TYPE.test(contentType)) {
      return originalSend.call(this, body);
    }

    let buffer = typeof body === 'string' ? Buffer.from(body) : body;
    
    // Express res.send will automatically stringify objects.
    // If it hasn't, do it here.
    if (!Buffer.isBuffer(buffer)) {
      if (typeof buffer === 'object') {
        buffer = Buffer.from(JSON.stringify(buffer));
        if (!res.get('Content-Type')) res.type('json');
      } else {
        buffer = Buffer.from(String(buffer));
      }
    }

    // Skip if body is under 1 KB
    if (buffer.length < MIN_LENGTH) {
      return originalSend.call(this, buffer);
    }

    // Set correct headers
    res.set('Vary', 'Accept-Encoding');
    res.set('Content-Encoding', method);
    res.removeHeader('Content-Length');

    try {
      if (method === 'zstd') {
        // Fast level 3 for dynamic payloads
        const compressed = zstd.compressSync(buffer, 3);
        return originalSend.call(this, compressed);
      } else if (method === 'br') {
        // Fast level 4
        const compressed = zlib.brotliCompressSync(buffer, {
          params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 }
        });
        return originalSend.call(this, compressed);
      } else if (method === 'gzip') {
        // Fast level 6
        const compressed = zlib.gzipSync(buffer, { level: 6 });
        return originalSend.call(this, compressed);
      }
    } catch (err) {
      console.error('Dynamic compression error:', err);
      // Fallback gracefully to uncompressed if it fails
      res.removeHeader('Content-Encoding');
      return originalSend.call(this, buffer);
    }

    return originalSend.call(this, buffer);
  };

  next();
};
