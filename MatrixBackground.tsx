import { useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface MatrixBackgroundProps {
  theme: AppTheme;
  isActive: boolean;
}

export default function MatrixBackground({ theme, isActive }: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isActive) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@%&*";
    const alphabet = katakana.split("");

    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const rainDrops: number[] = Array.from({ length: columns }).map(() => Math.random() * -100);

    const getColors = () => {
      switch (theme) {
        case 'synthwave':
          return {
            bg: 'rgba(18, 0, 36, 0.08)',
            colors: ['#ff007f', '#00ffff', '#8a2be2', '#b300ff']
          };
        case 'cyberpunk':
          return {
            bg: 'rgba(26, 21, 0, 0.08)',
            colors: ['#ffb700', '#ff0055', '#00ffaa', '#ffe600']
          };
        case 'glacier':
          return {
            bg: 'rgba(5, 20, 28, 0.08)',
            colors: ['#00f2fe', '#0099ff', '#a8ffb2', '#e0ffff']
          };
        case 'matrix':
        default:
          return {
            bg: 'rgba(5, 11, 26, 0.08)',
            colors: ['#ff00e6', '#00f2fe', '#2F6FED', '#00ffb7']
          };
      }
    };

    const draw = () => {
      const themeColors = getColors();
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet[Math.floor(Math.random() * alphabet.length)];
        ctx.fillStyle = themeColors.colors[Math.floor(Math.random() * themeColors.colors.length)];
        ctx.font = fontSize + 'px monospace';
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity: isActive ? 0.28 : 0 }}
    />
  );
}
