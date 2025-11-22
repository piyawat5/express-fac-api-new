import express from "express";

import { authen, getUsers, login } from "../controllers/authCookie.controller";

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/verify", authen);
router.get("/get-user", getUsers)

// TODO: validate

export default router;
