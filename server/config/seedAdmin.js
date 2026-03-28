// config/seedAdmin.js
import bcrypt from 'bcryptjs';
import pool from './db.js';

export default async function seedAdmin() {
  const matricule = process.env.ADMIN_MATRICULE;
  const email     = process.env.ADMIN_EMAIL;
  const password  = process.env.ADMIN_PASSWORD;

  if (!matricule || !email || !password) {
    console.warn('⚠️  ADMIN_MATRICULE, ADMIN_EMAIL ou ADMIN_PASSWORD manquant dans .env — admin non créé');
    return;
  }

  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE matricule = ? OR email = ?',
      [matricule, email]
    );

    if (rows.length > 0) {
      console.log('ℹ️  Admin déjà existant — seed ignoré');
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users 
        (nom, prenom, matricule, email, password, role, must_change_password)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
      ['Admin', 'LEONI', matricule, email, hash]
    );

    console.log(`✅  Admin créé — matricule: ${matricule} / mot de passe: ${password}`);
    console.log('⚠️  L\'admin devra changer son mot de passe au premier login');
  } catch (err) {
    console.error('❌  Erreur lors du seed admin :', err.message);
  }
}