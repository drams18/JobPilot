'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Plus, Trash2, Download, RotateCcw, Save,
  Eye, Loader2, FileText,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { useResumes, type ParsedResumeJson } from '@/hooks/useResumes';
import { CVPreview } from '@/components/cv/CVPreview';

// ─── Shared input class ───────────────────────────────────────────────────────

const inputClass =
  'text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300 bg-white w-full';

// ─── Contact / Identity editor ────────────────────────────────────────────────

function IdentityEditor({
  data,
  onChange,
}: {
  data: ParsedResumeJson;
  onChange: (patch: Partial<ParsedResumeJson>) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identité</h3>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Prénom Nom"
          className={`${inputClass} col-span-2`}
        />
        <input
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Titre / Poste visé"
          className={`${inputClass} col-span-2`}
        />
        <input
          value={data.email ?? ''}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="Email"
          className={inputClass}
          type="email"
        />
        <input
          value={data.phone ?? ''}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="Téléphone"
          className={inputClass}
        />
        <input
          value={data.location ?? ''}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="Localisation (ex: Paris, France)"
          className={inputClass}
        />
        <input
          value={data.linkedin ?? ''}
          onChange={(e) => onChange({ linkedin: e.target.value })}
          placeholder="LinkedIn URL"
          className={inputClass}
        />
      </div>
    </section>
  );
}

// ─── Summary editor ───────────────────────────────────────────────────────────

function SummaryEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profil / Résumé</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
        placeholder="Votre résumé professionnel…"
      />
    </section>
  );
}

// ─── Skills editor ────────────────────────────────────────────────────────────

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed]);
    setInput('');
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compétences</h3>
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {skills.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full"
          >
            {s}
            <button
              onClick={() => onChange(skills.filter((x) => x !== s))}
              className="ml-0.5 text-indigo-400 hover:text-indigo-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Ajouter une compétence…"
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="px-3 py-2 text-xs font-medium rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </section>
  );
}

// ─── Experience editor ────────────────────────────────────────────────────────

type Experience = NonNullable<ParsedResumeJson['experiences']>[number];

function ExperienceEditor({
  experiences,
  onChange,
}: {
  experiences: Experience[];
  onChange: (v: Experience[]) => void;
}) {
  function update(i: number, patch: Partial<Experience>) {
    onChange(experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expériences</h3>
        <button
          onClick={() => onChange([...experiences, { role: '', company: '', startDate: '', endDate: '', bullets: [''] }])}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {experiences.map((exp, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <input value={exp.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Poste / Titre" className={inputClass} />
            <input value={exp.company} onChange={(e) => update(i, { company: e.target.value })} placeholder="Entreprise" className={inputClass} />
            <input value={exp.startDate} onChange={(e) => update(i, { startDate: e.target.value })} placeholder="Début (ex: 2022)" className={inputClass} />
            <input value={exp.endDate} onChange={(e) => update(i, { endDate: e.target.value })} placeholder="Fin (ex: présent)" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-gray-400">Points clés</p>
            {exp.bullets.map((b, j) => (
              <div key={j} className="flex gap-1.5 items-start">
                <textarea
                  value={b}
                  onChange={(e) => {
                    const bullets = exp.bullets.map((x, bi) => (bi === j ? e.target.value : x));
                    update(i, { bullets });
                  }}
                  rows={2}
                  placeholder="Description…"
                  className="flex-1 text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300 bg-white"
                />
                <button
                  onClick={() => update(i, { bullets: exp.bullets.filter((_, bi) => bi !== j) })}
                  className="text-gray-300 hover:text-red-400 mt-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => update(i, { bullets: [...exp.bullets, ''] })}
              className="self-start text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus size={11} /> Ajouter un point
            </button>
          </div>

          <button
            onClick={() => onChange(experiences.filter((_, idx) => idx !== i))}
            className="self-end text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      ))}
    </section>
  );
}

// ─── Education editor ─────────────────────────────────────────────────────────

type Education = NonNullable<ParsedResumeJson['education']>[number];

function EducationEditor({
  education,
  onChange,
}: {
  education: Education[];
  onChange: (v: Education[]) => void;
}) {
  function update(i: number, patch: Partial<Education>) {
    onChange(education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formation</h3>
        <button
          onClick={() => onChange([...education, { institution: '', degree: '', year: '' }])}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {education.map((edu, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <input value={edu.institution} onChange={(e) => update(i, { institution: e.target.value })} placeholder="École / Université" className={`${inputClass} col-span-2`} />
            <input value={edu.degree} onChange={(e) => update(i, { degree: e.target.value })} placeholder="Diplôme" className={inputClass} />
            <input value={edu.year} onChange={(e) => update(i, { year: e.target.value })} placeholder="Année (ex: 2020)" className={inputClass} />
          </div>
          <button
            onClick={() => onChange(education.filter((_, idx) => idx !== i))}
            className="self-end text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      ))}
    </section>
  );
}

// ─── Main editor page ─────────────────────────────────────────────────────────

export default function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: resumes } = useResumes();
  const resume = resumes?.find((r) => r.id === id);

  const [resumeData, setResumeData] = useState<ParsedResumeJson>({
    name: '', title: '', email: '', phone: '', location: '', linkedin: '',
    summary: '', skills: [], experiences: [], education: [],
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (resume && !hasInitialized.current) {
      hasInitialized.current = true;
      setResumeData({
        name: '', title: '', email: '', phone: '', location: '', linkedin: '',
        summary: '', skills: [], experiences: [], education: [],
        ...(resume.parsedJson ?? {}),
      });
    }
  }, [resume]);

  const saveMutation = useMutation({
    mutationFn: (data: ParsedResumeJson) =>
      apiClient.put(`/resumes/${id}`, { parsedJson: data }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] });
      setIsDirty(false);
      toast.success('Sauvegardé');
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  // Auto-save debounced
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => saveMutation.mutate(resumeData), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, isDirty]);

  function update(patch: Partial<ParsedResumeJson>) {
    setResumeData((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
    if (showOriginal) setShowOriginal(false);
  }

  function handleReset() {
    if (!resume) return;
    setResumeData({
      name: '', title: '', email: '', phone: '', location: '', linkedin: '',
      summary: '', skills: [], experiences: [], education: [],
      ...(resume.parsedJson ?? {}),
    });
    setIsDirty(false);
    toast.success('Réinitialisé');
  }

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch('/api/resume/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ parsedJson: resumeData }),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume?.fileName?.replace(/\.[^.]+$/, '') ?? 'cv'}-modifie.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to html2canvas
      if (!previewRef.current) return;
      try {
        const { exportToPDF } = await import('@/lib/cv-export');
        await exportToPDF(previewRef.current, `${resume?.fileName ?? 'cv'}.pdf`);
      } catch {
        toast.error("Erreur lors de l'export PDF");
      }
    } finally {
      setIsExporting(false);
    }
  }, [resumeData, resume]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/resumes"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 shrink-0"
          >
            <ChevronLeft size={14} />
            Mes CV
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-xs font-medium text-gray-700 truncate">
            {resume?.fileName ?? 'Chargement…'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <Save size={12} /> Non sauvegardé
            </span>
          )}
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showOriginal
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-500 hover:text-gray-700 border-gray-200'
            }`}
          >
            <Eye size={12} />
            {showOriginal ? 'Voir modifié' : 'PDF original'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            <RotateCcw size={12} />
            Réinitialiser
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {isExporting ? 'Génération…' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      {/* ─── Split panel ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">

        {/* Left — Edit form */}
        <div className="overflow-auto bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6">
          <IdentityEditor data={resumeData} onChange={update} />
          <SummaryEditor
            value={resumeData.summary ?? ''}
            onChange={(v) => update({ summary: v })}
          />
          <SkillsEditor
            skills={resumeData.skills ?? []}
            onChange={(v) => update({ skills: v })}
          />
          <ExperienceEditor
            experiences={resumeData.experiences ?? []}
            onChange={(v) => update({ experiences: v })}
          />
          <EducationEditor
            education={resumeData.education ?? []}
            onChange={(v) => update({ education: v })}
          />
        </div>

        {/* Right — Preview */}
        <div className="overflow-hidden bg-gray-50 rounded-2xl border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-gray-400" />
              <p className="text-xs font-medium text-gray-500">
                {showOriginal ? 'PDF original' : 'Aperçu en direct'}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {showOriginal ? resume?.fileName : 'A4 · 210 × 297 mm'}
            </span>
          </div>

          {showOriginal ? (
            <div className="flex-1 overflow-hidden">
              {resume?.fileUrl ? (
                <embed
                  src={resume.fileUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Fichier non disponible
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 flex justify-center">
              <div
                className="shadow-lg rounded overflow-hidden"
                style={{ width: '210mm', transformOrigin: 'top center' }}
              >
                <CVPreview ref={previewRef} data={resumeData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
