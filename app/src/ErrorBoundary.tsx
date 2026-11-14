// AI-assisted: written with help from Claude (Anthropic). Reviewed by 8crsk.
// Keeps one broken part (the map, a chart, a panel) from blanking the page.
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  /** What the user loses, for the message: "the map", "this chart". */
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Fire Census] ${this.props.name} failed`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      this.props.fallback ?? (
        <div className="note error" role="alert">
          Sorry, {this.props.name} could not be shown ({this.state.error.message}). The rest of the page still works.
        </div>
      )
    );
  }
}
