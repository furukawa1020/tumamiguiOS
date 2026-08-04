export const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : "予期しないエラーが発生しました。";
