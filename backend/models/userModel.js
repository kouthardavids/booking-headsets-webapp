import db from '../config/db.js';

// Check if the user already exists
export const checkUserExists = async (email) => {
    const [result] = await db.query(
        `SELECT * FROM users WHERE email = ?`, [email]
    );

    return result[0];
};

// Manually sign up user
export const signup = async (username, email, password) => {
  const [result] = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, password]
  );

  const [rows] = await db.query(
    'SELECT * FROM users WHERE user_id = ?',
    [result.insertId]
  );

  return rows[0];
};


// Manually login user 
export const login = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};


// Google signup 
export const googleSignup = async (google_id, full_name, email) => {
    const [result] = await db.query(
        `INSERT INTO users (google_id, username, email, password_hash, is_google_user) VALUES (?, ?, ?, ?, ?)`,
        [google_id, full_name, email, '', 1]
    );

    return result.insertId;
};