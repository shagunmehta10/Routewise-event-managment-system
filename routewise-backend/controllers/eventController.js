import pool from "../config/db.js";
import { emitRefresh } from "../socket/socketUtils.js";
import crypto from "crypto";
import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});


// Hospital locations for risk detection
const HOSPITALS = [
  { name: "Max Hospital", lat: 30.3756, lon: 78.0772 },
  { name: "Doon Hospital", lat: 30.3228, lon: 78.0379 },
  { name: "Synergy Hospital", lat: 30.3421, lon: 77.9945 }
];

function getDistance(lat1, lon1, lat2, lon2) {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

function calculateRisk(row) {
  let score = 0;
  
  // 1. Time-based risk (Peak Hours)
  if (row.startTime || row.starttime) {
    const [h, m] = (row.startTime || row.starttime).split(':').map(Number);
    if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) {
      score += 40; // High peak hour penalty
    }
  }

  // 2. Proximity to Hospital (within 0.01 degrees ~ 1km)
  if (row.start_lat && row.start_lon) {
    const nearHospital = HOSPITALS.some(h => getDistance(row.start_lat, row.start_lon, h.lat, h.lon) < 0.01);
    if (nearHospital) score += 50;
  }

  // 3. Category-specific weights
  switch (row.event_type || row.eventType) {
    case 'ambulance':
      return 0; // Medical emergency is never "risk"
    case 'vip':
      score += 90;
      break;
    case 'rally':
      score += 70;
      break;
    case 'baraat':
      score += 15;
      break;
    case 'funeral':
      score += 20;
      break;
    default:
      score += 5;
  }

  return Math.min(score, 100);
}



function getCalculatedStatus(row) {
  if (!row.date) return row.status || 'upcoming';
  
  // 1. Get Current IST Time
  const now = new Date();
  const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // "YYYY-MM-DD"
  
  // Get current minutes in IST
  const istTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }); // "HH:MM:SS"
  const [currH, currM] = istTimeStr.split(':').map(Number);
  const currentMins = currH * 60 + currM;
  
  // 2. Get Event IST Date String
  const eventDateStr = new Date(row.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const isToday = eventDateStr === istDateStr;
  const isPast = eventDateStr < istDateStr;
  const isFuture = eventDateStr > istDateStr;


  if (isFuture) return 'upcoming';
  if (isPast) return 'completed';

  if (isToday) {
    const startTime = row.startTime || row.starttime;
    const endTime = row.endTime || row.endtime;
    
    if (startTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const startMins = sh * 60 + sm;
      
      if (!endTime) {
        return currentMins >= startMins ? 'live' : 'upcoming';
      }

      const [eh, em] = endTime.split(':').map(Number);
      let endMins = eh * 60 + em;
      
      if (endMins < startMins) {
        // Midnight cross
        if (currentMins >= startMins || currentMins <= endMins) return 'live';
        if (currentMins > endMins && currentMins < startMins) return 'upcoming';
      } else {
        if (currentMins >= startMins && currentMins <= endMins) return 'live';
        if (currentMins < startMins) return 'upcoming';
      }
      return 'completed';
    }
    return 'live';
  }
  
  return row.status || 'upcoming';
}


// Helper: normalize PostgreSQL row keys to camelCase for frontend
function normalizeEvent(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    date: row.date,
    startLocation: row.startLocation || row.startlocation || '',
    endLocation: row.endLocation || row.endlocation || '',
    startTime: row.startTime || row.starttime || '',
    endTime: row.endTime || row.endtime || '',
    status: getCalculatedStatus(row),
    eventType: row.event_type || 'other',
    venueId: row.venue_id,
    riskScore: calculateRisk(row),
    startCoords: row.start_lat ? [row.start_lat, row.start_lon] : null,
    endCoords: row.end_lat ? [row.end_lat, row.end_lon] : null,
    is_private: row.is_private || false,
    created_at: row.created_at,
  };
}

// Create Event Controller
export const createEvent = async (req, res) => {
  const { name, description, date, startLocation, endLocation, startTime, endTime, startCoords, endCoords, eventType, venueId, userId, penalty } = req.body;
  try {
    console.log("Attempting to create event for user:", userId, { name, eventType, penalty });

    // 1. Validation for Baraat
    if (eventType === 'baraat' && !venueId) {
       return res.status(400).json({ message: "Baraat events must select a venue." });
    }
    
    const appliedPenalty = parseInt(penalty) || 0;

    // 2. INSERT into events
    const result = await pool.query(
      `INSERT INTO events (name, description, date, "startLocation", "endLocation", "startTime", "endTime", status, start_lat, start_lon, end_lat, end_lon, event_type, venue_id, user_id, penalty, is_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        name, 
        appliedPenalty > 0 ? `[CLASH PENALTY: ${appliedPenalty}] ${description || ''}` : description,
        date, startLocation, endLocation, startTime, endTime, "upcoming",
        startCoords?.[0] || null, startCoords?.[1] || null, endCoords?.[0] || null, endCoords?.[1] || null,
        eventType || 'other', venueId || null, userId || null, appliedPenalty,
        req.body.is_private || false
      ]
    );
    
    if (userId) {
      await pool.query("UPDATE users SET points = points + 10 WHERE id = $1", [userId]);
    }

    const normalized = normalizeEvent(result.rows[0]);
    // Sync the risk score with the penalty
    normalized.riskScore = Math.min(normalized.riskScore + (appliedPenalty / 10), 100);

    res.status(201).json(normalized);
    
    // Notify clients about new event
    emitRefresh();


  } catch (error) {
    console.error("CRITICAL DATABASE ERROR during event creation:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
};



// Get All Events Controller
export const getAllEvents = async (req, res) => {
  const { userId } = req.query;
  try {
    let result;
    if (userId) {
      result = await pool.query("SELECT * FROM events WHERE user_id = $1 ORDER BY date ASC", [userId]);
    } else {
      result = await pool.query("SELECT * FROM events ORDER BY date ASC");
    }
    res.json(result.rows.map(normalizeEvent));
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error while fetching events" });
  }
};

// Get Event By ID Controller
export const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(normalizeEvent(result.rows[0]));
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error while fetching event" });
  }
};

// Update Event Controller
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, date, startLocation, endLocation, startTime, endTime } = req.body;
  try {
    console.log("Attempting to update event:", id);
    const result = await pool.query(
      `UPDATE events 
       SET name = $1, description = $2, date = $3, "startLocation" = $4, "endLocation" = $5, "startTime" = $6, "endTime" = $7, is_private = $8
       WHERE id = $9 RETURNING *`,
      [name, description, date, startLocation, endLocation, startTime, endTime, req.body.is_private || false, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    const normalized = normalizeEvent(result.rows[0]);
    console.log("Event updated successfully:", id);
    res.json(normalized);

    // Notify clients about updated event
    emitRefresh();


  } catch (error) {
    console.error("CRITICAL DATABASE ERROR during event update:", {
      message: error.message,
      detail: error.detail,
      code: error.code
    });
    res.status(500).json({ 
      message: "Server error while updating event",
      detail: error.message,
      code: error.code
    });
  }
};

// Delete Event Controller
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    res.json({ message: "Event deleted successfully" });

    // Notify clients about deleted event
    emitRefresh();

  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error while deleting event" });
  }
};

// ── Razorpay Integration ───────────────────────────────────────────────────

export const createRazorpayOrder = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_event_${id}`,
    };
    
    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).json({ message: "Error creating Razorpay order" });
    
    res.json(order);
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ message: "Server error creating payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { id } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic, update the event record
      await pool.query("UPDATE events SET penalty_paid = TRUE WHERE id = $1", [id]);
      
      // Notify clients to re-fetch so the clash shows as paid
      emitRefresh();
      
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Server error verifying payment" });
  }
};
