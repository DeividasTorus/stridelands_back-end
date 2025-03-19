import pool from '../config/db.js';

export const createUser = async (username, hashedPassword) => {
  return await pool.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
    [username, hashedPassword]
  );
};

export const findUserByUsername = async (username) => {
  return await pool.query('SELECT * FROM users WHERE username = $1', [username]);
};
