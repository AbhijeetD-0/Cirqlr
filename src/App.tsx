/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { SafetyGuidelinesBanner } from './components/common/SafetyGuidelinesBanner';
import { FloatingBackgroundIcons } from './components/common/FloatingBackgroundIcons';
import { TokenInspectionModal } from './components/common/TokenInspectionModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { ReportModal } from './components/common/ReportModal';
import { AuthModal } from './components/auth/AuthModal';
import { BookerView } from './components/booker/BookerView';
import { MyBookingsView } from './components/booker/MyBookingsView';
import { CompanionStudioView } from './components/companion/CompanionStudioView';
import { FounderAdminVault } from './components/admin/FounderAdminVault';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { TermsAndConditions } from './components/legal/TermsAndConditions';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { RefundPolicy } from './components/legal/RefundPolicy';
import { AboutUsModal } from './components/common/AboutUsModal';
import { FeedbackModal } from './components/common/FeedbackModal';
import { SuspensionNoticeModal } from './components/common/SuspensionNoticeModal';
import { AdminLiveBroadcastModal } from './components/common/AdminLiveBroadcastModal';

const MarketplaceAppShell: React.FC = () => {
  const { 
    isFounderVaultUnlocked, 
    activeTab, 
    isAuthModalOpen, 
    setIsAuthModalOpen,
    activeLegalModal,
    closeLegalModal
  } = useMarketplace();
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);

  // PERSPECTIVE 2: HIDDEN & LOCKED FOUNDER ADMIN VAULT
  // Only rendered if the Founder successfully authenticated with Master Passkey!
  if (isFounderVaultUnlocked) {
    return (
      <>
        <FounderAdminVault />
        <TokenInspectionModal />
        <SuspensionNoticeModal />
      </>
    );
  }

  // PERSPECTIVE 1: THE PUBLIC USER APPLICATION
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Zero-Lag Pure CSS Floating Activity Icons Background */}
      <FloatingBackgroundIcons />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Public Header - Strictly Explore, My Bookings, and Companion Studio */}
        <Header />

        {/* Main Container - Compact Spacing */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <SafetyGuidelinesBanner />

          {activeTab === 'explore' && <BookerView />}
          {activeTab === 'my-bookings' && <MyBookingsView />}
          {activeTab === 'companion-studio' && <CompanionStudioView />}
        </main>

        {/* Public Footer - Contains 3-click secret trigger on v3.0 & Alt+A listener */}
        <Footer onRequestFounderAuth={() => setShowAdminAuthModal(true)} />
      </div>

      {/* Cirqlr OTP User Sign Up / Log In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Secret Passkey Authentication Gate for Founder */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
      />

      {/* Reusable Token Identity Inspector */}
      <TokenInspectionModal />

      {/* User Profile & Companion Pro Membership Modal */}
      <UserProfileModal />

      {/* Official Safety Report Modal */}
      <ReportModal />

      {/* Official Legal Pages & Governance Modals */}
      {activeLegalModal === 'terms' && (
        <TermsAndConditions onClose={closeLegalModal} />
      )}
      {activeLegalModal === 'privacy' && (
        <PrivacyPolicy onClose={closeLegalModal} />
      )}
      {activeLegalModal === 'refund' && (
        <RefundPolicy onClose={closeLegalModal} />
      )}

      {/* About Us Modal */}
      <AboutUsModal />

      {/* User Feedback System Modal */}
      <FeedbackModal />

      {/* 7-Day Safety Hold & Violation Modal */}
      <SuspensionNoticeModal />

      {/* Real-Time Live Admin Promotional & Broadcast Offer Modal */}
      <AdminLiveBroadcastModal />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <MarketplaceAppShell />
    </MarketplaceProvider>
  );
}
