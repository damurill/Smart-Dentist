
import axios from '../utils/axiosConfig';
import { Search, Plus, Phone, Mail, MoreHorizontal, MessageCircle, Users, FileText, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { locations } from '../constants/locations';

const Patients = () => {
    const { t } = useLanguage();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '', province: '', district: '' });

    // History Modal State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Dropdown State
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

    useEffect(() => {
        fetchPatients();
    }, [search]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/patients?search=${search}`);
            setPatients(res.data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/patients', formData);
            setShowForm(false);
            setFormData({ name: '', phone: '', email: '', notes: '' });
            fetchPatients();
        } catch (error) {
            console.error("Error creating patient:", error);
        }
    };

    const handleDelete = async (patient) => {
        if (window.confirm(t('patients.confirm_delete') || `¿Estás seguro que deseas eliminar a ${patient.name}? Esta acción borrará también su historial de citas.`)) {
            try {
                await axios.delete(`/api/patients/${patient.id}`);
                fetchPatients(); // Refresh list
                setActiveDropdown(null);
            } catch (error) {
                console.error("Error deleting patient:", error);
                alert("Error al eliminar el paciente");
            }
        }
    };

    const handleViewHistory = async (patient) => {
        setSelectedPatient(patient);
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const res = await axios.get(`/api/patients/${patient.id}/history`);
            setPatientHistory(res.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openWhatsApp = (phone) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {t('patients.title')}
                    </h2>
                    <p className="text-gray-500">{t('patients.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    {t('patients.new_patient')}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('patients.search_placeholder')}
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Patients List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>
                ) : patients.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 w-16 h-16">
                            <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">{t('patients.no_patients')}</h3>
                        <p className="text-gray-500 text-sm">{t('patients.start_adding')}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('patients.table_name')}</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('patients.table_contact')}</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('patients.table_notes')}</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('patients.table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {patient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="font-medium text-gray-900">{patient.name}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="space-y-1">
                                            {patient.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 group cursor-pointer" onClick={() => openWhatsApp(patient.phone)}>
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-500 transition-colors" />
                                                    <span className="group-hover:text-green-600 transition-colors">{patient.phone}</span>
                                                </div>
                                            )}
                                            {patient.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    {patient.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">
                                        {patient.notes || '-'}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {patient.phone && (
                                                <button
                                                    onClick={() => openWhatsApp(patient.phone)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={() => setActiveDropdown(activeDropdown === patient.id ? null : patient.id)}
                                                    className={`p-2 rounded-lg transition-colors ${activeDropdown === patient.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                {/* Dropdown Menu */}
                                                {activeDropdown === patient.id && (
                                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => {
                                                                handleViewHistory(patient);
                                                                setActiveDropdown(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            Ver Historial Clínico
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Simple Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{t('patients.modal_title_new')}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors bg-white"
                                        value={formData.province}
                                        onChange={e => setFormData({ ...formData, province: e.target.value, district: '' })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {Object.keys(locations).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors bg-white"
                                        value={formData.district}
                                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                                        disabled={!formData.province}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {formData.province && locations[formData.province]?.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.form_name')}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.form_phone')}</label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.form_email')}</label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.form_notes')}</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    {t('patients.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                >
                                    {t('patients.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModalOpen && selectedPatient && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Historial Clínico</h3>
                                <p className="text-gray-500">Paciente: {selectedPatient.name}</p>
                            </div>
                            <button
                                onClick={() => setHistoryModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {historyLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-gray-400">Cargando historial...</div>
                                </div>
                            ) : patientHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <FileText className="w-12 h-12 text-gray-300 mb-2" />
                                    <p>No hay historial clínico disponible.</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Tratamiento</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {patientHistory.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    {new Date(record.start_time).toLocaleDateString()}
                                                    <span className="text-xs text-gray-400 block">
                                                        {new Date(record.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className="px-2 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: `${record.type_color || '#cccccc'}20`, color: record.type_color || '#666666' }}
                                                    >
                                                        {record.type_name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    {record.doctor_name || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;
