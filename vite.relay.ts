import http from 'node:http';
import https from 'node:https';
import type { Connect, Plugin } from 'vite';

/**
 * Same-origin relay for S3 Vectors-compatible internal environments.
 *
 * Browsers refuse cross-origin responses that lack CORS headers, so an
 * internal S3 Vectors-compatible endpoint (which usually sends no CORS
 * headers) cannot be called from the page directly. This middleware accepts
 * same-origin requests under /s3v-api and forwards them to the real endpoint
 * carried in the `x-s3v-target` request header (or S3V_PROXY_TARGET as a
 * static fallback). Signature-relevant headers are forwarded untouched so
 * SigV4 validation on the upstream keeps working against the original
 * signed headers.
 */
function s3vRelayHandler(
  req: Connect.IncomingMessage,
  res: http.ServerResponse
) {
  const headerTarget = req.headers['x-s3v-target'];
  const target =
    (typeof headerTarget === 'string' && headerTarget.trim()) ||
    process.env.S3V_PROXY_TARGET ||
    '';

  if (!target) {
    res.statusCode = 400;
    res.end(
      's3v relay: no target. Set the endpoint in Settings (auto-relay) or S3V_PROXY_TARGET.'
    );
    return;
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(target);
  } catch {
    res.statusCode = 400;
    res.end(`s3v relay: invalid target "${target}"`);
    return;
  }
  if (upstreamUrl.protocol !== 'http:' && upstreamUrl.protocol !== 'https:') {
    res.statusCode = 400;
    res.end('s3v relay: target must be http(s)');
    return;
  }

  const isHttps = upstreamUrl.protocol === 'https:';
  const mod = isHttps ? https : http;

  // Connect already stripped the /s3v-api mount prefix from req.url.
  // Forward everything as-is: method, signed headers (incl. x-s3v-target),
  // and body. Only hop-by-hop headers must not be forwarded.
  const headers: Record<string, string | string[] | undefined> = {
    ...req.headers,
  };
  delete headers.connection;

  const upstreamReq = mod.request(
    {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (isHttps ? 443 : 80),
      path: req.url || '/',
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstreamReq.on('error', (err) => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.end(`s3v relay upstream error: ${err.message}`);
    } else {
      res.end();
    }
  });
  req.pipe(upstreamReq);
}

export function s3vRelayPlugin(): Plugin {
  return {
    name: 's3v-same-origin-relay',
    configureServer(server) {
      server.middlewares.use('/s3v-api', s3vRelayHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/s3v-api', s3vRelayHandler);
    },
  };
}
