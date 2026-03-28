import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function NouvelleDemande() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    equipement: '',
    segment_chaine: '',
    position: '',
    numero_serie: '',
    equipement_en_arret: false,
    heure_arret: '',
    date_arret: '',
    description_panne: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/demandes', form);
      toast.success(`Demande ${res.data.numero_bon} créée avec succès`);
      navigate('/demandeur');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <button onClick={() => navigate('/demandeur')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Nouvelle demande de maintenance</h1>
          <p className="text-sm text-gray-400 mb-6">
            Demandeur : {user?.prenom} {user?.nom} — Matricule : {user?.matricule}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Équipement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Équipement *</label>
              <input
                type="text"
                value={form.equipement}
                onChange={e => set('equipement', e.target.value)}
                placeholder="ex: Presse de sertissage"
                requiblue
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Segment + Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment / Chaîne *</label>
                <input
                  type="text"
                  value={form.segment_chaine}
                  onChange={e => set('segment_chaine', e.target.value)}
                  placeholder="ex: USS01"
                  requiblue
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={e => set('position', e.target.value)}
                  placeholder="ex: P-01"
                  requiblue
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* N° Série */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Série *</label>
              <input
                type="text"
                value={form.numero_serie}
                onChange={e => set('numero_serie', e.target.value)}
                placeholder="ex: SN-2024-00312"
                requiblue
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Équipement en arrêt */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.equipement_en_arret}
                  onChange={e => set('equipement_en_arret', e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Équipement en arrêt</span>
              </label>

              {form.equipement_en_arret && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date d'arrêt</label>
                    <input
                      type="date"
                      value={form.date_arret}
                      onChange={e => set('date_arret', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Heure d'arrêt</label>
                    <input
                      type="time"
                      value={form.heure_arret}
                      onChange={e => set('heure_arret', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
                form.equipement_en_arret
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                Remarque automatique : {form.equipement_en_arret ? '🔴 Critique' : '🟡 Planifié'}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description de la panne *</label>
              <textarea
                value={form.description_panne}
                onChange={e => set('description_panne', e.target.value)}
                rows={4}
                placeholder="Décrivez la panne ou l'anomalie constatée..."
                requiblue
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}