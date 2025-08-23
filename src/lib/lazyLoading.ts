/**
 * Lazy loading utilities for better code splitting and performance
 */

import React, {
  lazy,
  ComponentType,
  Suspense,
  ReactNode,
  useState,
  useEffect,
} from "react";

/**
 * Create a lazily loaded component with a fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return React.createElement(
      Suspense,
      {
        fallback:
          fallback ||
          React.createElement("div", {
            className: "animate-pulse bg-gray-200 h-32 rounded",
          }),
      },
      React.createElement(LazyComponent, props)
    );
  };
}

/**
 * Preload a component to avoid loading delay
 */
export function preloadComponent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  // Start loading the component
  importFn();
}

/**
 * Create a preloadable lazy component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPreloadableLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  const LazyWrapper = function (props: React.ComponentProps<T>) {
    return React.createElement(
      Suspense,
      {
        fallback:
          fallback ||
          React.createElement("div", {
            className: "animate-pulse bg-gray-200 h-32 rounded",
          }),
      },
      React.createElement(LazyComponent, props)
    );
  };

  // Add preload method
  LazyWrapper.preload = () => preloadComponent(importFn);

  return LazyWrapper;
}

/**
 * Hook for lazy loading data
 */
export function useLazyData<T>(loadFn: () => Promise<T>) {
  // This would typically use a state management library or React hooks
  // For now, returning the load function
  return loadFn;
}

/**
 * Intersection Observer hook for lazy loading on scroll
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Common lazy-loaded components
export const LazyProductCard = createPreloadableLazyComponent(
  () => import("../components/products/ProductCard")
);

export const LazyProductFilters = createPreloadableLazyComponent(
  () => import("../components/products/ProductFilters")
);
