import type { AwsErrorLike } from '../components/ErrorBanner';

export function errorFromCaught(err: unknown): AwsErrorLike {
  if (err instanceof Error) {
    return {
      name: err.name,
      code: (err as { code?: string }).code,
      message: err.message,
    };
  }
  return { message: String(err) };
}
