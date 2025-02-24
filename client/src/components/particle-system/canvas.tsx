import { useEffect, useRef } from "react";
import { Particle } from "./particle";
import { createProgram, createShader, vertexShaderSource, fragmentShaderSource } from "./webgl-utils";
import PerformanceMonitor from "./performance-monitor";
import type { VisualizationMode, ColorTheme } from "./controls";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  colorTheme: ColorTheme;
  mode: VisualizationMode;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const programRef = useRef<WebGLProgram | null>(null);
  const waveSourcesRef = useRef<WaveSource[]>([]);
  const frameRef = useRef(0);
  const drawCallsRef = useRef(0);
  const draggedParticleRef = useRef<Particle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (config.mode === "waves") {
        waveSourcesRef.current.push({
          x: mouseX,
          y: mouseY,
          time: 0
        });
      } else {
        // Find the closest particle to drag
        const allParticles = particlesRef.current.flat();
        const closestParticle = allParticles.find(p => p.checkDrag(mouseX, mouseY));
        if (closestParticle) {
          draggedParticleRef.current = closestParticle;
          closestParticle.isDragged = true;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons > 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (config.mode === "waves") {
          handleMouseDown(e);
        } else if (draggedParticleRef.current) {
          draggedParticleRef.current.updateLineMode(
            mouseX,
            mouseY,
            config.repulsionForce,
            particlesRef.current.flat().filter(p => p !== draggedParticleRef.current),
            canvas.width,
            canvas.height
          );
        }
      }
    };

    const handleMouseUp = () => {
      if (draggedParticleRef.current) {
        draggedParticleRef.current.isDragged = false;
        draggedParticleRef.current = null;
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    const animate = () => {
      const particles = particlesRef.current.flat();
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      if (config.mode === "waves") {
        waveSourcesRef.current = waveSourcesRef.current.filter(source => {
          source.time += 1;
          return source.time < 300;
        });

        particles.forEach(particle => {
          waveSourcesRef.current.forEach(source => {
            particle.updateWaveMode(
              source.x,
              source.y,
              config.repulsionForce,
              source.time,
              canvas.width,
              canvas.height
            );
          });
        });
      } else {
        // Line mode: update particles with neighbor interactions
        particles.forEach(particle => {
          if (!particle.isDragged) {
            particle.updateLineMode(
              0,
              0,
              config.repulsionForce,
              particles.filter(p => p !== particle),
              canvas.width,
              canvas.height
            );
          }
        });
      }

      // Collect data for rendering
      particles.forEach(particle => {
        const data = particle.getBufferData();
        positions.push(data[0], data[1]);
        colors.push(data[2], data[3], data[4]);
        sizes.push(data[5]);
      });

      // Set background color based on theme
      if (config.colorTheme === "black") {
        gl.clearColor(1, 1, 1, 1); // White background
      } else {
        gl.clearColor(0, 0, 0, 1); // Black background
      }
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      // Draw particles
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

      // Draw particles
      gl.drawArrays(gl.POINTS, 0, particles.length);

      // Draw lines in line mode
      if (config.mode === "lines") {
        const lineVertices: number[] = [];
        const lineColors: number[] = [];

        particlesRef.current.forEach(thread => {
          // Connect particles within the same thread
          for (let i = 0; i < thread.length - 1; i++) {
            lineVertices.push(
              thread[i].x, thread[i].y,
              thread[i + 1].x, thread[i + 1].y
            );
            lineColors.push(
              ...thread[i].color, 0.2,
              ...thread[i + 1].color, 0.2
            );
          }
        });

        // Update buffers for lines
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

        // Draw lines
        gl.drawArrays(gl.LINES, 0, lineVertices.length / 2);
      }

      drawCallsRef.current++;
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      cancelAnimationFrame(frameRef.current);

      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(sizeBuffer);
    };
  }, [config.repulsionForce, config.colorTheme, config.mode]);

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
      <PerformanceMonitor
        particleCount={particlesRef.current.flat().length}
        drawCalls={drawCallsRef.current}
      />
    </>
  );
}