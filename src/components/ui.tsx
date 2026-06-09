import React from 'react';
import { useStore } from '../store/useStore';
import { translations } from '../utils/translations';

// ─── Hook: useT (translation hook) ───────────────────────────────────────────
export function useT() {
  const lang = useStore((s) => s.settings.language);
  const t = translations[lang];
  return { t, lang, isRtl: lang === 'ar' };
}

// ─── IconCircle — tinted circle with a centred line-icon ─────────────────────
interface IconCircleProps {
  icon: React.ReactNode;
  bg?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function IconCircle({ icon, bg = 'bg-teal-soft', size = 'md', className = '' }: IconCircleProps) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  return (
    <div
      className={`${sizeMap[size]} ${bg} rounded-full flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
}

// ─── SoftCard ────────────────────────────────────────────────────────────────
interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: string;
}

export function SoftCard({ children, className = '', onClick, padding = 'p-[14px]' }: SoftCardProps) {
  return (
    <div
      className={`bg-surface rounded-[18px] shadow-soft border border-border-hairline/[.18] ${padding} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function PrimaryButton({ children, onClick, type = 'button', disabled, className = '', fullWidth = true }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        bg-primary text-surface font-semibold
        py-3.5 px-6 rounded-[18px]
        min-h-[44px]
        shadow-soft active:scale-[0.97] transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        text-[15px]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── SecondaryButton ──────────────────────────────────────────────────────────
export function SecondaryButton({ children, onClick, type = 'button', disabled, className = '', fullWidth = true }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        bg-surface text-text-primary font-semibold
        py-3.5 px-6 rounded-[18px]
        min-h-[44px]
        border border-border-hairline/[.3]
        active:scale-[0.97] transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        text-[15px]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  label?: string;
  variant?: 'primary' | 'soft' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconButton({ icon, onClick, label, variant = 'soft', size = 'md', className = '' }: IconButtonProps) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const variantClasses = {
    primary: 'bg-primary text-surface',
    soft: 'bg-soft-surface text-text-secondary',
    ghost: 'bg-transparent text-text-secondary',
  };
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center
        min-h-[44px] min-w-[44px]
        ${variantClasses[variant]}
        active:scale-[0.95] transition-transform
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
        ${className}
      `}
    >
      {icon}
    </button>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────────
interface FormInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

export function FormInput({ label, value, onChange, type = 'text', placeholder, required, className = '', min, max }: FormInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">
        {label} {required && <span className="text-error-text">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="
          w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px]
          px-4 py-3 text-text-primary placeholder-text-faint
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
          transition-all text-[14px]
          min-h-[44px]
        "
      />
    </div>
  );
}

// ─── FormTextArea ─────────────────────────────────────────────────────────────
interface FormTextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function FormTextArea({ label, value, onChange, placeholder, rows = 3, className = '' }: FormTextAreaProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px]
          px-4 py-3 text-text-primary placeholder-text-faint
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
          transition-all text-[14px] resize-none
        "
      />
    </div>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────
interface SegOption { value: string; label: string }
interface SegmentedControlProps {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className = '' }: SegmentedControlProps) {
  return (
    <div className={`flex bg-soft-surface rounded-[14px] p-1 gap-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 py-2 px-3 rounded-[10px] text-sm font-medium transition-all duration-200
            min-h-[36px]
            ${value === opt.value
              ? 'bg-primary text-surface shadow-soft'
              : 'text-text-secondary'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tint?: string;
}

export function EmptyState({ icon, title, subtitle, action, tint = 'bg-teal-soft' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
      <div className={`w-16 h-16 ${tint} rounded-full flex items-center justify-center mb-2 text-primary animate-pulse-soft`} aria-hidden="true">
        {icon}
      </div>
      <p className="font-semibold text-text-secondary text-[15px]">{title}</p>
      {subtitle && <p className="text-[13px] text-text-hint leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── SafetyNotice ─────────────────────────────────────────────────────────────
interface SafetyNoticeProps {
  text: string;
  className?: string;
}

export function SafetyNotice({ text, className = '' }: SafetyNoticeProps) {
  return (
    <div className={`bg-surface-sunk border border-border-hairline/[.2] rounded-[14px] p-3 ${className}`}>
      <p className="text-[12px] text-text-secondary leading-relaxed">{text}</p>
    </div>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function SummaryCard({ icon, label, value, sub, color = 'bg-teal-soft', onClick }: SummaryCardProps) {
  return (
    <div
      className={`${color} rounded-[18px] p-[14px] flex gap-3 items-start border border-border-hairline/[.15] ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center shrink-0" aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-muted font-medium lowercase tracking-[0.03em]">{label}</p>
        <p className="text-[14px] font-semibold text-text-primary truncate">{value}</p>
        {sub && <p className="text-[11px] text-text-hint">{sub}</p>}
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-mobile bg-surface rounded-[24px] p-6 shadow-elevated animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[17px] font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-[13px] text-text-secondary mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 px-6 rounded-[18px] font-semibold text-[15px] min-h-[44px] active:scale-[0.97] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${danger ? 'bg-error-soft text-error-text focus-visible:outline-error-text' : 'bg-primary text-surface focus-visible:outline-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      role="switch"
      aria-checked={enabled}
      className="flex items-center gap-3 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
      <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-border/60'}`}>
        <div className={`absolute top-0.5 start-0.5 w-5 h-5 bg-surface rounded-full shadow-soft transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

// ─── Pill Chip ────────────────────────────────────────────────────────────────
interface PillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}

export function Pill({ label, active, onClick, color }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-[14px] text-[13px] font-medium transition-all duration-150 shrink-0 min-h-[36px]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1
        ${active
          ? color || 'bg-primary text-surface shadow-soft'
          : 'bg-surface text-text-secondary border border-border-hairline/[.25]'
        }
      `}
    >
      {label}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-[16px] font-[500] text-text-primary">{title}</h2>
      {action}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: 'primary' | 'soft' | 'error' | 'cream';
}

export function Badge({ label, color = 'soft' }: BadgeProps) {
  const colors = {
    primary: 'bg-primary text-surface',
    soft: 'bg-teal-soft text-primary',
    error: 'bg-error-soft text-error-text',
    cream: 'bg-surface text-text-secondary',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}
