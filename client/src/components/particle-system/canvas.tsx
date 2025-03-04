import { useEffect, useRef, useState } from "react";
import { Particle } from "./particle";
import { createProgram, createShader, vertexShaderSource, fragmentShaderSource } from "./webgl-utils";
import PerformanceMonitor from "./performance-monitor";
import type { ColorTheme } from "./controls";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  colorTheme: ColorTheme;
}

interface ParticleCanvasProps {
  config: Config;
}

interface WaveSource {
  x: number;
  y: number;
  time: number;
}

export default function ParticleCanvas({ config }: ParticleCanvasProps) {
  const [statsVisible, setStatsVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const programRef = useRef<WebGLProgram | null>(null);
  const waveSourcesRef = useRef<WaveSource[]>([]);
  const frameRef = useRef(0);
  const drawCallsRef = useRef(0);
  const timeRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        setStatsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Store particles globally for repulsion effects
    (globalThis as any).particleSystem = {
      particles: particlesRef.current.flat()
    };

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    programRef.current = program;

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const sizeLocation = gl.getAttribLocation(program, "a_size");

    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleClick = (e: MouseEvent) => {
      const currentTime = Date.now();
      // Limit click rate to prevent too many wave sources
      if (currentTime - lastClickTimeRef.current < 50) return;
      lastClickTimeRef.current = currentTime;

      const rect = canvas.getBoundingClientRect();
      // Limit maximum number of wave sources
      if (waveSourcesRef.current.length >= 10) {
        waveSourcesRef.current.shift(); // Remove oldest wave source
      }
      waveSourcesRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        time: 0
      });
    };

    canvas.addEventListener("mousedown", handleClick);
    canvas.addEventListener("mousemove", (e) => {
      if (e.buttons > 0) handleClick(e);
    });

    const animate = () => {
      timeRef.current += 1;
      const particles = particlesRef.current.flat();
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      waveSourcesRef.current = waveSourcesRef.current.filter(source => {
        source.time += 0.8;
        return source.time < 400; // Increased from 200 to 400 to allow full wave completion
      });

      const chunkSize = 100;
      for (let i = 0; i < particles.length; i += chunkSize) {
        const chunk = particles.slice(i, i + chunkSize);
        chunk.forEach(particle => {
          // Process all wave sources for every particle
          waveSourcesRef.current.forEach(source => {
            particle.update(
              source.x,
              source.y,
              config.repulsionForce,
              source.time,
              canvas.width,
              canvas.height
            );
          });

          const data = particle.getBufferData();
          positions.push(data[0], data[1]);
          colors.push(data[2], data[3], data[4]);
          sizes.push(data[5]);
        });
      }

      if (config.colorTheme === "black") {
        gl.clearColor(1, 1, 1, 1);
      } else {
        gl.clearColor(0, 0, 0, 1);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.drawArrays(gl.POINTS, 0, particles.length);

      drawCallsRef.current++;
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup
      (globalThis as any).particleSystem = null;
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleClick);
      canvas.removeEventListener("mousemove", (e) => {
        if (e.buttons > 0) handleClick(e);
      });
      cancelAnimationFrame(frameRef.current);

      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(sizeBuffer);
    };
  }, [config.repulsionForce, config.colorTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const threads: Particle[][] = [];
    const spacing = canvas.width / (config.threadCount + 1);

    for (let i = 0; i < config.threadCount; i++) {
      const thread: Particle[] = [];
      const x = spacing * (i + 1);

      for (let j = 0; j < config.particlesPerThread; j++) {
        const y = (canvas.height / (config.particlesPerThread - 1)) * j;
        thread.push(new Particle(x, y, config.colorTheme));
      }

      threads.push(thread);
    }

    particlesRef.current = threads;
  }, [config.threadCount, config.particlesPerThread, config.colorTheme]);

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full select-none" />
      {statsVisible && (
        <PerformanceMonitor
          particleCount={particlesRef.current.flat().length}
          drawCalls={drawCallsRef.current}
        />
      )}
    </>
  );
}