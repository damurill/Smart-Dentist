import React from 'react';
import { Lock, Info } from 'lucide-react';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#F3F4F6',
      color: '#1F2937',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        padding: '3rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '450px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <Lock size={40} color="#DC2626" />
        </div>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '1rem',
          letterSpacing: '-0.025em'
        }}>
          Prueba Demo Finalizada
        </h1>
        <p style={{
          color: '#4B5563',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          El tiempo límite para la prueba demo de <strong>Smart Medical</strong> ha llegado a su fin y la plataforma ha sido bloqueada.
        </p>

        <div style={{
          backgroundColor: '#F3F4F6',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <Info size={20} color="#4B5563" style={{ flexShrink: 0, marginTop: '3px' }} />
          <span style={{ fontSize: '0.9rem', color: '#374151' }}>
            Por favor comuníquese con el equipo de desarrollo (DMC) para regularizar el servicio y restaurar el acceso al sistema.
          </span>
        </div>

        <a href="https://wa.me/50661471838" target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-block',
          backgroundColor: '#25D366', // WhatsApp Green
          color: '#FFFFFF',
          padding: '0.9rem 2.5rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'background-color 0.2s',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default App;
