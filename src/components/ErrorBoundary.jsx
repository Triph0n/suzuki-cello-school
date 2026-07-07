import { Component } from "react";
import { Music } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-10 shadow-sm">
          <Music size={48} className="mx-auto mb-4 text-primary opacity-60" aria-hidden="true" />
          <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
            Something went off-key
          </h1>
          <p className="text-on-surface-variant text-sm mb-6">
            An unexpected error occurred. Reloading usually fixes it — your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-dim text-on-primary font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
