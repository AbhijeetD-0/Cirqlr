import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AccountStatus } from '../../types/marketplace';
import { CopyUserIdButton } from './CopyUserIdButton';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Calendar,
  Lock,
  Check,
  ShieldAlert,
  Mail,
  Star,
  Sparkles,
  FileText,
  Eye,
  Home,
  ChevronDown,
  ChevronUp,
  History,
  ExternalLink
} from 'lucide-react';

export const TokenInspectionModal: React.FC = () => {
  const { 
    inspectedUserToken, 
    setInspectedUserToken, 
    getUserByToken, 
    updateUserAccountStatus,
    verifyUserIdentity,
    getReportsForUser,
    bookings
  } = useMarketplace();

  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>('Active');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHistoryLog, setShowHistoryLog] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  if (!inspectedUserToken) return null;

  const user = getUserByToken(inspectedUserToken);
  const isUserVerified = user ? Boolean((user.documentImageUrl || user.idDocumentUrl) && (user.isVerified || user.verificationStatus === 'Verified' || user.verificationStatus === 'ID Verified')) : false;
  const reportsAgainstUser = getReportsForUser(inspectedUserToken);
  const reviewsAsCompanion = bookings
    .filter(
      (b) =>
        (b.companionToken === inspectedUserToken || b.companionId === inspectedUserToken) &&
        (b.ratingSubmitted || b.bookerRatingSubmitted)
    )
    .map((b) => ({
      id: `${b.id}-comp`,
      reviewerRole: 'Booker',
      reviewerName: b.bookerName,
      reviewerToken: b.bookerToken,
      rating: b.bookerRating || b.userRating || 5,
      review: b.bookerReview || b.userReview,
      activityTitle: b.activityTitle,
      outingDate: b.outingDate,
      bookingToken: b.bookingToken,
    }));

  const reviewsAsBooker = bookings
    .filter(
      (b) =>
        (b.bookerToken === inspectedUserToken || b.bookerId === inspectedUserToken) &&
        b.companionRatingSubmitted
    )
    .map((b) => ({
      id: `${b.id}-booker`,
      reviewerRole: 'Companion',
      reviewerName: b.companionName,
      reviewerToken: b.companionToken,
      rating: b.companionRating || 5,
      review: b.companionReview,
      activityTitle: b.activityTitle,
      outingDate: b.outingDate,
      bookingToken: b.bookingToken,
    }));

  const allReviewsForUser = [...reviewsAsCompanion, ...reviewsAsBooker];

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-md w-full m-2 sm:m-4 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold">User Token Not Found</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Token <code className="text-indigo-400 font-mono">{inspectedUserToken}</code> is not registered.
          </p>
          <button
            onClick={() => setInspectedUserToken(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    );
  }

  const handleApplyStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserAccountStatus(user.userToken, selectedStatus, statusNote || 'Direct admin token inspection status update');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleApproveId = () => {
    verifyUserIdentity(user.userToken);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-3xl w-full max-w-full sm:max-w-xl md:max-w-3xl m-2 sm:m-4 md:m-6 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                User Identity & Security Dossier
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <CopyUserIdButton
                  userId={user.userToken}
                  showText={true}
                  className="font-mono text-indigo-400 hover:text-indigo-300 font-bold text-sm bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800"
                />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user.accountStatus === 'Active' 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                    : user.accountStatus === 'Warned' 
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {user.accountStatus}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setInspectedUserToken(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
          {/* Identity Snapshot with unmasked phone */}
          <div className="flex items-start gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {user.avatarUrl && user.avatarUrl.trim() !== '' ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold items-center justify-center text-2xl ring-2 ring-indigo-500/30 shrink-0 shadow-xs ${
                user.avatarUrl && user.avatarUrl.trim() !== '' ? 'hidden' : 'flex'
              }`}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white truncate">{user.fullName}</h3>
                <span className="text-xs text-slate-400 font-medium">Age: {user.age} yrs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{user.city}, {user.state}</span>
              </div>
              <div className="space-y-1.5 text-xs mt-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-800/40 w-fit">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-sans mr-0.5">Phone:</span>
                  <span className="font-mono font-bold">{user.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-800/40 w-fit">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-sans mr-0.5">Email:</span>
                  <span className="font-mono font-semibold">{user.email || 'No email registered'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED SECTION: Govt ID Verification & Address Audit History */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Address & Govt ID Verification</span>
                    <span className="text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-950/60 px-2 py-0.2 rounded border border-cyan-800/50">
                      Fraud Prevention Vault
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Mandatory address cross-referencing and permanent audit log of submitted credentials.
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                isUserVerified
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                {isUserVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            {/* PART A: CURRENT ACTIVE ID & ADDRESS */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Current Active Credential Record</span>
                </span>
                {user.idSubmittedAt && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    Submitted: {new Date(user.idSubmittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Document Type & ID Number */}
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Document Type & Registration ID
                  </span>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{user.documentType || <span className="text-amber-400 font-normal">Pending Document Submission</span>}</span>
                  </div>
                  {user.documentIdNumber ? (
                    <div className="font-mono text-cyan-400 font-bold text-sm tracking-wide mt-0.5">
                      {user.documentIdNumber}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic block">No ID number registered</span>
                  )}
                </div>

                {/* Residential Address */}
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <Home className="w-3 h-3 text-cyan-400" />
                    <span>Registered Residential Address</span>
                  </span>
                  <p className="text-slate-300 font-medium text-xs leading-relaxed">
                    {user.residentialAddress || <span className="text-slate-500 italic">No residential address recorded</span>}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    City Hub: {user.city}, {user.state}
                  </span>
                </div>
              </div>

              {/* ID Document Image Preview */}
              <div className="pt-1">
                {user.documentImageUrl ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.documentImageUrl}
                        alt="ID Document"
                        className="w-14 h-10 rounded object-cover border border-slate-700 cursor-pointer hover:opacity-90"
                        onClick={() => setPreviewModalImage(user.documentImageUrl || null)}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Document Scan Attached</span>
                        <span className="text-[10px] text-slate-400">Click preview to enlarge in modal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewModalImage(user.documentImageUrl || null)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80 text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>No document scan uploaded yet (bypassed during signup testing or pending upload).</span>
                  </div>
                )}
              </div>

              {/* Approval Action */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-4 h-4 ${isUserVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-slate-300 font-medium">
                    {isUserVerified
                      ? 'Member is auto-verified with Government ID on file.'
                      : 'Unverified: No Government ID uploaded yet.'}
                  </span>
                </div>

                {!isUserVerified ? (
                  <button
                    type="button"
                    onClick={handleApproveId}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve ID (Make Live ✔)</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Auto-Verified &amp; Live</span>
                  </span>
                )}
              </div>
            </div>

            {/* PART B: PREVIOUS ID HISTORY LOG (FRAUD PREVENTION AUDIT TRAIL) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
              <button
                type="button"
                onClick={() => setShowHistoryLog(!showHistoryLog)}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Previous ID & Address History Log</span>
                  <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                    {user.verificationHistory ? user.verificationHistory.length : 0} Records
                  </span>
                </div>
                {showHistoryLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHistoryLog && (
                <div className="p-3.5 space-y-2.5 border-t border-slate-800 animate-fadeIn">
                  {(!user.verificationHistory || user.verificationHistory.length === 0) ? (
                    <p className="text-xs text-slate-500 text-center py-2 italic">
                      No previous credential update history on record.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {user.verificationHistory.map((rec, idx) => (
                        <div
                          key={rec.id || idx}
                          className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                              <span>{rec.documentType}</span>
                              <span className="font-mono text-cyan-400 font-bold">({rec.idNumber})</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rec.submittedAt ? new Date(rec.submittedAt).toLocaleString('en-IN') : 'N/A'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-start gap-1">
                            <Home className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                            <span>Address: <strong className="text-slate-300">{rec.residentialAddress || 'N/A'}</strong></span>
                          </div>

                          {rec.documentImageUrl && (
                            <div className="flex items-center gap-2 pt-1">
                              <img
                                src={rec.documentImageUrl}
                                alt="Prior ID Scan"
                                className="w-12 h-8 rounded object-cover border border-slate-700 cursor-pointer"
                                onClick={() => setPreviewModalImage(rec.documentImageUrl || null)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewModalImage(rec.documentImageUrl || null)}
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>View Archived Image</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DEDICATED SECTION: User Ratings & Reviews */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-950/60 border border-amber-700/60 flex items-center justify-center text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-200">
                  User Ratings & Reviews
                </span>
              </div>

              {user.reviewCount > 0 && user.rating > 0 ? (
                <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= Math.round(user.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-extrabold text-amber-300">
                    {user.rating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({user.reviewCount} rating{user.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  New (No ratings yet)
                </span>
              )}
            </div>

            {allReviewsForUser.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                No client ratings or outing reviews recorded yet for this user token.
              </p>
            ) : (
              <div className="space-y-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Outing Feedback Logged by Verified Participants ({allReviewsForUser.length}):
                </span>
                {allReviewsForUser.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {r.reviewerRole}: {r.reviewerName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                          {r.reviewerToken}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= (r.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="font-mono font-bold text-amber-400 ml-1">
                          {r.rating}/5
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="text-slate-300 font-medium">{r.activityTitle}</span>
                      <span>•</span>
                      <span>{r.outingDate}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-500">{r.bookingToken}</span>
                    </div>

                    {r.review ? (
                      <p className="text-[11px] text-slate-200 italic bg-slate-950/70 p-2 rounded border border-slate-800/80">
                        "{r.review}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">
                        Rating submitted with no text review comment.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEDICATED SECTION: Filed Safety Reports Against This User */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Filed Safety Reports Against This User ({reportsAgainstUser.length})</span>
              </span>
              {reportsAgainstUser.length > 0 && (
                <span className="bg-rose-950 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-800">
                  FLAGGED
                </span>
              )}
            </div>

            {reportsAgainstUser.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                No safety complaints or violations have been filed against this token.
              </p>
            ) : (
              <div className="space-y-2">
                {reportsAgainstUser.map((report) => (
                  <div
                    key={report.id}
                    className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-mono text-indigo-400 font-bold">{report.reportToken}</span>
                      <span className="text-rose-400 font-bold">{report.category}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      "{report.details}"
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Filed by Token: <code className="text-slate-300 font-mono">{report.reportedByToken}</code> • Location: {report.venueAddress}
                    </div>
                    {report.adminResolutionNotes && (
                      <div className="text-[10px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded">
                        Resolution Note: {report.adminResolutionNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Status Update Form */}
          <form onSubmit={handleApplyStatusChange} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">
              Modify Account Standing (Active, Warn, Suspend, Block)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Active', 'Warned', 'Suspended', 'Blocked'] as AccountStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div>
              <input
                type="text"
                placeholder="Reason / resolution notes (recorded to immutable audit log)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              {saveSuccess ? (
                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Standing updated & logged!
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Suspended / Blocked users are immediately hidden from public Explore.
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Apply Standing
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setInspectedUserToken(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewModalImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImage}
              alt="Government ID Full Preview"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
