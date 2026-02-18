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
        top_treatments: []
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

                            {/* Filters */}
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

                            <div className="flex-1 overflow-y-auto">
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
                            </div>
                        </div>
                    </div>
                )
            }
        </div >

    );
};

export default Dashboard;
