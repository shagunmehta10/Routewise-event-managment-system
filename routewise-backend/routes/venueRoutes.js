import express from "express";
import * as venueController from "../controllers/venueController.js";

const router = express.Router();

// Register a new venue
router.post("/", venueController.registerVenue);

// Get all venues
router.get("/", venueController.getAllVenues);

// Get a specific venue
router.get("/:id", venueController.getVenueById);

// Update a venue
router.put("/:id", venueController.updateVenue);

// Delete a venue
router.delete("/:id", venueController.deleteVenue);

// Admin: Approve a venue
router.put("/:id/approve", venueController.approveVenue);

export default router;

