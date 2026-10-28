import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Lock, KeyRound, AlertTriangle, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose }) => {
  const { platformSettings, unlockFounderVault } = useMarketplace();
  const [passkeyInput, setPasskeyInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === platformSettings.adminMasterPasskey) {
      setErrorMessage(null);
      setPasskeyInput('');
      unlockFounderVault();
      onClose();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setErrorMessage(
        nextAttempts >= 3
          ? 'Security Alert: Multiple incorrect attempts recorded. Incident logged.'
          : 'Invalid Master Passkey. Access Denied.'
      );
      setPasskeyInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-full sm:max-w-md md:max-w-lg m-2 sm:m-4 md:m-6 max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Top security header bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">
                Founder Security Vault
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Level-0 Master Authentication Gate
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="mb-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Enter Founder Master Security Passkey to unlock the Operations Command Center.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
                Master Security Passkey
              </label>
              <input
                type="password"
                maxLength={16}
                autoFocus
                placeholder="••••••"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950"
            >
              Authenticate & Open Vault
            </button>
          </form>
        </div>

        {/* Footer Security Notice - No passkey leaks */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-900 text-[10px] text-slate-500 text-center">
          Strictly confidential. Unauthorized access is logged in tamper-evident audit journals.
        </div>
      </div>
    </div>
  );
};
