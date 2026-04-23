'use client';

import { use, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Link2, FileText, Sparkles, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { useResumes, useResumeVersions, type ParsedResumeJson, type ResumeVersion } from '@/hooks/useResumes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── CV Sections renderer ─────────────────────────────────────────────────────

function CVSections({ data }: { data: ParsedResumeJson | null }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
        <FileText size={32} className="opacity-30" />
        <p className="text-sm">Aucune donnée structurée disponible</p>
        <p className="text-xs">Re-uploadez votre CV pour analyser son contenu</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {data.summary && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Résumé</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Compétences</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((skill) => (
              <span key={skill} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.experiences && data.experiences.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Expériences</h3>
          <div className="flex flex-col gap-4">
            {data.experiences.map((exp, i) => (
              <div key={i} className="border-l-2 border-indigo-100 pl-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{exp.role}</p>
                    {exp.company && <p className="text-xs text-gray-500 mt-0.5">{exp.company}</p>}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                    </span>
                  )}
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-indigo-300 shrink-0 mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Formation</h3>
          <div className="flex flex-col gap-2">
            {data.education.map((edu, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{edu.institution}</p>
                  {edu.degree && <p className="text-xs text-gray-500 mt-0.5">{edu.degree}</p>}
                </div>
                {edu.year && <span className="text-xs text-gray-400 shrink-0">{edu.year}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: resumes } = useResumes();
  const resume = resumes?.find((r) => r.id === id);

  const { data: versions } = useResumeVersions(id);

  const [tab, setTab] = useState<'original' | 'optimized'>('original');
  const [jobMode, setJobMode] = useState<'url' | 'text'>('text');
  const [jobInput, setJobInput] = useState('');
  const [parsedJob, setParsedJob] = useState<{ title: string; company: string; rawText: string } | null>(null);
  const [optimizedData, setOptimizedData] = useState<ParsedResumeJson | null>(null);

  const parseJobMutation = useMutation({
    mutationFn: (payload: { url?: string; text?: string }) =>
      apiClient.post('/job/parse', payload).then((r) => r.data),
    onSuccess: (data) => {
      setParsedJob(data);
      toast.success('Offre analysée');
    },
    onError: () => toast.error("Impossible d'analyser cette offre"),
  });

  const optimizeMutation = useMutation({
    mutationFn: (jobText: string) =>
      apiClient.post('/resume/optimize', { resumeId: id, jobText }).then((r) => r.data),
    onSuccess: (data) => {
      setOptimizedData(data.optimizedJson);
      setTab('optimized');
      qc.invalidateQueries({ queryKey: ['resume-versions', id] });
      toast.success('CV optimisé !');
    },
    onError: () => toast.error("Erreur lors de l'optimisation"),
  });

  function handleParseJob() {
    if (!jobInput.trim()) return;
    if (jobMode === 'url') {
      parseJobMutation.mutate({ url: jobInput.trim() });
    } else {
      parseJobMutation.mutate({ text: jobInput.trim() });
    }
  }

  function handleOptimize() {
    const jobText = parsedJob?.rawText ?? jobInput;
    if (!jobText.trim()) return;
    optimizeMutation.mutate(jobText);
  }

  function loadVersion(version: ResumeVersion) {
    setOptimizedData(version.optimizedJson);
    setTab('optimized');
  }

  const displayData = tab === 'optimized' ? optimizedData : (resume?.parsedJson ?? null);

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/resumes"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={14} />
          Mes CV
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-xs font-medium text-gray-700 truncate max-w-xs">
          {resume?.fileName ?? 'Chargement…'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Left — CV viewer */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setTab('original')}
              className={`px-5 py-3 text-xs font-semibold transition-colors ${
                tab === 'original'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setTab('optimized')}
              disabled={!optimizedData}
              className={`px-5 py-3 text-xs font-semibold transition-colors disabled:opacity-40 ${
                tab === 'optimized'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Optimisé
              {optimizedData && (
                <span className="ml-1.5 inline-flex items-center">
                  <CheckCircle size={11} className="text-emerald-500" />
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <CVSections data={displayData} />
          </div>
        </div>

        {/* Right — Job input + history */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Job input card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Offre d&apos;emploi</p>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
                <button
                  onClick={() => setJobMode('text')}
                  className={`px-3 py-1.5 transition-colors ${jobMode === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Texte
                </button>
                <button
                  onClick={() => setJobMode('url')}
                  className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${jobMode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Link2 size={11} />
                  URL
                </button>
              </div>
            </div>

            {jobMode === 'text' ? (
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="Collez le texte de l'offre d'emploi ici…"
                className="w-full h-32 text-xs text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
              />
            ) : (
              <input
                type="url"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://www.exemple.com/offre/123"
                className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
              />
            )}

            <button
              onClick={handleParseJob}
              disabled={!jobInput.trim() || parseJobMutation.isPending}
              className="w-full py-2 text-xs font-medium rounded-xl border border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {parseJobMutation.isPending ? 'Analyse…' : 'Analyser l\'offre'}
            </button>

            {parsedJob && (
              <div className="bg-indigo-50 rounded-xl p-3 flex flex-col gap-1">
                <p className="text-xs font-semibold text-indigo-800 truncate">{parsedJob.title}</p>
                {parsedJob.company && (
                  <p className="text-xs text-indigo-600 truncate">{parsedJob.company}</p>
                )}
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={!parsedJob || optimizeMutation.isPending}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={13} />
              {optimizeMutation.isPending ? 'Optimisation…' : 'Optimiser ce CV'}
            </button>
          </div>

          {/* Version history */}
          {versions && versions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">Historique</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto">
                  {versions.length}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => loadVersion(v)}
                    className="text-left p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-xs text-gray-500 group-hover:text-gray-700">
                      {format(new Date(v.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}
                    </p>
                    {v.jobText && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {v.jobText.slice(0, 60)}…
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
