import * as THREE from 'three'

const roomVertex = `
      ${THREE.ShaderChunk.common}
      varying vec2 vUv;
      varying vec3 vPattern;
      uniform vec2 uResolution;
      uniform vec3 uMood;
      uniform float uTime;
      uniform float uPulse;
      uniform float uPulse2;
      uniform float uBeat;
      uniform sampler2D uTexture;
      vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}
${THREE.ShaderChunk.logdepthbuf_pars_vertex}
void main() {
  vec3 col =  uMood;
  float strength = abs(distance(uv,vec2(0.5))-0.25);
  vec2 noiseUv = uv;
  noiseUv.x += uTime/50000.;
  noiseUv.y += uTime/70000.;
  col *= mix(cnoise(noiseUv*15.)*uBeat , (1. - strength*20.) , .5) ; 
  // col *= 0.5;
  vec3 newPosition = position + normal * col;
  vPattern = col;
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.);
  // gl_Position = projectedPosition;
  // gl_PointSize = uSize * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  ${THREE.ShaderChunk.logdepthbuf_vertex}
}
    `

const roomFragment = `
  precision highp float;
  precision highp int;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  varying vec3 vPattern;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec3 uMood;
  uniform float uTime;
  uniform float uPulse;
  uniform float uPulse2;
  uniform float uBeat;
  uniform sampler2D uTexture;
  
  void main() {

    gl_FragColor = vec4(vPattern, 1.);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }

`
const roomWireframeFragment = `
  precision highp float;
  precision highp int;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  varying vec3 vPattern;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec3 uMood;
  uniform float uTime;
  uniform float uBeat;
  uniform sampler2D uTexture;
  #define tau 6.2831853
    
 
  float circ(vec2 p) {
    float r = length(p);
    r = log(sqrt(r));
    return abs(mod(r * 4., tau) - 3.14) * 3. + .2;
  
  }
  void main() {
    float time = uTime/1000.;
    vec2 p = vec2(vUv.x - 0.5, vUv.y - 0.5);

    float rz = vUv.y + 10.;
  
    //rings
    p /= exp(mod(time, 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679));
    // p /= exp(mod(1.2 , 3.14159 ));
    rz /= pow(abs((0. - circ(p))), .5);
    vec3 t = vec3(1.);
    // t*=rz;
    // t/=2.;
    // t.r += uBeat/3.;
    // t.g += uBeat/4.;
    // t.b += uBeat/2.;
    float strength = 1. - step(0.5 , distance(gl_PointCoord, vec2(.5)));
    vec3 col = t;

    gl_FragColor = vec4(col, .005);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`

export { roomVertex, roomFragment, roomWireframeFragment }
