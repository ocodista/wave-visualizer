import { vertexShaderSource, fragmentShaderSource, computeVertexShaderSource, computeFragmentShaderSource } from "./shaders";

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private computeProgram: WebGLProgram;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private particleCount: number;
  private positionBuffers: [WebGLBuffer, WebGLBuffer];
  private colorBuffer: WebGLBuffer;
  private transformFeedback: WebGLTransformFeedback;
  private startTime: number;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private currentBuffer: number = 0;

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
    this.startTime = performance.now();

    // Create shader programs
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.computeProgram = this.createProgram(
      computeVertexShaderSource,
      computeFragmentShaderSource,
      ['v_position']
    );

    // Initialize buffers
    this.positionBuffers = [
      this.gl.createBuffer()!,
      this.gl.createBuffer()!
    ];
    this.colorBuffer = this.gl.createBuffer()!;
    this.transformFeedback = this.gl.createTransformFeedback()!;

    // Initialize particle data
    this.particlePositions = new Float32Array(particleCount * 2);
    this.particleColors = new Float32Array(particleCount * 3);

    // Create initial particle positions in a grid
    const gridSize = Math.ceil(Math.sqrt(particleCount));
    for (let i = 0; i < particleCount; i++) {
      const x = (i % gridSize) / gridSize * 2 - 1;
      const y = Math.floor(i / gridSize) / gridSize * 2 - 1;
      this.particlePositions[i * 2] = x;
      this.particlePositions[i * 2 + 1] = y;

      // Random colors with a cohesive palette
      const hue = (i / particleCount) * 360;
      const [r, g, b] = this.hslToRgb(hue / 360, 0.8, 0.7);
      this.particleColors[i * 3] = r;
      this.particleColors[i * 3 + 1] = g;
      this.particleColors[i * 3 + 2] = b;
    }

    this.setupBuffers();

    // Enable alpha blending (original line remains, but blendFunc is updated below)
    this.gl.enable(this.gl.BLEND);
    
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(`Shader compile error: ${this.gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string, transformFeedbackVaryings?: string[]): WebGLProgram {
    const program = this.gl.createProgram()!;
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    if (transformFeedbackVaryings) {
      this.gl.transformFeedbackVaryings(program, transformFeedbackVaryings, this.gl.SEPARATE_ATTRIBS);
    }

    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${this.gl.getProgramInfoLog(program)}`);
    }

    return program;
  }

  private setupBuffers(): void {
    // Initialize position buffers
    this.positionBuffers.forEach(buffer => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particlePositions, this.gl.DYNAMIC_COPY);
    });

    // Initialize color buffer with more vibrant colors
    for (let i = 0; i < this.particleCount; i++) {
      const hue = (i / this.particleCount) * 360;
      const [r, g, b] = this.hslToRgb(hue / 360, 1.0, 0.7); // Increased saturation
      this.particleColors[i * 3] = r;
      this.particleColors[i * 3 + 1] = g;
      this.particleColors[i * 3 + 2] = b;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particleColors, this.gl.STATIC_DRAW);

    // Enable additive blending for more vibrant particles
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
  }

  public setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  public resize(width: number, height: number): void {
    this.gl.canvas.width = width;
    this.gl.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  public render(repulsionForce: number = 50): void {
    const currentTime = (performance.now() - this.startTime) / 1000;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Compute pass
    this.gl.useProgram(this.computeProgram);

    // Set uniforms
    const timeLocation = this.gl.getUniformLocation(this.computeProgram, "u_time");
    const mouseLocation = this.gl.getUniformLocation(this.computeProgram, "u_mouse");
    const resolutionLocation = this.gl.getUniformLocation(this.computeProgram, "u_resolution");
    const repulsionLocation = this.gl.getUniformLocation(this.computeProgram, "u_repulsionForce");

    this.gl.uniform1f(timeLocation, currentTime);
    this.gl.uniform2f(mouseLocation, this.mouseX, this.mouseY);
    this.gl.uniform2f(resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.uniform1f(repulsionLocation, repulsionForce);

    // Set up transform feedback
    const positionLocation = this.gl.getAttribLocation(this.computeProgram, "a_position");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[this.currentBuffer]);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
    this.gl.bindBufferBase(
      this.gl.TRANSFORM_FEEDBACK_BUFFER,
      0,
      this.positionBuffers[1 - this.currentBuffer]
    );

    this.gl.enable(this.gl.RASTERIZER_DISCARD);
    this.gl.beginTransformFeedback(this.gl.POINTS);
    this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);
    this.gl.endTransformFeedback();
    this.gl.disable(this.gl.RASTERIZER_DISCARD);

    // Render pass
    this.gl.useProgram(this.program);

    const renderPosLocation = this.gl.getAttribLocation(this.program, "a_position");
    const colorLocation = this.gl.getAttribLocation(this.program, "a_color");

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[1 - this.currentBuffer]);
    this.gl.enableVertexAttribArray(renderPosLocation);
    this.gl.vertexAttribPointer(renderPosLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);

    // Swap buffers
    this.currentBuffer = 1 - this.currentBuffer;
  }

  public destroy(): void {
    // Cleanup WebGL resources
    this.gl.deleteProgram(this.program);
    this.gl.deleteProgram(this.computeProgram);
    this.positionBuffers.forEach(buffer => this.gl.deleteBuffer(buffer));
    this.gl.deleteBuffer(this.colorBuffer);
    this.gl.deleteTransformFeedback(this.transformFeedback);
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