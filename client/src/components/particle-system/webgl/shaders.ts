// Fragment and vertex shaders for particle system
export const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in vec3 a_color;
  out vec3 v_color;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 2.0;
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
    fragColor = vec4(v_color, alpha);
  }
`;

// Dedicated compute vertex shader for particle physics
export const computeVertexShaderSource = `#version 300 es
  in vec2 a_position;
  out vec2 v_position;  // Transform feedback varying

  uniform vec2 u_resolution;
  uniform vec2 u_magnetic_positions[10];
  uniform float u_magnetic_count;
  uniform float u_magnetic_radius;
  uniform float u_time;

  vec2 calculateMagneticForce(vec2 particlePos, vec2 magnetPos) {
    vec2 diff = magnetPos - particlePos;
    float dist = length(diff);

    // Convert 10px radius to clip space coordinates
    float radiusInClipSpace = (u_magnetic_radius / u_resolution.x) * 2.0;

    if (dist > radiusInClipSpace) {
      return vec2(0.0);
    }

    float normalizedDist = dist / radiusInClipSpace;
    float forceMagnitude = min(8.0, 2.0 / (normalizedDist * normalizedDist));

    vec2 perpForce = vec2(-diff.y, diff.x) / dist;
    float radialRatio = 0.8;
    float tangentialRatio = 0.2;

    return (normalize(diff) * radialRatio + perpForce * tangentialRatio) * forceMagnitude;
  }

  void main() {
    vec2 position = a_position;
    vec2 velocity = vec2(0.0);

    // Apply magnetic forces
    for (int i = 0; i < 10; i++) {
      if (float(i) >= u_magnetic_count) break;
      velocity += calculateMagneticForce(position, u_magnetic_positions[i]);
    }

    // Apply velocity with damping
    position += velocity * 0.016; // Assuming 60fps (1/60 ≈ 0.016)

    // Boundary reflection
    if (abs(position.x) > 1.0) {
      position.x = sign(position.x) * 1.0;
      velocity.x *= -0.8; // Bounce with energy loss
    }
    if (abs(position.y) > 1.0) {
      position.y = sign(position.y) * 1.0;
      velocity.y *= -0.8;
    }

    v_position = position;  // Output for transform feedback
  }
`;

// Minimal fragment shader for compute pass (required by WebGL2)
export const computeFragmentShaderSource = `#version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(0.0);
  }
`;