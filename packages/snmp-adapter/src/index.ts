export interface SnmpTarget {
  host: string;
  port: number;
}

export interface SnmpAdapter {
  testConnection(target: SnmpTarget): Promise<{ connected: boolean }>;
}

