import express from "express";
import * as eventController from "../controllers/eventController.js";

const router = express.Router();

router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.post("/", eventController.createEvent);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);

// Razorpay routes
router.post("/:id/pay-penalty", eventController.createRazorpayOrder);
router.post("/:id/verify-payment", eventController.verifyPayment);

export default router;
