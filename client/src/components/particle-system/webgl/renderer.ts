import { vertexShaderSource, fragmentShaderSource, computeVertexShaderSource, computeFragmentShaderSource } from "./shaders";

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private computeProgram: WebGLProgram;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private particleCount: number;
  private magneticPositions: Float32Array;
  private magneticCount: number = 0;
  private positionBuffers: [WebGLBuffer, WebGLBuffer];
  private colorBuffer: WebGLBuffer;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private currentBuffer: number = 0;
  private transformFeedback: WebGLTransformFeedback;

  constructor(canvas: HTMLCanvasElement, particleCount: number) {
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    this.particleCount = particleCount;

    // Create buffers
    this.positionBuffers = [
      this.gl.createBuffer()!,
      this.gl.createBuffer()!
    ];
    this.colorBuffer = this.gl.createBuffer()!;
    this.transformFeedback = this.gl.createTransformFeedback()!;

    // Initialize particle data
    this.particlePositions = new Float32Array(particleCount * 2);
    this.particleColors = new Float32Array(particleCount * 3);
    this.magneticPositions = new Float32Array(10 * 2); // Support up to 10 magnetic particles

    // Create initial particle positions in a grid
    for (let i = 0; i < particleCount; i++) {
      const x = (i % Math.sqrt(particleCount)) / Math.sqrt(particleCount);
      const y = Math.floor(i / Math.sqrt(particleCount)) / Math.sqrt(particleCount);
      this.particlePositions[i * 2] = x * 2 - 1; // Convert to clip space (-1 to 1)
      this.particlePositions[i * 2 + 1] = y * 2 - 1;

      // Random colors
      const hue = Math.random() * 360;
      const [r, g, b] = this.hslToRgb(hue / 360, 0.8, 0.7);
      this.particleColors[i * 3] = r;
      this.particleColors[i * 3 + 1] = g;
      this.particleColors[i * 3 + 2] = b;
    }

    // Create shader programs
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.computeProgram = this.createProgram(
      computeVertexShaderSource,
      computeFragmentShaderSource,
      ['v_position']  // Transform feedback varying
    );

    // Enable alpha blending
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.setupBuffers();

    console.log(`WebGL2 Renderer initialized with ${particleCount} particles`);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      console.error(`Shader compilation failed:`, info);
      throw new Error(`Shader compile error: ${info}`);
    }

    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string, transformFeedbackVaryings?: string[]): WebGLProgram {
    const program = this.gl.createProgram()!;
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    // Setup transform feedback if needed
    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(program, transformFeedbackVaryings, this.gl.SEPARATE_ATTRIBS);
    }

    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      console.error(`Program linking failed:`, info);
      throw new Error(`Program link error: ${info}`);
    }

    return program;
  }

  private setupBuffers(): void {
    // Initialize both position buffers
    this.positionBuffers.forEach((buffer) => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particlePositions, this.gl.DYNAMIC_DRAW);
    });

    // Color buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleColors, this.gl.STATIC_DRAW);
  }

  public addMagneticParticle(x: number, y: number): void {
    if (this.magneticCount >= 10) return;

    // Convert screen coordinates to clip space
    const clipX = (x / this.gl.canvas.width) * 2 - 1;
    const clipY = (y / this.gl.canvas.height) * -2 + 1; // Flip Y coordinate

    this.magneticPositions[this.magneticCount * 2] = clipX;
    this.magneticPositions[this.magneticCount * 2 + 1] = clipY;
    this.magneticCount++;

    console.log(`Added magnetic particle at (${clipX}, ${clipY}), total: ${this.magneticCount}`);
  }

  public render(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.frameCount++;

    // Log performance every 100 frames
    if (this.frameCount % 100 === 0) {
      console.log(`FPS: ${1000 / deltaTime}, Active magnetic particles: ${this.magneticCount}`);
    }

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use compute program to update particle positions
    this.gl.useProgram(this.computeProgram);

    // Set uniforms for compute shader
    const resolutionLocation = this.gl.getUniformLocation(this.computeProgram, "u_resolution");
    this.gl.uniform2f(resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);

    const magneticPosLocation = this.gl.getUniformLocation(this.computeProgram, "u_magnetic_positions");
    this.gl.uniform2fv(magneticPosLocation, this.magneticPositions);

    const magneticCountLocation = this.gl.getUniformLocation(this.computeProgram, "u_magnetic_count");
    this.gl.uniform1f(magneticCountLocation, this.magneticCount);

    const magneticRadiusLocation = this.gl.getUniformLocation(this.computeProgram, "u_magnetic_radius");
    this.gl.uniform1f(magneticRadiusLocation, 10.0); // 10px radius

    const timeLocation = this.gl.getUniformLocation(this.computeProgram, "u_time");
    this.gl.uniform1f(timeLocation, currentTime * 0.001); // Convert to seconds

    // Perform transform feedback to update positions
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[this.currentBuffer]);
    const posLocation = this.gl.getAttribLocation(this.computeProgram, 'a_position');
    this.gl.enableVertexAttribArray(posLocation);
    this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set up transform feedback
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.positionBuffers[1 - this.currentBuffer]);
    this.gl.beginTransformFeedback(this.gl.POINTS);

    // Draw points (this updates the positions)
    this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);

    // End transform feedback
    this.gl.endTransformFeedback();
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    // Swap buffers
    this.currentBuffer = 1 - this.currentBuffer;

    // Switch to render program and draw particles
    this.gl.useProgram(this.program);

    // Update attribute bindings for rendering
    const renderPosLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[this.currentBuffer]);
    this.gl.enableVertexAttribArray(renderPosLocation);
    this.gl.vertexAttribPointer(renderPosLocation, 2, this.gl.FLOAT, false, 0, 0);

    const renderColorLocation = this.gl.getAttribLocation(this.program, 'a_color');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(renderColorLocation);
    this.gl.vertexAttribPointer(renderColorLocation, 3, this.gl.FLOAT, false, 0, 0);

    // Draw the particles
    this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
  }
}