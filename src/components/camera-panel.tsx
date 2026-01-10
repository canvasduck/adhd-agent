'use client';

import { cn } from '@/lib/utils';
import { X, Camera, Upload, Loader2, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ImageAnalysisResult, ExtractedTask } from '@/types';

interface CameraPanelProps {
  open: boolean;
  onClose: () => void;
  onTasksCreated: (projectName: string, tasks: ExtractedTask[]) => void;
}

type Step = 'capture' | 'processing' | 'clarify' | 'review';

export function CameraPanel({ open, onClose, onTasksCreated }: CameraPanelProps) {
  const [step, setStep] = useState<Step>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [editableTasks, setEditableTasks] = useState<Array<{ title: string; included: boolean }>>([]);
  const [projectName, setProjectName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setCapturedImage(base64);
      await processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, type: string, context?: string) => {
    setStep('processing');
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: type,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result: ImageAnalysisResult = await response.json();
      setAnalysisResult(result);

      if (result.clarifyingQuestion) {
        setStep('clarify');
      } else {
        setProjectName(result.projectName);
        setEditableTasks(result.tasks.map((t) => ({ title: t.title, included: true })));
        setStep('review');
      }
    } catch (err) {
      console.error('Failed to process image:', err);
      setError('Failed to analyze image. Please try again.');
      setStep('capture');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClarifyAnswer = async (answer: string) => {
    if (!capturedImage || !analysisResult?.clarifyingQuestion) return;

    const context = `Question: ${analysisResult.clarifyingQuestion.question} Answer: ${answer}`;
    await processImage(capturedImage, mimeType, context);
  };

  const handleToggleTask = (index: number) => {
    setEditableTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, included: !t.included } : t))
    );
  };

  const handleUpdateTask = (index: number, title: string) => {
    setEditableTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, title } : t))
    );
  };

  const handleDeleteTask = (index: number) => {
    setEditableTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    setEditableTasks((prev) => [...prev, { title: '', included: true }]);
  };

  const handleSave = () => {
    const tasksToCreate = editableTasks
      .filter((t) => t.included && t.title.trim())
      .map((t) => ({ title: t.title.trim() }));

    if (tasksToCreate.length === 0) return;

    onTasksCreated(projectName, tasksToCreate);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setEditableTasks([]);
    setProjectName('');
    setError(null);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {step !== 'capture' && (
            <button
              onClick={handleReset}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
          )}
          <h2 className="font-semibold text-gray-900 flex-1 text-center">
            {step === 'capture' && 'Capture Space'}
            {step === 'processing' && 'Analyzing...'}
            {step === 'clarify' && 'Quick Question'}
            {step === 'review' && 'Review Tasks'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Capture Step */}
          {step === 'capture' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-medium">
                  Point at a messy spot
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  I&apos;ll help you break it down into tiny steps
                </p>
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose from Gallery
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-6 py-8">
              {capturedImage && (
                <img
                  src={`data:${mimeType};base64,${capturedImage}`}
                  alt="Captured"
                  className="w-48 h-48 object-cover rounded-2xl"
                />
              )}
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-600">Looking at your space...</p>
              </div>
            </div>
          )}

          {/* Clarify Step */}
          {step === 'clarify' && analysisResult?.clarifyingQuestion && (
            <div className="flex flex-col items-center gap-6 py-8">
              {capturedImage && (
                <img
                  src={`data:${mimeType};base64,${capturedImage}`}
                  alt="Captured"
                  className="w-32 h-32 object-cover rounded-xl"
                />
              )}
              <div className="bg-indigo-50 rounded-2xl p-4 w-full max-w-sm">
                <p className="text-gray-700 font-medium">
                  {analysisResult.clarifyingQuestion.question}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {analysisResult.clarifyingQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleClarifyAnswer(option)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-4">
              {capturedImage && (
                <img
                  src={`data:${mimeType};base64,${capturedImage}`}
                  alt="Captured"
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Project name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                {editableTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTask(index)}
                      className={cn(
                        'h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                        task.included
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300'
                      )}
                    >
                      {task.included && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <Input
                      value={task.title}
                      onChange={(e) => handleUpdateTask(index, e.target.value)}
                      className="flex-1 h-9"
                      placeholder="Task description"
                    />
                    <button
                      onClick={() => handleDeleteTask(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddTask}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                + Add another task
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="p-4 border-t border-gray-100 pb-safe">
            <Button
              onClick={handleSave}
              disabled={editableTasks.filter((t) => t.included && t.title.trim()).length === 0}
              className="w-full"
            >
              Save to my todos
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
