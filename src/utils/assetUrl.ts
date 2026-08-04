export const buildAssetUrl = (path: string): string => {
  const baseMeta = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env;
  const base = (baseMeta?.BASE_URL ?? "/").toString();
  const baseSuffix = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${baseSuffix}${normalizedPath}`;
};
