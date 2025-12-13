import { Request } from "express";
import * as jwt from "jsonwebtoken";
import env from "../../../utils/env";


export const decodeToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as any;
};
export const encodeToken = (data: any) => {
  // Parse JWT_EXPIRATION_TIME as number (seconds)
  const expirationTime = env.JWT_EXPIRATION_TIME || "172800"; // Default: 2 days
  let expiresIn: number;
  
  // Try to parse as number
  const parsedNumber = Number(expirationTime);
  if (!isNaN(parsedNumber) && parsedNumber > 0 && isFinite(parsedNumber)) {
    expiresIn = parsedNumber; // Use as number of seconds
  } else {
    // Fallback: default to 2 days (172800 seconds)
    expiresIn = 172800;
  }
  
  return jwt.sign({ ...data }, env.JWT_SECRET, { expiresIn }) as any;
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