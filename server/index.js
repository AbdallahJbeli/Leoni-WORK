import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import seedAdmin from './config/seedAdmin.js';

import authRoutes from './routes/auth.js';
import demandesRoutes from './routes/demandes.js';
import technicienRoutes from './routes/technicien.js';
import qualiteRoutes from './routes/qualite.js';

dotenv.config();

const app = express();

// ----------------------------------------------------------
// Middlewares
// ----------------------------------------------------------
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ----------------------------------------------------------
// Routes
// ----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);
app.use('/api/technicien', technicienRoutes);
app.use('/api/qualite', qualiteRoutes);

// ----------------------------------------------------------
// Health check
// ----------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LEONI BDT API en ligne' });
});

// ----------------------------------------------------------
// Start server
// ----------------------------------------------------------
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await seedAdmin(); // create admin if not exists

    app.listen(PORT, () => {
      console.log(`✅ Serveur LEONI BDT démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erreur au démarrage:', err);
  }
};

start();