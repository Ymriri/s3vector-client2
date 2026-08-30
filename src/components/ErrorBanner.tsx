import { Alert, Button, Space, Typography } from 'antd';

export interface AwsErrorLike {
  name?: string;
  code?: string;
  message?: string;
}

export interface ErrorBannerProps {
  error: AwsErrorLike | null | undefined;
  onDismiss?: () => void;
}

function extractErrorCode(error: AwsErrorLike): string {
  return error.code ?? error.name ?? 'UnknownError';
}

function extractErrorMessage(error: AwsErrorLike): string {
  return error.message ?? 'An unexpected error occurred.';
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  const code = extractErrorCode(error);
  const message = extractErrorMessage(error);

  return (
    <Alert
      type="error"
      message={
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ color: 'inherit' }}>
            {code}
          </Typography.Text>
          <Typography.Text style={{ color: 'inherit' }}>
            {message}
          </Typography.Text>
        </Space>
      }
      showIcon
      action={
        onDismiss ? (
          <Button size="small" type="text" onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null
      }
      style={{ marginBottom: 16 }}
    />
  );
}
