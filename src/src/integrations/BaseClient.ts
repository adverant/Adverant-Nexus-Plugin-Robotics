import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Logger } from 'winston';
import { API_CONSTANTS } from '../../../shared/src/constants';
import { RoboticsError } from '../../../shared/src/types';

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

export class BaseClient {
  protected client: AxiosInstance;
  protected logger: Logger;
  private retryConfig: RetryConfig;
  private circuitBreaker: {
    failures: number;
    lastFailureTime: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  };

  constructor(
    protected serviceName: string,
    protected baseURL: string,
    logger: Logger,
    retryConfig?: Partial<RetryConfig>,
    _circuitBreakerConfig?: Partial<CircuitBreakerConfig>
  ) {
    this.logger = logger.child({ service: serviceName });

    this.retryConfig = {
      maxAttempts: retryConfig?.maxAttempts ?? API_CONSTANTS.MAX_RETRY_ATTEMPTS,
      delayMs: retryConfig?.delayMs ?? API_CONSTANTS.RETRY_DELAY_MS,
      backoffMultiplier: retryConfig?.backoffMultiplier ?? API_CONSTANTS.RETRY_BACKOFF_MULTIPLIER,
    };

    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };

    this.client = axios.create({
      baseURL,
      timeout: API_CONSTANTS.DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'nexus-robotics',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('Response', {
          status: response.status,
          url: response.config.url,
        });
        this.resetCircuitBreaker();
        return response;
      },
      (error) => {
        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute request with retry logic and circuit breaker
   */
  protected async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    options?: { retries?: number; operationName?: string }
  ): Promise<T> {
    const maxAttempts = options?.retries ?? this.retryConfig.maxAttempts;
    const operationName = options?.operationName || 'request';

    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < 30000) {
        // 30 second reset timeout
        throw new RoboticsError(
          `Circuit breaker OPEN for ${this.serviceName}. Service temporarily unavailable.`,
          'CIRCUIT_BREAKER_OPEN',
          503
        );
      } else {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.logger.info('Circuit breaker entering HALF_OPEN state', { service: this.serviceName });
      }
    }

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await requestFn();
        if (attempt > 1) {
          this.logger.info('Request succeeded after retry', {
            service: this.serviceName,
            operation: operationName,
            attempt,
          });
        }
        return result;
      } catch (error) {
        lastError = error as Error;

        this.logger.warn('Request failed', {
          service: this.serviceName,
          operation: operationName,
          attempt,
          maxAttempts,
          error: (error as Error).message,
        });

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw this.transformError(error);
        }

        // Increment circuit breaker failure count
        this.incrementCircuitBreakerFailure();

        // If not last attempt, wait before retry
        if (attempt < maxAttempts) {
          const delay = this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          this.logger.debug('Retrying after delay', { delayMs: delay });
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.logger.error('All retry attempts exhausted', {
      service: this.serviceName,
      operation: operationName,
      maxAttempts,
    });

    throw this.transformError(lastError!);
  }

  /**
   * GET request with retry
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.client.get<T>(url, config);
        return response.data;
      },
      { operationName: `GET ${url}` }
    );
  }

  /**
   * POST request with retry
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
      },
      { operationName: `POST ${url}` }
    );
  }

  /**
   * PUT request with retry
   */
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
      },
      { operationName: `PUT ${url}` }
    );
  }

  /**
   * DELETE request with retry
   */
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.client.delete<T>(url, config);
        return response.data;
      },
      { operationName: `DELETE ${url}` }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('Health check failed', {
        service: this.serviceName,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Handle response errors
   */
  private handleResponseError(error: AxiosError): void {
    if (error.response) {
      this.logger.error('Response error', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      });
    } else if (error.request) {
      this.logger.error('No response received', {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      this.logger.error('Request setup error', {
        message: error.message,
      });
    }
  }

  /**
   * Transform axios error to RoboticsError
   */
  private transformError(error: Error): RoboticsError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      const code = error.response?.data?.code || 'SERVICE_ERROR';

      return new RoboticsError(`${this.serviceName}: ${message}`, code, status, {
        service: this.serviceName,
        originalError: error.message,
        url: error.config?.url,
      });
    }

    return new RoboticsError(
      `${this.serviceName}: ${error.message}`,
      'UNKNOWN_ERROR',
      500,
      {
        service: this.serviceName,
        originalError: error.message,
      }
    );
  }

  /**
   * Increment circuit breaker failure count
   */
  private incrementCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= 5) {
      // Threshold
      this.circuitBreaker.state = 'OPEN';
      this.logger.error('Circuit breaker OPEN', {
        service: this.serviceName,
        failures: this.circuitBreaker.failures,
      });
    }
  }

  /**
   * Reset circuit breaker on successful request
   */
  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.failures > 0) {
      this.logger.info('Circuit breaker reset', {
        service: this.serviceName,
        previousFailures: this.circuitBreaker.failures,
      });
    }
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
