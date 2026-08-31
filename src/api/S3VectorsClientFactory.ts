import { S3VectorsClient } from '@aws-sdk/client-s3vectors';

/**
 * Marker path where this page's own origin serves the transparent relay
 * (see vite.relay.ts). The SDK connects to `<origin>/s3v-api` and carries
 * the real endpoint in the `x-s3v-target` header, so the browser never
 * makes a cross-origin call to the internal service. Official AWS endpoints
 * are NOT relayed (they allow all origins, and relaying would break SigV4);
 * Node/SSR usage is unaffected.
 */
export const SAME_ORIGIN_RELAY_PATH = '/s3v-api';
export const RELAY_TARGET_HEADER = 'x-s3v-target';

/** Official AWS endpoints: CORS-friendly, and SigV4 must not be relayed. */
export function isAwsEndpoint(endpoint: string): boolean {
  try {
    const { hostname } = new URL(endpoint);
    return (
      hostname.endsWith('.amazonaws.com') ||
      hostname.endsWith('.amazonaws.com.cn') ||
      hostname.endsWith('.api.aws') ||
      hostname === 'aws.amazon.com'
    );
  } catch {
    return false;
  }
}

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  );
}

type NextFn = (args: unknown) => Promise<unknown>;

/**
 * Middleware that stamps the real endpoint onto every outgoing request so
 * the same-origin relay knows where to forward it. Added at the `build`
 * step, so the header is present before SigV4 signing and travels intact.
 */
export function relayTargetMiddleware(target: string) {
  return (next: NextFn) =>
    async (args: unknown): Promise<unknown> => {
      const req = (args as { request?: { headers?: Record<string, unknown> } })
        .request;
      if (req && req.headers) {
        req.headers[RELAY_TARGET_HEADER] = target;
      }
      return next(args);
    };
}

export interface ClientSettings {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  endpoint?: string;
  /** Set false to disable the browser same-origin relay. */
  relay?: boolean;
}

export class S3VectorsClientFactory {
  private client: S3VectorsClient | null = null;

  constructor(private settings: ClientSettings) {}

  updateSettings(settings: ClientSettings): void {
    this.settings = settings;
    this.client = null;
  }

  /**
   * Returns the relay wiring when the SDK should talk to the page's own
   * origin instead of the user's endpoint directly (browser + custom
   * endpoint + relay not disabled).
   */
  private resolveRelay(): { sdkEndpoint: string; target: string } | null {
    if (!isBrowser() || this.settings.relay === false) return null;
    const target = this.settings.endpoint;
    if (!target) return null;
    if (target.endsWith(SAME_ORIGIN_RELAY_PATH)) return null; // already relayed
    if (isAwsEndpoint(target)) return null; // AWS allows CORS; relay would break SigV4
    const origin = window.location.origin;
    if (!origin || origin === 'null') return null;
    return { sdkEndpoint: `${origin}${SAME_ORIGIN_RELAY_PATH}`, target };
  }

  getClient(): S3VectorsClient {
    if (!this.client) {
      const relay = this.resolveRelay();
      const sdkEndpoint = relay ? relay.sdkEndpoint : this.settings.endpoint;

      const config: ConstructorParameters<typeof S3VectorsClient>[0] = {
        region: this.settings.region,
        credentials: {
          accessKeyId: this.settings.accessKeyId,
          secretAccessKey: this.settings.secretAccessKey,
          ...(this.settings.sessionToken
            ? { sessionToken: this.settings.sessionToken }
            : {}),
        },
        ...(sdkEndpoint ? { endpoint: sdkEndpoint } : {}),
      };
      this.client = new S3VectorsClient(config);

      if (relay) {
        // The SDK's MiddlewareStack overloads are step-specific; our handler
        // is structurally compatible with the build-step middleware, so go
        // through a minimal structural view (no `any`).
        type MinimalStack = {
          add: (h: unknown, o: { step: string; name: string }) => void;
        };
        (this.client.middlewareStack as unknown as MinimalStack).add(
          relayTargetMiddleware(relay.target),
          { step: 'build', name: 's3vRelayTarget' }
        );
      }
    }
    return this.client;
  }
}
