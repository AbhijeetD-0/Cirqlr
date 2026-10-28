import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

import { copyToClipboard } from '../../utils/clipboard';

interface CopyUserIdButtonProps {
  userId: string;
  className?: string;
  showText?: boolean;
  iconOnly?: boolean;
  showUserId?: boolean;
}

export const CopyUserIdButton: React.FC<CopyUserIdButtonProps> = ({
  userId,
  className = '',
  showText = false,
  iconOnly = false,
  showUserId,
}) => {
  const [copied, setCopied] = useState(false);

  // Only render user ID text if showUserId is explicitly true, or if showText is true and not iconOnly.
  // When used as an inline copy button next to an existing token label, default to icon-only.
  const shouldRenderIdText = showUserId !== undefined ? showUserId : (!iconOnly && showText);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await copyToClipboard(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        title="Click to copy User ID"
        className={`inline-flex items-center gap-1 font-mono transition-all cursor-pointer group/copy select-none ${className}`}
      >
        {shouldRenderIdText && <span>{userId}</span>}
        {copied ? (
          <span className="inline-flex items-center gap-0.5 text-emerald-500 font-sans text-[10px] font-bold animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {showText && <span>Copied!</span>}
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-slate-400 group-hover/copy:text-indigo-400 transition-colors">
            <Copy className="w-3.5 h-3.5" />
            {showText && <span className="font-sans text-[10px]">Copy ID</span>}
          </span>
        )}
      </button>

      {/* Quick floating "User ID Copied!" confirmation popover */}
      {copied && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-fadeIn">
          User ID Copied!
        </div>
      )}
    </div>
  );
};
