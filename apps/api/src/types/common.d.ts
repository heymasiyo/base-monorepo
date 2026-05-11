export type ParsedError = {
  path?: (string | number)[];
  message: string;
};

export interface RequestInfo {
  ip: string;
  userAgent: string;
}

export type JwtPayload = {
  exp: number;
  nbf: number;
  iat: number;
  iss: string;
  sub: string;
  token: string;
};
