import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { ActivityPackageCard } from '../../types/marketplace';
import { X, Tag, Building2, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { checkVenueSafety } from '../../services/safetyFilterService';

interface ActivityCardModalProps {
  cardToEdit?: ActivityPackageCard | null;
  onClose: () => void;
  onTriggerProModal: () => void;
}

export const ActivityCardModal: React.FC<ActivityCardModalProps> = ({
  cardToEdit,
  onClose,
  onTriggerProModal,
}) => {
  const { 
    currentUser, 
    platformSettings, 
    createActivityCard, 
    updateActivityCard,
    suspendUserForSafetyViolation,
    openSuspensionNotice
  } = useMarketplace();

  const [title, setTitle] = useState(cardToEdit?.title || '');
  const [venueCategory, setVenueCategory] = useState(
    cardToEdit?.venueCategory || platformSettings.allowedPublicVenueCategories[0] || 'Verified Cafe & Restaurant'
  );
  const [shortDescription, setShortDescription] = useState(cardToEdit?.shortDescription || '');
  const [city, setCity] = useState(cardToEdit?.city || currentUser?.city || 'Kolkata');
  const [hourlyRate, setHourlyRate] = useState<number>(cardToEdit?.hourlyRate || 400);
  const [formError, setFormError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Check if Companion is currently in 7-Day Restricted Mode
    if (currentUser.accountStatus === 'Suspended') {
      openSuspensionNotice(currentUser);
      onClose();
      return;
    }

    if (!title.trim()) {
      setFormError('Please provide a package title.');
      return;
    }
    if (hourlyRate < 300) {
      setFormError('Minimum hourly rate must be at least ₹300/hour.');
      return;
    }
    if (!shortDescription.trim()) {
      setFormError('Please provide a short description for this activity package.');
      return;
    }

    // Safety Scanner: Check Title, Venue Category & Description for forbidden accommodation keywords
    const safetyCheck = checkVenueSafety(title, venueCategory, shortDescription);
    if (safetyCheck.isForbidden) {
      suspendUserForSafetyViolation(
        currentUser.userToken,
        safetyCheck.detectedKeyword,
        `Activity Card [${safetyCheck.field}]: "${title.trim()}" | Category: "${venueCategory}" | Description: "${shortDescription.trim()}"`
      );
      onClose();
      return;
    }

    if (cardToEdit) {
      updateActivityCard(cardToEdit.id, {
        title: title.trim(),
        venueCategory,
        shortDescription: shortDescription.trim(),
        city,
        hourlyRate: Number(hourlyRate),
      });
      onClose();
    } else {
      if (!currentUser) return;
      const result = createActivityCard({
        companionToken: currentUser.userToken,
        title: title.trim(),
        venueCategory,
        shortDescription: shortDescription.trim(),
        city,
        hourlyRate: Number(hourlyRate),
      });

      if (result.requiresPro) {
        onTriggerProModal();
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-750 flex flex-col m-2 sm:m-4 md:m-6 text-white">
        <div className="bg-slate-950/90 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {cardToEdit ? 'Edit Activity Package Card' : 'Create Custom Activity Package Card'}
              </h3>
              <span className="text-[10px] text-slate-400">
                100% Commercial Public Venues Only
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/90 text-white">
          {formError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              Activity Package Title
            </label>
            <input
              type="text"
              placeholder="e.g. Cinema & Post-Movie Critique at INOX, Museum Walk & Art Talk..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Permitted Public Venue Category
              </label>
              <select
                value={venueCategory}
                onChange={(e) => setVenueCategory(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                {platformSettings.allowedPublicVenueCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                City / Operating Hub
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                {['Kolkata', 'Siliguri', 'Durgapur', 'Bhubaneswar', 'Cuttack', 'Puri'].map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-200">
                1-Hour Rate (Minimum ₹300 / hr)
              </label>
              <span className="font-extrabold text-sm text-cyan-400">₹{hourlyRate}/hr</span>
            </div>
            <input
              type="range"
              min={300}
              max={1200}
              step={25}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Min ₹300/hr</span>
              <span>Standard ₹450/hr</span>
              <span>Max ₹1200/hr</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">
              Short Description / What We Will Do
            </label>
            <textarea
              rows={3}
              placeholder="Describe the outing experience, conversation topics, or activities..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              required
            />
          </div>

          {/* Fee Notice */}
          <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-xl p-3 text-[11px] text-cyan-200 leading-snug">
            <strong>Platform Transparency:</strong> Platform fee is strictly {platformSettings.baseAcceptanceFeePercent}% upon accepting an outing (5% discount available with referral credits). Booker pays you 100% of the outing value directly in cash/UPI upon meeting.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
            >
              {cardToEdit ? 'Save Changes' : 'Publish Activity Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
