import React, { ReactNode } from 'react';

import { ErrorBoundary as EBoundary  } from 'react-error-boundary';

import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface IErrorBoundary {
  children: ReactNode
}

const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div>
      Something went wrong
      <Label>{error.message}</Label>
      <Button onClick={resetErrorBoundary}></Button>
    </div>
  );
};

const ErrorBoundary: React.FC<IErrorBoundary> = ({ children }: IErrorBoundary) => {
  return (
    <EBoundary
      FallbackComponent={ErrorFallback}
    >
      { children }
    </EBoundary>
  );
};

export default ErrorBoundary;
