/**
 * Comprehensive performance utilities for the application - OPTIMIZED
 */

import React from "react";

// Simple performance monitor for development
export const performanceMonitor = {
  timers: new Map<string, number>(),

  start(label: string) {
    this.timers.set(label, performance.now());
  },

  end(label: string) {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === "development") {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      this.timers.delete(label);
      return duration;
    }
    return 0;
  },

  async measure<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(label);
    }
  },
};

// Memory usage checker
export const checkMemoryUsage = () => {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (performance as any).memory;
    if (process.env.NODE_ENV === "development") {
      console.log("🧠 Memory Usage:", {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
      });
    }
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Performance measurement utilities
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor(private name: string) {
    this.startTime = performance.now();
    if (
      typeof window !== "undefined" &&
      window.performance &&
      typeof window.performance.mark === "function"
    ) {
      performance.mark(`${name}-start`);
    }
  }

  mark(label: string): void {
    const time = performance.now() - this.startTime;
    this.marks.set(label, time);

    if (
      typeof window !== "undefined" &&
      window.performance &&
      typeof window.performance.mark === "function"
    ) {
      performance.mark(`${this.name}-${label}`);
    }
  }

  end(): { totalTime: number; marks: Record<string, number> } {
    const totalTime = performance.now() - this.startTime;

    if (
      typeof window !== "undefined" &&
      window.performance &&
      typeof window.performance.mark === "function"
    ) {
      performance.mark(`${this.name}-end`);
      performance.measure(this.name, `${this.name}-start`, `${this.name}-end`);
    }

    return {
      totalTime,
      marks: Object.fromEntries(this.marks),
    };
  }
}

// Bundle size analyzer (for development)
export function analyzeBundle() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return null;
  }

  const scripts = Array.from(document.scripts);
  const stylesheets = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );

  return {
    scripts: scripts.map((script) => ({
      src: script.src,
      async: script.async,
      defer: script.defer,
    })),
    stylesheets: stylesheets.map((link) => ({
      href: (link as HTMLLinkElement).href,
    })),
    totalScripts: scripts.length,
    totalStylesheets: stylesheets.length,
  };
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window === "undefined" || !("memory" in performance)) {
    return null;
  }

  const memory = (
    performance as {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;
  if (!memory) return null;

  return {
    used: Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100, // MB
    total: Math.round((memory.totalJSHeapSize / 1024 / 1024) * 100) / 100, // MB
    limit: Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100, // MB
  };
}

// Network monitoring
export function getNetworkInfo() {
  if (typeof window === "undefined" || !("connection" in navigator)) {
    return null;
  }

  const connection = (
    navigator as {
      connection?: {
        effectiveType: string;
        downlink: number;
        rtt: number;
        saveData: boolean;
      };
    }
  ).connection;
  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

// Core Web Vitals measurement
export function measureWebVitals() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const vitals: Record<string, number> = {};

    // Cumulative Layout Shift (CLS)
    if ("PerformanceObserver" in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              vitals.cls = (vitals.cls || 0) + (layoutShiftEntry.value || 0);
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch {
        // Observer not supported
      }

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEntry & {
              processingStart?: number;
            };
            vitals.fid = (fidEntry.processingStart || 0) - entry.startTime;
          }
        });
        fidObserver.observe({ type: "first-input", buffered: true });
      } catch {
        // Observer not supported
      }
    }

    // Largest Contentful Paint (LCP)
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === "first-contentful-paint"
      );
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }
    }

    // Return after a short delay to collect metrics
    setTimeout(() => {
      resolve(vitals);
    }, 1000);
  });
}

// Resource loading performance
export function analyzeResourceLoading() {
  if (typeof window === "undefined" || !window.performance) {
    return null;
  }

  const resources = window.performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[];

  const analysis = {
    total: resources.length,
    byType: {} as Record<string, number>,
    slowest: [] as Array<{ name: string; duration: number; type: string }>,
    totalSize: 0,
    totalTime: 0,
  };

  resources.forEach((resource) => {
    const type = getResourceType(resource.name);
    analysis.byType[type] = (analysis.byType[type] || 0) + 1;

    const duration = resource.responseEnd - resource.startTime;
    analysis.totalTime += duration;

    if (resource.transferSize) {
      analysis.totalSize += resource.transferSize;
    }

    analysis.slowest.push({
      name: resource.name.split("/").pop() || resource.name,
      duration: Math.round(duration),
      type,
    });
  });

  // Sort by duration and take top 10
  analysis.slowest.sort((a, b) => b.duration - a.duration);
  analysis.slowest = analysis.slowest.slice(0, 10);

  return analysis;
}

function getResourceType(url: string): string {
  if (url.includes(".js")) return "script";
  if (url.includes(".css")) return "stylesheet";
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return "image";
  if (url.includes(".woff") || url.includes(".ttf")) return "font";
  return "other";
}

// Component render performance
export function withRenderTracking<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const renderCount = React.useRef(0);
    const renderTimes = React.useRef<number[]>([]);

    React.useEffect(() => {
      renderCount.current += 1;
      const renderTime = performance.now();
      renderTimes.current.push(renderTime);

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10);
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `${componentName || Component.name} rendered ${
            renderCount.current
          } times`
        );
      }
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withRenderTracking(${
    componentName || Component.displayName || Component.name
  })`;
  return WrappedComponent;
}

// Export performance observer for real-time monitoring
export class RealTimePerformanceMonitor {
  private observers: PerformanceObserver[] = [];
  private metrics: Record<string, unknown> = {};

  start() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    // Monitor paint timings
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics[entry.name] = entry.startTime;
        }
      });
      paintObserver.observe({ type: "paint", buffered: true });
      this.observers.push(paintObserver);
    } catch {
      console.warn("Paint observer not supported");
    }

    // Monitor navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceEntry & {
            domContentLoadedEventEnd?: number;
            loadEventEnd?: number;
          };
          this.metrics.navigation = {
            domContentLoaded:
              (navEntry.domContentLoadedEventEnd || 0) - entry.startTime,
            loadComplete: (navEntry.loadEventEnd || 0) - entry.startTime,
          };
        }
      });
      navObserver.observe({ type: "navigation", buffered: true });
      this.observers.push(navObserver);
    } catch {
      console.warn("Navigation observer not supported");
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  stop() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}
