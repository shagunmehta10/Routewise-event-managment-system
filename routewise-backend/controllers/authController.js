import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ── Email Transporter (Gmail SMTP) ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (toEmail, resetLink) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("[EMAIL] EMAIL_USER or EMAIL_PASS not set — skipping email. Reset link:", resetLink);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"RouteWise" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "RouteWise — Password Reset Link",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 520px; margin: auto; background: #0f172a; padding: 2rem; border-radius: 1rem; color: white;">
          <h1 style="color: #60a5fa; margin-bottom: 0.5rem;">RouteWise</h1>
          <p style="color: #94a3b8;">You requested a password reset for your RouteWise account.</p>
          <a href="${resetLink}" style="display: inline-block; margin-top: 1.5rem; padding: 0.85rem 2rem; background: #3b82f6; color: white; border-radius: 0.75rem; text-decoration: none; font-weight: bold;">
            Reset My Password
          </a>
          <p style="color: #64748b; margin-top: 2rem; font-size: 0.85rem;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Reset link sent to ${toEmail}`);
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
    console.log(`Login attempt for: ${email}`);
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);

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
    const existingUser = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
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

// ── Forgot Password — sends real email ────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Email not recognized in the tactical grid." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [token, expiry, userResult.rows[0].id]
    );

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendURL}/reset-password?token=${token}`;

    const emailSent = await sendResetEmail(email, resetLink);

    res.json({
      success: true,
      message: emailSent
        ? "Password reset link sent to your email."
        : "Reset link generated (email not configured — check server logs).",
      // Dev fallback: include link in response only if email isn't configured
      ...(!emailSent && { link: resetLink }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Strategic failure during reset request." });
  }
};

// ── Reset Password ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { password, token } = req.body;
  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired mission token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, result.rows[0].id]
    );

    res.json({ success: true, message: "Command access restored. New credentials active." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Deployment failure for new credentials." });
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

    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${i++}`); values.push(email); }
    if (avatar_url !== undefined) { fields.push(`avatar_url = $${i++}`); values.push(avatar_url); }
    if (points !== undefined) { fields.push(`points = $${i++}`); values.push(points); }
    if (settings !== undefined) {
      // Merge with existing so partial updates don't wipe previous keys
      fields.push(`settings = COALESCE(settings, '{}'::jsonb) || $${i++}::jsonb`);
      values.push(JSON.stringify(settings));
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, name, email, role, points, avatar_url, settings`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Tactical profile synchronized", user: result.rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Strategic failure during profile synchronization." });
  }
};
