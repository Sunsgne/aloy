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

export interface ManagementWireGuardPlanInput {
  interfaceName?: string;
  deviceAddress: string;
  controllerPublicKey: string;
  controllerEndpoint: string;
  controllerPort?: number;
  allowedControllerCidrs: string[];
}

export function buildManagementWireGuardPlan(input: ManagementWireGuardPlanInput) {
  const interfaceName = input.interfaceName ?? "aloy-mgmt";
  const controllerPort = input.controllerPort ?? 51820;
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(interfaceName)) {
    throw new Error("Invalid WireGuard interface name");
  }
  if (!isCidr(input.deviceAddress) || !input.allowedControllerCidrs.length || !input.allowedControllerCidrs.every(isCidr)) {
    throw new Error("Valid device and controller CIDRs are required");
  }
  if (!/^[A-Za-z0-9+/]{43}=$/.test(input.controllerPublicKey)) {
    throw new Error("Invalid WireGuard controller public key");
  }
  if (!/^[A-Za-z0-9.-]+$/.test(input.controllerEndpoint) || !Number.isInteger(controllerPort) || controllerPort < 1 || controllerPort > 65535) {
    throw new Error("Invalid WireGuard controller endpoint");
  }

  const comment = "aloy:managed:management-wireguard";
  return {
    riskLevel: "LOW",
    containsPrivateKey: false,
    commands: [
      `/interface/wireguard/add name=${interfaceName} comment="${comment}"`,
      `/ip/address/add address=${input.deviceAddress} interface=${interfaceName} comment="${comment}"`,
      `/interface/wireguard/peers/add interface=${interfaceName} public-key="${input.controllerPublicKey}" endpoint-address=${input.controllerEndpoint} endpoint-port=${controllerPort} allowed-address=${input.allowedControllerCidrs.join(",")} persistent-keepalive=25s comment="${comment}"`,
    ],
    verification: ["interface-exists", "peer-exists", "latest-handshake", "controller-reachable"],
  };
}

export interface ExistingConfigItem {
  kind: "IP_ADDRESS" | "BRIDGE" | "VLAN" | "DEFAULT_ROUTE" | "ROUTE" | "FIREWALL" | "OSPF" | "BGP" | "DNS" | "QUEUE";
  identifier: string;
  comment?: string;
}

export function analyzeExistingConfiguration(items: ExistingConfigItem[]) {
  const managedItems = items.filter((item) => item.comment?.startsWith("aloy:managed"));
  const protectedItems = items.filter((item) => !item.comment?.startsWith("aloy:managed"));
  const highRiskKinds = new Set<ExistingConfigItem["kind"]>(["DEFAULT_ROUTE", "FIREWALL", "OSPF", "BGP"]);
  const conflicts = protectedItems
    .filter((item) => highRiskKinds.has(item.kind))
    .map((item) => ({
      kind: item.kind,
      identifier: item.identifier,
      severity: "HIGH",
      resolution: "Review manually; Aloy will not modify this existing object.",
    }));

  return {
    mode: "READ_ONLY",
    riskLevel: conflicts.length ? "HIGH" : protectedItems.length ? "MEDIUM" : "LOW",
    summary: {
      totalItems: items.length,
      managedItems: managedItems.length,
      protectedItems: protectedItems.length,
      conflicts: conflicts.length,
    },
    takeoverScope: managedItems.map(({ kind, identifier }) => ({ kind, identifier })),
    conflicts,
    safeguards: [
      "Existing configuration is read-only by default.",
      "Only objects tagged with aloy:managed are eligible for platform management.",
      "No existing object will be deleted automatically.",
    ],
  };
}

function isCidr(value: string) {
  return /^(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[12][0-9]|3[0-2])$/.test(value) ||
    /^[0-9a-fA-F:]+\/(?:[0-9]|[1-9][0-9]|1[01][0-9]|12[0-8])$/.test(value);
}
