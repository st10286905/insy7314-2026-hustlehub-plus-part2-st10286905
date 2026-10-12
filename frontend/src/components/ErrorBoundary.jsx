import React from "react";
import { Component } from "react";
import { EmptyState } from "./feedback";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error, info) {
        if (import.meta.env.DEV) console.error("[ErrorBoundary]", error, info.componentStack);
    }
    render() {
        if (this.state.hasError) {
            return (
                <EmptyState
                    title="Something went wrong"
                    message="An unexpected error occurred. Try reloading the page."
                    action={{ label: "Reload", onClick: () => window.location.reload() }}
                />
            );
        }
        return this.props.children;
    }
}
