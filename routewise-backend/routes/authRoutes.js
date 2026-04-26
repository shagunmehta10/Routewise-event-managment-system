import express from "express";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile/:id", authController.getProfile);
router.put("/profile/:id", authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
