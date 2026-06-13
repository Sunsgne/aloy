export interface DnsProviderAdapter {
  testConnection(providerId: string): Promise<{ connected: boolean }>;
  reloadServer(serverId: string): Promise<{ successful: boolean }>;
}

