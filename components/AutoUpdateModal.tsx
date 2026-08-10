import React, { useEffect, useState } from 'react';
import { checkForAppUpdate, AppVersionInfo } from '../services/AutoUpdateService';
import { Browser } from '@capacitor/browser';

export const AutoUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkForAppUpdate().then((info) => {
      if (info) {
        setUpdateInfo(info);
        setIsOpen(true);
      }
    });
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleDownloadUpdate = async () => {
    if (updateInfo.downloadUrl) {
      await Browser.open({ url: updateInfo.downloadUrl });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: '#38bdf8' }}>
          🎉 Update Terbaru Tersedia!
        </div>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '16px' }}>
          Versi terbaru <strong>v{updateInfo.version}</strong> telah dirilis.
        </p>
        {updateInfo.releaseNotes && (
          <div style={{
            backgroundColor: '#0f172a',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            borderLeft: '4px solid #38bdf8'
          }}>
            {updateInfo.releaseNotes}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {!updateInfo.mandatory && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#334155',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              Nanti Saja
            </button>
          )}
          <button
            onClick={handleDownloadUpdate}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Download & Update
          </button>
        </div>
      </div>
    </div>
  );
};
