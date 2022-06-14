/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import SpatialAudio from './audio/index.js'

import {
  masterPieceParticlesFragment,
  masterPieceParticlesVertex,
} from './shaders/masterPieceParticles.js'
import {
  roomFragment,
  roomVertex,
  roomWireframeFragment,
} from './shaders/room.js'
import {
  sphereFragment,
  sphereFragment1,
  sphereFragment2,
  sphereVertex,
} from './shaders/sphere.js'
import { simplex3D } from './simplex.js'

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1')

let physicsIds = []
let passesIds = []
let emasiveArray = []
let neonClubEmissiveMaterial
let neonClubCyberLinesMaterial
let beatFactor1
let beatFactor2
let beatFactor3
let beatFactor4
let elapsedTime
let pulseAnimation = false
let pulseNumber = 1
let pulseNumber2 = 1
let audio
let audioPosition = { x: 0, y: 0, z: 0 }
let audioRotation = { x: 0, y: 0, z: 0 }
// let rotationAnimation = false
// let lastRotationNumber = 0

export default (e) => {
  const app = useApp()
  app.name = 'neon-club'
  const camera = useInternals().camera
  const gl = useInternals().renderer
  const physics = usePhysics()
  gl.outputEncoding = THREE.sRGBEncoding
  const disposeMaterial = (obj) => {
    if (obj.material) {
      obj.material.dispose()
    }
  }
  app.traverse(disposeMaterial)
  const loadModel = (params) => {
    return new Promise((resolve, reject) => {
      const { gltfLoader } = useLoaders()
      const { dracoLoader } = useLoaders()
      gltfLoader.setDRACOLoader(dracoLoader).setCrossOrigin('anonymous')

      gltfLoader.load(params.filePath + params.fileName, (gltf) => {
        gltf.scene.traverse((child) => {})
        const physicsId = physics.addGeometry(gltf.scene)
        physicsIds.push(physicsId)
        // gltf.scene.position.set(0, 0, 0)
        // gltf.scene.rotation.set(Math.PI, 0, 0)
        // gltf.scene.updateMatrixWorld()
        resolve(gltf.scene)
      })
    })
  }

  // sky
  const pmremGenerator = new THREE.PMREMGenerator(gl)
  pmremGenerator.compileEquirectangularShader()

  new EXRLoader()
    // .setDataType(THREE.UnsignedByteType)
    .load(baseUrl + 'exr/kloppenheim.exr', function (texture) {
      let t = pmremGenerator.fromEquirectangular(texture).texture
      t.minFilter = THREE.LinearFilter
      // rootScene.background = t
      texture.dispose()
    })

  const masterPieceGeometry = new THREE.BoxBufferGeometry(6, 6, 6, 5, 5, 5)
  const masterPieceMaterial = new THREE.ShaderMaterial({
    vertexShader: masterPieceParticlesVertex,
    fragmentShader: masterPieceParticlesFragment,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    // side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(1, 2, 1) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      uSize: { value: 9 * gl.getPixelRatio() },
    },
  })

  const masterPiece = new THREE.Points(masterPieceGeometry, masterPieceMaterial)
  // const wireframe = new THREE.LineSegments(
  //   masterPieceGeometry,
  //   masterPieceMaterial
  // )
  // masterPiece.add(wireframe)
  masterPiece.scale.set(0.4, 0.99, 0.4)
  masterPiece.position.set(6, 2.5, 0)
  masterPiece.rotation.x = Math.PI
  masterPiece.updateMatrixWorld()

  app.add(masterPiece)

  // const roomGeometry = new THREE.BoxBufferGeometry(30, 5, 5, 100, 100, 100)
  const roomGeometry = new THREE.PlaneBufferGeometry(6, 6, 500, 500)
  const roomWireframeGeometry = new THREE.BoxBufferGeometry(
    30,
    7,
    7,
    20,
    20,
    20
  )
  const roomMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  const roomWireframeMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomWireframeFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })

  const room = new THREE.Mesh(roomGeometry, roomMaterial)

  // room.rotation.z += Math.PI / 2
  // room.rotation.x += Math.PI / 4
  // room.rotation.y += Math.PI / 4
  room.position.set(12, 2.5, -3)
  room.updateMatrixWorld()
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial()
  )
  ground.rotation.x -= Math.PI / 2
  ground.position.y -= 1
  // const groundPhysicsId = physics.addGeometry(ground)
  // physicsIds.push(groundPhysicsId)
  const wireframe = new THREE.LineSegments(
    roomWireframeGeometry,
    roomWireframeMaterial
  )
  // wireframe.scale.set(0.999, 0.999, 0.999)
  wireframe.position.set(20, 2.5, 0)
  wireframe.updateMatrixWorld()
  // room.add(wireframe)
  // app.add(room)

  const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(2.5, 1000, 1000),
    new THREE.ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: sphereFragment,
      // depthWrite: false,
      // blending: THREE.AdditiveBlending,
      vertexColors: true,
      // wireframe:true,
      // transparent: true,
      // side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: -2 },
        uPulse2: { value: -2 },
        uBeat: { value: 0.5 },
        uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uTexture: { value: null },
        // uSize: { value: 4 * gl.getPixelRatio() },
      },
    })
  )
  sphere.position.set(7, 2, 0)
  sphere.rotation.y = Math.PI
  sphere.updateMatrixWorld()

  // app.add(sphere)

  // drag and dropping audio file
  document.body.ondrop = (e) => {
    console.log('File(s) dropped')

    // Prevent default behavior (Prevent file from being opened)
    e.preventDefault()

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < e.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile()
          const fileReader = new FileReader()
          fileReader.readAsArrayBuffer(file)
          fileReader.onload = function (e) {
            const blob = new Blob([e.target.result], { type: 'audio/mp3' })
            const url = window.URL.createObjectURL(blob)
            audio = new SpatialAudio(url, app, camera, false)
            // audio.track.play()
            console.log(
              "Filename: '" + file.name + "'",
              '(' + Math.floor((file.size / 1024 / 1024) * 100) / 100 + ' MB)'
            )
          }
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        console.log(
          '... file[' + i + '].name = ' + e.dataTransfer.files[i].name
        )
      }
    }
  }

  // creating audio with space bar click

  document.body.onkeyup = (e) => {
    if (e.code === 'Digit1') {
      if (!audio) {
        audio = new SpatialAudio('https://res.cloudinary.com/musixdevelop/video/upload/track-audios/Sad.mp3', app, camera)
        audioPosition.z -= 2
        audio.updateAudio({
          position: audioPosition,
          rotation: audioRotation,
        })
      }
      if (audio.track.paused !== undefined) {
        if (audio.track.paused) {
          audio.track.play()
        } else {
          audio.track.pause()
        }
      }
    }
  }

  // curve
  function computeCurl(x, y, z) {
    var eps = 0.0001

    var curl = new THREE.Vector3()

    //Find rate of change in YZ plane
    var n1 = simplex3D(x, y + eps, z)
    var n2 = simplex3D(x, y - eps, z)
    //Average to find approximate derivative
    var a = (n1 - n2) / (2 * eps)
    var n1 = simplex3D(x, y, z + eps)
    var n2 = simplex3D(x, y, z - eps)
    //Average to find approximate derivative
    var b = (n1 - n2) / (2 * eps)
    curl.x = a - b

    //Find rate of change in XZ plane
    n1 = simplex3D(x, y, z + eps)
    n2 = simplex3D(x, y, z - eps)
    a = (n1 - n2) / (2 * eps)
    n1 = simplex3D(x + eps, y, z)
    n2 = simplex3D(x - eps, y, z)
    b = (n1 - n2) / (2 * eps)
    curl.y = a - b

    //Find rate of change in XY plane
    n1 = simplex3D(x + eps, y, z)
    n2 = simplex3D(x - eps, y, z)
    a = (n1 - n2) / (2 * eps)
    n1 = simplex3D(x, y + eps, z)
    n2 = simplex3D(x, y - eps, z)
    b = (n1 - n2) / (2 * eps)
    curl.z = a - b

    return curl
  }

  const getCurve = (start) => {
    const points = []
    points.push(start)
    const currentPoint = start.clone()
    for (let i = 0; i < 50; i++) {
      const v = computeCurl(currentPoint.x, currentPoint.y, currentPoint.z)
      currentPoint.addScaledVector(v, 0.001)
      points.push(currentPoint.clone())
    }
    return points
  }
  const curveMat = new THREE.ShaderMaterial({
    vertexShader: sphereVertex,
    fragmentShader: sphereFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  const curveMat1 = new THREE.ShaderMaterial({
    vertexShader: sphereVertex,
    fragmentShader: sphereFragment1,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  const curveMat2 = new THREE.ShaderMaterial({
    vertexShader: sphereVertex,
    fragmentShader: sphereFragment2,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  for (let i = 0; i < 100; i++) {
    const path = new THREE.CatmullRomCurve3(
      getCurve(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
      )
    )
    const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.002, 8, false)
    const curve = new THREE.Mesh(curveGeo, curveMat)
    curve.scale.set(2, 8, 2)
    curve.updateMatrixWorld()
    app.add(curve)
  }
  for (let i = 0; i < 200; i++) {
    const path = new THREE.CatmullRomCurve3(
      getCurve(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
      )
    )
    const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.001, 8, false)
    const curve = new THREE.Mesh(curveGeo, curveMat1)
    curve.scale.set(2, 10, 2)
    curve.updateMatrixWorld()
    app.add(curve)
  }
  for (let i = 0; i < 100; i++) {
    const path = new THREE.CatmullRomCurve3(
      getCurve(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
      )
    )
    const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.001, 8, false)
    const curve = new THREE.Mesh(curveGeo, curveMat2)
    curve.scale.set(2, 7, 2)
    curve.updateMatrixWorld()
    app.add(curve)
  }

  useFrame(({ timestamp }) => {
    elapsedTime = timestamp
    if (audio) {
      // spatial audio position

      audioPosition.x = Math.sin(elapsedTime / 1000) * 4
      audioRotation.y = -Math.sin(elapsedTime / 1000)
      audio.updateAudio({
        position: audioPosition,
        rotation: audioRotation,
      })
      const threshold = audio.getThreshold()
      audio.updateMoodArray()
      audio.logMood()
      masterPiece.material.uniforms.uTime.value = elapsedTime
      room.material.uniforms.uTime.value = elapsedTime * 10
      sphere.material.uniforms.uTime.value = elapsedTime * 10
      curveMat.uniforms.uTime.value = elapsedTime
      curveMat1.uniforms.uTime.value = elapsedTime
      curveMat2.uniforms.uTime.value = elapsedTime

      wireframe.material.uniforms.uTime.value = elapsedTime
      if (pulseAnimation) {
        if (pulseNumber >= 2) {
          pulseNumber = 1
          pulseNumber2 = 1
          pulseAnimation = false
        } else {
          pulseNumber += beatFactor3 / 100
          pulseNumber2 += beatFactor3 / 100
          room.material.uniforms.uPulse.value = pulseNumber
          room.material.uniforms.uPulse2.value = pulseNumber2
        }
      }

      const moodChanger = threshold / 255
      const moodChangerColor = [
        moodChanger + 0.1 + (beatFactor3 ? beatFactor3 / 50 : 0),
        0.3 + moodChanger / 10 + (beatFactor2 ? beatFactor2 / 40 : 0),
        Math.abs(0.8 - moodChanger) + (beatFactor1 ? beatFactor1 / 30 : 0),
      ]
      const moodChangerColor1 = [
        Math.abs(0.8 - moodChanger),
        moodChanger + 0.1,
        0.3 + moodChanger / 10,
      ]
      masterPiece.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      room.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      sphere.material.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor1
      )
      wireframe.material.uniforms.uMood.value = new THREE.Vector3(
        moodChangerColor1[2],
        moodChangerColor1[0],
        moodChangerColor1[1]
      )
      curveMat.uniforms.uMood.value = new THREE.Vector3(
        moodChangerColor1[2],
        moodChangerColor1[0],
        moodChangerColor1[1]
      )
      curveMat1.uniforms.uMood.value = new THREE.Vector3(
        moodChangerColor1[0],
        moodChangerColor1[1],
        moodChangerColor1[2]
      )
      curveMat2.uniforms.uMood.value = new THREE.Vector3(
        moodChangerColor1[2],
        moodChangerColor1[0],
        moodChangerColor1[1]
      )
      if (beatFactor1) {
        room.material.uniforms.uBeat.value = beatFactor1
        sphere.material.uniforms.uBeat.value = beatFactor1
        masterPiece.material.uniforms.uBeat.value = beatFactor1
        curveMat.uniforms.uBeat.value += beatFactor1

        // if (rotationAnimation) {
        //   if (masterPiece.rotation.x - lastRotationNumber >= Math.PI / 2) {
        //     rotationAnimation = false
        //     lastRotationNumber = masterPiece.rotation.x
        //   } else {
        //     masterPiece.rotation.x += beatFactor1 / 100
        //     masterPiece.updateMatrixWorld()
        //   }
        // }
        // if (beatFactor1 >= 0.5) {
        //   rotationAnimation = true
        // }
        // masterPiece.rotation.x += beatFactor1/10
        masterPiece.updateMatrixWorld()
      }

      if (beatFactor2) {
        curveMat2.uniforms.uBeat.value += beatFactor2
      }

      if (beatFactor3) {
        // pulse
        if (beatFactor3 >= 0.88) {
          curveMat1.uniforms.uBeat.value += beatFactor3
          pulseAnimation = true
        }
      }
      // if (beatFactor2) {
      //   cloudMaterial2.color = new THREE.Color(
      //     (moodChangerColor[1] + beatFactor2 / 22) / 5,
      //     (moodChangerColor[0] + beatFactor2 / 30) / 5,
      //     (moodChangerColor[2] + beatFactor2 / 30) / 5
      //   )
      // }
      // if (beatFactor3) {
      //   cloudMaterial3.color = new THREE.Color(
      //     (moodChangerColor[0] - beatFactor3 / 30) / 5,
      //     (moodChangerColor[1] + beatFactor3 / 25) / 5,
      //     (moodChangerColor[2] + beatFactor3 / 30) / 5
      //   )
      // }
      // if (beatFactor4) {
      //   cloudMaterial4.color = new THREE.Color(
      //     (moodChangerColor[0] - beatFactor4 / 30) / 5,
      //     (moodChangerColor[1] + beatFactor4 / 24) / 5,
      //     (moodChangerColor[2] + beatFactor4 / 32) / 5
      //   )
      // }

      // updateClouds(cloudParticles2, 0.0004, beatFactor2)
      // updateClouds(cloudParticles3, 0.00025, beatFactor3)
      // updateClouds(cloudParticles4, -0.0003, beatFactor4)
      // directionalLight.color = new THREE.Color(...moodChangerColor)
      // console.log(moodChanger)

      beatFactor1 = audio.getFrequenciesByRange({
        horizontalRangeStart: 40,
        horizontalRangeEnd: 48,
        verticalRangeStart: 0,
        verticalRangeEnd: 255,
      })
      beatFactor2 = audio.getFrequenciesByRange({
        horizontalRangeStart: 85,
        horizontalRangeEnd: 93,
        verticalRangeStart: 15,
        verticalRangeEnd: 40,
      })
      beatFactor3 = audio.getFrequenciesByRange({
        horizontalRangeStart: 3,
        horizontalRangeEnd: 10,
        verticalRangeStart: 0,
        verticalRangeEnd: 255,
      })
      beatFactor4 = audio.getFrequenciesByRange({
        horizontalRangeStart: 140,
        horizontalRangeEnd: 148,
        verticalRangeStart: 80,
        verticalRangeEnd: 100,
      })

      // console.log(beatFactor3)
    }
  })
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId)
    }
  })

  return app
}
