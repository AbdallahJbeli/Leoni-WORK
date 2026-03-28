import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DashboardDemandeur() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading]   = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
            <p className="text-sm text-gray-500 mt-1">{demandes.length} demande(s) au total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchDemandes} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <Link
              to="/demandeur/nouvelle"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus size={16} />
              Nouvelle demande
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'En attente',     statut: 'en_attente',    color: 'bg-gray-50 border-gray-200'   },
            { label: 'En révision',    statut: 'en_revision',   color: 'bg-blue-50 border-blue-200'   },
            { label: 'En réparation',  statut: 'en_reparation', color: 'bg-orange-50 border-orange-200'},
            { label: 'Réparé',         statut: 'repare',        color: 'bg-green-50 border-green-200' },
          ].map(({ label, statut, color }) => (
            <div key={statut} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-2xl font-bold text-gray-800">
                {demandes.filter(d => d.statut === statut).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : demandes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-sm">Aucune demande pour le moment</p>
            <Link to="/demandeur/nouvelle" className="text-blue-600 text-sm font-medium mt-2 inline-block hover:underline">
              Créer votre première demande →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N° Bon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Segment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Remarque</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demandes.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{d.numero_bon}</td>
                    <td className="px-4 py-3 text-gray-700">{d.equipement}</td>
                    <td className="px-4 py-3 text-gray-500">{d.segment_chaine}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.remarque === 'critique'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {d.remarque === 'critique' ? '🔴 Critique' : '🟡 Planifié'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatutBadge statut={d.statut} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(d.date_demande).toLocaleDateString('fr-FR')}
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