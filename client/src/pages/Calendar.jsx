import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addDays, addWeeks, addMonths, getHours, isSameDay, isSameMonth
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, Users, CheckCircle, Bell, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Calendar = () => {
    const { t, language } = useLanguage();
    const dateLocale = language === 'es' ? es : enUS;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('day'); // 'day', 'week', 'month'
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [types, setTypes] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('all'); // Filter for week/month views

    // Details Modal
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // New Appointment Form State
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        type_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        notes: ''
    });



    const [settings, setSettings] = useState({});

    const fetchInitialData = async () => {
        try {
            const [doctorsRes, typesRes, patientsRes, settingsRes] = await Promise.all([
                axios.get('/api/doctors'),
                axios.get('/api/appointment_types'),
                axios.get('/api/patients'),
                axios.get('/api/settings')
            ]);
            setDoctors(doctorsRes.data);
            setTypes(typesRes.data);
            setPatients(patientsRes.data);
            if (settingsRes.data) setSettings(settingsRes.data);

            if (doctorsRes.data.length > 0) setFormData(prev => ({ ...prev, doctor_id: doctorsRes.data[0].id }));
            if (typesRes.data.length > 0) setFormData(prev => ({ ...prev, type_id: typesRes.data[0].id }));
            if (patientsRes.data.length > 0) setFormData(prev => ({ ...prev, patient_id: patientsRes.data[0].id }));

        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchAppointments = async () => {
        try {
            let start, end;

            if (view === 'day') {
                start = startOfDay(currentDate);
                end = endOfDay(currentDate);
            } else if (view === 'week') {
                start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
                end = endOfWeek(currentDate, { weekStartsOn: 1 });
            } else { // month
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
            }

            const res = await axios.get(`/api/appointments`, {
                params: {
                    start_date: start.toISOString(),
                    end_date: end.toISOString()
                }
            });
            setAppointments(res.data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [currentDate, view]);

    const navigate = (direction) => {
        if (view === 'day') setCurrentDate(d => addDays(d, direction));
        else if (view === 'week') setCurrentDate(d => addWeeks(d, direction));
        else setCurrentDate(d => addMonths(d, direction));
    };

    const handleAppointmentClick = (apt) => {
        setSelectedAppointment(apt);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dateStr = formData.date;

            const selectedType = types.find(t => t.id == formData.type_id);
            const duration = selectedType ? selectedType.duration_minutes : 30;

            const [hours, minutes] = formData.start_time.split(':').map(Number);
            const [year, month, day] = dateStr.split('-').map(Number);
            const startDateObj = new Date(year, month - 1, day, hours, minutes);
            const endDateObj = new Date(startDateObj.getTime() + duration * 60000);

            // Destructure formData to exclude the original start_time string,
            // then add the correctly formatted ISO string start_time
            const { start_time: _st, date: _d, ...restFormData } = formData;

            await axios.post('/api/appointments', {
                ...restFormData,
                start_time: startDateObj.toISOString(),
                end_time: endDateObj.toISOString()
            });

            setShowForm(false);
            fetchAppointments();
        } catch (error) {
            console.error("Error booking appointment:", error);
            alert("Error al agendar cita");
        }
    };

    const MAX_URL_LENGTH = 2000;

    const truncateForUrl = (str) => {
        return str && str.length > 500 ? str.substring(0, 500) + '...' : str;
    };

    const sendWhatsApp = (templateType) => {
        if (!selectedAppointment) return;
        const { patient_name, patient_phone, start_time, type_name } = selectedAppointment;
        const date = format(new Date(start_time), "EEEE d 'de' MMMM", { locale: dateLocale });
        const time = format(new Date(start_time), 'HH:mm');
        const phone = patient_phone ? patient_phone.replace(/\D/g, '') : '';

        if (!phone) {
            alert("El paciente no tiene teléfono registrado.");
            return;
        }

        let messageTemplate = "";

        if (templateType === 'confirm') {
            messageTemplate = settings.whatsapp_confirm ||
                "Hola ${patient_name}, te escribimos de Smart Medical. Por favor confirma tu asistencia para tu cita de *${type_name}* el *${date}* a las *${time}*.";
        } else if (templateType === 'reminder') {
            messageTemplate = settings.whatsapp_reminder ||
                "Hola ${patient_name}, recuerda tu cita de mañana a las *${time}* en Smart Medical. Te esperamos.";
        }

        // Replace placeholders safely
        let message = messageTemplate
            .replace(/\${patient_name}/g, patient_name || '')
            .replace(/\${type_name}/g, type_name || '')
            .replace(/\${date}/g, date || '')
            .replace(/\${time}/g, time || '');

        // Encode and check length - though unlikely to hit limit with just this text
        const encodedMessage = encodeURIComponent(message);

        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const updateStatus = async (status) => {
        try {
            await axios.patch(`/api/appointments/${selectedAppointment.id}/status`, { status });
            setSelectedAppointment(null);
            fetchAppointments();
        } catch (e) {
            console.error(e);
            alert("Error al actualizar estado");
        }
    };

    // ... (rest of code)

    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

    const filteredApts = appointments.filter(apt =>
        selectedDoctor === 'all' || apt.doctor_id == selectedDoctor
    );

    const renderDayView = () => (
        <div className="flex-1 overflow-y-auto">
            {hours.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_1fr] border-b border-gray-100 min-h-[100px]">
                    <div className="p-4 border-r border-gray-200 text-xs text-gray-400 font-medium text-right relative">
                        <span className="-top-3 relative">{hour}:00</span>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${doctors.length}, 1fr)` }}>
                        {doctors.map(doc => {
                            const slotAppointments = filteredApts.filter(apt => {
                                const d = new Date(apt.start_time);
                                return apt.doctor_id === doc.id && isSameDay(d, currentDate) && getHours(d) === hour;
                            });
                            return (
                                <div key={doc.id} className="border-r border-gray-100 last:border-r-0 p-1 relative">
                                    {slotAppointments.map(apt => (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                            className="p-2 rounded-lg text-xs mb-1 shadow-sm border-l-4 cursor-pointer hover:brightness-95 transition-all"
                                            style={{
                                                backgroundColor: `${apt.type_color}20`,
                                                borderLeftColor: apt.type_color,
                                                opacity: apt.status === 'cancelled' ? 0.5 : 1
                                            }}
                                        >
                                            <div className={clsx("font-bold text-gray-800 truncate", apt.status === 'cancelled' && "line-through")}>{apt.patient_name}</div>
                                            <div className="text-gray-500 flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(apt.start_time), 'HH:mm')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    // ... (rest of render functions)

    const renderWeekView = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

        return (
            <div className="flex-1 overflow-auto">
                <div className="min-w-[800px]">
                    <div
                        className="grid border-b border-gray-200 bg-gray-50"
                        style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
                    >
                        <div className="p-4 border-r border-gray-200"></div>
                        {days.map(day => (
                            <div key={day.toString()} className={twMerge("p-3 text-center border-r border-gray-200 last:border-r-0", isSameDay(day, new Date()) && "bg-blue-50")}>
                                <div className="text-xs text-gray-500 font-medium uppercase">{format(day, 'EEE', { locale: dateLocale })}</div>
                                <div className={twMerge("text-lg font-bold", isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-900")}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {hours.map(hour => (
                            <div
                                key={hour}
                                className="grid border-b border-gray-100 min-h-[100px]"
                                style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
                            >
                                <div className="p-4 border-r border-gray-200 text-xs text-gray-400 font-medium text-right relative">
                                    <span className="-top-3 relative">{hour}:00</span>
                                </div>
                                {days.map(day => {
                                    const slotAppointments = filteredApts.filter(apt => {
                                        const d = new Date(apt.start_time);
                                        return isSameDay(d, day) && getHours(d) === hour;
                                    });
                                    return (
                                        <div key={day.toString()} className="border-r border-gray-100 last:border-r-0 p-1 relative">
                                            {slotAppointments.map(apt => (
                                                <div
                                                    key={apt.id}
                                                    onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                                    className="p-1.5 rounded-lg text-[10px] mb-1 shadow-sm border-l-2 cursor-pointer hover:brightness-95 transition-all truncate"
                                                    style={{
                                                        backgroundColor: `${apt.type_color}20`,
                                                        borderLeftColor: apt.type_color,
                                                        opacity: apt.status === 'cancelled' ? 0.5 : 1
                                                    }}
                                                    title={`${apt.patient_name} - ${apt.type_name}${apt.status === 'cancelled' ? ' (CANCELADA)' : ''}`}
                                                >
                                                    <div className={clsx("font-bold text-gray-800 truncate", apt.status === 'cancelled' && "line-through")}>{apt.patient_name}</div>
                                                    <div className="text-gray-500">{format(new Date(apt.start_time), 'HH:mm')}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        );
    };

    const renderMonthView = () => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        const days = [];
        let day = start;
        while (day <= end) {
            days.push(day);
            day = addDays(day, 1);
        }

        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shadow-sm z-10">
                    {t('calendar.weekdays_short').map(d => (
                        <div key={d} className="p-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-auto">
                    {days.map(day => {
                        const dayAppointments = filteredApts.filter(apt => isSameDay(new Date(apt.start_time), day));
                        return (
                            <div
                                key={day.toString()}
                                className={twMerge(
                                    "border-r border-b border-gray-100 p-2 min-h-[100px] hover:bg-gray-50/50 transition-colors flex flex-col gap-1",
                                    !isSameMonth(day, currentDate) && "bg-gray-50/30 text-gray-400"
                                )}
                            >
                                <div className="text-right mb-1">
                                    <span className={twMerge(
                                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ml-auto",
                                        isSameDay(day, new Date()) ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {dayAppointments.slice(0, 3).map(apt => (
                                    <div
                                        key={apt.id}
                                        onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                        style={{
                                            backgroundColor: `${apt.type_color}20`,
                                            borderLeftColor: apt.type_color,
                                            opacity: apt.status === 'cancelled' ? 0.5 : 1
                                        }}
                                    >
                                        <div className={clsx("font-bold text-gray-800 truncate", apt.status === 'cancelled' && "line-through")}>{apt.patient_name}</div>
                                    </div>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[10px] text-gray-400 text-center font-medium">
                                        + {dayAppointments.length - 3} más
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-5rem)] flex flex-col">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-4 lg:mb-6 gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Month/Date Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-1 w-full sm:w-auto">
                        <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="px-2 sm:px-4 font-medium text-gray-700 w-full sm:w-48 text-center capitalize truncate text-sm sm:text-base">
                            {view === 'month'
                                ? format(currentDate, 'MMMM yyyy', { locale: dateLocale })
                                : format(currentDate, 'EEEE d MMM', { locale: dateLocale })
                            }
                        </div>
                        <button onClick={() => navigate(1)} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors w-full sm:w-auto text-center"
                    >
                        {t('calendar.today')}
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* View Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                        {[
                            { id: 'day', label: t('calendar.view_day') },
                            { id: 'week', label: t('calendar.view_week') },
                            { id: 'month', label: t('calendar.view_month') },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className={clsx(
                                    "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-center",
                                    view === v.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            className="flex-1 sm:w-48 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-500"
                            value={selectedDoctor}
                            onChange={e => setSelectedDoctor(e.target.value)}
                        >
                            <option value="all">{t('calendar.filter_all_doctors')}</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => {
                                setFormData(prev => ({ ...prev, date: format(currentDate, 'yyyy-MM-dd') }));
                                setShowForm(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="sr-only sm:not-sr-only">{t('calendar.new_appointment')}</span>
                        </button>
                    </div>
                </div>
            </div >

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {view === 'day' && (
                    <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 bg-gray-50">
                        <div className="p-4 border-r border-gray-200"></div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${doctors.length}, 1fr)` }}>
                            {doctors.map(doc => (
                                <div key={doc.id} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: doc.color }}></div>
                                        {doc.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'day' && renderDayView()}
                {view === 'week' && renderWeekView()}
                {view === 'month' && renderMonthView()}
            </div>

            {
                selectedAppointment && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold">{t('calendar.modal_title_details')}</h3>
                                <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {selectedAppointment.patient_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{selectedAppointment.patient_name}</h4>
                                        <p className="text-sm text-gray-500">{selectedAppointment.patient_phone || 'Sin teléfono'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">{t('calendar.form_date')}</span>
                                        <span className="font-medium text-gray-700 capitalize">
                                            {format(new Date(selectedAppointment.start_time), "EEEE d MMM", { locale: dateLocale })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">{t('calendar.form_time')}</span>
                                        <span className="font-medium text-gray-700">
                                            {format(new Date(selectedAppointment.start_time), 'HH:mm')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">{t('common.treatment')}</span>
                                        <span className="font-medium text-gray-700">{selectedAppointment.type_name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">{t('calendar.form_doctor')}</span>
                                        <span className="font-medium text-gray-700">{selectedAppointment.doctor_name}</span>
                                    </div>
                                </div>

                                {selectedAppointment.notes && (
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                                        "{selectedAppointment.notes}"
                                    </div>
                                )}

                                {/* Follow-up Suggestion */}
                                {selectedAppointment.follow_up_rule_days > 0 && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between">
                                        <div>
                                            <span className="block text-xs font-bold text-indigo-600 uppercase">{t('calendar.suggestion')}</span>
                                            <span className="text-sm text-indigo-900">
                                                {format(addDays(new Date(selectedAppointment.start_time), selectedAppointment.follow_up_rule_days), "d 'de' MMMM", { locale: dateLocale })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const nextDate = addDays(new Date(selectedAppointment.start_time), selectedAppointment.follow_up_rule_days);
                                                setFormData({
                                                    patient_id: selectedAppointment.patient_id,
                                                    doctor_id: selectedAppointment.doctor_id,
                                                    type_id: selectedAppointment.type_id,
                                                    date: format(nextDate, 'yyyy-MM-dd'),
                                                    start_time: '09:00', // Default time
                                                    notes: 'Control automático'
                                                });
                                                setCurrentDate(nextDate);
                                                setSelectedAppointment(null);
                                                setShowForm(true);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            {t('calendar.btn_schedule')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-4">
                                {/* Status Management */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('calendar.manage_status')}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedAppointment.status !== 'confirmed' && (
                                            <button
                                                onClick={() => updateStatus('confirmed')}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors shadow-sm shadow-green-200"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                {t('calendar.mark_confirmed')}
                                            </button>
                                        )}
                                        {selectedAppointment.status !== 'cancelled' && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(t('calendar.confirm_cancel'))) updateStatus('cancelled');
                                                }}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium transition-colors border border-red-200"
                                            >
                                                <Users className="w-5 h-5" />
                                                {t('calendar.cancel_appointment')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* WhatsApp Messages */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('calendar.send_reminder')}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => sendWhatsApp('confirm')}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors border border-gray-200"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {t('calendar.request_confirmation')}
                                        </button>
                                        <button
                                            onClick={() => sendWhatsApp('reminder')}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors border border-gray-200"
                                        >
                                            <Bell className="w-4 h-4" />
                                            {t('calendar.simple_reminder')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Appointment Creation Modal (Same as before) -- Including full form here for completeness */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <h3 className="text-lg font-bold mb-4">{t('calendar.modal_title_new')}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_patient')}</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                                        value={formData.patient_id}
                                        onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                    >
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_date')}</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_doctor')}</label>
                                        <select
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                                            value={formData.doctor_id}
                                            onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                                        >
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_start_time')}</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    >
                                        {hours.map(h => {
                                            const time = `${h.toString().padStart(2, '0')}:00`;
                                            return <option key={time} value={time}>{time}</option>
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_type')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {types.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type_id: t.id })}
                                                className={clsx(
                                                    "p-2 rounded-lg text-sm border text-left transition-all",
                                                    formData.type_id == t.id
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                                                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                                                )}
                                            >
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-xs opacity-70">{t.duration_minutes} min</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('calendar.form_notes')}</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        rows="2"
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
                                        {t('calendar.btn_cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                    >
                                        {t('calendar.btn_schedule')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Calendar;
