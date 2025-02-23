import express from "express";
import { login, logout, register } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/register", register);
userRouter.post("/logout/:userId", logout);

export default userRouter;
