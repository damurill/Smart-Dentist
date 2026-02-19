import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';

const PatientPortal = () => {
    const { t, language } = useLanguage();
    const { id } = useParams();
    const dateLocale = language === 'es' ? es : enUS;
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // 'confirmed', 'cancelled', or null

    useEffect(() => {
        fetchAppointment();
    }, [id]);

    const fetchAppointment = async () => {
        try {
            const res = await axios.get(`/api/appointments/${id}`);
            setAppointment(res.data);
            if (res.data.status === 'confirmed' || res.data.status === 'cancelled') {
                setStatus(res.data.status);
            }
        } catch (error) {
            console.error("Error fetching appointment:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (newStatus) => {
        try {
            await axios.patch(`/api/appointments/${id}/status`, { status: newStatus });
            setStatus(newStatus);
        } catch {
            alert(t('patient_portal.error_update'));
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{t('patient_portal.loading')}</div>;
    if (!appointment) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">{t('patient_portal.not_found')}</div>;

    if (status) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-lg p-8 text-center">
                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {status === 'confirmed' ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {status === 'confirmed' ? t('patient_portal.status_confirmed') : t('patient_portal.status_cancelled')}
                    </h2>
                    <p className="text-gray-500">
                        {status === 'confirmed'
                            ? t('patient_portal.msg_confirmed')
                            : t('patient_portal.msg_cancelled')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-xl font-bold mb-1">{t('patient_portal.title')}</h1>
                    <p className="text-blue-100 text-sm">Smart Medical</p>
                </div>

                <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-xs text-amber-800">
                        {t('patient_portal.demo_note')}
                    </div>

                    <div className="text-center mb-8">
                        <p className="text-gray-500 text-sm uppercase tracking-wider font-semibold mb-1">{t('patient_portal.hello')}</p>
                        <h2 className="text-2xl font-bold text-gray-900">{appointment.patient_name}</h2>
                    </div>

                    {/* ... (rest of details) ... */}

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('common.date')}</p>
                                <p className="font-semibold text-gray-800 capitalize">
                                    {format(new Date(appointment.start_time), "EEEE d 'de' MMMM", { locale: dateLocale })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('common.time')}</p>
                                <p className="font-semibold text-gray-800">
                                    {format(new Date(appointment.start_time), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('common.treatment')}</p>
                                <p className="font-semibold text-gray-800">{appointment.type_name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleAction('confirmed')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {t('patient_portal.btn_confirm')}
                        </button>

                        <button
                            onClick={() => handleAction('cancelled')}
                            className="w-full bg-white border-2 border-red-100 text-red-500 font-bold py-4 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-5 h-5" />
                            {t('patient_portal.btn_cancel')}
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('patient_portal.footer_note')}
                    </p>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <a href="/" className="text-xs text-blue-400 hover:text-blue-600 font-medium">
                            ← {t('patient_portal.back_dashboard')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientPortal;
