export const buildAssetUrl = (path: string): string => {
  const viteMeta = import.meta as unknown as { env?: { BASE_URL?: string } };
  const base = (viteMeta?.env?.BASE_URL ?? "/").toString();
  const baseSuffix = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${baseSuffix}${normalizedPath}`;
};
