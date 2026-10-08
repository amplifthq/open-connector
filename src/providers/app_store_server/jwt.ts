import { importPKCS8, SignJWT } from "jose";
import { ProviderRequestError, requiredInputString } from "../provider-runtime.ts";

const appStoreServerAudience = "appstoreconnect-v1";

const tokenLifetimeSeconds = 600;
const pkcs8Marker = "-----BEGIN PRIVATE KEY-----";

export interface AppStoreServerCredential {
  issuerId: string;
  keyId: string;

  bundleId: string;

  privateKey: string;
}

export function readAppStoreServerCredential(values: Record<string, string | undefined>): AppStoreServerCredential {
  const privateKey = requiredInputString(values.privateKey, "privateKey").replaceAll("\\n", "\n");
  if (!privateKey.includes(pkcs8Marker)) {
    throw new ProviderRequestError(
      400,
      "privateKey must be the PEM contents of the In-App Purchase .p8 key file, starting with -----BEGIN PRIVATE KEY-----",
      undefined,
      "invalid_input",
    );
  }

  return {
    issuerId: requiredInputString(values.issuerId, "issuerId"),
    keyId: requiredInputString(values.keyId, "keyId"),
    bundleId: requiredInputString(values.bundleId, "bundleId"),
    privateKey,
  };
}

export function createAppStoreServerAuthorization(credential: AppStoreServerCredential): () => Promise<string> {
  let signed: Promise<string> | undefined;
  return () => {
    signed ??= signAuthorizationHeader(credential);
    return signed;
  };
}

async function signAppStoreServerJwt(credential: AppStoreServerCredential, now: Date = new Date()): Promise<string> {
  const signingKey = await importAppStoreServerKey(credential.privateKey);
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ bid: credential.bundleId })
    .setProtectedHeader({ alg: "ES256", kid: credential.keyId, typ: "JWT" })
    .setIssuer(credential.issuerId)
    .setAudience(appStoreServerAudience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + tokenLifetimeSeconds)
    .sign(signingKey);
}

async function signAuthorizationHeader(credential: AppStoreServerCredential): Promise<string> {
  return `Bearer ${await signAppStoreServerJwt(credential)}`;
}

async function importAppStoreServerKey(privateKey: string): Promise<CryptoKey> {
  try {
    return await importPKCS8(privateKey, "ES256");
  } catch {
    throw new ProviderRequestError(
      400,
      "privateKey must be an EC P-256 private key in PKCS#8 PEM format, as downloaded from App Store Connect",
      undefined,
      "invalid_input",
    );
  }
}
