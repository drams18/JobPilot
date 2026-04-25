'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type State = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface UploadedResume {
  id: string;
  fileName: string;
}

async function uploadResume(file: File): Promise<UploadedResume> {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch('/api/resumes/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    throw new Error('Non autorisé');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? `Erreur ${res.status}`);
  }

  return res.json();
}

async function saveThumbnail(resumeId: string, thumbnail: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  await fetch(`/api/resumes/${resumeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ thumbnail }),
  });
}

export function ResumeUploader() {
  const qc = useQueryClient();
  const [state, setState] = useState<State>('idle');

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const resume = await uploadResume(file);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        setState('processing');
        try {
          const { generatePdfThumbnail } = await import('@/lib/pdf-thumbnail');
          const thumbnail = await generatePdfThumbnail(file);
          await saveThumbnail(resume.id, thumbnail);
        } catch {
          // thumbnail generation is non-critical
        }
      }

      return resume;
    },
    onMutate: () => setState('uploading'),
    onSuccess: () => {
      setState('done');
      qc.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('CV uploadé et analysé !');
      setTimeout(() => setState('idle'), 3000);
    },
    onError: (error: Error) => {
      setState('error');
      toast.error(error.message || "Erreur lors de l'upload");
    },
  });

  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) uploadMutation.mutate(files[0]);
    },
    [uploadMutation],
  );

  const onDropRejected = useCallback((rejected: FileRejection[]) => {
    const err = rejected[0]?.errors[0];
    if (err?.code === 'file-too-large') {
      toast.error('Fichier trop volumineux (max 10MB)');
    } else if (err?.code === 'file-invalid-type') {
      toast.error('Format non supporté — PDF ou DOCX uniquement');
    } else {
      toast.error(err?.message ?? 'Fichier rejeté');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: state === 'uploading' || state === 'processing',
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
        (state === 'uploading' || state === 'processing') && 'pointer-events-none opacity-70',
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {state === 'idle' && (
          <>
            <UploadCloud className="text-gray-400" size={40} />
            <p className="text-sm font-medium text-gray-700">
              Déposez votre CV ici, ou{' '}
              <span className="text-indigo-600">parcourez</span>
            </p>
            <p className="text-xs text-gray-400">PDF ou DOCX · max 10MB</p>
          </>
        )}
        {state === 'uploading' && (
          <>
            <FileText className="text-indigo-400 animate-pulse" size={40} />
            <p className="text-sm text-gray-600">Upload et analyse en cours…</p>
          </>
        )}
        {state === 'processing' && (
          <>
            <FileText className="text-indigo-400 animate-pulse" size={40} />
            <p className="text-sm text-gray-600">Génération de la miniature…</p>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle className="text-emerald-500" size={40} />
            <p className="text-sm font-medium text-emerald-700">CV uploadé avec succès !</p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertCircle className="text-red-500" size={40} />
            <p className="text-sm text-red-600">Upload échoué. Réessayez.</p>
          </>
        )}
      </div>
    </div>
  );
}
