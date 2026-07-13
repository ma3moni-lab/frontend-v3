import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <RefreshCw size={26} className="text-destructive" />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1.125rem" }}>Something went wrong</p>
          <p className="text-muted-foreground mt-2 mb-6" style={{ fontSize: "0.875rem", maxWidth: 300 }}>
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 700 }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
