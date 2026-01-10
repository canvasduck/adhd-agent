'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

type Step = 'welcome' | 'photo-prompt' | 'ready';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const router = useRouter();

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem('onboarding-complete', 'true');
    router.push('/');
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-complete', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {step === 'welcome' && (
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hey! I&apos;m here to help you get things done without the overwhelm.
          </h1>
          <p className="text-gray-600 mt-4">
            Let&apos;s start with something easy.
          </p>
          <Button
            onClick={() => setStep('photo-prompt')}
            className="mt-8 w-full"
            size="lg"
          >
            Let&apos;s go
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {step === 'photo-prompt' && (
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Take a photo of one spot that&apos;s been bugging you.
          </h1>
          <p className="text-gray-600 mt-4">
            A messy desk, cluttered counter, overflowing laundry... anything.
          </p>
          <p className="text-gray-600 mt-2">
            I&apos;ll help you break it down into tiny, doable steps.
          </p>
          <Button
            onClick={() => {
              handleComplete();
              // Trigger camera open after navigation
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-camera'));
              }, 100);
            }}
            className="mt-8 w-full"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Open camera
          </Button>
          <button
            onClick={handleSkip}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
