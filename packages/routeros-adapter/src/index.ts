export interface ConnectionResult {
  connected: boolean;
  message?: string;
}

export interface RouterOsAdapter {
  testConnection(deviceId: string): Promise<ConnectionResult>;
}

export interface BootstrapScriptInput {
  apiBaseUrl: string;
  bootstrapToken: string;
}

export function generateBootstrapScript(input: BootstrapScriptInput) {
  const baseUrl = input.apiBaseUrl.trim().replace(/\/+$/, "");
  if (!baseUrl.startsWith("https://")) {
    throw new Error("RouterOS bootstrap requires an HTTPS API base URL");
  }
  if (!/^aloy_bootstrap_[A-Za-z0-9_-]{32,}$/.test(input.bootstrapToken)) {
    throw new Error("Invalid bootstrap token");
  }

  return [
    "# Aloy RouterOS bootstrap - token is one-time use",
    `:local aloyUrl "${baseUrl}/api/v1/device-onboarding/register";`,
    `:local aloyToken "${input.bootstrapToken}";`,
    ':local aloySerial "";',
    ':do { :set aloySerial [/system/routerboard get serial-number] } on-error={};',
    ':local aloyPayload {',
    '  "identity"=[/system/identity get name];',
    '  "serialNumber"=$aloySerial;',
    '  "model"=[/system/resource get board-name];',
    '  "architectureName"=[/system/resource get architecture-name];',
    '  "routerOsVersion"=[/system/resource get version];',
    "};",
    ':local aloyJson [:serialize to=json options=json.no-string-conversion value=$aloyPayload];',
    '/tool fetch url=$aloyUrl http-method=post check-certificate=yes output=user as-value \\',
    '  http-header-field=("Authorization: Bearer " . $aloyToken . ",Content-Type: application/json") \\',
    "  http-data=$aloyJson;",
    ':set aloyToken "";',
  ].join("\n");
}
