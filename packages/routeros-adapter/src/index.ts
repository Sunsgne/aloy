export interface ConnectionResult {
  connected: boolean;
  message?: string;
}

export interface RouterOsAdapter {
  testConnection(deviceId: string): Promise<ConnectionResult>;
}

