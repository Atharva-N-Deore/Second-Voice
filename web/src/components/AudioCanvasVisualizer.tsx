import React, { useRef, useEffect } from 'react';

interface AudioCanvasVisualizerProps {
  isRecording: boolean;
  volumeLevel: number;
}

export const AudioCanvasVisualizer: React.FC<AudioCanvasVisualizerProps> = ({
  isRecording,
  volumeLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw flowing sine waves with gold glow
      const numWaves = 3;
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 3 : 1.5;
        
        const alpha = isRecording ? (0.8 - i * 0.2) : (0.25 - i * 0.08);
        ctx.strokeStyle = isRecording 
          ? `rgba(244, 63, 94, ${alpha})`
          : `rgba(212, 175, 55, ${alpha})`;

        const amplitude = isRecording
          ? (height / 2.5) * (volumeLevel * 1.5 + 0.25) * (1 - i * 0.25)
          : (height / 8) * (1 - i * 0.25);

        const frequency = 0.02 + i * 0.01;

        for (let x = 0; x < width; x += 2) {
          const y = centerY + Math.sin(x * frequency + phase + i * 1.2) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw floating audio particles when active
      if (isRecording && volumeLevel > 0.05) {
        for (let p = 0; p < 8; p++) {
          const px = (width / 8) * p + Math.sin(phase + p) * 20;
          const py = centerY + Math.cos(phase * 1.5 + p) * (height / 3) * volumeLevel;
          ctx.beginPath();
          ctx.arc(px, py, 2.5 * volumeLevel + 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffd700';
          ctx.fill();
        }
      }

      phase += isRecording ? 0.08 : 0.025;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isRecording, volumeLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={80}
      style={{
        width: '100%',
        maxWidth: '480px',
        height: '60px',
        display: 'block',
        margin: '0 auto',
      }}
    />
  );
};
