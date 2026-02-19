import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, Users, Stethoscope, Save, X, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('doctors'); // 'doctors', 'treatments', 'messages'
    const [doctors, setDoctors] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [settings, setSettings] = useState({
        whatsapp_confirm: '',
        whatsapp_reminder: ''
    });
    const [loading, setLoading] = useState(true);

    // Form States
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docsRes, treatsRes, settingsRes] = await Promise.all([
                axios.get('/api/doctors'),
                axios.get('/api/appointment_types'),
                axios.get('/api/settings')
            ]);
            setDoctors(docsRes.data);
            setTreatments(treatsRes.data);
            if (settingsRes.data) {
                setSettings(prev => ({ ...prev, ...settingsRes.data }));
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await axios.post('/api/settings', settings);
            alert(t('common.success'));
        } catch (error) {
            console.error("Error saving settings:", error);
            alert(t('common.error_save'));
        }
    };

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (activeTab === 'doctors') {
            setFormData(item || { name: '', color: '#3b82f6', phone: '' });
        } else {
            setFormData(item || { name: '', duration_minutes: 30, price: 0, color: '#10b981', follow_up_rule_days: 0 });
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este elemento?")) return;
        try {
            const endpoint = activeTab === 'doctors' ? `/api/doctors/${id}` : `/api/appointment_types/${id}`;
            await axios.delete(endpoint);
            fetchData();
        } catch (error) {
            console.error("Error deleting item:", error);
            const msg = error.response?.data?.error;

            // Check if it's the specific constraint error for doctors
            if (activeTab === 'doctors' && error.response?.status === 400 && msg === "No se puede eliminar el doctor porque tiene citas asignadas.") {
                if (window.confirm("El doctor tiene citas asignadas. ¿Deseas eliminarlo de todas formas y borrar TODAS sus citas? Esta acción no se puede deshacer.")) {
                    try {
                        await axios.delete(`/api/doctors/${id}?force=true`);
                        fetchData();
                        return; // Exit on success
                    } catch (forceError) {
                        console.error("Error force deleting:", forceError);
                        alert("Error al eliminar forzosamente.");
                    }
                }
            } else {
                alert(msg || t('common.error_delete'));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = activeTab === 'doctors' ? '/api/doctors' : '/api/appointment_types';
            if (editingItem) {
                await axios.put(`${endpoint}/${editingItem.id}`, formData);
            } else {
                await axios.post(endpoint, formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving item:", error);
            const msg = error.response?.data?.error || error.message || t('common.error_save');
            alert(`Error: ${msg}`);
        }
    };

    if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('settings.title')}</h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('doctors')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'doctors' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users className="w-5 h-5" />
                    {t('settings.tab_doctors')}
                </button>
                <button
                    onClick={() => setActiveTab('treatments')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'treatments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Stethoscope className="w-5 h-5" />
                    {t('settings.tab_treatments')}
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <MessageSquare className="w-5 h-5" />
                    {t('settings.tab_messages')}
                </button>
                <button
                    onClick={() => setActiveTab('subscription')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'subscription' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="w-5 h-5 flex items-center justify-center font-bold text-lg leading-none">$</div>
                    {t('settings.tab_subscription')}
                </button>
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                    {activeTab === 'doctors' ? t('settings.doctors_title') :
                        activeTab === 'treatments' ? t('settings.treatments_title') :
                            activeTab === 'messages' ? t('settings.messages_title') :
                                t('settings.subscription_title')}
                </h3>
                {(activeTab === 'doctors' || activeTab === 'treatments') && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'doctors' ? t('settings.add_doctor') : t('settings.add_treatment')}
                    </button>
                )}
            </div>

            {/* List Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {activeTab === 'doctors' && (
                    <div className="divide-y divide-gray-100">
                        {doctors.map(doc => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: doc.color }}>
                                        {doc.name.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-900 block">{doc.name}</span>
                                        {doc.phone && (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-sm text-gray-500">{doc.phone}</span>
                                                <a
                                                    href={`https://wa.me/${doc.phone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full p-1 transition-colors"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                                </a>
                                            </div>
                                        )}
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {doc.pending_appointments_count || 0} cita(s) pendiente(s)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(doc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {doctors.length === 0 && <div className="p-8 text-center text-gray-400">{t('settings.no_doctors')}</div>}
                    </div>
                )}

                {activeTab === 'treatments' && (
                    <div className="divide-y divide-gray-100">
                        {treatments.map(t => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: t.color }}>
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{t.name}</p>
                                        <p className="text-xs text-gray-500">{t.duration_minutes} min • ${t.price}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {treatments.length === 0 && <div className="p-8 text-center text-gray-400">{t('settings.no_treatments')}</div>}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="p-6">
                        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">{t('settings.variables_help')}</p>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.msg_confirmation')}</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 h-32 outline-none focus:border-blue-500 text-sm"
                                    value={settings.whatsapp_confirm || ''}
                                    onChange={e => setSettings({ ...settings, whatsapp_confirm: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.msg_reminder')}</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 h-32 outline-none focus:border-blue-500 text-sm"
                                    value={settings.whatsapp_reminder || ''}
                                    onChange={e => setSettings({ ...settings, whatsapp_reminder: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveSettings}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <Save className="w-4 h-4" />
                                    {t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <div className="p-8">
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-blue-100 font-medium mb-1">{t('settings.current_plan')}</p>
                                            <h3 className="text-3xl font-bold">Smart Medical Pro</h3>
                                        </div>
                                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold border border-white/20">
                                            {t('common.active')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <p className="text-blue-100 text-sm mb-1">{t('settings.next_payment')}</p>
                                            <p className="font-semibold text-xl">1 Marzo, 2026</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-100 text-sm mb-1">{t('settings.amount')}</p>
                                            <p className="font-semibold text-xl">$29.99 <span className="text-sm font-normal text-blue-200">/ mes</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => alert(t('settings.redirecting_payment'))}
                                        className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors"
                                    >
                                        {t('settings.manage_subscription')}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                                    <span className="text-gray-700 font-medium">Citas Ilimitadas</span>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                                    <span className="text-gray-700 font-medium">Recordatorios WhatsApp</span>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                                    <span className="text-gray-700 font-medium">Multi-Doctor</span>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                                    <span className="text-gray-700 font-medium">Soporte Prioritario</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingItem ? t('common.edit') : t('common.add')} {activeTab === 'doctors' ? t('common.doctor') : t('common.treatment')}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.form_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.form_color')}</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        />
                                        <span className="text-sm text-gray-500 font-mono">{formData.color}</span>
                                    </div>
                                </div>

                                {activeTab === 'doctors' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                )}

                                {activeTab === 'treatments' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.form_duration')}</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="5"
                                                    step="5"
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                                    value={formData.duration_minutes}
                                                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.form_price')}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.form_follow_up_rule')}</label>
                                            <p className="text-xs text-gray-500 mb-2">{t('settings.follow_up_help')}</p>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                                value={formData.follow_up_rule_days}
                                                onChange={e => setFormData({ ...formData, follow_up_rule_days: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {t('common.save')}
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

export default Settings;
