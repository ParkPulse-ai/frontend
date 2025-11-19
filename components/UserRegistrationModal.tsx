'use client';

import { useState } from 'react';
import { X, User, Mail, MapPin, Loader2 } from 'lucide-react';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; address: string; isGovEmployee: boolean; inviteCode?: string }) => Promise<void>;
  walletAddress: string;
}

export default function UserRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  walletAddress,
}: UserRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    isGovEmployee: false,
    inviteCode: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    address: '',
    inviteCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      address: '',
      inviteCode: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.isGovEmployee) {
      if (!formData.inviteCode.trim()) {
        newErrors.inviteCode = 'Invite code is required for government employees';
      } else if (formData.inviteCode !== '000000') {
        newErrors.inviteCode = 'Invalid invite code';
      }
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.address && !newErrors.inviteCode;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        email: formData.email,
        address: formData.address,
        isGovEmployee: formData.isGovEmployee,
        inviteCode: formData.isGovEmployee ? formData.inviteCode : undefined,
      });
      // Reset form on success
      setFormData({ name: '', email: '', address: '', isGovEmployee: false, inviteCode: '' });
      setRegistrationError('');
    } catch (error) {
      console.error('Registration failed:', error);
      setRegistrationError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (typeof value === 'string') {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Clear registration error
    setRegistrationError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 animate-slideUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-8 pb-6 border-b border-emerald-500/20">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <User className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-400 text-center text-sm">
            Wallet: <span className="text-emerald-400 font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <User size={20} />
              </div>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border ${
                  errors.name ? 'border-red-500/50' : 'border-slate-700'
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border ${
                  errors.email ? 'border-red-500/50' : 'border-slate-700'
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Address field */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-300 mb-2">
              Physical Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <MapPin size={20} />
              </div>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border ${
                  errors.address ? 'border-red-500/50' : 'border-slate-700'
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all`}
                disabled={isSubmitting}
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-400">{errors.address}</p>
            )}
          </div>

          {/* Government Employee Checkbox */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGovEmployee}
                onChange={(e) => handleChange('isGovEmployee', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-slate-700"
                disabled={isSubmitting}
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-200">
                  I am a Government Employee
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  If you have received an invite code, check this box to register as a government employee
                </p>
              </div>
            </label>
          </div>

          {/* Invite Code field - Only show if government employee is checked */}
          {formData.isGovEmployee && (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-semibold text-gray-300 mb-2">
                Invite Code <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="inviteCode"
                  type="password"
                  value={formData.inviteCode}
                  onChange={(e) => handleChange('inviteCode', e.target.value)}
                  placeholder="Enter your 6-digit invite code"
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${
                    errors.inviteCode ? 'border-red-500/50' : 'border-slate-700'
                  } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-center tracking-widest`}
                  disabled={isSubmitting}
                  maxLength={6}
                />
              </div>
              {errors.inviteCode && (
                <p className="mt-1 text-sm text-red-400">{errors.inviteCode}</p>
              )}
              <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                ⚠️ Without a valid invite code, you will be registered as a regular user
              </p>
            </div>
          )}

          {/* Registration Error Message */}
          {registrationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-400">{registrationError}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
