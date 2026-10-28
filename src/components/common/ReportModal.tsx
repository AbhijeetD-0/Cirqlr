import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { SafetyReport } from '../../types/marketplace';
import { X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { 
    activeReportUserToken, 
    setActiveReportUserToken, 
    fileSafetyReport, 
    getUserByToken 
  } = useMarketplace();

  const [category, setCategory] = useState<SafetyReport['category']>('Attempted Off-Platform Contact');
  const [venueAddress, setVenueAddress] = useState('');
  const [details, setDetails] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!activeReportUserToken) return null;

  const reportedUser = getUserByToken(activeReportUserToken);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    fileSafetyReport({
      reportedUserToken: activeReportUserToken,
      category,
      details: details.trim(),
      venueAddress: venueAddress.trim() || 'Pre-booking communication',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setActiveReportUserToken(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-full sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col m-2 sm:m-4 md:m-6">
        <div className="bg-rose-950 text-white px-4 sm:px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-900 border border-rose-700 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                File Official Safety Report
              </h3>
              <span className="text-[10px] text-rose-300 font-mono">
                Against {reportedUser ? reportedUser.fullName : activeReportUserToken}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveReportUserToken(null)}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">Safety Report Submitted</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your report has been logged to the Founder Admin Security Dossier for investigation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Violation Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SafetyReport['category'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-rose-600"
              >
                <option value="Attempted Off-Platform Contact">Attempted Off-Platform Contact (WhatsApp/Call)</option>
                <option value="Private Venue Proposition">Private Venue Proposition (Home/Hotel/Resort)</option>
                <option value="Unprofessional Demeanor">Unprofessional Demeanor / Misconduct</option>
                <option value="No-Show at Venue">No-Show at Public Venue</option>
                <option value="Suspicious Identity">Suspicious Identity</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Public Venue Location
              </label>
              <input
                type="text"
                placeholder="e.g. South City Mall / Inox Multiplex / Oxford Bookstore"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Detailed Incident Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what occurred with specific times and facts..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReportUserToken(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Submit Incident Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
