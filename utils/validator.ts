import { object, string } from "yup";
import createError from "./createError.js";
//ตรงส่วนนี้สามารถ copy ไปใช้ฝั่งหน้าบ้านได้ด้วย
export const registerSchema = object({
  email: string()
    .email("กรุณากรอกเป็นรูปแบบ Email")
    .required("กรุณากรอก Email"),
  firstName: string()
    .min(3, "กรุณากรอกชื่อ 3 ตัวอักษร")
    .required("กรุณากรอกชื่อ"),
  lastName: string()
    .min(3, "กรุณากรอกชื่อ 3 ตัวอักษร")
    .required("กรุณากรอกชื่อ"),
  password: string()
    .min(6, "กรุณากรอกรหัสผ่าน อย่างน้อย 6 ตัวอักษร")
    .required("กรุณากรอกรหัสผ่าน"),
});

export const loginSchema = object({
  email: string()
    .email("กรุณากรอกเป็นรูปแบบ Email")
    .required("กรุณากรอก Email"),
  password: string()
    .min(6, "กรุณากรอกรหัสผ่าน อย่างน้อย 6 ตัวอักษร")
    .required("กรุณากรอกรหัสผ่าน"),
});

export interface RequestWithBody<T = any> {
  body: T;
}

export interface ResponseLike {
  // kept minimal to avoid importing express types
  [key: string]: any;
}

export type NextFn = (err?: any) => void;

export interface SchemaLike {
  validate(value: any, options?: { abortEarly?: boolean }): Promise<any>;
}

export const validate =
  (schema: SchemaLike) =>
    async (req: RequestWithBody, res: ResponseLike, next: NextFn): Promise<void> => {
      try {
        //abortEarly มีไว้สำหรับเช็คให้หมดทุกตัว ไม่ใช่เจอ error แล้วหยุด
        await schema.validate(req.body, { abortEarly: true });
        next();
      } catch (error: any) {
        createError(400, Array.isArray(error?.errors) ? error.errors.join(",") : String(error));
        // const errTxt = error.errors.join(",");
        // const err = new Error(errTxt);
        // err.code = 400;
        // next(error);
      }
    };
