// routes/auth.js
import express from 'express';
const router = express.Router();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

// ----------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------
router.post('/login', async (req, res) => {
  const { matricule, password } = req.body;

  if (!matricule || !password) {
    return res.status(400).json({ message: 'Matricule et mot de passe requis' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE matricule = ? AND actif = 1',
      [matricule]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Matricule ou mot de passe incorrect' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Matricule ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      {
        id:        user.id,
        nom:       user.nom,
        prenom:    user.prenom,
        matricule: user.matricule,
        role:      user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id:                   user.id,
        nom:                  user.nom,
        prenom:               user.prenom,
        matricule:            user.matricule,
        email:                user.email,
        role:                 user.role,
        must_change_password: user.must_change_password === 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// POST /api/auth/change-password
// ----------------------------------------------------------
router.post('/change-password', verifyToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Mot de passe actuel et nouveau requis' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
      [hash, req.user.id]
    );

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// POST /api/auth/users (Admin)
// ----------------------------------------------------------
router.post('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { nom, prenom, matricule, email, password, role } = req.body;

  if (!nom || !prenom || !matricule || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  const rolesValides = ['admin', 'demandeur', 'technicien', 'qualite'];
  if (!rolesValides.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE matricule = ? OR email = ?',
      [matricule, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Matricule ou email déjà utilisé' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (nom, prenom, matricule, email, password, role, must_change_password) VALUES (?,?,?,?,?,?,1)',
      [nom, prenom, matricule, email, hash, role]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// GET /api/auth/users
// ----------------------------------------------------------
router.get('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, prenom, matricule, email, role, actif, must_change_password, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// PUT /api/auth/users/:id
// ----------------------------------------------------------
router.put('/users/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { nom, prenom, email, role, actif, password, reset_password } = req.body;
  const { id } = req.params;

  try {

    if (parseInt(id) === req.user.id && actif === 0) {
      return res.status(403).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      const mustChange = reset_password ? 1 : 0;

      await pool.query(
        'UPDATE users SET nom=?, prenom=?, email=?, role=?, actif=?, password=?, must_change_password=? WHERE id=?',
        [nom, prenom, email, role, actif, hash, mustChange, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET nom=?, prenom=?, email=?, role=?, actif=? WHERE id=?',
        [nom, prenom, email, role, actif, id]
      );
    }

    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// GET /api/auth/me
// ----------------------------------------------------------
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, prenom, matricule, email, role, must_change_password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;