import jwt from "jsonwebtoken";
import createError from "../utils/createError";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  headers: {
    authorization?: string;
  };
}

type TokenPayload = JwtPayload & {
  id?: string;
  [key: string]: any;
};

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(createError(401, "No token provided"));

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(createError(401, "Invalid token format"));
  }

  const token = parts[1] as string;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string
    ) as TokenPayload;

    // attach decoded payload to the request for downstream handlers
    (req as any).user = decoded;
    next();
  } catch (err) {
    // wrap verification errors as 401 Unauthorized
    return next(createError(401, (err as Error).message || "Invalid token"));
  }
};

export default verifyToken;
