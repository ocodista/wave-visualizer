import { useEffect, useRef } from "react";
import { Particle } from "./particle";
import { createProgram, createShader, vertexShaderSource, fragmentShaderSource } from "./webgl-utils";
import type { VisualizationMode } from "./controls";

interface Config {
  threadCount: number;
  particlesPerThread: number;
  repulsionForce: number;
  mode: VisualizationMode;
}

interface ParticleCanvasProps {
  config: Config;
}

interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
}

export default function ParticleCanvas({ config }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[][]>([]);
  const programRef = useRef<WebGLProgram | null>(null);
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, isDown: false });
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    // Get WebGL context with error handling
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Create and compile shaders with error checking
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    // Create and link program with error checking
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    programRef.current = program;

    // Get locations with error checking
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getAttribLocation(program, "a_color");
    const sizeLocation = gl.getAttribLocation(program, "a_size");

    if (positionLocation === -1 || colorLocation === -1 || sizeLocation === -1) {
      console.error('Failed to get attribute locations', {
        positionLocation,
        colorLocation,
        sizeLocation
      });
      return;
    }

    // Create buffers with error checking
    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();

    if (!positionBuffer || !colorBuffer || !sizeBuffer) {
      console.error('Failed to create buffers');
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isDown: mouseRef.current.isDown
      };
    };

    const handleMouseDown = () => {
      mouseRef.current.isDown = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    const animate = () => {
      const particles = particlesRef.current.flat();
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      // Update and collect particle data
      particles.forEach(particle => {
        particle.update(
          mouseRef.current.x,
          mouseRef.current.y,
          mouseRef.current.isDown ? config.repulsionForce * 1.5 : config.repulsionForce,
          canvas.width,
          canvas.height
        );

        const data = particle.getBufferData();
        positions.push(data[0], data[1]);       // x, y
        colors.push(data[2], data[3], data[4]); // r, g, b
        sizes.push(data[5]);                    // size
      });

      // Clear and set viewport
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Use shader program
      gl.useProgram(program);

      // Set uniforms
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      if (!resolutionLocation) {
        console.error('Failed to get uniform location: u_resolution');
        return;
      }
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      // Update position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Update color buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      // Update size buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Draw points
      gl.drawArrays(gl.POINTS, 0, particles.length);

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      cancelAnimationFrame(frameRef.current);

      // Cleanup WebGL resources
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(colorBuffer);
      gl.deleteBuffer(sizeBuffer);
    };
  }, [config.repulsionForce]);

  // Initialize particles when thread count or particles per thread changes
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
        thread.push(new Particle(x, y));
      }

      threads.push(thread);
    }

    particlesRef.current = threads;
  }, [config.threadCount, config.particlesPerThread]);

  return (
    <canvas ref={canvasRef} className="w-full h-full select-none" />
  );
}