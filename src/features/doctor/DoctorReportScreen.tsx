import { useState } from 'react';
import { FileText, Copy, Check, Milk, Moon, Droplets, Scale, HelpCircle, Utensils, Pill, CalendarDays } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useT, SoftCard, PrimaryButton, SecondaryButton, IconCircle } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { formatDuration } from '../../utils/dateHelpers';
import jsPDF from 'jspdf';
import type { Appointment } from '../../types';

type Range = '24h' | '7d' | '30d' | 'since-last-apt' | 'custom';

const MAX_CUSTOM_DAYS = 90;

function lastPastAppointment(appointments: Appointment[]): Appointment | null {
  const today = new Date().toISOString().slice(0, 10);
  const past = appointments.filter((a) => a.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return past[0] ?? null;
}

function computeRange(
  range: Range,
  appointments: Appointment[],
  customFrom: string,
  customTo: string,
): { startDate: Date | null; endDate: Date; invalid?: string } {
  const now = new Date();
  if (range === '24h') { const s = new Date(now); s.setDate(s.getDate() - 1); return { startDate: s, endDate: now }; }
  if (range === '7d')  { const s = new Date(now); s.setDate(s.getDate() - 7); return { startDate: s, endDate: now }; }
  if (range === '30d') { const s = new Date(now); s.setDate(s.getDate() - 30); return { startDate: s, endDate: now }; }
  if (range === 'since-last-apt') {
    const last = lastPastAppointment(appointments);
    if (!last) return { startDate: null, endDate: now, invalid: 'no-past-apt' };
    return { startDate: new Date(last.date), endDate: now };
  }
  if (range === 'custom') {
    if (!customFrom || !customTo) return { startDate: null, endDate: now, invalid: 'incomplete-custom' };
    const s = new Date(customFrom);
    let e = new Date(customTo);
    if (e < s) return { startDate: null, endDate: now, invalid: 'invalid-range' };
    const cap = new Date(s); cap.setDate(cap.getDate() + MAX_CUSTOM_DAYS);
    if (e > cap) e = cap;
    return { startDate: s, endDate: e };
  }
  return { startDate: null, endDate: now };
}

export function DoctorReportScreen() {
  const { t, lang } = useT();
  const { babyProfile, logs, medicines, appointments, weights, doctorQuestions, foodReactions } = useStore();
  const [range, setRange] = useState<Range>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const ar = lang === 'ar';
  const { startDate, endDate, invalid } = computeRange(range, appointments, customFrom, customTo);

  const inRange = (dateStr: string) => {
    if (!startDate) return false;
    const d = new Date(dateStr);
    return d >= startDate && d <= endDate;
  };

  const filteredLogs       = logs.filter((l) => inRange(l.createdAt));
  const feedingLogs        = filteredLogs.filter((l) => l.type === 'feeding');
  const sleepLogs          = filteredLogs.filter((l) => l.type === 'sleep');
  const diaperLogs         = filteredLogs.filter((l) => l.type === 'diaper');
  const filteredWeights    = weights.filter((w) => inRange(w.date));
  const filteredQuestions  = doctorQuestions.filter((q) => inRange(q.createdAt));
  const unansweredQs       = filteredQuestions.filter((q) => !q.answered);
  const filteredReactions  = foodReactions.filter((r) => inRange(r.triedDate));
  const today              = new Date().toISOString().slice(0, 10);
  const upcomingApts       = appointments.filter((a) => a.date >= today);
  const recentWeights      = [...filteredWeights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const totalSleep         = sleepLogs.reduce((acc, l: any) => acc + (l.durationMinutes || 0), 0);

  const rangeLabel = () => {
    if (range === '24h') return ar ? 'آخر ٢٤ ساعة' : 'Last 24 Hours';
    if (range === '7d')  return ar ? 'آخر ٧ أيام' : 'Last 7 Days';
    if (range === '30d') return ar ? 'آخر ٣٠ يوماً' : 'Last 30 Days';
    if (range === 'since-last-apt') {
      const last = lastPastAppointment(appointments);
      return last ? (ar ? `منذ ${last.date}` : `Since ${last.date}`) : (ar ? 'منذ آخر موعد' : 'Since last appointment');
    }
    if (range === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`;
    return '';
  };

  const canExport = !invalid && startDate !== null;

  const buildText = () => {
    const lines = [
      'NunaCare – Doctor Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Period: ${rangeLabel()}`,
      '',
    ];
    if (babyProfile) lines.push(`Baby: ${babyProfile.name}`, `DOB: ${babyProfile.dateOfBirth}`, '');
    lines.push(`Feeding: ${feedingLogs.length} sessions`);
    lines.push(`Sleep: ${sleepLogs.length} sessions (${formatDuration(totalSleep, 'en')})`);
    lines.push(`Diapers: ${diaperLogs.length}`, '');
    if (recentWeights.length) lines.push(`Latest weight: ${recentWeights[0].value} kg (${recentWeights[0].date})`, '');
    if (medicines.length) { lines.push('Medicines:'); medicines.forEach((m) => lines.push(`  - ${m.name}: ${m.dose} ${m.frequency}`)); lines.push(''); }
    if (upcomingApts.length) { lines.push('Upcoming Appointments:'); upcomingApts.forEach((a) => lines.push(`  - ${a.title} on ${a.date}`)); lines.push(''); }
    if (unansweredQs.length) { lines.push('Questions for Doctor:'); unansweredQs.forEach((q) => lines.push(`  ? ${q.text}`)); lines.push(''); }
    if (filteredReactions.length) { lines.push('Food Reactions:'); filteredReactions.forEach((r) => lines.push(`  - ${r.foodName} (${r.liked})`)); }
    return lines.join('\n');
  };

  const handlePDF = async () => {
    if (!canExport) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const m = 20; let y = m; const lh = 7; const pageH = 277;
      const addL = (txt: string, sz = 11, bold = false, col = '#2D2118') => {
        if (y + lh > pageH) { doc.addPage(); y = m; }
        doc.setFontSize(sz); doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(col); doc.text(txt, m, y); y += lh;
      };

      doc.setFillColor(139, 74, 43); doc.rect(0, 0, 210, 28, 'F');
      doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor('#FFFFFF');
      doc.text('NunaCare – Doctor Report', m, 18); y = 38;
      addL(`Generated: ${new Date().toLocaleString()}`, 9, false, '#9B8A7A');
      addL(`Period: ${rangeLabel()}`, 9, false, '#9B8A7A'); y += 3;

      if (babyProfile) {
        addL('Baby Profile', 13, true, '#8B4A2B');
        addL(`Name: ${babyProfile.name}`);
        addL(`DOB: ${babyProfile.dateOfBirth}`);
        y += 3;
      }

      addL('Summary', 13, true, '#8B4A2B');
      addL(`Feeding: ${feedingLogs.length} sessions`);
      addL(`Sleep: ${sleepLogs.length} sessions (${formatDuration(totalSleep, 'en')})`);
      addL(`Diapers: ${diaperLogs.length}`);
      y += 3;

      if (recentWeights.length) {
        addL('Weight', 13, true, '#8B4A2B');
        recentWeights.forEach((w) => addL(`${w.date}: ${w.value} kg`));
        y += 3;
      }

      addL('Medicines', 13, true, '#8B4A2B');
      if (!medicines.length) addL('None', 11, false, '#9B8A7A');
      else medicines.forEach((med) => addL(`• ${med.name}: ${med.dose} – ${med.frequency}`));
      y += 3;

      addL('Upcoming Appointments', 13, true, '#8B4A2B');
      if (!upcomingApts.length) addL('None', 11, false, '#9B8A7A');
      else upcomingApts.forEach((a) => addL(`• ${a.title} – ${a.date} ${a.time}`));
      y += 3;

      addL('Questions for Doctor', 13, true, '#8B4A2B');
      if (!unansweredQs.length) addL('None', 11, false, '#9B8A7A');
      else unansweredQs.forEach((q) => addL(`? ${q.text}`));

      if (filteredReactions.length) {
        y += 3;
        addL('Food Reactions', 13, true, '#8B4A2B');
        filteredReactions.forEach((r) => addL(`• ${r.foodName}: ${r.liked}${r.rash ? ', rash' : ''}${r.vomiting ? ', vomiting' : ''}${r.constipation ? ', constipation' : ''}`));
      }

      doc.setFontSize(8); doc.setTextColor('#9B8A7A');
      doc.text('Generated locally – no data transmitted.', m, 285);
      doc.save(`nunacare-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (!canExport) return;
    await navigator.clipboard.writeText(buildText());
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const rangeChip = (r: Range, label: string) => (
    <button
      key={r}
      onClick={() => setRange(r)}
      className={`py-2 px-3 rounded-[14px] text-[13px] font-medium border transition-all min-h-[44px] ${
        range === r
          ? 'border-primary bg-feeding-tint text-primary'
          : 'border-border-hairline/[.25] bg-soft-surface text-text-secondary'
      }`}
    >
      {label}
    </button>
  );

  const previewItems: { icon: React.ReactNode; bg: string; label: string; count: number }[] = [
    { icon: <Milk       size={14} aria-hidden="true" />, bg: 'bg-feeding-tint', label: ar ? 'رضاعة' : 'Feedings',            count: feedingLogs.length },
    { icon: <Moon       size={14} aria-hidden="true" />, bg: 'bg-sleep-soft',   label: ar ? 'نوم' : 'Sleep sessions',         count: sleepLogs.length },
    { icon: <Droplets   size={14} aria-hidden="true" />, bg: 'bg-diaper-tint',  label: ar ? 'حفاض' : 'Diapers',              count: diaperLogs.length },
    { icon: <Scale      size={14} aria-hidden="true" />, bg: 'bg-teal-soft',    label: ar ? 'قياسات وزن' : 'Weight entries',  count: filteredWeights.length },
    { icon: <HelpCircle size={14} aria-hidden="true" />, bg: 'bg-teal-soft',    label: ar ? 'أسئلة غير مجابة' : 'Unanswered questions', count: unansweredQs.length },
    { icon: <Utensils   size={14} aria-hidden="true" />, bg: 'bg-feeding-tint', label: ar ? 'تفاعلات غذائية' : 'Food reactions', count: filteredReactions.length },
  ];

  const summaryItems: { icon: React.ReactNode; bg: string; label: string; value: number }[] = [
    { icon: <Milk     size={14} aria-hidden="true" />, bg: 'bg-feeding-tint', label: ar ? 'رضاعة' : 'Feeding',    value: feedingLogs.length },
    { icon: <Moon     size={14} aria-hidden="true" />, bg: 'bg-sleep-soft',   label: ar ? 'نوم' : 'Sleep',        value: sleepLogs.length },
    { icon: <Droplets size={14} aria-hidden="true" />, bg: 'bg-diaper-tint',  label: ar ? 'حفاض' : 'Diapers',    value: diaperLogs.length },
    { icon: <Pill     size={14} aria-hidden="true" />, bg: 'bg-warm-soft',    label: ar ? 'أدوية' : 'Medicines',  value: medicines.length },
  ];

  return (
    <AppShell title={t.doctorReport} showBack showNav={false}>
      {/* Range picker */}
      <div className="mb-5">
        <p className="text-[11px] font-medium text-text-faint lowercase tracking-[0.05em] mb-2">{t.reportRange}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {rangeChip('24h', t.last24h)}
          {rangeChip('7d', t.last7d)}
          {rangeChip('30d', t.last30d)}
          {rangeChip('since-last-apt', ar ? 'منذ آخر موعد' : 'Since Last Visit')}
          {rangeChip('custom', t.customRange)}
        </div>

        {range === 'custom' && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <p className="text-[11px] text-text-faint lowercase tracking-[0.04em] mb-1">{ar ? 'من' : 'from'}</p>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || new Date().toISOString().slice(0, 10)}
                className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-text-faint lowercase tracking-[0.04em] mb-1">{ar ? 'إلى' : 'to'}</p>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full bg-soft-surface border border-border-hairline/[.25] rounded-[14px] px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px]"
              />
            </div>
          </div>
        )}
        {range === 'custom' && customFrom && customTo && (() => {
          const from = new Date(customFrom);
          const cap = new Date(from); cap.setDate(cap.getDate() + MAX_CUSTOM_DAYS);
          if (new Date(customTo) > cap) {
            return <p className="text-[11px] text-text-hint mt-1">{ar ? `الحد الأقصى ٩٠ يوماً. سيتم اقتطاع التاريخ عند ${cap.toISOString().slice(0,10)}` : `Capped at 90 days – end date adjusted to ${cap.toISOString().slice(0,10)}`}</p>;
          }
          return null;
        })()}

        {range === 'since-last-apt' && invalid === 'no-past-apt' && (
          <p className="text-[12px] text-text-hint mt-2">{ar ? 'لا مواعيد سابقة. أضف موعداً أولاً.' : 'No past appointments found. Add one first.'}</p>
        )}
      </div>

      {/* Preview */}
      {canExport && (
        <SoftCard className="mb-5">
          <p className="text-[14px] font-bold text-text-primary mb-3">{ar ? 'ما سيتضمنه التقرير' : 'What will be included'}</p>
          <div className="flex flex-col gap-1.5">
            {previewItems.map(({ icon, bg, label, count }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <IconCircle icon={icon} bg={bg} size="sm" />
                  {label}
                </span>
                <span className={`text-[13px] font-semibold ${count > 0 ? 'text-primary' : 'text-text-hint'}`}>{count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border-hairline/[.15] pt-1.5 mt-1">
              <span className="flex items-center gap-2 text-[13px] text-text-secondary">
                <IconCircle icon={<Pill size={14} aria-hidden="true" />} bg="bg-warm-soft" size="sm" />
                {ar ? 'أدوية' : 'Medicines'}
              </span>
              <span className={`text-[13px] font-semibold ${medicines.length > 0 ? 'text-primary' : 'text-text-hint'}`}>{medicines.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-text-secondary">
                <IconCircle icon={<CalendarDays size={14} aria-hidden="true" />} bg="bg-teal-soft" size="sm" />
                {ar ? 'مواعيد قادمة' : 'Upcoming appointments'}
              </span>
              <span className={`text-[13px] font-semibold ${upcomingApts.length > 0 ? 'text-primary' : 'text-text-hint'}`}>{upcomingApts.length}</span>
            </div>
          </div>
        </SoftCard>
      )}

      {/* Summary cards */}
      {canExport && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {summaryItems.map(({ icon, bg, label, value }) => (
            <SoftCard key={label} className="text-center">
              <div className="flex justify-center mb-2">
                <IconCircle icon={icon} bg={bg} size="lg" />
              </div>
              <div className="text-[24px] font-extrabold text-primary">{value}</div>
              <div className="text-[12px] text-text-hint mt-0.5">{label}</div>
            </SoftCard>
          ))}
        </div>
      )}

      {canExport && unansweredQs.length > 0 && (
        <SoftCard className="mb-5">
          <p className="text-[14px] font-bold text-text-primary mb-2">{ar ? `أسئلة (${unansweredQs.length})` : `Questions (${unansweredQs.length})`}</p>
          {unansweredQs.map((q) => <p key={q.id} className="text-[13px] text-text-secondary">• {q.text}</p>)}
        </SoftCard>
      )}

      {canExport && upcomingApts.length > 0 && (
        <SoftCard className="mb-5">
          <p className="text-[14px] font-bold text-text-primary mb-2">{t.upcomingAppointments}</p>
          {upcomingApts.slice(0, 3).map((a) => (
            <p key={a.id} className="flex items-center gap-1.5 text-[13px] text-text-secondary">
              <CalendarDays size={12} aria-hidden="true" /> {a.title} – {a.date}
            </p>
          ))}
        </SoftCard>
      )}

      <div className="flex flex-col gap-3">
        <PrimaryButton onClick={handlePDF} disabled={generating || !canExport}>
          <span className="flex items-center justify-center gap-2">
            <FileText size={16} aria-hidden="true" />
            {generating ? (ar ? 'جاري الإنشاء...' : 'Generating...') : t.downloadPDF}
          </span>
        </PrimaryButton>
        <SecondaryButton onClick={handleCopy} disabled={!canExport}>
          <span className="flex items-center justify-center gap-2">
            {copied ? <Check size={16} className="text-primary" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? (ar ? 'تم النسخ!' : 'Copied!') : t.copyText}
          </span>
        </SecondaryButton>
      </div>

      <p className="text-[11px] text-text-hint text-center mt-4">
        {ar ? 'التقرير يُولَّد محلياً. لا يتم إرسال أي بيانات.' : 'Report generated locally. No data transmitted.'}
      </p>
    </AppShell>
  );
}
