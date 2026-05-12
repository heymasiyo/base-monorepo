export type ParsedError = {
  path?: (string | number)[];
  message: string;
};

export interface RequestInfo {
  ip: string;
  userAgent: string;
}
