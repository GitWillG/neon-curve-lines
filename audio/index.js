import * as THREE from 'three'
import { checkArrayEqualElements } from '../utils/index.js'

class SpatialAudio {
  constructor(audioSource, scene, camera, helper) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 1, 10, 10, 10)
    const material = new THREE.MeshBasicMaterial({
      color: '#ff0000',
      transparent: true,
      opacity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    })
    const linesMaterial = new THREE.MeshBasicMaterial({
      color: '#0008f5',
      transparent: true,
      opacity: 1,
      metalness: 1,
      roughness: 0,
    })
    const mesh = new THREE.Mesh(geometry, material)
    const lines = new THREE.LineSegments(geometry, linesMaterial)
    mesh.add(lines)
    this.helper = mesh
    const quaternion = this.helper.quaternion
    const position = this.helper.position
    this.track = new Audio()
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.camera = camera
    this.scene = scene
    const listenerOrientation = new THREE.Vector3()
    listenerOrientation.set(0, 0, -1).applyQuaternion(camera.quaternion)
    this.listener = this.audioContext.listener
    this.listener.positionX.value = camera.position.x
    this.listener.positionY.value = camera.position.y
    this.listener.positionZ.value = camera.position.z
    this.listener.forwardX.value = listenerOrientation.x
    this.listener.forwardY.value = listenerOrientation.y
    this.listener.forwardZ.value = listenerOrientation.z
    this.listener.upX.value = camera.up.x
    this.listener.upY.value = camera.up.y
    this.listener.upZ.value = camera.up.z
    const pannerModel = 'HRTF'
    const innerCone = 0
    const outerCone = 50
    const outerGain = 0.3
    const distanceModel = 'linear'
    const maxDistance = 10000
    const refDistance = 1
    const rollOff = 10
    const positionX = position.x
    const positionY = position.y
    const positionZ = position.z
    const orientation = new THREE.Vector3()
    orientation.set(0, 0, 1).applyQuaternion(quaternion)
    const orientationX = orientation.x
    const orientationY = orientation.y
    const orientationZ = orientation.z
    this.panner = new PannerNode(this.audioContext, {
      panningModel: pannerModel,
      distanceModel: distanceModel,
      positionX: positionX,
      positionY: positionY,
      positionZ: positionZ,
      orientationX: orientationX,
      orientationY: orientationY,
      orientationZ: orientationZ,
      refDistance: refDistance,
      maxDistance: maxDistance,
      rolloffFactor: rollOff,
      coneInnerAngle: innerCone,
      coneOuterAngle: outerCone,
      coneOuterGain: outerGain,
    })
    this.panner.positionX.value += 0.1
    this.source = this.audioContext.createMediaElementSource(this.track)
    this.volumeControl = this.audioContext.createGain()
    this.source.connect(this.volumeControl)
    this.analyzer = this.audioContext.createAnalyser()
    this.analyzer.fftSize = 512
    // analyzer.connect(audioContext.destination)
    this.volumeControl.connect(this.analyzer)
    this.source.connect(this.panner).connect(this.audioContext.destination)
    this.mood = 'silence'
    this.moodArray = []
    this.threshold = 10
    this.track.src = audioSource
    this.track.currentTime = this.currentTime || 0
    this.track.volume = this.volume || 1
    this.track.crossOrigin = 'anonymous'
    if (helper) {
      scene.add(this.helper)
    }
    document.body.appendChild(this.track)
  }

  getAudioFrequenciesByRange({
    frequencyData,
    horizontalRangeStart = 0,
    horizontalRangeEnd = 255,
    verticalRangeStart = 0,
    verticalRangeEnd = 255,
  }) {
    // if (audio.currentTime <= 14.6) {
    let rangeSum = 0
    for (let i = horizontalRangeStart; i < horizontalRangeEnd; i++) {
      rangeSum += frequencyData[i]
    }
    const average = rangeSum / (horizontalRangeEnd - horizontalRangeStart)
    let factor
    if (average > verticalRangeStart) {
      factor =
        (average - verticalRangeStart) / (verticalRangeEnd - verticalRangeStart)
      if (factor > 1) {
        factor = 1
      }
    }
    return factor
  }

  updateAudioThreshold(frequencyData) {
    const frequencyDataActive = []
    for (let i = 0; i < frequencyData.length; i++) {
      frequencyDataActive.push(frequencyData[i])
      if (frequencyData[i] === 0 && i !== 0) {
        this.threshold = i - 1
        break
      }
    }
    if (this.threshold == 0) {
      this.mood = 'silence'
    }
    if (this.threshold < 0 && this.threshold <= 50) {
      this.mood = 'superLow'
    }
    if (this.threshold < 50 && this.threshold <= 100) {
      this.mood = 'low'
    }
    if (this.threshold < 100 && this.threshold <= 150) {
      this.mood = 'mid'
    }
    if (this.threshold < 150 && this.threshold <= 200) {
      this.mood = 'high'
    }
    if (this.threshold < 200) {
      this.mood = 'superHigh'
    }
  }

  updateMoodArray() {
    this.moodArray.push(this.mood)
  }

  logMood() {
    if (checkArrayEqualElements(this.moodArray)) {
      // console.log(lastTen)
      // currentMood = moodArray.slice(-1)[0]
      // console.log(moodArray.slice(-1)[0])
    }
    this.moodArray = []
  }

  updateListenerPosition(position) {
    if (this.listener && position) {
      this.listener.positionX.value = position.x
      this.listener.positionY.value = position.y
      this.listener.positionZ.value = position.z
    }
  }

  updateListenerRotation(quaternion, up) {
    if (this.listener && quaternion && up) {
      const orientation = new THREE.Vector3()
      orientation.set(0, 0, -1).applyQuaternion(quaternion)
      this.listener.forwardX.value = orientation.x
      this.listener.forwardY.value = orientation.y
      this.listener.forwardZ.value = orientation.z
      this.listener.forwardX.value = up.x
      this.listener.forwardY.value = up.y
      this.listener.forwardZ.value = up.z
    }
  }

  updateAudioPosition(position) {
    if (this.panner && position) {
      this.panner.positionX.value = position.x
      this.panner.positionY.value = position.y
      this.panner.positionZ.value = position.z
    }
  }

  updateAudioRotation(quaternion) {
    if (this.panner && quaternion) {
      const orientation = new THREE.Vector3()
      orientation.set(0, 0, 1).applyQuaternion(quaternion)
      this.panner.orientationX.value = orientation.x
      this.panner.orientationY.value = orientation.y
      this.panner.orientationZ.value = orientation.z
    }
  }

  updateAudio({ position, rotation }) {
    this.updateListenerPosition(this.camera.position)
    this.updateListenerRotation(this.camera.quaternion, this.camera.up)
    if (position) {
      this.helper.position.set(position.x, position.y, position.z)
      this.helper.updateMatrixWorld()
      this.updateAudioPosition(this.helper.position)
    }
    if (rotation) {
      this.helper.rotation.set(rotation.x, rotation.y, rotation.z)
      this.helper.updateMatrixWorld()
      this.updateAudioRotation(this.helper.quaternion)
    }
  }

  getThreshold() {
    return this.threshold
  }

  getListener() {
    return this.listener
  }

  getFrequenciesByRange(params) {
    if (this.analyzer) {
      const frequencyData = new Uint8Array(this.analyzer.frequencyBinCount)
      this.analyzer.getByteFrequencyData(frequencyData)
      params.frequencyData = frequencyData
      this.updateAudioThreshold(frequencyData)
      return this.getAudioFrequenciesByRange(params)
    }
  }
}

export default SpatialAudio
