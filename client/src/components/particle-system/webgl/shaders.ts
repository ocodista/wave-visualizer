// Fragment and vertex shaders for particle system
export const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in vec3 a_color;
  out vec3 v_color;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 8.0; // Increased point size for better visibility
    v_color = a_color;
  }
`;

export const fragmentShaderSource = `#version 300 es
  precision mediump float;
  in vec3 v_color;
  out vec4 fragColor;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord) * 2.0;
    float alpha = 1.0 - smoothstep(0.8, 1.0, r);
    fragColor = vec4(v_color, alpha * 0.8); // Slightly transparent for better blending
  }
`;

// Compute shader for particle physics including wave propagation
export const computeVertexShaderSource = `#version 300 es
  in vec2 a_position;
  out vec2 v_position;

  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_repulsionForce;

  void main() {
    vec2 position = a_position;
    vec2 velocity = vec2(0.0);

    // Calculate distance from mouse
    vec2 mousePos = (u_mouse / u_resolution) * 2.0 - 1.0;
    vec2 toMouse = position - mousePos;
    float dist = length(toMouse);

    // Wave propagation parameters
    float waveSpeed = 2.0;
    float waveRadius = u_time * waveSpeed;
    float waveWidth = 0.3; // Wider wave effect

    // Apply wave force
    if (abs(dist - waveRadius) < waveWidth) {
      float wavePosition = abs(dist - waveRadius) / waveWidth;
      float waveIntensity = exp(-wavePosition * 1.5) * sin(wavePosition * 3.14159);
      float timeDecay = exp(-u_time * (u_time < 10.0 ? 0.01 : 0.003));
      float distanceDecay = exp(-dist * 0.5);
      float initialBoost = u_time < 5.0 ? 2.0 : 1.0;
      float waveForce = waveIntensity * timeDecay * distanceDecay * u_repulsionForce * 0.004 * initialBoost;

      vec2 waveDir = normalize(toMouse);
      velocity += waveDir * waveForce;
    }

    // Add slight attraction to original position
    vec2 homeForce = -position * 0.02;
    velocity += homeForce;

    // Apply velocity with damping
    position += velocity;
    position *= 0.999;

    // Boundary reflection
    if (abs(position.x) > 1.0) {
      position.x = sign(position.x) * 1.0;
      velocity.x *= -0.6;
    }
    if (abs(position.y) > 1.0) {
      position.y = sign(position.y) * 1.0;
      velocity.y *= -0.6;
    }

    v_position = position;
  }
`;

export const computeFragmentShaderSource = `#version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(0.0);
  }
`;