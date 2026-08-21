/** Shared helpers to simulate asynchronous API behaviour. */

const BASE_LATENCY = 220;

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface SimulateOptions {
  /** Label used in simulated error messages. */
  label: string;
  /** Probability (0-1) of a simulated transient API failure. */
  failureRate?: number;
  minLatency?: number;
  maxLatency?: number;
}

export async function simulateRequest<T>(
  produce: () => T,
  { label, failureRate = 0, minLatency = BASE_LATENCY, maxLatency = BASE_LATENCY + 380 }: SimulateOptions,
): Promise<T> {
  await delay(minLatency + Math.random() * (maxLatency - minLatency));
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new Error(`${label} is temporarily unavailable. Please retry.`);
  }
  return produce();
}

/** Deep clone so callers can never mutate the seeded store. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
