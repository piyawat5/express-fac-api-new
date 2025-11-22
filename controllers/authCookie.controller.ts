import createError from "../utils/createError";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

import nodemailer from "nodemailer";
// import axios from "axios";

interface OTPEmailParams {
  email: string;
  otp: string;
}

interface OTPMailOptions extends nodemailer.SendMailOptions { }
export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  // include optional index signature for any additional Prisma fields (createdAt, updatedAt, etc.)
  [key: string]: unknown;
}
export interface GetUsersResponse {
  success: boolean;
  data: User[];
}
interface DecodedToken {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

interface LoginResponse extends DecodedToken {
  userId: string;
  dbUser: User;
}

// ------------------- function -----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (
  email: OTPEmailParams["email"],
  otp: OTPEmailParams["otp"]
): Promise<nodemailer.SentMessageInfo> => {
  const mailOptions: OTPMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ยืนยันการสมัครสมาชิก - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ยืนยันการสมัครสมาชิก</h2>
        <p>รหัส OTP ของคุณคือ:</p>
        <div style="font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
        <p>หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const getUsers = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users } as GetUsersResponse);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    next(createError(500, message));
  }
};

export const login = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
): Promise<void> => {
  const authHeader: string | undefined = req.headers.authorization as string | undefined;
  if (!authHeader) return next(createError(401, "No token provided"));
  const parts = authHeader.split(" ");
  if (parts.length < 2 || !parts[1]) return next(createError(401, "Malformed token"));
  const token: string = parts[1];
  try {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) return next(createError(500, "JWT secret not configured"));
    const decoded: DecodedToken = await new Promise<DecodedToken>((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) reject(createError(401, "token หมดอายุ"));
        else resolve(decoded as DecodedToken);
      });
    });

    // เช็คว่ามี user ในระบบหรือยัง
    let user: User | null = await prisma.user.findFirst({
      where: { email: decoded.email },
    });

    // ถ้ายังไม่มี ให้สร้างใหม่
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName || null,
          lastName: decoded?.lastName || null,
          avatar: decoded.avatar || null,
        },
      });
    }

    // ส่งข้อมูล user กลับไป
    res.json({
      ...decoded,
      userId: user.id,
      dbUser: user,
    } as LoginResponse);
  } catch (err) {
    next(err);
  }
};

export const authen = (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
): void => {
  const authHeader: string | undefined = req.headers.authorization as string | undefined;
  if (!authHeader) return next(createError(401, "No token provided"));
  const parts = authHeader.split(" ");
  if (parts.length < 2 || !parts[1]) return next(createError(401, "Malformed token"));
  const token: string = parts[1];

  try {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) return next(createError(500, "JWT secret not configured"));
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return next(createError(401, "token หมดอายุ"));
      }
      res.json(decoded);
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------ LOGOUT ------------------------
// export const logout = async (req, res) => {
//   const refreshToken = req.cookies.jid;
//   if (refreshToken) {
//     await prisma.refreshToken.updateMany({
//       where: { tokenHash: hashRt(refreshToken) },
//       data: { revoked: true },
//     });
//   }

//   res.clearCookie("jid"); // ลบ cookie
//   res.json({ message: "Logged out" });
// };

// ------------------------ ME (ไม่ได้ใช้) ----------------------------
// export const authen = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return next(createError(401, "No token provided"));
//   const token = authHeader.split(" ")[1];
//   try {
//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//       if (err) {
//         return next(createError(401, "token หมดอายุ"));
//       }
//       res.json(decoded);
//     });
//   } catch (err) {
//     next(err);
//   }
// };
