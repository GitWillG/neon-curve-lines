import * as THREE from 'three'

const sphereVertex = `
      ${THREE.ShaderChunk.common}
      varying vec2 vUv;
      varying vec3 vPattern;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uBeat;
      uniform float uSize;
      uniform sampler2D uTexture;
     

${THREE.ShaderChunk.logdepthbuf_pars_vertex}
void main() {

  

  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.);
  gl_Position = projectedPosition;
  // gl_PointSize = uSize * fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  ${THREE.ShaderChunk.logdepthbuf_vertex}
}
    `

const sphereFragment = `
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
    float dash = sin(vUv.x*5. + uBeat/50.);
    if(dash < 0.) discard;
    float strength = 1. - distance(vUv.x , 0.5);
    vec3 col = vec3(0.1,0.8,0.4)* uMood * 3.;
    gl_FragColor = vec4(col, 1.);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`
const sphereFragment1 = `
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
    float dash = sin(vUv.x*5. + uBeat);
    if(dash < 0.) discard;
    float strength = 1. - distance(vUv.x , 0.5);
    vec3 col = vec3(1.0,0.2,0.4) * uMood * 3.;
    gl_FragColor = vec4(col, 1.);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`
const sphereFragment2 = `
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
    float dash = sin(vUv.x*5. + uBeat);
    if(dash < 0.) discard;
    float strength = 1. - distance(vUv.x , 0.5);
    vec3 col = vec3(.9,0.5,0.1) * uMood * 3.;
    gl_FragColor = vec4(col, 1.);
  // gl_FragColor = vec4(vec3(pow(1. - distance(gl_PointCoord, vec2(.5)) , 10.))  * vec3(0.2784, 0.5529, 0.9137) / vec3(0.3765, 0.6118, 0.4863)/5. * vec3(texture2D(uTexture , vUv)) ,1.);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`

export { sphereVertex, sphereFragment, sphereFragment1, sphereFragment2 }
