'use client';

import { DotLottiePlayer } from '@dotlottie/react-player';

export default function HeroLottie() {
  return (
    <div className="mb-6 flex justify-center items-center h-40 w-40">
      <DotLottiePlayer
        src="/icons/cute-ai-star.lottie"
        autoplay
        loop
        style={{ width: '160px', height: '160px' }}
      />
    </div>
  );
}
