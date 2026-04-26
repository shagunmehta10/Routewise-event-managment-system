import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend"; // npm install resend

// ── Resend Email Client ─────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendResetEmail = async (toEmail, resetLink) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY not set — skipping email. Reset link:", resetLink);
    return false;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@routewise.app",
      to: toEmail,
      subject: "RouteWise — Password Reset Link",
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#0f172a;padding:2rem;border-radius:1rem;color:white;">
          <h1 style="color:#60a5fa;margin-bottom:0.5rem;">RouteWise</h1>
          <p style="color:#94a3b8;">You requested a password reset for your RouteWise account.</p>
          <a href="${resetLink}" style="display:inline-block;margin-top:1.5rem;padding:0.85rem 2rem;background:#3b82f6;color:white;border-radius:0.75rem;text-decoration:none;font-weight:bold;">
            Reset My Password
          </a>
          <p style="color:#64748b;margin-top:2rem;font-size:0.85rem;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return false;
    }

    console.log(`[EMAIL] Reset email sent to ${toEmail}, ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send reset email:", err.message);
    return false;
  }
};

// ── Ensure settings column exists (safe migration) ─────────────────────────
export const ensureSettingsColumn = async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'`);
    console.log("[DB] settings column ready");
  } catch (err) {
    console.warn("[DB] Could not ensure settings column:", err.message);
  }
};

// ── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        avatar_url: user.avatar_url,
        settings: user.settings || {},
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, points, avatar_url, settings FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists. Please login instead." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, role || "user"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]
    );

    // Always return 200 — don't reveal whether email exists (security best practice)
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1-hour expiry

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [token, expiry, userResult.rows[0].id]
    );

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendURL}/reset-password?token=${token}`;

    const emailSent = await sendResetEmail(email, resetLink);

    console.log(`[RESET] ${emailSent ? "Email sent" : "Dev fallback"}: ${resetLink}`);

    res.json({
      success: true,
      message: emailSent
        ? "Password reset link sent to your email."
        : "Reset link generated (RESEND_API_KEY not set — see server logs).",
      // Only expose link in response when email is not configured (dev mode)
      ...(!emailSent && { link: resetLink }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during reset request." });
  }
};

// ── Reset Password ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, result.rows[0].id]
    );

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
};

// ── Update Profile / Settings ──────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, avatar_url, points, settings } = req.body;
  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined)       { fields.push(`name = $${i++}`);       values.push(name); }
    if (email !== undefined)      { fields.push(`email = $${i++}`);      values.push(email); }
    if (avatar_url !== undefined) { fields.push(`avatar_url = $${i++}`); values.push(avatar_url); }
    if (points !== undefined)     { fields.push(`points = $${i++}`);     values.push(points); }
    if (settings !== undefined) {
      // Merge so partial updates don't wipe previous keys
      fields.push(`settings = COALESCE(settings, '{}'::jsonb) || $${i++}::jsonb`);
      values.push(JSON.stringify(settings));
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    values.push(id);
    const query = `
      UPDATE users SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING id, name, email, role, points, avatar_url, settings
    `;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated", user: result.rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update." });
  }
};
