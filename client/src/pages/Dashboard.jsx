import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, Activity, TrendingUp, FileText } from 'lucide-react';
import TrendChart from '../components/TrendChart';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        total_patients: 0,
        appointments_today: 0,
        top_treatments: [],
        pending_confirmations: [],
        upcoming_reminders: []
    });
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    const [doctors, setDoctors] = useState([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [dashboardDoctorFilter, setDashboardDoctorFilter] = useState('');
    const [timeRange, setTimeRange] = useState('week'); // week, month, 3months, 6months

    // History Modal State
    const [historyDetails, setHistoryDetails] = useState([]);
    const [historyFilter, setHistoryFilter] = useState({ date: '', doctor_id: '' });
    const [historyTab, setHistoryTab] = useState('appointments'); // 'appointments' or 'audit'
    const [auditLogs, setAuditLogs] = useState([]);

    // 1. Fetch Doctors ONLY ONCE on mount
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get('/api/doctors');
                setDoctors(res.data);
            } catch (error) {
                console.error("Error loading doctors:", error);
            }
        };
        fetchDoctors();
    }, []);

    // 2. Fetch Stats & History when Filter changes
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const params = {
                    range: timeRange,
                    ...(dashboardDoctorFilter ? { doctor_id: dashboardDoctorFilter } : {})
                };
                const [statsRes, historyRes] = await Promise.all([
                    axios.get('/api/stats', { params }),
                    axios.get('/api/appointments/history', { params })
                ]);
                setStats(statsRes.data);
                setHistory(historyRes.data);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [dashboardDoctorFilter, timeRange]);

    // Filter history details
    useEffect(() => {
        if (showHistoryModal) {
            const fetchDetails = async () => {
                try {
                    const res = await axios.get('/api/appointments_filter', { params: historyFilter });
                    setHistoryDetails(res.data);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchDetails();
        }
    }, [showHistoryModal, historyFilter]);

    // Fetch Audit Logs when tab is active
    useEffect(() => {
        if (showHistoryModal && historyTab === 'audit') {
            const fetchAudit = async () => {
                try {
                    const res = await axios.get('/api/audit_logs');
                    setAuditLogs(res.data);
                } catch (error) {
                    console.error("Error fetching audit logs:", error);
                }
            };
            fetchAudit();
        }
    }, [showHistoryModal, historyTab]);

    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const doctorStats = React.useMemo(() => {
        const dStats = {};
        (stats.appointments_list || []).forEach(apt => {
            if (!dStats[apt.doctor_name]) {
                dStats[apt.doctor_name] = {
                    count: 0,
                    color: apt.doctor_color,
                    appointments: []
                };
            }
            dStats[apt.doctor_name].count++;
            dStats[apt.doctor_name].appointments.push(apt);
        });
        return Object.entries(dStats).map(([name, data]) => ({ name, ...data }));
    }, [stats.appointments_list]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando estadísticas...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h2>
                    <p className="text-sm text-gray-500">
                        {t(`dashboard.subtitle_range_${timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : timeRange === '3months' ? '3m' : '6m'}`)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        {[
                            { id: 'week', label: '7D' },
                            { id: 'month', label: '30D' },
                            { id: '3months', label: '3M' },
                            { id: '6months', label: '6M' }
                        ].map(range => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeRange === range.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {t(`dashboard.range_${range.id === 'week' ? '7' : range.id === 'month' ? '30' : range.id === '3months' ? '3m' : '6m'}`)}
                            </button>
                        ))}
                    </div>

                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500 min-w-[150px]"
                        value={dashboardDoctorFilter}
                        onChange={e => setDashboardDoctorFilter(e.target.value)}
                    >
                        <option value="">{t('dashboard.filter_all_doctors')}</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                    >
                        <FileText className="w-5 h-5" />
                        {t('dashboard.history_button')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* ... existing KPIs ... */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">{t('dashboard.kpi_appointments')}</h3>
                            <p className="text-2xl font-bold mt-1 text-gray-900">{stats.appointments_today}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-green-50 p-3 rounded-xl text-green-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">{t('dashboard.kpi_patients')}</h3>
                        <p className="text-2xl font-bold mt-1 text-gray-900">{stats.total_patients}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-xl text-red-600">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">{t('dashboard.kpi_cancellations')}</h3>
                        <p className="text-2xl font-bold mt-1 text-gray-900">{stats.cancelled_appointments || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                        <div className="w-8 h-8 flex items-center justify-center font-bold text-xl">
                            %
                        </div>
                    </div>
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium">{t('dashboard.kpi_response_time')}</h3>
                        <p className="text-2xl font-bold mt-1 text-gray-900">{stats.whatsapp_response_time || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Pending Confirmations & Reminders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pending Confirmations */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{t('dashboard.pending_confirmations_title') || 'Por Confirmar'}</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.pending_confirmations && stats.pending_confirmations.length > 0 ? (
                            stats.pending_confirmations.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800">{apt.patient_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(apt.start_time).toLocaleDateString()} - {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-blue-600">{apt.type_name}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const phone = apt.patient_phone ? apt.patient_phone.replace(/\D/g, '') : '';
                                            if (!phone) return alert("Paciente sin teléfono");
                                            const date = new Date(apt.start_time).toLocaleDateString();
                                            const time = new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const msg = `Hola ${apt.patient_name}, te escribimos de Smart Dentist. Por favor confirma tu cita de *${apt.type_name}* el *${date}* a las *${time}*.`;
                                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                        title="Enviar WhatsApp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-4 text-sm">{t('dashboard.no_pending') || 'No hay citas por confirmar'}</p>
                        )}
                        <button className="w-full text-center text-blue-600 text-sm font-medium hover:underline mt-2">
                            {t('dashboard.view_all') || 'Ver todas'}
                        </button>
                    </div>
                </div>

                {/* Upcoming Reminders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{t('dashboard.reminders_title') || 'Recordatorios Mañana'}</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.upcoming_reminders && stats.upcoming_reminders.length > 0 ? (
                            stats.upcoming_reminders.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800">{apt.patient_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-purple-600">{apt.type_name}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const phone = apt.patient_phone ? apt.patient_phone.replace(/\D/g, '') : '';
                                            if (!phone) return alert("Paciente sin teléfono");
                                            const time = new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            const msg = `Hola ${apt.patient_name}, te recordamos tu cita mañana a las *${time}* en Smart Dentist. Te esperamos.`;
                                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                        title="Enviar Recordatorio"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-4 text-sm">{t('dashboard.no_reminders') || 'No hay citas mañana'}</p>
                        )}
                        <button className="w-full text-center text-blue-600 text-sm font-medium hover:underline mt-2">
                            {t('dashboard.view_all') || 'Ver todas'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trend Chart - Spans 2 columns */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-bold text-gray-800">
                                {t('dashboard.chart_title')}
                            </h3>
                        </div>
                    </div>
                    <TrendChart
                        data={history}
                        days={timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 180}
                    />
                </div>

                {/* Top Treatments - Spans 1 column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-bold text-gray-800">{t('dashboard.top_treatments')}</h3>
                    </div>

                    <div className="space-y-4">
                        {stats.top_treatments && stats.top_treatments.length > 0 ? (
                            stats.top_treatments.map((t, index) => (
                                <div key={t.name} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-400 border border-gray-200 shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{t.name}</p>
                                        <p className="text-sm text-gray-500">{t.count} citas</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">{t('dashboard.no_data')}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Doctor Stats Section */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-bold text-gray-800">{t('dashboard.appointments_list_title')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctorStats.length > 0 ? (
                            doctorStats.map((doc) => (
                                <div
                                    key={doc.name}
                                    onClick={() => setSelectedDoctor(doc)}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: doc.color }}>
                                            {doc.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{doc.name}</p>
                                            <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Ver detalles</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">{doc.count}</p>
                                            <p className="text-xs text-gray-400 uppercase font-bold">Citas</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                            →
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">{t('dashboard.no_appointments_today')}</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Doctor Details Modal */}
            {
                selectedDoctor && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: selectedDoctor.color }}>
                                        {selectedDoctor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedDoctor.name}</h3>
                                        <p className="text-sm text-gray-500">{t('calendar.today')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDoctor(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {selectedDoctor.appointments.map(apt => (
                                    <div key={apt.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">{apt.patient_name}</p>
                                            <p className="text-sm text-gray-600">{apt.type_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">
                                                {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Full History Modal */}
            {
                showHistoryModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{t('patients.history')}</h3>
                                    <p className="text-sm text-gray-500">{t('dashboard.subtitle')}</p>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">✕</button>
                            </div>

                            {/* Modal Content with Tabs */}

                            {/* Tabs */}
                            <div className="flex gap-4 mb-4 border-b border-gray-100">
                                <button
                                    onClick={() => setHistoryTab('appointments')}
                                    className={`pb-2 font-medium transition-colors border-b-2 ${historyTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Citas
                                </button>
                                <button
                                    onClick={() => setHistoryTab('audit')}
                                    className={`pb-2 font-medium transition-colors border-b-2 ${historyTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Auditoría de Sistema
                                </button>
                            </div>

                            {/* Filters (Only for appointments tab) */}
                            {historyTab === 'appointments' && (
                                <div className="bg-gray-50 p-4 rounded-xl mb-4 flex flex-wrap gap-4 items-end">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('common.date')}</label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                                            value={historyFilter.date}
                                            onChange={e => setHistoryFilter({ ...historyFilter, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('common.doctor')}</label>
                                        <select
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500"
                                            value={historyFilter.doctor_id}
                                            onChange={e => setHistoryFilter({ ...historyFilter, doctor_id: e.target.value })}
                                        >
                                            <option value="">{t('dashboard.filter_all_doctors')}</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setHistoryFilter({ date: '', doctor_id: '' })}
                                        className="px-4 py-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {t('common.clear_filters')}
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {historyTab === 'appointments' ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                                <th className="py-3 font-semibold">{t('common.date')}</th>
                                                <th className="py-3 font-semibold">{t('common.time')}</th>
                                                <th className="py-3 font-semibold">{t('common.patient')}</th>
                                                <th className="py-3 font-semibold">{t('common.doctor')}</th>
                                                <th className="py-3 font-semibold">{t('common.treatment')}</th>
                                                <th className="py-3 font-semibold text-right">{t('common.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {historyDetails.length > 0 ? (
                                                historyDetails.map(apt => (
                                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 text-gray-900 font-medium">
                                                            {new Date(apt.start_time).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 text-gray-600">
                                                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="py-3 text-gray-800 font-medium">{apt.patient_name}</td>
                                                        <td className="py-3 text-gray-600">{apt.doctor_name}</td>
                                                        <td className="py-3">
                                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">
                                                                {apt.type_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {apt.status === 'confirmed' ? t('common.status_confirmed') :
                                                                    apt.status === 'cancelled' ? t('common.status_cancelled') : t('common.status_pending')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center text-gray-500 italic">
                                                        {t('dashboard.no_data')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                                <th className="py-3 font-semibold">Fecha/Hora</th>
                                                <th className="py-3 font-semibold">Acción</th>
                                                <th className="py-3 font-semibold">Entidad</th>
                                                <th className="py-3 font-semibold">Detalles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {auditLogs.length > 0 ? (
                                                auditLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 text-gray-600 whitespace-nowrap pr-4">
                                                            {new Date(log.timestamp + 'Z').toLocaleString()}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-gray-800 font-medium">{log.entity}</td>
                                                        <td className="py-3 text-gray-600 text-sm">{log.details}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                                                        No hay registros de auditoría aún.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >

    );
};

export default Dashboard;
