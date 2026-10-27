import { db } from "../db/connection.js";
export async function listBureaus(_req, res, next) {
  try {
    const bureaus = await db.query(
      "SELECT id, code, name, description, is_active FROM bureaus WHERE is_active = 1 ORDER BY code ASC;"
    );
    res.status(200).json(bureaus);
  } catch (err) {
    next(err);
  }
}
export async function getBureauOfficers(req, res, next) {
  try {
    const { bureauId } = req.params;
    const officers = await db.query(
      `SELECT id, full_name, email, designation 
       FROM users 
       WHERE role = 'officer' AND is_active = 1 AND bureau_id = ?
       ORDER BY full_name ASC;`,
      [bureauId]
    );
    res.status(200).json(officers);
  } catch (err) {
    next(err);
  }
}
