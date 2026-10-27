import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "./auditService.js";
export async function register(dto, ipAddress) {
  const existing = await db.queryOne("SELECT id FROM users WHERE email = ?;", [dto.email.toLowerCase().trim()]);
  if (existing) {
    const error = new Error("An account with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(dto.password, 10);
  const normalizedEmail = dto.email.toLowerCase().trim();
  const role = "complainant";
  await db.execute(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, bureau_id, designation, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
    [id, normalizedEmail, passwordHash, dto.full_name.trim(), dto.phone || null, role, dto.designation || null]
  );
  await logAudit({
    actorId: id,
    action: "USER_REGISTERED",
    entityType: "user",
    entityId: id,
    newValues: { email: normalizedEmail, role },
    ipAddress
  });
  const tokenPayload = {
    userId: id,
    email: normalizedEmail,
    role,
    bureauId: null,
    fullName: dto.full_name.trim()
  };
  const token = signToken(tokenPayload);
  return {
    token,
    user: {
      id,
      email: normalizedEmail,
      full_name: dto.full_name.trim(),
      phone: dto.phone || null,
      role,
      bureau_id: null,
      designation: dto.designation || null,
      is_active: 1,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
export async function login(dto) {
  const normalizedEmail = dto.email.toLowerCase().trim();
  const user = await db.queryOne(
    `SELECT u.*, b.name as bureau_name, b.code as bureau_code
     FROM users u
     LEFT JOIN bureaus b ON u.bureau_id = b.id
     WHERE u.email = ?;`,
    [normalizedEmail]
  );
  if (!user || !user.password_hash) {
    const error = new Error("Invalid email address or password.");
    error.statusCode = 401;
    throw error;
  }
  if (!user.is_active) {
    const error = new Error("This account has been deactivated. Please contact the system administrator.");
    error.statusCode = 403;
    throw error;
  }
  const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error("Invalid email address or password.");
    error.statusCode = 401;
    throw error;
  }
  await logAudit({
    actorId: user.id,
    action: "USER_LOGIN",
    entityType: "user",
    entityId: user.id,
    ipAddress: dto.ipAddress
  });
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    bureauId: user.bureau_id || null,
    fullName: user.full_name
  };
  const token = signToken(tokenPayload);
  const { password_hash, ...safeUser } = user;
  return {
    token,
    user: safeUser
  };
}
export async function getUserById(id) {
  const user = await db.queryOne(
    `SELECT u.*, b.name as bureau_name, b.code as bureau_code
     FROM users u
     LEFT JOIN bureaus b ON u.bureau_id = b.id
     WHERE u.id = ?;`,
    [id]
  );
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
export async function updateUserProfile(id, updates) {
  await db.execute(
    `UPDATE users
     SET full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         designation = COALESCE(?, designation),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    [updates.full_name || null, updates.phone || null, updates.designation || null, id]
  );
  const updated = await getUserById(id);
  if (!updated) throw new Error("User not found");
  return updated;
}
