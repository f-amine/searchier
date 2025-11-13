declare module "pg" {
  import { EventEmitter } from "node:events";

  export interface PoolConfig {
    connectionString?: string;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    end(): Promise<void>;
    query<T = unknown>(queryText: string, params?: unknown[]): Promise<{
      rows: T[];
    }>;
  }
}
