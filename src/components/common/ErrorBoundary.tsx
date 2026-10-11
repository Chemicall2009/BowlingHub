/**
 * @file src/components/common/ErrorBoundary.tsx
 * @description Граница ошибок (Error Boundary) верхнего уровня с перехватом рендер-сбоев и кнопкой отчёта.
 */

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, Home } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Uncaught render error:", error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleCopyReport = () => {
    const report = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast.success("Отчёт об ошибке скопирован в буфер обмена");
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800 m-6">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            {this.props.fallbackTitle || "Что-то пошло не так в интерфейсе"}
          </h2>
          <p className="text-xs text-zinc-400 text-center max-w-md mb-6">
            Произошла непредвиденная ошибка рендеринга компонента. Вы можете перезагрузить страницу или вернуться на главную.
          </p>

          {isDev && this.state.error && (
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-4 rounded-lg font-mono text-xs text-red-300 mb-6 overflow-x-auto max-h-48">
              <p className="font-bold">{this.state.error.toString()}</p>
              <pre className="mt-2 text-[10px] text-zinc-400">{this.state.error.stack}</pre>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={this.handleReload}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Перезагрузить страницу
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={this.handleCopyReport}
              className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs gap-2"
            >
              <Copy className="h-3.5 w-3.5" /> Скопировать отчёт
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={this.handleGoHome}
              className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs gap-2"
            >
              <Home className="h-3.5 w-3.5" /> К дорожкам
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
