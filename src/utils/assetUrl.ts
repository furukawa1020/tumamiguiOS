export const buildAssetUrl = (path: string): string => {
  const base = (import.meta.env.BASE_URL ?? "/").toString();
  const baseSuffix = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${baseSuffix}${normalizedPath}`;
};
