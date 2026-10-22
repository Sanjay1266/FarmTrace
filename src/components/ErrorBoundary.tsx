import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "An unexpected error occurred." };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto my-8 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {this.props.fallbackTitle || "Something went wrong in this view"}
            </h3>
            <p className="text-xs text-rose-300 mt-1 max-w-sm mx-auto leading-relaxed">
              {this.state.errorMessage}
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-[#121c17] hover:bg-[#1a2820] border border-[#1f2f25] text-white font-semibold text-xs rounded-xl transition flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-farm-950/40 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
