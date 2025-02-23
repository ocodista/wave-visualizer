// Utility functions for WebGL setup and shader compilation
export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error('Failed to create program');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

// Vertex shader for particles
export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec3 a_color;
  attribute float a_size;

  uniform vec2 u_resolution;

  varying vec3 v_color;

  void main() {
    vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(position * vec2(1, -1), 0, 1);
    gl_PointSize = a_size;
    v_color = a_color;
  }
`;

// Fragment shader for particles
export const fragmentShaderSource = `
  precision mediump float;
  varying vec3 v_color;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distance = length(coord);

    if (distance > 0.5) {
        discard;
    }

    float alpha = 1.0 - smoothstep(0.45, 0.5, distance);
    gl_FragColor = vec4(v_color, alpha);
  }
`;