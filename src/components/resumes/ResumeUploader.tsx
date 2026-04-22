'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type State = 'idle' | 'uploading' | 'done' | 'error';

export function ResumeUploader() {
  const qc = useQueryClient();
  const [state, setState] = useState<State>('idle');

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/resumes/upload', formData);
    },
    onMutate: () => setState('uploading'),
    onSuccess: () => {
      setState('done');
      qc.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('CV uploadé et analysé !');
      setTimeout(() => setState('idle'), 3000);
    },
    onError: () => {
      setState('error');
      toast.error("Erreur lors de l'upload");
    },
  });

  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) uploadMutation.mutate(files[0]);
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: state === 'uploading',
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
        state === 'uploading' && 'pointer-events-none opacity-70',
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
