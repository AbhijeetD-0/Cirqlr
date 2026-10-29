import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AllowedDocumentType, UserCity, UserProfile } from '../../types/marketplace';
import { generateSixDigitOtp, verifyOtp } from '../../services/otpService';
import { saveUserToSheet } from '../../services/googleSheetsService';
import { CopyUserIdButton } from '../common/CopyUserIdButton';
import { SignUpLegalReaderModal, LegalDocType } from './SignUpLegalReaderModal';
import { compressImageFile } from '../../utils/imageCompressor';
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Lock,
  Mail,
  RotateCw,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Camera,
  Upload,
  FileText,
  KeyRound,
  Sparkles,
  Home,
  Send
} from 'lucide-react';

/**
 * PERMANENT PRODUCTION EMAILJS CONFIGURATION
 * Embedded directly in source code — zero dependency on .env or external environment variables.
 * Works seamlessly in AI Studio Preview and on live Vercel production deployment.
 */
const EMAILJS_SERVICE_ID = "service_5kbh9qo".trim();
const EMAILJS_TEMPLATE_ID = "YOUR_COPIED_TEMPLATE_ID".trim();
const EMAILJS_PUBLIC_KEY = "BX_yOKOuFB1qNTSTC".trim();

/**
 * Direct EmailJS OTP dispatcher sending passcode using {{passcode}} and {{email}}
 */
async function sendDirectEmailJsOtp(
  recipientEmail: string,
  passcode: string,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (recipientEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid Gmail / Email address.' };
  }

  const cleanPhone = (phoneNumber || '').replace(/\D/g, '').slice(-10);

  const templateParams: Record<string, unknown> = {
    passcode: String(passcode),
    email: cleanEmail,
    to_email: cleanEmail,
    user_email: cleanEmail,
    recipient: cleanEmail,
    to_name: cleanEmail.split('@')[0] || 'Cirqlr Member',
    otp: String(passcode),
    code: String(passcode),
    phone_number: cleanPhone ? `+91 ${cleanPhone}` : 'N/A',
    platform: 'Cirqlr',
    message: `Your Cirqlr 6-digit OTP verification passcode is: ${passcode}. It is valid for 10 minutes.`,
  };

  try {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    } catch {
      // ignore
    }

    const activeTemplateId =
      EMAILJS_TEMPLATE_ID && EMAILJS_TEMPLATE_ID !== 'YOUR_COPIED_TEMPLATE_ID'
        ? EMAILJS_TEMPLATE_ID
        : 'template_m7uoiuf'.trim();

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      activeTemplateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.info(`[EmailJS] OTP passcode ${passcode} dispatched successfully to ${cleanEmail}`, response);
    return { success: true };
  } catch (err: any) {
    const errorText =
      err?.text || err?.message || (typeof err === 'string' ? err : 'Email delivery failed');
    console.error(`[EmailJS Error] Failed to send OTP to ${cleanEmail}:`, {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      errorText,
      rawError: err,
    });
    return {
      success: false,
      error: errorText.includes('Account blocked')
        ? 'Email service temporarily unavailable. Please retry shortly.'
        : errorText || 'Failed to dispatch verification email. Please try again.',
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CITIES: UserCity[] = ['Kolkata', 'Siliguri', 'Durgapur', 'Bhubaneswar', 'Cuttack', 'Puri'];

const ALLOWED_ID_TYPES: AllowedDocumentType[] = ['Voter ID Card', 'Driving License', 'PAN Card'];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    registerUser,
    usersAndCompanions,
    loginWithPassword,
    loginUserAccount,
    resetUserPassword,
    currentUser,
  } = useMarketplace();

  // 3D Card Flip Mode: 'login' (front) vs 'signup' (back)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Full Legal Document Reader Modal State during Sign Up
  const [legalDocToView, setLegalDocToView] = useState<LegalDocType | null>(null);

  // --- RETURNING USER LOGIN STATE ---
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Instant Gmail OTP Login State
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginExpectedOtp, setLoginExpectedOtp] = useState('');
  const [loginEnteredOtp, setLoginEnteredOtp] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(60);
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [loginUserFound, setLoginUserFound] = useState<UserProfile | null>(null);

  // --- 3-STEP PASSWORD RESET FLOW ---
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<'identify' | 'otp' | 'new_password'>('identify');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetUserFound, setResetUserFound] = useState<UserProfile | null>(null);
  const [resetExpectedOtp, setResetExpectedOtp] = useState('');
  const [resetEnteredOtp, setResetEnteredOtp] = useState('');
  const [resetResendTimer, setResetResendTimer] = useState(60);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessToast, setResetSuccessToast] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // --- 5-STEP SIGN UP WIZARD STATE ---
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Basic Details & Full Address
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Non-Binary / Prefer not to say'>('Female');
  const [city, setCity] = useState<UserCity>('Kolkata');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [bio, setBio] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedCharter, setAgreedCharter] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Profile Photo (Optional)
  const [avatarUrl, setAvatarUrl] = useState('');

  // Step 3: Address Verification (Government ID Upload - Optional for Testing)
  const [documentType, setDocumentType] = useState<AllowedDocumentType>('Voter ID Card');
  const [documentIdNumber, setDocumentIdNumber] = useState('');
  const [documentImageUrl, setDocumentImageUrl] = useState('');
  const [step3Error, setStep3Error] = useState('');

  // Step 4: Set Account Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step4Error, setStep4Error] = useState('');

  // Step 5: Final Gmail OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);

  // Registration Completed View
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);

  // Countdown timer for signup OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (signUpStep === 5 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signUpStep, resendTimer]);

  // Countdown timer for forgot password OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isResetMode && resetStep === 'otp' && resetResendTimer > 0) {
      interval = setInterval(() => {
        setResetResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResetMode, resetStep, resetResendTimer]);

  // Countdown timer for returning user login OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (loginOtpSent && loginOtpTimer > 0) {
      interval = setInterval(() => {
        setLoginOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loginOtpSent, loginOtpTimer]);

  // Strictly reset login form inputs whenever modal closes or user logs out
  useEffect(() => {
    if (!isOpen || !currentUser) {
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginError('');
      setShowLoginPassword(false);
      setIsResetMode(false);
      setResetStep('identify');
      setResetIdentifier('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetEnteredOtp('');
      setLoginOtpSent(false);
      setLoginEnteredOtp('');
      setLoginUserFound(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Masking helpers
  const maskEmail = (emailStr?: string): string => {
    if (!emailStr || !emailStr.includes('@')) return emailStr || 'your registered Gmail';
    const [userPart, domain] = emailStr.split('@');
    if (userPart.length <= 2) return `${userPart.charAt(0)}***@${domain}`;
    return `${userPart.slice(0, 2)}***${userPart.slice(-1)}@${domain}`;
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 10) {
      setPhoneNumber(raw);
      setStep1Error('');
    }
  };

  // Flip card between Login & Sign Up
  const toggleFlip = (target: 'login' | 'signup') => {
    setAuthMode(target);
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');
    setIsResetMode(false);
    setResetStep('identify');
    setResetError('');
    setResetSuccessToast('');
    setStep1Error('');
    setStep3Error('');
    setStep4Error('');
    setOtpError('');
  };

  const handleCloseModal = () => {
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');
    setIsResetMode(false);
    onClose();
  };

  // Reset all signup state
  const resetSignUp = () => {
    setSignUpStep(1);
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setAge('');
    setGender('Female');
    setCity('Kolkata');
    setResidentialAddress('');
    setBio('');
    setReferralCode('');
    setAgreedCharter(false);
    setAvatarUrl('');
    setDocumentType('Voter ID Card');
    setDocumentIdNumber('');
    setDocumentImageUrl('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setRegisteredUser(null);
  };

  // --- PASSWORD LOGIN SUBMIT ---
  const handlePasswordLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setLoginError('Please enter your User ID (e.g. USR-WB-1042) or registered Gmail address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    setIsLoggingIn(true);
    const result = loginWithPassword(cleanId, loginPassword);
    setIsLoggingIn(false);

    if (result.success && result.user) {
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginError('');
      onClose();
    } else {
      setLoginError(result.error || 'Authentication failed. Please check credentials or use OTP login.');
    }
  };

  // --- RETURNING USER GMAIL OTP LOGIN HANDLERS ---
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    const cleanId = loginIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setLoginError('Please enter your User ID or registered Gmail address.');
      return;
    }

    const found = usersAndCompanions.find(
      (u) =>
        u.userToken.toLowerCase() === cleanId ||
        (u.email && u.email.trim().toLowerCase() === cleanId)
    );

    if (!found) {
      setLoginError('No registered account found with this User ID or Gmail address.');
      return;
    }

    if (!found.email) {
      setLoginError('This account does not have a registered Gmail address. Please log in with password.');
      return;
    }

    const cleanPhone = (found.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const generatedOtp = generateSixDigitOtp();
    setLoginUserFound(found);
    setLoginExpectedOtp(generatedOtp);
    setLoginEnteredOtp('');
    setLoginOtpTimer(60);
    setIsSendingLoginOtp(true);

    try {
      const result = await sendDirectEmailJsOtp(found.email, generatedOtp, cleanPhone);
      if (result.success) {
        setLoginOtpSent(true);
        setLoginError('');
      } else {
        setLoginError(
          `Unable to send OTP: ${result.error || 'Please verify your Gmail address or try again in a moment.'}`
        );
      }
    } catch (err: any) {
      console.error('[Login OTP Send Exception]', err);
      setLoginError(`Email delivery failed: ${err?.message || 'Network error occurred. Please try again.'}`);
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (loginOtpTimer > 0 || !loginUserFound || !loginUserFound.email) return;
    const cleanPhone = (loginUserFound.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const generatedOtp = generateSixDigitOtp();
    setLoginExpectedOtp(generatedOtp);
    setLoginOtpTimer(60);
    setIsSendingLoginOtp(true);
    try {
      const res = await sendDirectEmailJsOtp(loginUserFound.email, generatedOtp, cleanPhone);
      if (!res.success) {
        setLoginError(`Failed to resend OTP: ${res.error || 'Please try again.'}`);
      } else {
        setLoginError('');
      }
    } catch (err: any) {
      console.error('[Login OTP Resend Exception]', err);
      setLoginError(`Resend failed: ${err?.message || 'Network error.'}`);
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const handleVerifyLoginOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (loginEnteredOtp.trim().length !== 6) {
      setLoginError('Please enter the complete 6-digit OTP code.');
      return;
    }

    const isValid = verifyOtp(loginEnteredOtp, loginExpectedOtp);
    if (!isValid) {
      setLoginError('Incorrect OTP passcode. Please check your Gmail or resend code.');
      return;
    }

    if (loginUserFound) {
      loginUserAccount(loginUserFound);
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginError('');
      setLoginOtpSent(false);
      onClose();
    }
  };

  // --- 3-STEP PASSWORD RESET HANDLERS ---
  const handleStartResetFlow = () => {
    setIsResetMode(true);
    setResetStep('identify');
    setResetIdentifier(loginIdentifier.trim());
    setResetError('');
    setResetSuccessToast('');
    setLoginError('');
  };

  const handleCancelResetFlow = () => {
    setIsResetMode(false);
    setResetStep('identify');
    setResetError('');
    setResetSuccessToast('');
    setResetEnteredOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
  };

  // Step A: Dispatch Reset OTP to Gmail
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const cleanId = resetIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setResetError('Please enter your User ID or registered Gmail address.');
      return;
    }

    const found = usersAndCompanions.find(
      (u) =>
        u.userToken.toLowerCase() === cleanId ||
        (u.email && u.email.trim().toLowerCase() === cleanId)
    );

    if (!found) {
      setResetError('No registered account found with this User ID or Gmail address.');
      return;
    }

    const cleanPhone = (found.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const generatedOtp = generateSixDigitOtp();
    setResetUserFound(found);
    setResetExpectedOtp(generatedOtp);
    setResetEnteredOtp('');
    setResetResendTimer(60);
    setIsResetSubmitting(true);

    try {
      const result = await sendDirectEmailJsOtp(found.email, generatedOtp, cleanPhone);
      if (result.success) {
        setResetStep('otp');
        setResetError('');
      } else {
        setResetError(
          `Unable to send OTP: ${result.error || 'Please check your Gmail address or try again.'}`
        );
      }
    } catch (err: any) {
      console.error('[Reset OTP Send Exception]', err);
      setResetError(`Email delivery failed: ${err?.message || 'Failed to dispatch email.'}`);
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Resend OTP for Password Reset
  const handleResendResetOtp = async () => {
    if (resetResendTimer > 0 || !resetUserFound || !resetUserFound.email) return;
    const cleanPhone = (resetUserFound.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const generatedOtp = generateSixDigitOtp();
    setResetExpectedOtp(generatedOtp);
    setResetResendTimer(60);
    setIsResetSubmitting(true);
    try {
      const result = await sendDirectEmailJsOtp(resetUserFound.email, generatedOtp, cleanPhone);
      if (!result.success) {
        setResetError(`Failed to resend OTP: ${result.error || 'Please try again.'}`);
      } else {
        setResetError('');
      }
    } catch (err: any) {
      console.error('[Reset OTP Resend Exception]', err);
      setResetError(`Resend failed: ${err?.message || 'Network error.'}`);
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Step B: Verify OTP Passcode
  const handleVerifyResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetEnteredOtp.trim().length !== 6) {
      setResetError('Please enter the complete 6-digit OTP passcode.');
      return;
    }
    const isValid = verifyOtp(resetEnteredOtp, resetExpectedOtp);
    if (!isValid) {
      setResetError('Incorrect OTP passcode. Please check your Gmail or resend code.');
      return;
    }
    setResetStep('new_password');
  };

  // Step C: Update Password & Log In
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetNewPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!resetUserFound) {
      setResetError('Account session expired. Please start over.');
      setResetStep('identify');
      return;
    }

    setIsResetSubmitting(true);
    const res = resetUserPassword(resetUserFound.userToken, resetNewPassword);
    setIsResetSubmitting(false);

    if (res.success && res.user) {
      setResetSuccessToast('Password updated successfully! Logging you in...');
      loginUserAccount(res.user);
      setTimeout(() => {
        onClose();
        handleCancelResetFlow();
      }, 1200);
    } else {
      setResetError(res.error || 'Failed to update password. Please try again.');
    }
  };

  // --- SIGN UP STEP NAVIGATION ---
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');

    if (!fullName.trim()) {
      setStep1Error('Please enter your full legal name.');
      return;
    }
    if (phoneNumber.length !== 10) {
      setStep1Error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStep1Error('Please enter a valid Gmail / Email address.');
      return;
    }
    const numAge = Number(age);
    if (!age || isNaN(numAge) || numAge < 21) {
      setStep1Error('Safety Rule: You must be at least 21 years old to register on Cirqlr.');
      return;
    }
    if (!residentialAddress.trim()) {
      setStep1Error('Full Residential Address is mandatory for identity verification.');
      return;
    }
    if (!agreedCharter) {
      setStep1Error('Please check the acknowledgment box confirming age (21+) and public commercial venues.');
      return;
    }

    // Check for existing accounts
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();
    const phoneExists = usersAndCompanions.some((u) => {
      const uDigits = u.phoneNumber.replace(/\D/g, '');
      return uDigits.endsWith(cleanDigits) || cleanDigits.endsWith(uDigits);
    });
    if (phoneExists) {
      setStep1Error('This Mobile Number is already registered. Please flip to Log In.');
      return;
    }
    const emailExists = usersAndCompanions.some((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      setStep1Error('This Gmail address is already registered. Please flip to Log In.');
      return;
    }

    setSignUpStep(2);
  };

  // Step 2: Photo upload handler with client-side canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.72);
      if (compressed) {
        setAvatarUrl(compressed);
      }
    } catch {
      // Fallback if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 3: ID document upload handler with client-side canvas compression
  const handleDocumentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 800, 0.75);
      if (compressed) {
        setDocumentImageUrl(compressed);
      }
    } catch {
      // Fallback if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setDocumentImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep3Continue = () => {
    setStep3Error('');
    if (!documentType) {
      setStep3Error('Please select a valid Document Type (Voter ID Card, Driving License, or PAN Card).');
      return;
    }
    if (!documentImageUrl.trim()) {
      setStep3Error('Please upload a clear photo or document scan of your ID to proceed. Or click "Skip for Now" to bypass.');
      return;
    }
    setSignUpStep(4);
  };

  const handleStep3Skip = () => {
    setStep3Error('');
    setDocumentImageUrl('');
    setSignUpStep(4);
  };

  // Step 4: Password setup and trigger OTP
  const handleStep4Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep4Error('');

    if (password.length < 6) {
      setStep4Error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setStep4Error('Passwords do not match. Please re-enter.');
      return;
    }

    // Trigger Gmail OTP via EmailJS
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();
    const generatedOtp = generateSixDigitOtp();
    setExpectedOtp(generatedOtp);
    setOtpCode('');
    setOtpError('');
    setResendTimer(60);
    setIsSendingOtp(true);

    try {
      const res = await sendDirectEmailJsOtp(cleanEmail, generatedOtp, cleanDigits);
      if (res.success) {
        setSignUpStep(5);
        setStep4Error('');
      } else {
        setStep4Error(
          `Unable to send OTP: ${res.error || 'Could not deliver code to your email. Please double-check your email address.'}`
        );
      }
    } catch (err: any) {
      console.error('[Sign Up OTP Send Exception]', err);
      setStep4Error(`Email delivery failed: ${err?.message || 'Network error occurred. Please try again.'}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendSignUpOtp = async () => {
    if (resendTimer > 0) return;
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();
    const generatedOtp = generateSixDigitOtp();
    setExpectedOtp(generatedOtp);
    setResendTimer(60);
    setIsSendingOtp(true);
    try {
      const res = await sendDirectEmailJsOtp(cleanEmail, generatedOtp, cleanDigits);
      if (!res.success) {
        setOtpError(`Failed to resend OTP: ${res.error || 'Please try again.'}`);
      } else {
        setOtpError('');
      }
    } catch (err: any) {
      console.error('[Sign Up OTP Resend Exception]', err);
      setOtpError(`Resend failed: ${err?.message || 'Network error.'}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 5: Final OTP verification & user registration
  const handleStep5SubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompletingRegistration) return;
    setOtpError('');

    if (otpCode.trim().length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP sent to your Gmail.');
      return;
    }

    const isValid = verifyOtp(otpCode, expectedOtp);
    if (!isValid) {
      setOtpError('Incorrect OTP passcode. Please check your Gmail or click Resend.');
      return;
    }

    setIsCompletingRegistration(true);

    try {
      // Register user with all collected data
      const regResult = registerUser({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        age: Number(age),
        gender,
        city,
        residentialAddress: residentialAddress.trim(),
        bio: bio.trim(),
        password,
        avatarUrl: avatarUrl || undefined,
        documentType: documentImageUrl.trim() ? documentType : undefined,
        documentImageUrl: documentImageUrl || undefined,
        referralCode: referralCode.trim() || undefined,
      });

      if (!regResult.success || !regResult.user) {
        setOtpError(regResult.error || 'Failed to complete registration. Please try again.');
        setIsCompletingRegistration(false);
        return;
      }

      const sheetPayload = {
        fullName: fullName.trim(),
        mobile: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        age: Number(age),
        gender,
        city,
      };

      // Dispatched strictly ONCE through the deduplicated service
      await saveUserToSheet(sheetPayload);

      // Show celebratory success screen with User ID and one-click copy button
      setRegisteredUser(regResult.user);
    } catch {
      setOtpError('An error occurred during registration. Please try again.');
    } finally {
      setIsCompletingRegistration(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 overflow-y-auto">
      {/* 3D Perspective Card Wrapper */}
      <div
        className="w-full max-w-lg my-auto py-4"
        style={{ perspective: 1400 }}
      >
        <motion.div
          animate={{ rotateY: authMode === 'login' ? 0 : 180 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ========================================================================= */}
          {/* FRONT FACE: RETURNING USER LOG IN                                         */}
          {/* ========================================================================= */}
          <div
            className={`w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl ring-1 ring-cyan-500/20 ${
              authMode === 'login' ? 'relative' : 'absolute top-0 left-0 pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Top Bar with Mode Switcher & Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => toggleFlip('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFlip('signup')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Password Login or 3-Step Password Reset Flow */}
            {!isResetMode ? (
              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Welcome Back
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Sign in to Cirqlr
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your system-generated User ID or registered Gmail address.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Login Method Toggle: Password vs Gmail OTP */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setLoginError('');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginMethod === 'password'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('otp');
                      setLoginError('');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginMethod === 'otp'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gmail OTP</span>
                  </button>
                </div>

                {loginMethod === 'password' ? (
                  <form onSubmit={handlePasswordLoginSubmit} className="space-y-4" autoComplete="off">
                    {/* Input 1: User ID or Gmail */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        User ID or Gmail Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="cirqlr_login_user_id"
                          autoComplete="off"
                          value={loginIdentifier}
                          onChange={(e) => {
                            setLoginIdentifier(e.target.value);
                            setLoginError('');
                          }}
                          placeholder="USR-WB-1042 or you@gmail.com"
                          className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Input 2: Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleStartResetFlow}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          name="cirqlr_login_password"
                          autoComplete="off"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            setLoginError('');
                          }}
                          placeholder="Enter your account password"
                          className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          title={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Log In to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Gmail OTP Login Form */
                  <div className="space-y-4">
                    {!loginOtpSent ? (
                      <form onSubmit={handleSendLoginOtp} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            User ID or Registered Gmail Address
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={loginIdentifier}
                              onChange={(e) => {
                                setLoginIdentifier(e.target.value);
                                setLoginError('');
                              }}
                              placeholder="USR-WB-1042 or you@gmail.com"
                              className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                              required
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            We will send a 6-digit OTP passcode to your registered Gmail address.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingLoginOtp}
                          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingLoginOtp ? (
                            <>
                              <RotateCw className="w-4 h-4 animate-spin" />
                              <span>Sending OTP...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send OTP</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* OTP Code Entry View */
                      <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-fadeIn">
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>OTP passcode sent to:</span>
                            <span className="font-mono text-cyan-300 font-bold">{maskEmail(loginUserFound?.email)}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Valid for 10 minutes. Check your inbox and spam folder.
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            Enter 6-Digit OTP Passcode
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={loginEnteredOtp}
                            onChange={(e) => {
                              setLoginEnteredOtp(e.target.value.replace(/\D/g, ''));
                              setLoginError('');
                            }}
                            placeholder="• • • • • •"
                            className="w-full py-3 text-center tracking-[0.5em] font-mono text-lg bg-slate-950/90 border border-slate-700 rounded-xl text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                            required
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {loginOtpTimer > 0 ? `Resend code in ${loginOtpTimer}s` : 'Did not receive code?'}
                          </span>
                          {loginOtpTimer === 0 && (
                            <button
                              type="button"
                              onClick={handleResendLoginOtp}
                              disabled={isSendingLoginOtp}
                              className="text-cyan-400 hover:underline font-bold cursor-pointer disabled:opacity-50"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginOtpSent(false);
                              setLoginEnteredOtp('');
                              setLoginError('');
                            }}
                            className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                          >
                            ← Back
                          </button>
                          <button
                            type="submit"
                            disabled={loginEnteredOtp.trim().length !== 6}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify OTP & Log In</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* 3-STEP PASSWORD RESET SUB-VIEW */
              <div className="mt-6 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Account Recovery
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      Reset Password
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelResetFlow}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Log In</span>
                  </button>
                </div>

                {/* Reset Wizard 3-Step Progress Indicator */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        resetStep === 'identify'
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 font-black'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {resetStep === 'identify' ? '1' : '✓'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">Account</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-2 ${resetStep !== 'identify' ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        resetStep === 'otp'
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 font-black'
                          : resetStep === 'new_password'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {resetStep === 'new_password' ? '✓' : '2'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">Gmail OTP</span>
                  </div>
                  <div className={`h-0.5 flex-1 mx-2 ${resetStep === 'new_password' ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        resetStep === 'new_password'
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 font-black'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      3
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">New Password</span>
                  </div>
                </div>

                {resetSuccessToast && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{resetSuccessToast}</span>
                  </div>
                )}

                {resetError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* STEP A: Enter User ID or Registered Gmail */}
                {resetStep === 'identify' && (
                  <form onSubmit={handleSendResetOtp} className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enter your User ID (e.g. USR-WB-1001) or registered Gmail address. We will dispatch a 6-digit OTP to verify ownership.
                    </p>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        User ID or Registered Gmail Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={resetIdentifier}
                          onChange={(e) => {
                            setResetIdentifier(e.target.value);
                            setResetError('');
                          }}
                          placeholder="USR-WB-1001 or you@gmail.com"
                          className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          autoFocus
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isResetSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isResetSubmitting ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP B: Enter OTP Sent to Gmail */}
                {resetStep === 'otp' && (
                  <form onSubmit={handleVerifyResetOtp} className="space-y-4 animate-fadeIn">
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Reset OTP dispatched to:</span>
                        <span className="font-mono text-cyan-300 font-bold">{maskEmail(resetUserFound?.email)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Valid for 10 minutes. Check inbox and spam folders.
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Enter 6-Digit OTP Passcode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={resetEnteredOtp}
                        onChange={(e) => {
                          setResetEnteredOtp(e.target.value.replace(/\D/g, ''));
                          setResetError('');
                        }}
                        placeholder="• • • • • •"
                        className="w-full py-3 text-center tracking-[0.5em] font-mono text-lg bg-slate-950/90 border border-slate-700 rounded-xl text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {resetResendTimer > 0 ? `Resend code in ${resetResendTimer}s` : 'Did not receive code?'}
                      </span>
                      {resetResendTimer === 0 && (
                        <button
                          type="button"
                          onClick={handleResendResetOtp}
                          className="text-cyan-400 hover:underline font-bold cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setResetStep('identify')}
                        className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify OTP</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP C: Enter New Password & Confirm */}
                {resetStep === 'new_password' && (
                  <form onSubmit={handleUpdatePassword} className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enter your new account password for <strong className="text-cyan-300 font-mono">{resetUserFound?.userToken}</strong>.
                    </p>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showResetNewPassword ? 'text' : 'password'}
                          value={resetNewPassword}
                          onChange={(e) => {
                            setResetNewPassword(e.target.value);
                            setResetError('');
                          }}
                          placeholder="At least 6 characters"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showResetConfirmPassword ? 'text' : 'password'}
                          value={resetConfirmPassword}
                          onChange={(e) => {
                            setResetConfirmPassword(e.target.value);
                            setResetError('');
                          }}
                          placeholder="Re-type new password"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isResetSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isResetSubmitting ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Update Password & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BACK FACE: 5-STEP SIGN UP WIZARD (ROTATED 180 DEG)                        */}
          {/* ========================================================================= */}
          <div
            className={`w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-2xl ring-1 ring-cyan-500/20 ${
              authMode === 'signup' ? 'relative' : 'absolute top-0 left-0 pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {/* Top Bar with Mode Switcher & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => toggleFlip('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFlip('signup')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Registration is completed, show celebratory User ID card */}
            {registeredUser ? (
              <div className="mt-6 text-center space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Registration Complete
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Welcome to Cirqlr, {registeredUser.fullName.split(' ')[0]}!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Your account is registered and your unique Member ID has been issued.
                  </p>
                </div>

                {/* Unique User ID Display with 1-Click Copy */}
                <div className="p-5 bg-slate-950/90 rounded-2xl border border-slate-700/80 space-y-3">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Your Official System-Generated Member ID
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400 tracking-wider">
                      {registeredUser.userToken}
                    </span>
                    <CopyUserIdButton
                      userId={registeredUser.userToken}
                      iconOnly={true}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Keep this ID handy. You can use it to log in or reference your account with Admin support.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetSignUp();
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Platform & Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* 5-STEP SIGN UP WIZARD */
              <div className="mt-5 space-y-4">
                {/* 5-Step Progress Bar Indicator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider">
                      Step {signUpStep} of 5
                    </span>
                    <span className="text-slate-400 font-medium">
                      {signUpStep === 1 && 'Basic Details & Full Address'}
                      {signUpStep === 2 && 'Profile Photo (Optional)'}
                      {signUpStep === 3 && 'Address Verification'}
                      {signUpStep === 4 && 'Set Account Password'}
                      {signUpStep === 5 && 'Gmail OTP Verification'}
                    </span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        className={`flex-1 h-full transition-all duration-300 border-r border-slate-900 last:border-r-0 ${
                          s <= signUpStep
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 1: Basic Details & Full Address                          */}
                {/* ------------------------------------------------------------- */}
                {signUpStep === 1 && (
                  <form onSubmit={handleStep1Continue} className="space-y-3.5 animate-fadeIn">
                    {step1Error && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{step1Error}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Full Legal Name */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Full Legal Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            setStep1Error('');
                          }}
                          placeholder="As on Government ID"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          required
                        />
                      </div>

                      {/* 10-Digit Mobile */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          10-Digit Mobile Number <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-xs font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phoneNumber}
                            onChange={handlePhoneInputChange}
                            placeholder="9876543210"
                            className="w-full pl-11 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Gmail Address */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Gmail Address <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setStep1Error('');
                          }}
                          placeholder="yourname@gmail.com"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          required
                        />
                      </div>

                      {/* Age (21+) */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Age (21+) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min={21}
                          max={99}
                          value={age}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                            setAge(val);
                            setStep1Error('');
                          }}
                          placeholder="Min 21"
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Gender */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Gender <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Non-Binary / Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      {/* City / Hub */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          City / Regional Hub <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value as UserCity)}
                          className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* NEW MANDATORY FIELD: Full Residential Address */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Full Residential Address <span className="text-rose-400">*</span></span>
                        <span className="text-[10px] text-slate-500 font-normal">Cross-referenced with ID</span>
                      </label>
                      <textarea
                        rows={2}
                        value={residentialAddress}
                        onChange={(e) => {
                          setResidentialAddress(e.target.value);
                          setStep1Error('');
                        }}
                        placeholder="Flat / House No., Street, Area, Landmark, PIN code"
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                        required
                      />
                    </div>

                    {/* Short Bio */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Short Bio (Optional)
                      </label>
                      <input
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Passionate about art galleries, live theater, and coffee discussions."
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Referral Code (Optional) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Referral Code (Optional)
                        </label>
                        <span className="text-[10px] text-cyan-400 font-semibold">5% Fee Waiver Reward</span>
                      </div>
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. REF-WB-1001"
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder-slate-500 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <p className="text-[10px] text-slate-500">
                        Have a friend's referral code? Enter it to award rewards and unlock community perks.
                      </p>
                    </div>

                    {/* Mandatory 21+ & Public Venue Checkbox with Full Legal Reader Links */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedCharter}
                          onChange={(e) => {
                            setAgreedCharter(e.target.checked);
                            setStep1Error('');
                          }}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 shrink-0 cursor-pointer"
                          required
                        />
                        <span className="leading-relaxed">
                          I confirm that I am at least 21 years old and I have read and agree to the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLegalDocToView('terms');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer transition-colors"
                          >
                            Terms &amp; Conditions (including Refund Policy)
                          </button>
                          ,{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLegalDocToView('privacy');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer transition-colors"
                          >
                            Privacy Policy
                          </button>
                          , and{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLegalDocToView('safety');
                            }}
                            className="text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer transition-colors"
                          >
                            100% Public Venue Safety Charter
                          </button>
                          .
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <span>Continue to Photo Upload</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: Upload Profile Photo (Optional)                      */}
                {/* ------------------------------------------------------------- */}
                {signUpStep === 2 && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-bold text-white">
                        Upload Profile Photo
                      </h3>
                      <p className="text-xs text-slate-400">
                        Add a clear photo to help companions recognize you at public meeting spots.
                      </p>
                    </div>

                    {/* Circular Preview */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="relative">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-cyan-500/40 shadow-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                            <Camera className="w-7 h-7 text-slate-500" />
                            <span className="text-[10px] mt-1">No Photo</span>
                          </div>
                        )}
                        <label
                          htmlFor="signup-avatar-input"
                          className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105"
                          title="Choose photo"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </label>
                        <input
                          id="signup-avatar-input"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>

                      <label
                        htmlFor="signup-avatar-input"
                        className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        {avatarUrl ? 'Change Photo' : 'Upload from Device'}
                      </label>
                    </div>

                    {/* Quick Avatar Presets */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 block text-center">
                        Or select a quick default avatar:
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(preset)}
                            className={`relative rounded-full overflow-hidden transition-all cursor-pointer ${
                              avatarUrl === preset ? 'ring-2 ring-cyan-400 scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="w-10 h-10 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Continue vs Skip */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignUpStep(1)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpStep(3)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Skip for Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpStep(3)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: Address Verification (Government ID Upload - Optional) */}
                {/* ------------------------------------------------------------- */}
                {signUpStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>Address Verification</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Upload an official ID for address & identity verification.
                      </p>
                    </div>

                    {step3Error && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{step3Error}</span>
                      </div>
                    )}

                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
                      {/* Document Type Selector: STRICTLY ONLY Voter ID Card, Driving License, or PAN Card */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Document Type Selector
                        </label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value as AllowedDocumentType)}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {ALLOWED_ID_TYPES.map((dt) => (
                            <option key={dt} value={dt}>
                              {dt}
                            </option>
                          ))}
                        </select>
                      </div>


                      {/* Document Image/File Upload Preview */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Upload Document Image / PDF Preview
                        </label>
                        {documentImageUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-32 bg-slate-900">
                            <img
                              src={documentImageUrl}
                              alt="ID Preview"
                              className="w-full h-32 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setDocumentImageUrl('')}
                              className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black text-rose-400 rounded-lg text-xs"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="signup-doc-image"
                            className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer"
                          >
                            <FileText className="w-6 h-6 text-slate-500 mb-1" />
                            <span className="text-xs text-slate-300 font-semibold">
                              Click to select ID photo or document
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              JPEG, PNG, or clear camera snapshot
                            </span>
                          </label>
                        )}
                        <input
                          id="signup-doc-image"
                          type="file"
                          accept="image/*"
                          onChange={handleDocumentImageUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          Address: <strong className="text-slate-200">{residentialAddress || 'Set in Step 1'}</strong>
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic text-center">
                      Clicking &ldquo;Continue &rarr;&rdquo; verifies your ID &amp; Document scan. You can click &ldquo;Skip for Now&rdquo; to test or submit verification later.
                    </p>

                    {/* Bottom Action Buttons: Continue vs Skip for Now */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignUpStep(2)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleStep3Skip}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Skip for Now
                      </button>
                      <button
                        type="button"
                        onClick={handleStep3Continue}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 4: Set Account Password                                  */}
                {/* ------------------------------------------------------------- */}
                {signUpStep === 4 && (
                  <form onSubmit={handleStep4Continue} className="space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-cyan-400" />
                        <span>Set Account Password</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Create a secure password to quickly sign into your Cirqlr account.
                      </p>
                    </div>

                    {step4Error && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{step4Error}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Create Password */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Create Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setStep4Error('');
                            }}
                            placeholder="Minimum 6 characters"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Confirm Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setStep4Error('');
                            }}
                            placeholder="Re-enter password"
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignUpStep(3)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 5: Final Gmail OTP Verification                          */}
                {/* ------------------------------------------------------------- */}
                {signUpStep === 5 && (
                  <form onSubmit={handleStep5SubmitOtp} className="space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span>Submit Your OTP</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Enter the 6-digit verification code dispatched to <strong className="text-cyan-300 font-mono">{maskEmail(email)}</strong>.
                      </p>
                    </div>

                    {otpError && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{otpError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          setOtpError('');
                        }}
                        placeholder="• • • • • •"
                        className="w-full py-3 text-center tracking-[0.5em] font-mono text-xl bg-slate-950/90 border border-slate-700 rounded-xl text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Did not receive code?'}
                      </span>
                      {resendTimer === 0 && (
                        <button
                          type="button"
                          onClick={handleResendSignUpOtp}
                          disabled={isSendingOtp}
                          className="text-cyan-400 hover:underline font-bold cursor-pointer disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignUpStep(4)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={isCompletingRegistration || otpCode.trim().length !== 6}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCompletingRegistration ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Verifying & Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify & Complete Registration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Full Legal Document Reader Modal (Overlay without losing sign-up inputs) */}
      <SignUpLegalReaderModal
        isOpen={!!legalDocToView}
        initialDoc={legalDocToView || 'terms'}
        onClose={() => setLegalDocToView(null)}
      />
    </div>
  );
};
