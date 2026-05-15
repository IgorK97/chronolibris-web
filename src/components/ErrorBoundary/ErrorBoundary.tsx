import React from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ошибка:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h2>Что-то пошло не так</h2>;
    }
    return this.props.children;
  }
}
