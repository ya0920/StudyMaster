<template>
  <div class="photo-overlay" @click.self="close">
    <div class="photo-content">
      <!-- 摄像头模式 -->
      <div v-if="!capturedImage" class="camera-mode">
        <video ref="videoElement" autoplay playsinline class="video-preview"></video>
        <div class="camera-controls">
          <button class="control-btn" @click="capturePhoto">
            <i class="iconfont icon-paizhao"></i>
          </button>
          <button class="control-btn" @click="toggleCamera">
            <i class="iconfont icon-swich"></i>
          </button>
          <button class="control-btn cancel-btn" @click="close">
            <i class="iconfont icon-close"></i>
          </button>
        </div>
      </div>
      <!-- 裁剪模式 -->
      <div v-else class="cropper-mode">
        <vue-cropper
          ref="cropperRef"
          :img="capturedImage"
          :outputSize="1"
          outputType="jpeg"
          :autoCrop="true"
          :fixedBox="false"
          :full="true"
          :canMove="true"
          :canMoveBox="true"
        />
        <div class="cropper-controls">
          <button class="control-btn rotate-btn" @click="rotateImage">
            <i class="iconfont icon-rotate"></i>
          </button>
          <button class="control-btn confirm-btn" @click="confirmCrop">
            <i class="iconfont icon-check"></i>
          </button>
          <button class="control-btn cancel-btn" @click="retakePhoto">
            <i class="iconfont icon-close"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick, defineEmits } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const emit = defineEmits(['photo-captured', 'close'])
const videoElement = ref(null)
const mediaStream = ref(null)
const capturedImage = ref('')
const cropperRef = ref(null)
const currentFacingMode = ref('environment') // 默认后置摄像头

// 启动摄像头
async function startCamera() {
  try {
    const constraints = { video: { facingMode: currentFacingMode.value } }
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream.value
      await videoElement.value.play()
    }
    console.log('摄像头启动成功')
  } catch (error) {
    console.error('摄像头启动失败:', error)
    alert('无法启动摄像头，请检查权限')
    close()
  }
}
startCamera()

// 切换摄像头
async function toggleCamera() {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment'
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
  }
  await startCamera()
}

// 拍照：捕获当前视频帧
function capturePhoto() {
  if (!videoElement.value) return
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.value.videoWidth
  canvas.height = videoElement.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)
  capturedImage.value = canvas.toDataURL('image/jpeg')
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
  }
  console.log('拍照完成，进入裁剪模式')
}

// 旋转按钮：使用vue-cropper的rotateRight方法
function rotateImage() {
  if (cropperRef.value) {
    cropperRef.value.rotateRight()
    console.log('图片旋转90度')
  } else {
    console.warn('未找到旋转方法')
  }
}

// 确认裁剪：使用vue-cropper的getCropData方法
async function confirmCrop() {
  if (cropperRef.value) {
    cropperRef.value.getCropData(data => {
      emit('photo-captured', data)
      close()
    })
  } else {
    console.error('Cropper实例未找到')
  }
}

// 重新拍摄：回到摄像头模式
function retakePhoto() {
  capturedImage.value = ''
  startCamera()
}

// 停止媒体流
function stopMediaStream() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
  }
}

// 关闭弹出框
function close() {
  stopMediaStream()
  emit('close')
}

onBeforeUnmount(() => {
  stopMediaStream()
})
</script>

<style scoped>
.photo-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.photo-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.camera-mode,
.cropper-mode {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.video-preview {
  width: 100%;
  height: 80%;
  object-fit: cover;
  background: #000;
}

.camera-controls,
.cropper-controls {
  position: fixed;
  bottom: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  padding: 0 20px;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #2196F3;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.2s;
}

.control-btn:hover {
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.cancel-btn {
  background: #f44336;
}

.confirm-btn {
  background: #4CAF50;
}

.rotate-btn {
  background: #ff9800;
}
</style>