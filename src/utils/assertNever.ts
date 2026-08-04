export const assertNever = (_value: never): never => {
  throw new Error("Unhandled value");
};
