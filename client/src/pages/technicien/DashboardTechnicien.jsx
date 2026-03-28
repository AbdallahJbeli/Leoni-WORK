import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DashboardTechnicien() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtre, setFiltre]     = useState('tous');
  const navigate = useNavigate();

  const fetchDemandes = async () => {
    try {
      const res = await api.get('/demandes');
      setDemandes(res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const handleVoir = async (id, statut) => {
    // Si encore "en_attente", on déclenche la mise en révision
    if (statut === 'en_attente') {
      try {
        await api.put(`/technicien/${id}/voir`);
      } catch (_) {}
    }
    navigate(`/technicien/fiche/${id}`);
  };

  const filtres = ['tous', 'en_attente', 'en_revision', 'en_reparation', 'attente_qualite', 'repare', 'hors_service'];
  const demandesFiltrees = filtre === 'tous'
    ? demandes
    : demandes.filter(d => d.statut === filtre);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord technicien</h1>
            <p className="text-sm text-gray-500 mt-1">{demandes.length} demande(s) au total</p>
          </div>
          <button onClick={fetchDemandes} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'En attente',    statut: 'en_attente',    bg: 'bg-gray-50'    },
            { label: 'En révision',   statut: 'en_revision',   bg: 'bg-blue-50'    },
            { label: 'En réparation', statut: 'en_reparation', bg: 'bg-orange-50'  },
            { label: 'Attente qualité', statut: 'attente_qualite', bg: 'bg-yellow-50' },
          ].map(({ label, statut, bg }) => (
            <div key={statut} className={`rounded-xl border border-gray-200 p-4 ${bg} cursor-pointer hover:shadow-sm transition`} onClick={() => setFiltre(statut)}>
              <p className="text-2xl font-bold text-gray-800">{demandes.filter(d => d.statut === statut).length}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap mb-4">
          {filtres.map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filtre === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f === 'tous' ? 'Tous' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : demandesFiltrees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucune demande dans cette catégorie</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N° Bon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Demandeur</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Segment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Remarque</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demandesFiltrees.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{d.numero_bon}</td>
                    <td className="px-4 py-3 text-gray-700">{d.equipement}</td>
                    <td className="px-4 py-3 text-gray-500">{d.prenom_demandeur} {d.nom_demandeur}</td>
                    <td className="px-4 py-3 text-gray-500">{d.segment_chaine}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.remarque === 'critique' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {d.remarque === 'critique' ? '🔴 Critique' : '🟡 Planifié'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatutBadge statut={d.statut} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(d.date_demande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleVoir(d.id, d.statut)}
                        className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
                      >
                        <Eye size={13} /> Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}