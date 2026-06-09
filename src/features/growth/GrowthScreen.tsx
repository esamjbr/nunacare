import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingUp, Scale } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, SafetyNotice, PrimaryButton, SecondaryButton, FormInput, FormTextArea, EmptyState, ConfirmModal, IconCircle } from '../../components/ui';
import { BottomSheet } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import { format, parseISO } from 'date-fns';

function AddWeightSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { addWeight } = useStore();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!value || isNaN(parseFloat(value))) { setError(lang === 'ar' ? 'أدخل وزناً صحيحاً' : 'Enter a valid weight'); return; }
    addWeight({ value: parseFloat(value), unit: 'kg', date, notes: notes || undefined });
    setValue(''); setNotes(''); setError('');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.addWeight2}>
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center gap-2 py-2">
          <IconCircle icon={<Scale size={28} aria-hidden="true" />} bg="bg-teal-soft" size="xl" />
        </div>
        <div className="flex gap-3">
          <FormInput label={`${lang === 'ar' ? 'الوزن' : 'weight'} (kg)`} value={value} onChange={(v) => { setValue(v); setError(''); }} type="number" placeholder="6.5" className="flex-1" />
          <FormInput label={lang === 'ar' ? 'التاريخ' : 'date'} value={date} onChange={setDate} type="date" className="flex-1" />
        </div>
        <FormTextArea label={t.notes} value={notes} onChange={setNotes} rows={2} />
        {error && <p className="text-[13px] text-error-text">{error}</p>}
        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} fullWidth={false} className="flex-1">{t.cancel}</SecondaryButton>
          <PrimaryButton onClick={handleSave} fullWidth={false} className="flex-1">{t.save}</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface rounded-[14px] px-3 py-2 shadow-soft border border-border-hairline/[.18] text-[12px]">
        <p className="text-text-hint">{label}</p>
        <p className="font-bold text-primary">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export function GrowthScreen() {
  const { t, lang } = useT();
  const { weights, deleteWeight } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  const chartData = sorted.map((w) => ({
    date: (() => { try { return format(parseISO(w.date), 'MMM d'); } catch { return w.date; } })(),
    weight: w.value,
  }));

  return (
    <AppShell title={t.growthTitle} showNav headerRight={
      <button
        onClick={() => setShowAdd(true)}
        aria-label={lang === 'ar' ? 'إضافة وزن' : 'Add weight'}
        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus size={18} className="text-surface" aria-hidden="true" />
      </button>
    }>
      <SafetyNotice text={t.weightNote} className="mb-4" />

      {/* Current weight hero */}
      {latest && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <SoftCard className="mb-5 bg-surface-sunk">
            <div className="flex items-center gap-4">
              <IconCircle icon={<Scale size={24} aria-hidden="true" />} bg="bg-teal-soft" size="xl" />
              <div>
                <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em]">{t.currentWeight}</p>
                <p className="text-[32px] font-extrabold text-primary leading-tight">{latest.value} <span className="text-[16px] font-semibold">kg</span></p>
                <p className="text-[12px] text-text-hint">{t.lastUpdated}: {latest.date}</p>
              </div>
            </div>
          </SoftCard>
        </motion.div>
      )}

      {/* Chart */}
      {sorted.length >= 2 && (
        <SoftCard className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" aria-hidden="true" />
            <p className="text-[14px] font-semibold text-text-primary">{t.weightTrend}</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B4A2B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8B4A2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(217 175 130 / 0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9B8A7A' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9B8A7A' }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="weight" stroke="#8B4A2B" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: '#8B4A2B', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SoftCard>
      )}

      {/* History list */}
      <div>
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-3">{t.weightHistory}</p>
        {sorted.length === 0 ? (
          <EmptyState icon={<Scale size={28} />} tint="bg-teal-soft" title={t.noWeight} subtitle={t.noWeightSub} />
        ) : (
          <div className="flex flex-col gap-2">
            {[...sorted].reverse().map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <SoftCard padding="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconCircle icon={<Scale size={14} aria-hidden="true" />} bg="bg-teal-soft" size="sm" />
                      <div>
                        <p className="text-[13px] font-semibold text-text-primary">{w.value} kg</p>
                        <p className="text-[11px] text-text-hint">{w.date}</p>
                      </div>
                    </div>
                    {w.notes && <p className="text-[12px] text-text-hint flex-1 mx-3 truncate">{w.notes}</p>}
                    <button
                      onClick={() => setConfirmId(w.id)}
                      aria-label={lang === 'ar' ? 'حذف السجل' : 'Delete entry'}
                      className="w-8 h-8 bg-soft-surface rounded-full flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <Trash2 size={12} className="text-text-hint" aria-hidden="true" />
                    </button>
                  </div>
                </SoftCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddWeightSheet isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConfirmModal
        isOpen={!!confirmId} title={lang === 'ar' ? 'حذف السجل' : 'Delete Entry'}
        message={lang === 'ar' ? 'هل تريد حذف هذا السجل؟' : 'Delete this weight entry?'}
        confirmLabel={t.delete} cancelLabel={t.cancel} danger
        onConfirm={() => { if (confirmId) deleteWeight(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </AppShell>
  );
}
