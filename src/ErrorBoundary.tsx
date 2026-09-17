import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Bump to clear a previous error (e.g. after loading a fresh scene). */
  resetKey: number;
  onReset: () => void;
}

interface State {
  error: string | null;
}

/**
 * A corrupt restored scene must never blank the whole window again:
 * show what failed and offer a fresh start instead.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(err: unknown): State {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="canvas-error">
          <p>Couldn&apos;t load the drawing: {this.state.error}</p>
          <button type="button" onClick={this.props.onReset}>
            Start fresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
