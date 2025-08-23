/**
 * Service status checker for monitoring API health
 */

import { modernApiClient } from "./modernApiClient";

interface ServiceStatus {
  isHealthy: boolean;
  lastChecked: number;
  errors: string[];
}

class ServiceStatusChecker {
  private status: ServiceStatus = {
    isHealthy: true,
    lastChecked: Date.now(),
    errors: [],
  };

  private listeners: ((status: ServiceStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // Check every 30 seconds

  constructor() {
    this.startMonitoring();
  }

  startMonitoring() {
    // Initial check
    this.checkHealth();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, this.CHECK_INTERVAL);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkHealth() {
    try {
      // Try the health check endpoint
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        this.updateStatus(true, []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Health check failed with status ${response.status}`;
        this.updateStatus(false, [errorMessage]);
      }
    } catch (error: any) {
      const errorMessage =
        error.name === "AbortError"
          ? "Health check timeout"
          : error.message || "Network error";

      this.updateStatus(false, [errorMessage]);
    }
  }

  private updateStatus(isHealthy: boolean, errors: string[]) {
    this.status = {
      isHealthy,
      lastChecked: Date.now(),
      errors,
    };

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.status));
  }

  getStatus(): ServiceStatus {
    return { ...this.status };
  }

  subscribe(callback: (status: ServiceStatus) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Manual health check
  async checkNow(): Promise<ServiceStatus> {
    await this.checkHealth();
    return this.getStatus();
  }
}

export const serviceStatusChecker = new ServiceStatusChecker();
export type { ServiceStatus };
