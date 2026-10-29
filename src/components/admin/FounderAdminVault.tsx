import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AccountStatus, BookingRecord, UserProfile } from '../../types/marketplace';
import { computeLiveBookingFee } from '../../utils/feeCalculator';
import { 
  Lock, 
  Sliders, 
  Building2, 
  Users, 
  ShieldAlert, 
  History, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  LogOut,
  Check,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Search,
  Mail,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Home,
  Star,
  MessageSquare,
  Wallet,
  Archive,
  Gift,
  Megaphone,
  Send,
  Loader2,
} from 'lucide-react';
import { CopyUserIdButton } from '../common/CopyUserIdButton';
import { sendPersonalOffer, broadcastOfferToAllUsers } from '../../services/cancellationAndOffersService';

type AdminTab = 'fees' | 'payments' | 'wallet' | 'venues' | 'users' | 'feedback' | 'reports' | 'security' | 'audit';

export const FounderAdminVault: React.FC = () => {
  const { 
    lockFounderVault, 
    platformSettings, 
    updatePlatformSettings, 
    resetSettingsToDefault, 
    updateAdminMasterPasskey, 
    addAllowedVenueCategory, 
    removeAllowedVenueCategory, 
    usersAndCompanions, 
    currentUser, 
    getUserByToken,
    updateUserAccountStatus,
    verifyUserIdentity, 
    safetyReports, 
    resolveReport, 
    auditLogs, 
    setInspectedUserToken,
    paymentsLedger,
    permanentlyPurgeArchivedUser,
    confirmPaymentAndReleaseBooking,
    rejectPaymentAndFlagBooking,
    getCompanionActivityCards,
    platformFeedbacks,
    deleteFeedback,
    liftUserSuspension,
    bookings,
    adjustUserWalletCredit,
    resolveBookingDisputeRefundAndBlock,
    addAuditLog,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<AdminTab>('fees');

  // Admin Offer System State (Google Apps Script Webhook)
  const [isPersonalOfferModalOpen, setIsPersonalOfferModalOpen] = useState<boolean>(false);
  const [personalOfferUserToken, setPersonalOfferUserToken] = useState<string>('');
  const [personalOfferEmail, setPersonalOfferEmail] = useState<string>('');
  const [personalOfferName, setPersonalOfferName] = useState<string>('');
  const [personalOfferTitle, setPersonalOfferTitle] = useState<string>('Special Platform Invitation: Exclusive Outing Offer');
  const [personalOfferMessage, setPersonalOfferMessage] = useState<string>('We are excited to share a customized promotional benefit for your next public platonic outing on Cirqlr.');
  const [personalOfferCoupon, setPersonalOfferCoupon] = useState<string>('CIRQLR50');
  const [personalOfferExpiry, setPersonalOfferExpiry] = useState<string>('Valid for 30 days');
  const [isSendingPersonalOffer, setIsSendingPersonalOffer] = useState<boolean>(false);
  const [personalOfferToast, setPersonalOfferToast] = useState<string | null>(null);

  const [isBroadcastOfferModalOpen, setIsBroadcastOfferModalOpen] = useState<boolean>(false);
  const [broadcastSubject, setBroadcastSubject] = useState<string>('Cirqlr Community Special: Discover Verified Public Outings');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('Connect with verified companions across Kolkata and Bhubaneswar for curated cafes, cinema discussions, and museum walks.');
  const [broadcastCoupon, setBroadcastCoupon] = useState<string>('COMMUNITY2026');
  const [broadcastExpiry, setBroadcastExpiry] = useState<string>('Limited Time Access');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);

  const handleSendPersonalOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toEmail = personalOfferEmail.trim();
    if (!toEmail) {
      setPersonalOfferToast('Recipient email address is required.');
      setTimeout(() => setPersonalOfferToast(null), 3500);
      return;
    }

    setIsSendingPersonalOffer(true);
    try {
      const success = await sendPersonalOffer({
        toEmail,
        userName: personalOfferName.trim() || 'Valued Member',
        userToken: personalOfferUserToken || undefined,
        offerTitle: personalOfferTitle.trim(),
        offerMessage: personalOfferMessage.trim(),
        couponCode: personalOfferCoupon.trim(),
        expiryDate: personalOfferExpiry.trim(),
      });

      if (success) {
        addAuditLog(
          'Personal Offer Dispatched',
          `Admin sent offer "${personalOfferTitle}" to ${personalOfferName || toEmail} (${toEmail}) via Apps Script.`
        );
        setPersonalOfferToast(`Personal offer successfully sent to ${toEmail}!`);
        setTimeout(() => {
          setIsPersonalOfferModalOpen(false);
          setPersonalOfferToast(null);
        }, 1500);
      } else {
        setPersonalOfferToast('Offer dispatched. Google Apps Script acknowledged request.');
        setTimeout(() => {
          setIsPersonalOfferModalOpen(false);
          setPersonalOfferToast(null);
        }, 1500);
      }
    } catch (err: any) {
      setPersonalOfferToast(`Error sending offer: ${err?.message || 'Check connection'}`);
      setTimeout(() => setPersonalOfferToast(null), 3500);
    } finally {
      setIsSendingPersonalOffer(false);
    }
  };

  const handleBroadcastOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeRecipients = usersAndCompanions
      .filter((u) => u.email && u.email.trim() !== '' && u.accountStatus !== 'Deleted_Archived')
      .map((u) => ({ email: u.email!, name: u.fullName }));

    if (activeRecipients.length === 0) {
      setBroadcastToast('No registered users with email found to broadcast.');
      setTimeout(() => setBroadcastToast(null), 3500);
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const success = await broadcastOfferToAllUsers({
        offerSubject: broadcastSubject.trim(),
        offerMessage: broadcastMessage.trim(),
        couponCode: broadcastCoupon.trim(),
        expiryDate: broadcastExpiry.trim(),
        recipients: activeRecipients,
      });

      if (success) {
        addAuditLog(
          'Broadcast Offer Dispatched',
          `Admin broadcast offer "${broadcastSubject}" to ${activeRecipients.length} registered members via Apps Script.`
        );
        setBroadcastToast(`Broadcast sent to ${activeRecipients.length} registered members!`);
        setTimeout(() => {
          setIsBroadcastOfferModalOpen(false);
          setBroadcastToast(null);
        }, 1500);
      } else {
        setBroadcastToast(`Broadcast triggered for ${activeRecipients.length} users.`);
        setTimeout(() => {
          setIsBroadcastOfferModalOpen(false);
          setBroadcastToast(null);
        }, 1500);
      }
    } catch (err: any) {
      setBroadcastToast(`Broadcast error: ${err?.message || 'Check connection'}`);
      setTimeout(() => setBroadcastToast(null), 3500);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Fee Form State
  const [baseFee, setBaseFee] = useState<number>(platformSettings.baseAcceptanceFeePercent);
  const [subPrice, setSubPrice] = useState<number>(platformSettings.proSubscriptionMonthlyPrice);
  const [discountPercent, setDiscountPercent] = useState<number>(platformSettings.proOccasionDiscountPercent);
  const [feeSavedToast, setFeeSavedToast] = useState<boolean>(false);

  // Manual Wallet Adjustment Modal State
  const [walletAdjustUser, setWalletAdjustUser] = useState<UserProfile | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number>(236);
  const [adjustReason, setAdjustReason] = useState<string>('Admin Goodwill Credit: Booker Non-Payment Dispute Support');
  const [walletToast, setWalletToast] = useState<string | null>(null);

  // 1-Click Dispute Action Modal State
  const [disputeBooking, setDisputeBooking] = useState<BookingRecord | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState<string>('Booker Non-Payment & Platform Policy Violation');
  const [disputeToast, setDisputeToast] = useState<string | null>(null);

  // Venue Local State
  const [newVenueCategoryInput, setNewVenueCategoryInput] = useState<string>('');

  // Security Passkey Rotation State
  const [newPasskeyInput, setNewPasskeyInput] = useState<string>('');
  const [confirmPasskeyInput, setConfirmPasskeyInput] = useState<string>('');
  const [passkeyToast, setPasskeyToast] = useState<string | null>(null);

  // Report resolution state
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [resolutionAction, setResolutionAction] = useState<AccountStatus>('Warned');

  // Ledger stats
  const onHoldPayments = paymentsLedger.filter((p) => p.status === 'ON HOLD (Check Razorpay)');
  const refundDuePayments = paymentsLedger.filter((p) => p.status === 'REFUND DUE (Cancelled Booking)');
  const totalVerifiedRevenue = paymentsLedger
    .filter((p) => p.status === 'VERIFIED & RELEASED')
    .reduce((sum, p) => sum + p.feeAmount, 0);
  const totalOnHoldAmount = onHoldPayments.reduce((sum, p) => sum + p.feeAmount, 0);
  const totalRefundDueAmount = refundDuePayments.reduce((sum, p) => sum + p.feeAmount, 0);

  const handleSaveFeeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings({
      baseAcceptanceFeePercent: Number(baseFee),
      proSubscriptionMonthlyPrice: Number(subPrice),
      proOccasionDiscountPercent: Number(discountPercent),
    });
    setFeeSavedToast(true);
    setTimeout(() => setFeeSavedToast(false), 2500);
  };

  const handleExecuteWalletAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAdjustUser) return;
    const delta = adjustType === 'add' ? Math.abs(Number(adjustAmount)) : -Math.abs(Number(adjustAmount));
    adjustUserWalletCredit(walletAdjustUser.userToken, delta, adjustReason);
    setWalletToast(`Wallet credit adjusted for ${walletAdjustUser.fullName} (${delta >= 0 ? '+' : ''}₹${delta}).`);
    setWalletAdjustUser(null);
    setTimeout(() => setWalletToast(null), 3500);
  };

  const handleExecuteDisputeResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeBooking) return;
    resolveBookingDisputeRefundAndBlock(disputeBooking.id, disputeReasonInput);
    setDisputeToast(`Dispute resolved for ${disputeBooking.bookingToken}: Fee refunded to Companion wallet & Booker blocked.`);
    setDisputeBooking(null);
    setTimeout(() => setDisputeToast(null), 4000);
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVenueCategoryInput.trim()) {
      addAllowedVenueCategory(newVenueCategoryInput.trim());
      setNewVenueCategoryInput('');
    }
  };

  const handleUpdatePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasskeyInput.length < 4) {
      setPasskeyToast('Passkey must be at least 4 characters long.');
      return;
    }
    if (newPasskeyInput !== confirmPasskeyInput) {
      setPasskeyToast('Passkeys do not match.');
      return;
    }

    const success = updateAdminMasterPasskey(newPasskeyInput);
    if (success) {
      setPasskeyToast('Master Passkey updated successfully! Audit log created.');
      setNewPasskeyInput('');
      setConfirmPasskeyInput('');
      setTimeout(() => setPasskeyToast(null), 3000);
    }
  };

  const handleExecuteReportResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReportId) return;
    resolveReport(resolvingReportId, resolutionNote || 'Resolved by Founder review', resolutionAction);
    setResolvingReportId(null);
    setResolutionNote('');
  };

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userStandingFilter, setUserStandingFilter] = useState<'all' | 'Suspended' | 'Active' | 'Warned' | 'Deleted_Archived'>('all');
  const [expandedUserTokens, setExpandedUserTokens] = useState<Set<string>>(new Set());

  // Wallet Management State
  const [walletSearchQuery, setWalletSearchQuery] = useState<string>('');
  const [walletFilterOnlyWithBalance, setWalletFilterOnlyWithBalance] = useState<boolean>(false);

  // User Feedback State
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all');
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState<string>('');

  const toggleExpandUser = (token: string) => {
    setExpandedUserTokens((prev) => {
      const next = new Set(prev);
      if (next.has(token)) {
        next.delete(token);
      } else {
        next.add(token);
      }
      return next;
    });
  };

  const allUsers = usersAndCompanions;
  const suspendedUsers = allUsers.filter((u) => u.accountStatus === 'Suspended');

  const filteredUsers = allUsers.filter((u) => {
    if (userStandingFilter !== 'all' && u.accountStatus !== userStandingFilter) {
      return false;
    }
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.trim().toLowerCase();
    const tokenMatch = (u.userToken || '').toLowerCase().includes(q);
    const nameMatch = (u.fullName || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(q);
    const cityMatch = (u.city || '').toLowerCase().includes(q);
    return tokenMatch || nameMatch || emailMatch || phoneMatch || cityMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Executive Command Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-slate-800 to-emerald-600 flex items-center justify-center border border-slate-700 shadow-md">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-wide text-white">
                  Founder Admin Command Center
                </h1>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">
                  ROOT VAULT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Confidential Marketplace Control • Payments & Hold Ledger • User ID Gates
              </p>
            </div>
          </div>

          {/* Command Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* 🎁 Send Personal Offer */}
            <button
              type="button"
              onClick={() => {
                setPersonalOfferToast(null);
                setIsPersonalOfferModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-amber-200" />
              <span>🎁 Send Personal Offer</span>
            </button>

            {/* 📢 Broadcast Offer to All Users */}
            <button
              type="button"
              onClick={() => {
                setBroadcastToast(null);
                setIsBroadcastOfferModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-cyan-500/20 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-cyan-200" />
              <span>📢 Broadcast Offer to All Users</span>
            </button>

            {/* Prominent Exit Button */}
            <button
              type="button"
              onClick={lockFounderVault}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-bold transition-all shadow-md group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Lock Admin Vault</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Navigation Tabs (Live Fee Simulation Sandbox removed per instructions) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800/80 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'fees'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Fee & Rules Controller</span>
          </button>

          {/* NEW TAB: Payments & Hold Verification Ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments & Hold Ledger</span>
            {onHoldPayments.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {onHoldPayments.length} ON HOLD
              </span>
            )}
          </button>
 
          {/* TAB: 💳 Wallet & Credit Center */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
              activeTab === 'wallet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>💳 Wallet &amp; Credit Center</span>
            {usersAndCompanions.reduce((s, u) => s + (u.cancellationCreditBalance || 0), 0) > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                ₹{usersAndCompanions.reduce((s, u) => s + (u.cancellationCreditBalance || 0), 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('venues')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'venues'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Venue Enforcement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Token Directory</span>
            {suspendedUsers.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                {suspendedUsers.length} SUSPENDED
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'feedback'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>User Feedback ({platformFeedbacks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Safety Reports ({safetyReports.filter((r) => r.status === 'Open Investigation').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Passkey Rotation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Tab 1: Live Dynamic Fee & Rules Controller */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    Marketplace Fee & Rules Controller
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure live platform acceptance fees, repeat client loyalty reductions, and Companion Pro freemium parameters.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSettingsToDefault}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {feeSavedToast && (
                <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Platform settings saved and deployed globally across Booker & Companion views!</span>
                </div>
              )}

              <form onSubmit={handleSaveFeeSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Platform Acceptance Fee Rate (%) */}
                  <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">
                        Base Platform Acceptance Fee Rate (%)
                      </label>
                      <span className="text-xl font-mono font-extrabold text-indigo-400">
                        {baseFee}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={baseFee}
                      onChange={(e) => setBaseFee(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>5%</span>
                      <span>Default: 15%</span>
                      <span>30%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Charged to the Companion upon accepting an outing. Submitted via Razorpay and sent to the Hold Ledger for verification.
                    </p>
                  </div>

                  {/* Simplified Marketplace Fee Policy (Repeat Client Loyalty Removed) */}
                  <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">
                        Referral & Loyalty Policy Architecture
                      </label>
                      <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        5% Referral Waiver Only
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                      <p>
                        <strong>Simplified Fee Engine:</strong> Base Acceptance Fee is strictly dynamic at <strong>{baseFee}%</strong>. Repeat client reductions have been completely removed to ensure pricing math remains simple, uniform, and conflict-free across all outings.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        • <strong>Referral Discount:</strong> If a Companion has referral credits (&gt;0), a 5% waiver is dynamically applied: <code className="text-emerald-300 font-mono">Math.round(baseFee * 0.95)</code>.
                      </p>
                    </div>
                  </div>

                  {/* Companion Pro Subscription Monthly Price */}
                  <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">
                        Companion Pro Subscription (1-Month / 30 Days)
                      </label>
                      <span className="text-xl font-mono font-extrabold text-amber-400">
                        ₹{subPrice} / 30 Days
                      </span>
                    </div>
                    <input
                      type="number"
                      step={50}
                      min={199}
                      max={1999}
                      value={subPrice}
                      onChange={(e) => setSubPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      1-Month Pass (30 Days Validity). Charged when a Companion wants to unlock unlimited Activity Cards beyond the 3 free cards.
                    </p>
                  </div>

                  {/* Occasion / Festive Discount (%) */}
                  <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-200">
                        Occasion / Festive Pro Discount (%)
                      </label>
                      <span className="text-xl font-mono font-extrabold text-emerald-400">
                        {discountPercent}% OFF
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>0% (No discount)</span>
                      <span>Default: 20% OFF (₹{Math.round(subPrice * (1 - discountPercent / 100))} / 1 Month)</span>
                      <span>80% OFF</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Applies festive promotional discounts to the 1-Month Companion Pro pass (valid 30 days) across Booker & Companion views.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Deploy Fee & Subscription Rules Globally
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: NEW Payments & Hold Verification Ledger */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Total Platform Revenue Verified
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1 block">
                  ₹{totalVerifiedRevenue}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Confirmed Fees, Subscriptions & ₹20 Cancellation Penalties.
                </p>
              </div>

              <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Payments Currently On Hold
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 mt-1 block">
                  ₹{totalOnHoldAmount} ({onHoldPayments.length} pending)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Requires Admin Razorpay verification before unlocking E2E chat.
                </p>
              </div>

              <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-rose-400 uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Refunds Due to Companions
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400 mt-1 block">
                  ₹{totalRefundDueAmount} ({refundDuePayments.length} due)
                </span>
                <p className="text-[11px] text-rose-300/80 mt-1">
                  Manual refund to Companion required within 15 days due to Booker cancellation.
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    Incoming Payment Transactions & Hold Ledger
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify incoming Razorpay reference IDs. Approving an On-Hold payment confirms the booking and unlocks the E2E encrypted chat.
                  </p>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {paymentsLedger.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">Transaction / Razorpay Ref</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Companion Token</th>
                      <th className="py-3 px-3">Companion Email</th>
                      <th className="py-3 px-3">Booker</th>
                      <th className="py-3 px-3">Outing Value</th>
                      <th className="py-3 px-3">Fee Rate</th>
                      <th className="py-3 px-3">Platform Fee (₹)</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paymentsLedger.map((txn) => {
                      const companionUser = usersAndCompanions.find(
                        (u) => u.userToken === txn.companionToken
                      );

                      return (
                        <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                            {txn.paymentReferenceId || txn.razorpayRefId}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {txn.type}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => setInspectedUserToken(txn.companionToken)}
                              className="font-mono text-indigo-400 hover:underline font-semibold"
                            >
                              {txn.companionToken}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            {companionUser?.email ? (
                              <span className="font-mono text-cyan-300 text-[11px] block truncate max-w-[170px]" title={companionUser.email}>
                                {companionUser.email}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No email</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {txn.bookerName || 'N/A'}
                          </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {txn.grossOutingValue
                            ? `₹${txn.grossOutingValue}`
                            : txn.type === '1-Month Pro Subscription'
                            ? '30d Pass'
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {txn.effectiveFeePercent ? `${txn.effectiveFeePercent}%` : 'Flat / Fixed'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          ₹{txn.feeAmount}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                            txn.status === 'VERIFIED & RELEASED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : txn.status === 'ON HOLD (Check Razorpay)'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              : txn.status === 'REFUND DUE (Cancelled Booking)'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600 font-extrabold shadow-xs flex items-center gap-1 w-fit'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {txn.status === 'REFUND DUE (Cancelled Booking)' && (
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                            )}
                            <span>{txn.status}</span>
                          </span>
                          {txn.refundNotes && (
                            <span className="text-[10px] text-rose-300/80 block mt-1 italic max-w-xs leading-tight">
                              {txn.refundNotes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {txn.status === 'ON HOLD (Check Razorpay)' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => rejectPaymentAndFlagBooking(txn.id)}
                                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold"
                              >
                                Reject / Flag Unpaid
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmPaymentAndReleaseBooking(txn.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                              >
                                {txn.type === '1-Month Pro Subscription'
                                  ? 'Confirm Payment & Activate Pro (30 Days) ✔'
                                  : 'Confirm Payment & Release Booking ✔'}
                              </button>
                            </div>
                          ) : txn.status === 'REFUND DUE (Cancelled Booking)' ? (
                            <div className="text-right space-y-0.5">
                              <span className="text-[11px] text-amber-400 font-bold block">
                                ⏳ Refund in 15 Days
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Manual Payout
                              </span>
                            </div>
                          ) : txn.type === 'Cancellation Penalty' ? (
                            <div className="text-right">
                              <span className="text-[11px] text-emerald-400 font-bold block">
                                Penalty Collected ✔
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Platform Revenue
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Outings Ledger & 1-Click Dispute Resolution */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">
                        Platform Outings &amp; 1-Click Dispute Resolution
                      </h2>
                      <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        DISPUTE CONTROLS
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Resolve post-outing disputes, non-payment by bookers, or policy violations. 1-click refund of Platform Fee to Companion's Fee Credit Wallet while instantly blocking the offending Booker.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-400 shrink-0">
                  {bookings.length} Total Platform Outing{bookings.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Outing Token &amp; Title</th>
                      <th className="py-2.5 px-3">Booker (Client)</th>
                      <th className="py-2.5 px-3">Companion (Host)</th>
                      <th className="py-2.5 px-3">Gross Value</th>
                      <th className="py-2.5 px-3">Platform Fee</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Founder Dispute Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                          No bookings created yet on the platform.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => {
                        const companion = getUserByToken(b.companionToken);
                        const booker = getUserByToken(b.bookerToken);
                        const liveFee = computeLiveBookingFee(b, bookings, companion, platformSettings);
                        const isDisputed = String(b.status || '').includes('Disputed');

                        return (
                          <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-mono text-indigo-400 font-bold">{b.bookingToken}</div>
                              <div className="text-slate-200 font-medium line-clamp-1">{b.activityTitle}</div>
                              <div className="text-[10px] text-slate-400">{b.outingDate} • {b.hours} hrs</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-200">{b.bookerName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{b.bookerToken}</div>
                              {booker?.accountStatus && booker.accountStatus !== 'Active' && (
                                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                  {booker.accountStatus}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-200">{b.companionName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{b.companionToken}</div>
                              <div className="text-[10px] text-emerald-400 font-mono">
                                Wallet: ₹{companion?.cancellationCreditBalance || 0}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              ₹{b.totalOutingCost}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <div className="text-emerald-400 font-bold">₹{liveFee.finalPlatformFee}</div>
                              <div className="text-[10px] text-slate-400">
                                {liveFee.effectiveFeePercent}% {liveFee.isDiscountApplied ? `(${liveFee.discountApplied})` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                isDisputed
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                  : b.status === 'Confirmed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : b.status === 'Completed'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : b.status.includes('Cancelled')
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isDisputed ? (
                                <div className="text-right space-y-0.5">
                                  <span className="text-[11px] text-rose-300 font-bold block">
                                    Dispute Resolved ✔
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    Fee Credited &amp; Booker Blocked
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDisputeBooking(b);
                                    setDisputeReasonInput('Booker Non-Payment & Platform Policy Violation');
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700/80 text-rose-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                                  title="1-Click Dispute: Refund Platform Fee to Companion Wallet & Block Booker"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>Dispute Action: Refund Fee &amp; Block Booker</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB: 💳 WALLET & CREDIT CENTER                                */}
        {/* ============================================================= */}
        {activeTab === 'wallet' && (() => {
          const totalActiveWalletBalance = usersAndCompanions.reduce(
            (sum, u) => sum + (u.cancellationCreditBalance || 0),
            0
          );

          // All wallet entries across all registered users
          const allGlobalWalletTxns = usersAndCompanions
            .flatMap((u) =>
              (u.walletHistory || []).map((tx) => ({
                ...tx,
                userToken: u.userToken,
                userName: u.fullName,
                userEmail: u.email,
              }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          const totalAdminGoodwillIssued = allGlobalWalletTxns
            .filter((tx) => tx.type === 'credit' && tx.adminToken)
            .reduce((sum, tx) => sum + tx.amount, 0);

          const totalLifelinesUsed = usersAndCompanions.filter(
            (u) => (u.monthlyLifelineUsed || 0) > 0
          ).length;

          // Filter users for wallet management table
          const q = walletSearchQuery.trim().toLowerCase();
          const filteredWalletUsers = usersAndCompanions.filter((u) => {
            if (walletFilterOnlyWithBalance && (u.cancellationCreditBalance || 0) <= 0) {
              return false;
            }
            if (!q) return true;
            return (
              (u.userToken || '').toLowerCase().includes(q) ||
              (u.fullName || '').toLowerCase().includes(q) ||
              (u.email || '').toLowerCase().includes(q)
            );
          });

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg border border-emerald-500/30">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-white">
                          💳 Wallet &amp; Fee Credit Command Center
                        </h2>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                          ADMIN DISPUTE TOOLS
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Centralized oversight for companion fee balances, Booker cancellation refunds, 1/1 Monthly Lifelines, and manual dispute top-ups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Wallet KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span className="uppercase tracking-wider text-[10px] font-bold">
                      Active User Wallet Balance
                    </span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono pt-1">
                    ₹{totalActiveWalletBalance}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live balance across all {usersAndCompanions.length} user accounts
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span className="uppercase tracking-wider text-[10px] font-bold">
                      Admin Dispute / Goodwill Credits
                    </span>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400 font-mono pt-1">
                    ₹{totalAdminGoodwillIssued}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Total Rupee goodwill credited for dispute resolutions
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span className="uppercase tracking-wider text-[10px] font-bold">
                      Monthly Lifelines Used
                    </span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono pt-1">
                    {totalLifelinesUsed} / {usersAndCompanions.length}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Companions currently at 0/1 available lifelines this month
                  </p>
                </div>
              </div>

              {/* Dedicated User Wallet Management Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Dedicated User Wallet Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      View live Rupee balances, monthly emergency lifeline status, and grant goodwill credits or adjustments.
                    </p>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={walletSearchQuery}
                        onChange={(e) => setWalletSearchQuery(e.target.value)}
                        placeholder="Search token, name, email..."
                        className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-52"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={walletFilterOnlyWithBalance}
                        onChange={(e) => setWalletFilterOnlyWithBalance(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Only with Balance (&gt; ₹0)</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">User Token &amp; Identity</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Standing</th>
                        <th className="py-2.5 px-3">Wallet Balance</th>
                        <th className="py-2.5 px-3">Monthly Lifeline</th>
                        <th className="py-2.5 px-3 text-right">Quick Wallet Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredWalletUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No user accounts match the current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredWalletUsers.map((u) => {
                          const bal = u.cancellationCreditBalance || 0;
                          const lifelineUsed = (u.monthlyLifelineUsed || 0) >= 1;

                          return (
                            <tr key={u.userToken} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {u.avatarUrl ? (
                                    <img
                                      src={u.avatarUrl}
                                      alt={u.fullName}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-700 shrink-0">
                                      {u.fullName.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{u.fullName}</span>
                                      {u.isProCompanion && (
                                        <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded font-bold">
                                          PRO
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="font-mono text-[10px] text-cyan-400">
                                        {u.userToken}
                                      </span>
                                      <CopyUserIdButton userId={u.userToken} />
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-slate-300">
                                <div className="text-[11px] truncate max-w-xs">{u.email || '—'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{u.phoneNumber}</div>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    u.accountStatus === 'Active'
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                      : u.accountStatus === 'Suspended'
                                      ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                                      : 'bg-amber-950 text-amber-300 border-amber-800'
                                  }`}
                                >
                                  {u.accountStatus}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl border ${
                                    bal > 0
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-xs'
                                      : 'bg-slate-950 text-slate-400 border-slate-800'
                                  }`}
                                >
                                  ₹{bal}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                                    lifelineUsed
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                                  }`}
                                >
                                  {lifelineUsed ? '0 / 1 Available (Used)' : '1 / 1 Available'}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWalletAdjustUser(u);
                                      setAdjustType('add');
                                      setAdjustAmount(236);
                                      setAdjustReason('Admin Goodwill Credit: Dispute Support / Booker Non-Payment Waiver');
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Add Rupee Credit to User Wallet"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add Credit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWalletAdjustUser(u);
                                      setAdjustType('deduct');
                                      setAdjustAmount(Math.min(bal > 0 ? bal : 50, 236));
                                      setAdjustReason('Admin Manual Adjustment');
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Deduct Rupee Credit from User Wallet"
                                  >
                                    <span>- Deduct</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Global Wallet Ledger History */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-cyan-400" />
                      <span>📜 Global Wallet Transaction &amp; Dispute Audit Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Immutable cross-user record of all wallet credit grants, acceptance fee redemptions, dispute refunds, and admin adjustments.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {allGlobalWalletTxns.length} Total Ledger Event{allGlobalWalletTxns.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Date &amp; Time</th>
                        <th className="py-2.5 px-3">User Token &amp; Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Reason / Details</th>
                        <th className="py-2.5 px-3">Authorized By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {allGlobalWalletTxns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No wallet transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        allGlobalWalletTxns.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                              {new Date(tx.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-bold text-white">{tx.userName}</div>
                              <span className="font-mono text-[10px] text-cyan-400">
                                {tx.userToken}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  tx.type === 'credit'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                                    : 'bg-rose-950 text-rose-300 border-rose-700/60'
                                }`}
                              >
                                {tx.type === 'credit' ? '+ Credit Added' : '- Debit Redeemed'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold">
                              <span
                                className={
                                  tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-slate-300 max-w-sm truncate text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                  {tx.paymentReferenceId || tx.id}
                                </span>
                                <span className="truncate">{tx.reason}</span>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[10px] text-slate-400">
                              {tx.adminToken ? (
                                <span className="text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                                  {tx.adminToken}
                                </span>
                              ) : (
                                <span className="text-slate-500">System (Automated)</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 3: Venue Category Enforcement */}
        {activeTab === 'venues' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Permitted Public Venue Category Enforcement
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every Activity Package Card and Booking must belong to one of these public commercial venue types.
              </p>
            </div>

            <div className="bg-rose-950/50 border border-rose-800/80 p-4 rounded-xl text-xs text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-300">Strict Constitutional Exclusion:</strong>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">
                  Private residences, independent apartments, farmhouses, hotel rooms, resort suites, and unverified private vehicles are permanently prohibited.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Currently Approved Public Categories ({platformSettings.allowedPublicVenueCategories.length})
              </span>
              <div className="space-y-2">
                {platformSettings.allowedPublicVenueCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">{category}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAllowedVenueCategory(category)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddVenue} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Add New Permitted Public Venue Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Public Botanical Garden / Park, Book Fair / Exhibition..."
                  value={newVenueCategoryInput}
                  onChange={(e) => setNewVenueCategoryInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            </form>

            {/* Prohibited Venue & Hotel Safety Infractions (7-Day Restricted Mode Log) */}
            <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Prohibited Venue &amp; Hotel Safety Violations (7-Day Restricted Mode Log)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time audit record of accounts placed under 7-day restricted mode due to hotel, private accommodation, or forbidden venue keywords.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 border border-rose-900/60 px-2.5 py-1 rounded-full font-bold">
                  {usersAndCompanions.filter((u) => u.accountStatus === 'Suspended').length} Active Holds
                </span>
              </div>

              {(() => {
                const suspendedList = usersAndCompanions.filter((u) => u.accountStatus === 'Suspended');
                if (suspendedList.length === 0) {
                  return (
                    <div className="p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <div className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>0 Prohibited Venue Violations Currently Active</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        All member booking requests and activity package cards comply with 100% public commercial venue policy.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {suspendedList.map((user) => (
                      <div
                        key={user.userToken}
                        className="p-4 bg-rose-950/30 border border-rose-900/70 rounded-xl space-y-2.5 text-xs text-rose-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-900/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{user.fullName}</span>
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-cyan-300 font-bold">{user.userToken}</span>
                              <CopyUserIdButton userId={user.userToken} iconOnly />
                            </div>
                            <span className="text-[10px] bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded font-extrabold border border-rose-700">
                              7-Day Restricted Mode
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => liftUserSuspension(user.userToken)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs self-start sm:self-auto"
                          >
                            Lift Hold
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Violation Reason / Detected Keyword:</span>
                            <span className="font-semibold text-rose-300">
                              {user.suspensionReason || 'Prohibited accommodation keyword'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">7-Day Restriction Expiry:</span>
                            <span className="font-mono text-amber-300">
                              {user.suspensionExpiryDate ? new Date(user.suspensionExpiryDate).toLocaleString() : '7 Days from infraction'}
                            </span>
                          </div>
                        </div>

                        {user.prohibitedVenueAttempt && (
                          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                            <span className="text-slate-400 block font-semibold">Attempted Prohibited Submission:</span>
                            <span className="font-mono text-rose-300 italic">
                              "{user.prohibitedVenueAttempt}"
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 4: User Token Directory & Identity Inspection */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  User Token Directory & Identity Inspection
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any token to inspect full dossiers, unmasked phone numbers, and filed safety reports. Click "Approve ID ✔" to make profiles live in Explore.
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Total Registered: {allUsers.length} accounts
              </span>
            </div>

            {/* Powerful Real-Time Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search users by User ID / System Token, Legal Name, or Registered Gmail Address..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                <span className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono text-[11px]">
                  Showing <strong className="text-white">{filteredUsers.length}</strong> of {allUsers.length} accounts
                </span>
                {(userSearchQuery || userStandingFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserStandingFilter('all');
                    }}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Quick Standing Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setUserStandingFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userStandingFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Accounts ({allUsers.length})
              </button>

              <button
                type="button"
                onClick={() => setUserStandingFilter('Suspended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  userStandingFilter === 'Suspended'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-950 text-rose-400 hover:bg-rose-950/60 border border-rose-900/60'
                }`}
              >
                <span>🚨 Suspended Violators ({suspendedUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserStandingFilter('Active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userStandingFilter === 'Active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-950 text-emerald-400 hover:bg-emerald-950/60 border border-emerald-900/60'
                }`}
              >
                Active ({allUsers.filter((u) => u.accountStatus === 'Active').length})
              </button>

              <button
                type="button"
                onClick={() => setUserStandingFilter('Warned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userStandingFilter === 'Warned'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 text-amber-400 hover:bg-amber-950/60 border border-amber-900/60'
                }`}
              >
                Warned ({allUsers.filter((u) => u.accountStatus === 'Warned').length})
              </button>
              <button
                type="button"
                onClick={() => setUserStandingFilter('Deleted_Archived')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  userStandingFilter === 'Deleted_Archived'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-950 text-amber-400 hover:bg-amber-950/60 border border-amber-900/60'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived / Deleted (1-Yr Hold) ({allUsers.filter((u) => u.accountStatus === 'Deleted_Archived').length})</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">System Token</th>
                    <th className="py-3 px-3">Full Legal Name</th>
                    <th className="py-3 px-3">Registered Gmail & Mobile</th>
                    <th className="py-3 px-3">City / Hub</th>
                    <th className="py-3 px-3">Activity Packages</th>
                    <th className="py-3 px-3">Fee Wallet</th>
                    <th className="py-3 px-3">Government ID Status</th>
                    <th className="py-3 px-3">Standing</th>
                    <th className="py-3 px-3 text-right">Founder Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                        No registered users yet. Register an account using "Sign Up / Log In" in the public app to inspect and verify Government IDs here.
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium space-y-2">
                        <div>No users match "{userSearchQuery}".</div>
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="text-xs text-indigo-400 underline font-semibold cursor-pointer"
                        >
                          Clear Search Query
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userCards = getCompanionActivityCards(u.userToken);
                      const isExpanded = expandedUserTokens.has(u.userToken);
                      return (
                        <React.Fragment key={u.userToken}>
                          <tr className={`hover:bg-slate-800/40 transition-colors ${u.accountStatus === 'Suspended' ? 'bg-rose-950/30 border-l-2 border-l-rose-500' : ''} ${isExpanded ? 'bg-slate-800/30' : ''}`}>
                            <td className="py-3 px-3">
                              <button
                                type="button"
                                onClick={() => setInspectedUserToken(u.userToken)}
                                className="font-mono text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{u.userToken}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 font-semibold text-white">
                              <div>{u.fullName}</div>
                              <div className="text-[10px] text-slate-400">{u.gender} • {u.age} yrs</div>
                            </td>
                            {/* Explicit Gmail Address alongside Mobile Phone Number */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-300">
                                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate max-w-[210px]" title={u.email || 'No Gmail registered'}>
                                  {u.email || <span className="text-slate-500 italic font-sans text-[11px]">No Gmail Linked</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mt-1">
                                <Phone className="w-3 h-3 text-emerald-500/80 shrink-0" />
                                <span>{u.phoneNumber}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {u.city}
                            </td>
                            <td className="py-3 px-3">
                              {userCards.length > 0 ? (
                                <span className="text-[10px] px-2 py-0.5 rounded border font-semibold bg-indigo-950 text-indigo-300 border-indigo-800">
                                  {userCards.length} Card{userCards.length > 1 ? 's' : ''} (Live)
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded border font-medium bg-slate-800 text-slate-400 border-slate-700">
                                  0 Cards (Hidden)
                                </span>
                              )}
                            </td>
                            {/* Live Fee Wallet Balance & Adjust Control */}
                            <td className="py-3 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold ${(u.cancellationCreditBalance || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  ₹{u.cancellationCreditBalance || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWalletAdjustUser(u);
                                    setAdjustType('add');
                                    setAdjustAmount(236);
                                    setAdjustReason('Admin Goodwill Credit: Booker Non-Payment Dispute Support');
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 border border-slate-700 hover:border-indigo-600 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Adjust Wallet Credit (+/- ₹)"
                                >
                                  <Wallet className="w-2.5 h-2.5 text-indigo-400" />
                                  <span>Adjust</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                                (u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified)
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border-amber-800'
                              }`}>
                                {(u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified) ? 'Verified' : (u.verificationStatus || 'Unverified')}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {u.accountStatus === 'Suspended' ? (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 animate-pulse flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>Suspended (7d)</span>
                                </span>
                              ) : u.accountStatus === 'Deleted_Archived' ? (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                                    <Archive className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>Archived (1-Yr Hold)</span>
                                  </span>
                                  {u.purgeAfter && (
                                    <div className="text-[10px] font-mono text-amber-400 font-semibold whitespace-nowrap">
                                      {Math.max(0, Math.ceil((u.purgeAfter - Date.now()) / (1000 * 60 * 60 * 24)))} days to purge
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  u.accountStatus === 'Active'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}>
                                  {u.accountStatus}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {u.accountStatus === 'Deleted_Archived' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm()) {
                                        permanentlyPurgeArchivedUser(u.userToken);
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                    title="Permanently erase record ahead of 365 days"
                                  >
                                    Purge Now
                                  </button>
                                )}
                                {u.accountStatus === 'Deleted_Archived' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Permanently erase ${u.userToken} (${u.fullName}) and all archived records from all system databases immediately? This action cannot be reversed.`)) {
                                        permanentlyPurgeArchivedUser(u.userToken);
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                    title="Permanently erase record ahead of 365 days"
                                  >
                                    Purge Now
                                  </button>
                                )}
                                {u.accountStatus === 'Suspended' && (
                                  <button
                                    type="button"
                                    onClick={() => liftUserSuspension(u.userToken)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                                    title="Lift 7-day safety suspension"
                                  >
                                    Lift Hold
                                  </button>
                                )}
                                {!(u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified) && (
                                  <button
                                    type="button"
                                    onClick={() => verifyUserIdentity(u.userToken)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                                    title="Approve Government ID and make live in Explore"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve ID ✔</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWalletAdjustUser(u);
                                    setAdjustType('add');
                                    setAdjustAmount(236);
                                    setAdjustReason('Admin Goodwill Credit: Booker Non-Payment Dispute Support');
                                  }}
                                  className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Adjust User Wallet Credit (+/- ₹)"
                                >
                                  <Wallet className="w-3 h-3 text-indigo-400" />
                                  <span>Wallet</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandUser(u.userToken)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Expand row to view Govt ID slot and details"
                                >
                                  <span>{isExpanded ? 'Hide ID' : 'Govt ID'}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInspectedUserToken(u.userToken)}
                                  className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 rounded text-[11px] font-semibold cursor-pointer"
                                  title="Open Full Security Dossier"
                                >
                                  Dossier
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED ROW: Govt ID Verification Slot & Account Details */}
                          {isExpanded && (
                            <tr className="bg-slate-950/60 border-b border-slate-800">
                              <td colSpan={9} className="p-4">
                                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-inner">
                                  {u.accountStatus === 'Suspended' && (
                                    <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-3.5 space-y-2 text-rose-200 shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold flex items-center gap-1.5 text-rose-300 text-xs">
                                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                          <span>7-Day Safety Policy Suspension Active</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => liftUserSuspension(u.userToken)}
                                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                                        >
                                          Lift Suspension Early
                                        </button>
                                      </div>
                                      <div className="text-[11px] space-y-1">
                                        <div>Infraction Reason: <strong className="text-white">{u.suspensionReason || 'Violation of 100% Commercial Public Venues Policy'}</strong></div>
                                        {u.prohibitedVenueAttempt && (
                                          <div>Attempted Submission: <span className="font-mono text-rose-300 italic">"{u.prohibitedVenueAttempt}"</span></div>
                                        )}
                                        {u.suspensionExpiryDate && (
                                          <div>Automated Expiry: <strong className="text-amber-300 font-mono">{new Date(u.suspensionExpiryDate).toLocaleString()}</strong></div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-200">
                                        Member Verification & Security Dossier:
                                      </span>
                                      <CopyUserIdButton
                                        userId={u.userToken}
                                        showText={true}
                                        className="font-mono text-indigo-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800"
                                      />
                                      <span className="text-slate-400 font-semibold">• {u.fullName}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setInspectedUserToken(u.userToken)}
                                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer underline w-fit"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Open Full Interactive Dossier & Audit Log</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* SECTION 1: GOVT ID VERIFICATION & ADDRESS SLOT */}
                                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                                            <FileText className="w-3.5 h-3.5" />
                                          </div>
                                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                                            Address & Govt ID Verification
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {u.verificationHistory && u.verificationHistory.length > 0 && (
                                            <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                                              {u.verificationHistory.length} Audit Record{u.verificationHistory.length !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            (u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified)
                                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                              : 'bg-amber-950 text-amber-400 border-amber-800'
                                          }`}>
                                            {(u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified) ? 'Verified' : (u.verificationStatus || 'Unverified')}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Active ID Document Record */}
                                      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                              <span>{u.documentType || 'Pending ID Submission'}</span>
                                              {u.documentIdNumber && (
                                                <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 text-[11px]">
                                                  {u.documentIdNumber}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 flex items-start gap-1 mt-1">
                                              <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                              <span>Address: <strong className="text-slate-300">{u.residentialAddress || 'No residential address recorded'}</strong></span>
                                            </div>
                                          </div>

                                          {/* View Uploaded ID thumbnail / action */}
                                          {(u.documentImageUrl || u.idDocumentUrl) ? (
                                            <button
                                              type="button"
                                              onClick={() => setInspectedUserToken(u.userToken)}
                                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                                            >
                                              <img
                                                src={u.documentImageUrl || u.idDocumentUrl}
                                                alt="ID"
                                                className="w-5 h-4 object-cover rounded"
                                              />
                                              <span>View Scan</span>
                                            </button>
                                          ) : (
                                            <span className="text-[10px] bg-slate-800 text-slate-500 font-semibold px-2 py-1 rounded border border-slate-700 shrink-0">
                                              No Scan Attached
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                        <span>
                                          Platform Escrow: <strong className="text-slate-300">{(u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified) ? 'Government ID Verified' : 'Awaiting Document Submission'}</strong>
                                        </span>
                                        {!(u.verificationStatus === 'ID Verified' || u.verificationStatus === 'Verified' || u.isVerified) && (
                                          <button
                                            type="button"
                                            onClick={() => verifyUserIdentity(u.userToken)}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Approve ID ✔</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* SECTION 2: VERIFIED CONTACT & CHANNELS */}
                                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                                          Registered Contact Credentials
                                        </span>
                                      </div>

                                      <div className="space-y-2 text-xs">
                                        <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                                          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                                            Registered Gmail Address:
                                          </span>
                                          <span className="font-mono text-indigo-300 font-bold">
                                            {u.email || <span className="text-slate-500 font-sans italic">Not linked yet</span>}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                                          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                            Verified Mobile Number:
                                          </span>
                                          <span className="font-mono text-emerald-400 font-bold">
                                            {u.phoneNumber}
                                          </span>
                                        </div>

                                        <div className="flex items-start justify-between bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 gap-2">
                                          <span className="text-slate-400 text-[11px] shrink-0">Member Bio:</span>
                                          <span className="text-slate-300 text-[11px] text-right truncate">
                                            {u.bio || 'No bio submitted'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* SECTION 3: WALLET & CANCELLATION CREDIT CONTROL */}
                                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                                            <Wallet className="w-3.5 h-3.5" />
                                          </div>
                                          <div>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider block">
                                              Fee Wallet &amp; Cancellation Credit Ledger
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                              Used by companions for 1-click booking acceptance fee waivers or stored goodwill credit.
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Available Credit</span>
                                            <span className="text-sm font-mono font-extrabold text-emerald-400">
                                              ₹{u.cancellationCreditBalance || 0}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setWalletAdjustUser(u);
                                              setAdjustType('add');
                                              setAdjustAmount(236);
                                              setAdjustReason('Admin Goodwill Credit: Booker Non-Payment Dispute Support');
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                                          >
                                            <Wallet className="w-3.5 h-3.5" />
                                            <span>Adjust Balance (+/- ₹)</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Transaction Statement History */}
                                      {u.walletHistory && u.walletHistory.length > 0 ? (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Recorded Wallet Adjustments ({u.walletHistory.length})
                                          </span>
                                          <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {u.walletHistory.map((tx) => (
                                              <div
                                                key={tx.id}
                                                className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between gap-2"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                                    tx.type === 'credit'
                                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                                  }`}>
                                                    {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                                                  </span>
                                                  <span className="text-slate-300">{tx.reason}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                                  {new Date(tx.timestamp).toLocaleString()}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-slate-500 italic pt-1">
                                          No manual wallet adjustments recorded yet for this member.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: User Feedback & Ratings Engine */}
        {activeTab === 'feedback' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <span>User Feedback &amp; Member Ratings</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review ratings, feature suggestions, bug reports, and member testimonials collected across the platform.
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {platformFeedbacks.length} submissions logged
              </span>
            </div>

            {/* Top Metrics Cards */}
            {(() => {
              const total = platformFeedbacks.length;
              const avgRating = total > 0
                ? (platformFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
                : '5.0';
              const fiveStarCount = platformFeedbacks.filter((f) => f.rating === 5).length;
              const featureSuggestionsCount = platformFeedbacks.filter((f) => f.category === 'Feature Suggestion').length;
              const bugsCount = platformFeedbacks.filter((f) => f.category === 'Bug / Issue Report').length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Avg Rating
                    </span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono flex items-center justify-center gap-1">
                      <span>⭐</span>
                      <span>{avgRating} / 5</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">Across {total} submissions</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      5-Star Ratings
                    </span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono">
                      {fiveStarCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Top satisfaction score</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Feature Requests
                    </span>
                    <span className="text-xl font-extrabold text-purple-400 font-mono">
                      {featureSuggestionsCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Community proposals</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Bug Reports
                    </span>
                    <span className="text-xl font-extrabold text-rose-400 font-mono">
                      {bugsCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Identified issues</span>
                  </div>
                </div>
              );
            })()}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {(['all', 'Feature Suggestion', 'Bug / Issue Report', 'General Appreciation'] as const).map((cat) => {
                  const count = cat === 'all'
                    ? platformFeedbacks.length
                    : platformFeedbacks.filter((f) => f.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        feedbackCategoryFilter === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'All Feedbacks' : cat} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={feedbackSearchQuery}
                  onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                  placeholder="Search feedback / user..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Feedback Cards List */}
            {(() => {
              const filtered = platformFeedbacks.filter((f) => {
                const matchesCat = feedbackCategoryFilter === 'all' || f.category === feedbackCategoryFilter;
                if (!matchesCat) return false;
                if (!feedbackSearchQuery.trim()) return true;
                const q = feedbackSearchQuery.toLowerCase();
                return (
                  f.message.toLowerCase().includes(q) ||
                  f.userName.toLowerCase().includes(q) ||
                  f.userToken.toLowerCase().includes(q) ||
                  (f.userEmail && f.userEmail.toLowerCase().includes(q))
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-1">
                    <p className="font-semibold text-slate-300">
                      {platformFeedbacks.length === 0
                        ? '0 feedback submissions logged.'
                        : 'No feedback entries match your filter or search query.'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {platformFeedbacks.length === 0
                        ? 'Real member feedback submitted via the "Give Feedback" modal will appear here.'
                        : 'Try adjusting your search terms or filter selection.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3 text-xs shadow-xs hover:border-slate-700 transition-colors"
                    >
                      {/* Top line: Stars, Category Badge, Timestamp & Delete Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= item.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>

                          <span className="text-slate-500 font-mono text-[11px] font-bold">
                            ({item.rating}/5)
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.category === 'Feature Suggestion'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                                : item.category === 'Bug / Issue Report'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(item.submittedAt).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteFeedback(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Delete this feedback entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Submitter details */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="font-semibold text-white">
                          {item.userName}
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1 font-mono">
                          <span>Token:</span>
                          <span className="text-cyan-300">{item.userToken}</span>
                          <CopyUserIdButton userId={item.userToken} iconOnly />
                        </div>
                        {item.userEmail && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 font-mono">{item.userEmail}</span>
                          </>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed">
                        "{item.message}"
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

          </div>
        )}

        {/* Tab 5: Safety Reports */}
        {activeTab === 'reports' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                Safety Incident Reports & Inquiries
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review complaints concerning off-platform diversions or private venue propositions.
              </p>
            </div>

            <div className="space-y-4">
              {safetyReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{report.reportToken}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-rose-400 font-bold">{report.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'Open Investigation'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(report.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      Reported Account Token:{' '}
                      <button
                        type="button"
                        onClick={() => setInspectedUserToken(report.reportedUserToken)}
                        className="font-mono text-indigo-400 underline font-bold"
                      >
                        {report.reportedUserToken}
                      </button>
                    </div>
                    <div>
                      Filed by Token:{' '}
                      <button
                        type="button"
                        onClick={() => setInspectedUserToken(report.reportedByToken)}
                        className="font-mono text-slate-400 underline"
                      >
                        {report.reportedByToken}
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    "{report.details}"
                  </p>

                  {report.adminResolutionNotes && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-300 text-[11px]">
                      <strong>Founder Resolution Note:</strong> {report.adminResolutionNotes}
                    </div>
                  )}

                  {report.status === 'Open Investigation' && (
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingReportId(report.id);
                          setResolutionAction('Warned');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                      >
                        Issue Warning & Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingReportId(report.id);
                          setResolutionAction('Suspended');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                      >
                        Suspend User & Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Resolution Modal Form */}
            {resolvingReportId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                <form
                  onSubmit={handleExecuteReportResolution}
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
                >
                  <h3 className="font-bold text-sm text-white">Resolve Incident Report</h3>
                  <p className="text-xs text-slate-400">
                    Applying action: <strong className="text-indigo-400">[{resolutionAction}]</strong>
                  </p>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">
                      Investigation Summary / Resolution Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="e.g. Conducted interview with parties. User acknowledged off-platform violation."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setResolvingReportId(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Confirm Resolution
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Security Passkey Rotation */}
        {activeTab === 'security' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                Founder Master Passkey Rotation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotate the Master Passkey required to open this Founder Command Center.
              </p>
            </div>

            {passkeyToast && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-bold">
                {passkeyToast}
              </div>
            )}

            <form onSubmit={handleUpdatePasskey} className="bg-slate-950/70 p-6 rounded-xl border border-slate-800 max-w-md space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  New Master Passkey (Min 4 chars)
                </label>
                <input
                  type="password"
                  value={newPasskeyInput}
                  onChange={(e) => setNewPasskeyInput(e.target.value)}
                  placeholder="Enter new passkey..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Confirm New Master Passkey
                </label>
                <input
                  type="password"
                  value={confirmPasskeyInput}
                  onChange={(e) => setConfirmPasskeyInput(e.target.value)}
                  placeholder="Repeat new passkey..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Update & Rotate Master Passkey
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 7: Immutable Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Immutable Operations Audit Trail
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Append-only journal recording fee updates, ID verification approvals, payment releases, and safety sanctions.
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {auditLogs.length} events logged
              </span>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">{log.id}</span>
                      <span className="font-bold text-indigo-400">{log.action}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                        {log.adminToken}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0 self-start sm:self-auto">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Manual Wallet Adjustment Modal */}
      {walletAdjustUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/90 border border-indigo-700/80 flex items-center justify-center text-indigo-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Manual Wallet Credit Adjustment
                  </h3>
                  <p className="text-xs text-slate-400">
                    {walletAdjustUser.fullName} • <span className="font-mono text-cyan-400">{walletAdjustUser.userToken}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalletAdjustUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteWalletAdjust} className="p-6 space-y-5">
              {/* Current Balance Display */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                    Current Wallet Balance
                  </span>
                  <span className="text-xs text-slate-400">
                    Live Cancellation &amp; Goodwill Credit
                  </span>
                </div>
                <span className="text-xl font-mono font-extrabold text-emerald-400">
                  ₹{walletAdjustUser.cancellationCreditBalance || 0}
                </span>
              </div>

              {/* Add vs Deduct Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Adjustment Operation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Credit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      adjustType === 'deduct'
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>- Deduct Credit</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & Quick Chips */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Adjustment Rupee Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[110, 236, 448, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors ${
                        adjustAmount === amt
                          ? 'bg-indigo-950 border-indigo-600 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Result */}
              {(() => {
                const current = walletAdjustUser.cancellationCreditBalance || 0;
                const delta = adjustType === 'add' ? adjustAmount : -adjustAmount;
                const projected = Math.max(0, current + delta);
                return (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Projected New Balance:</span>
                    <span className="font-mono font-bold text-white">
                      ₹{current} {adjustType === 'add' ? '+' : '-'} ₹{adjustAmount} = <strong className="text-emerald-400 text-sm">₹{projected}</strong>
                    </span>
                  </div>
                );
              })()}

              {/* Reason Note */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Audit &amp; Statement Reason Note (Visible to Member in Wallet tab)
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="Enter reason for wallet adjustment..."
                  required
                />

                {/* Prefill reason suggestions */}
                <div className="space-y-1 mt-1.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Quick Note Templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Admin Goodwill Credit: Booker Non-Payment Dispute Support',
                      'Emergency Cancellation Goodwill Restitution',
                      'Double-counted balance correction to single lifeline',
                      'Manual fee waiver reconciliation',
                    ].map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => setAdjustReason(template)}
                        className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-300 rounded px-2 py-0.5 text-left cursor-pointer transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalletAdjustUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>
                    Confirm {adjustType === 'add' ? '+ Add' : '- Deduct'} ₹{adjustAmount}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Click Outing Dispute Action Modal */}
      {disputeBooking && (() => {
        const companion = getUserByToken(disputeBooking.companionToken);
        const liveFee = computeLiveBookingFee(disputeBooking, bookings, companion, platformSettings);
        const feeToRefund = liveFee.finalPlatformFee;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-rose-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-900/80 border border-rose-700 flex items-center justify-center text-rose-300">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Execute Outing Dispute &amp; Booker Block
                    </h3>
                    <p className="text-xs text-rose-200/90 font-mono">
                      Outing: {disputeBooking.bookingToken}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisputeBooking(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleExecuteDisputeResolution} className="p-6 space-y-4">
                {/* Outing details summary */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Outing Activity:</span>
                    <strong className="text-white">{disputeBooking.activityTitle}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Venue Landmark:</span>
                    <span className="text-slate-300">{disputeBooking.venueName}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Total Outing Cost:</span>
                    <strong className="text-white font-mono">₹{disputeBooking.totalOutingCost}</strong>
                  </div>
                </div>

                {/* The Two Parties Involved */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Companion (Recipient of Refund) */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                      Fee Refund Recipient
                    </span>
                    <div className="font-bold text-white truncate">{disputeBooking.companionName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{disputeBooking.companionToken}</div>
                    <div className="text-[11px] text-emerald-400 font-mono pt-1">
                      Current Wallet: ₹{companion?.cancellationCreditBalance || 0}
                    </div>
                  </div>

                  {/* Offending Booker (To be Blocked) */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                      Offending Booker (Block)
                    </span>
                    <div className="font-bold text-white truncate">{disputeBooking.bookerName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{disputeBooking.bookerToken}</div>
                    <div className="text-[11px] text-rose-300 font-bold pt-1">
                      Action: Permanent Block ⛔
                    </div>
                  </div>
                </div>

                {/* Refund ruppes callout */}
                <div className="bg-emerald-950/50 border border-emerald-700/70 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-emerald-300 block">
                      Platform Acceptance Fee Refund
                    </span>
                    <span className="text-xs text-emerald-200/80">
                      100% credited into Companion's Fee Wallet
                    </span>
                  </div>
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    +₹{feeToRefund}
                  </span>
                </div>

                {/* Dispute Reason Input */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Dispute Reason &amp; Investigation Notes
                  </label>
                  <textarea
                    value={disputeReasonInput}
                    onChange={(e) => setDisputeReasonInput(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                    placeholder="Enter reason for sanction and refund..."
                    required
                  />

                  {/* Quick dispute reasons */}
                  <div className="space-y-1 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Quick Dispute Templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Booker Non-Payment & Platform Policy Violation',
                        'Booker No-Show & Ghosting at Public Landmark',
                        'Refusal to pay Companion hourly rate after outing',
                        'Harassment and Code of Conduct Violation',
                      ].map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => setDisputeReasonInput(template)}
                          className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-300 rounded px-2 py-0.5 text-left cursor-pointer transition-colors"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warning notice */}
                <div className="bg-rose-950/60 border border-rose-800/80 p-3 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <strong className="text-white block font-bold">1-Click Execution Outcomes:</strong>
                    <div>1. Exactly <strong>₹{feeToRefund}</strong> will be added to Companion {disputeBooking.companionName}'s fee credit wallet.</div>
                    <div>2. Booker {disputeBooking.bookerName} will be <strong>Blocked</strong> immediately.</div>
                    <div>3. Incident report SR-DISP logged in the immutable Operations Trail.</div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDisputeBooking(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm Dispute &amp; Block Booker</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: 🎁 Send Personal Offer */}
      {isPersonalOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl w-full max-w-full sm:max-w-lg overflow-hidden shadow-2xl border border-slate-750 flex flex-col text-white max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">🎁 Send Personal Offer</h3>
                  <p className="text-[11px] text-slate-400">
                    Dispatched directly to member via Google Apps Script Webhook
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalOfferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendPersonalOfferSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {personalOfferToast && (
                <div className="p-3 bg-amber-950/80 border border-amber-800 text-amber-200 rounded-xl text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{personalOfferToast}</span>
                </div>
              )}

              {/* Select Registered Member */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Select Registered Member (or enter manually below)
                </label>
                <select
                  value={personalOfferUserToken}
                  onChange={(e) => {
                    const selectedToken = e.target.value;
                    setPersonalOfferUserToken(selectedToken);
                    const user = usersAndCompanions.find((u) => u.userToken === selectedToken);
                    if (user) {
                      setPersonalOfferEmail(user.email || '');
                      setPersonalOfferName(user.fullName || '');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- Choose from registered users --</option>
                  {usersAndCompanions
                    .filter((u) => u.accountStatus !== 'Deleted_Archived')
                    .map((u) => (
                      <option key={u.userToken} value={u.userToken}>
                        {u.fullName} ({u.userToken}) — {u.email || 'No Email'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Member Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personalOfferName}
                    onChange={(e) => setPersonalOfferName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={personalOfferEmail}
                    onChange={(e) => setPersonalOfferEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Offer Title */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Offer Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={personalOfferTitle}
                  onChange={(e) => setPersonalOfferTitle(e.target.value)}
                  placeholder="e.g. Exclusive ₹100 Outing Credit for You"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Offer Message */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Offer Message Body *
                </label>
                <textarea
                  rows={3}
                  required
                  value={personalOfferMessage}
                  onChange={(e) => setPersonalOfferMessage(e.target.value)}
                  placeholder="Explain the perks, eligible activities, or welcome note..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Coupon & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Coupon / Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={personalOfferCoupon}
                    onChange={(e) => setPersonalOfferCoupon(e.target.value)}
                    placeholder="e.g. VIP2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Validity / Expiry
                  </label>
                  <input
                    type="text"
                    value={personalOfferExpiry}
                    onChange={(e) => setPersonalOfferExpiry(e.target.value)}
                    placeholder="e.g. Valid until Sunday"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPersonalOfferModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingPersonalOffer}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSendingPersonalOffer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Offer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-amber-200" />
                      <span>Send Personal Offer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 📢 Broadcast Offer to All Users */}
      {isBroadcastOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl w-full max-w-full sm:max-w-lg overflow-hidden shadow-2xl border border-slate-750 flex flex-col text-white max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-300">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">📢 Broadcast Offer to All Users</h3>
                  <p className="text-[11px] text-slate-400">
                    One-click broadcast delivered via Google Apps Script Webhook
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOfferModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBroadcastOfferSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {broadcastToast && (
                <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-cyan-200 rounded-xl text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{broadcastToast}</span>
                </div>
              )}

              {/* Audience Summary Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Target Broadcast Audience</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {usersAndCompanions.filter((u) => u.email && u.email.trim() !== '' && u.accountStatus !== 'Deleted_Archived').length} Registered Members with Email
                    </span>
                  </span>
                </div>
                <span className="text-[10px] bg-indigo-950/80 text-cyan-300 font-mono px-2 py-1 rounded border border-indigo-800">
                  ALL USERS
                </span>
              </div>

              {/* Broadcast Subject */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Broadcast Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Weekend Special: 20% Off Companion Booking Fees"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Broadcast Message */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Broadcast Message Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write your platform announcement or community offer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Coupon & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Coupon / Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastCoupon}
                    onChange={(e) => setBroadcastCoupon(e.target.value)}
                    placeholder="e.g. ALLCOMMUNITY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    Validity / Expiry
                  </label>
                  <input
                    type="text"
                    value={broadcastExpiry}
                    onChange={(e) => setBroadcastExpiry(e.target.value)}
                    placeholder="e.g. Valid this weekend only"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOfferModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSendingBroadcast ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Broadcasting to All...</span>
                    </>
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4 text-cyan-200" />
                      <span>Broadcast in 1-Click</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Notifications */}
      {personalOfferToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-950 border border-amber-600 text-amber-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{personalOfferToast}</span>
        </div>
      )}
      {broadcastToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-950 border border-cyan-500 text-cyan-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{broadcastToast}</span>
        </div>
      )}
      {walletToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-600 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{walletToast}</span>
        </div>
      )}
      {disputeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-950 border border-rose-600 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{disputeToast}</span>
        </div>
      )}
    </div>
  );
};

