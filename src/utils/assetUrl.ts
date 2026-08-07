export const buildAssetUrl = (path: string): string => {
  const viteMeta = import.meta as unknown as { env?: { BASE_URL?: string } };
  const configuredBase = (viteMeta?.env?.BASE_URL ?? "").toString();
  const normalizedBase = configuredBase === "./" || configuredBase === "" || configuredBase === "." ? "" : configuredBase;
  const pageBase = (() => {
    if (typeof window === "undefined") {
      return "/";
    }
    const pathname = window.location.pathname;
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash >= 0 ? `${pathname.slice(0, lastSlash + 1)}` : "/";
  })();
  const base =
    normalizedBase.length > 0
      ? normalizedBase
      : pageBase === "" || pageBase === "?"
        ? "/"
        : pageBase;
  const baseSuffix = base === "/" ? "/" : base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  const full = `${baseSuffix}${normalizedPath}`;
  if (baseSuffix.startsWith("http://") || baseSuffix.startsWith("https://")) {
    return new URL(full, window.location.href).toString();
  }
  return full.startsWith("http") || full.startsWith("/") || baseSuffix.startsWith("/") ? full : `/${full}`;
};
