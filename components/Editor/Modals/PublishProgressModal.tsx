"use client";

import { useEffect, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';

interface PublishProgressModalProps {
  step: string;
  percent: number;
  startedAt: number | null;
}

const STALL_THRESHOLD_MS = 8000;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PublishProgressModal({ step, percent, startedAt }: PublishProgressModalProps) {
  // Ticks on its own so elapsed/ETA keep moving even during steps (network
  // fetch, upload) that don't push a new percent for a few seconds - without
  // this the modal would look frozen even though work is actually happening.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Track when percent last actually moved. The AI marker compile step can
  // sit at the same percent for a long stretch (e.g. TensorFlow.js "cold
  // start" on first run, or a slow device) - an ETA derived from average
  // pace-so-far balloons upward the whole time it's stuck, which reads as
  // broken rather than "still working". Detect the stall and say so instead.
  const lastPercentRef = useRef(percent);
  const lastChangeAtRef = useRef(Date.now());
  if (percent !== lastPercentRef.current) {
    lastPercentRef.current = percent;
    lastChangeAtRef.current = Date.now();
  }
  const stalledMs = now - lastChangeAtRef.current;
  const isStalled = percent < 100 && stalledMs > STALL_THRESHOLD_MS;

  const elapsedMs = startedAt ? now - startedAt : 0;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  // Estimate remaining time from the average pace so far. Too noisy to trust
  // in the first couple of percent, and misleading once stalled.
  const etaMs = !isStalled && clampedPercent > 3 ? (elapsedMs / clampedPercent) * (100 - clampedPercent) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Rocket className="text-pln-blue" size={20} />
          <h2 className="text-lg font-bold text-white">Mem-publish Proyek...</h2>
        </div>

        <div className="p-6 flex flex-col items-center">
          <p className="text-sm text-gray-300 text-center mb-4 min-h-[2.5em]">{step}</p>

          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700 mb-2">
            <div
              className="h-full bg-pln-blue transition-[width] duration-300 ease-out"
              style={{ width: `${clampedPercent}%` }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-xs text-gray-400 mb-6">
            <span>{Math.round(clampedPercent)}%</span>
            <span>Berjalan {formatDuration(elapsedMs)}</span>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {isStalled
              ? <span className="text-amber-400">Proses berjalan lebih lama dari perkiraan, masih memproses - mohon tunggu...</span>
              : etaMs !== null
                ? <>Estimasi selesai dalam <span className="text-gray-300 font-medium">{formatDuration(etaMs)}</span></>
                : 'Menghitung estimasi waktu...'}
          </p>
          <p className="text-[10px] text-gray-600 text-center mt-3">
            Jangan tutup atau refresh halaman ini sampai proses selesai.
          </p>
        </div>
      </div>
    </div>
  );
}
