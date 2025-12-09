import { Request } from "express";
import * as jwt from "jsonwebtoken";
import env from "../../../utils/env";


export const decodeToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as any;
};
export const encodeToken = (data: any) => {
  return jwt.sign({ ...data }, env.JWT_SECRET, { expiresIn: Number(env.JWT_EXPIRATION_TIME) }) as any;
};

export const signInToken = (data: any) => {
  return jwt.sign({ ...data }, env.JWT_SECRET) as any;
};

export const signInRefreshToken = (data: any, expiry: number) => {
  return jwt.sign({ ...data }, env.JWT_SECRET, { expiresIn: expiry }) as any;
};

export async function getJwtToken(req: Request) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}