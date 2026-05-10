import {
  getConfiguredApiBaseUrl,
  getErrorMessage,
  type AuthProfile,
  type AuthProvider,
} from "@/src/services/sync/progressSync";

export type AuthSession = {
  token: string;
  userId: string;
  profileId: string;
  provider: AuthProvider;
  displayName: string;
  email?: string;
  issuedAt: string;
  expiresAt: string;
  source: string;
};

function getAuthEndpoint(path: string) {
  const baseUrl = getConfiguredApiBaseUrl();
  if (!baseUrl) return undefined;

  return `${baseUrl}/auth/${path.replace(/^\/+/, "")}`;
}

export async function createDevSession(authProfile: AuthProfile) {
  const endpoint = getAuthEndpoint("dev-session");
  if (!endpoint) {
    throw new Error("Auth sessions are not configured until EXPO_PUBLIC_API_BASE_URL is set.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authProfile }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Session creation failed: ${response.status}`));
  }

  return response.json() as Promise<AuthSession>;
}

export async function getCurrentSession(sessionToken: string) {
  const endpoint = getAuthEndpoint("session");
  if (!endpoint) {
    throw new Error("Auth sessions are not configured until EXPO_PUBLIC_API_BASE_URL is set.");
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Session check failed: ${response.status}`));
  }

  return response.json() as Promise<AuthSession>;
}
