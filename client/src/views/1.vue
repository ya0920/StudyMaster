<template>
  <div class="upload-page">
    <!-- 页面头部 -->
    <header class="upload-header">
      <i class="iconfont icon-jiantou" @click="goBack"></i>
      <h1 class="header-title">拍题录入</h1>
      <button class="header-save-btn" @click="handleSave">保存</button>
    </header>

    <!-- 上传容器 -->
    <div class="upload-container">
      <!-- 隐藏的文件输入 -->
      <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;" />

      <!-- 拍照区域（点击后弹出选择框） -->
      <div class="upload-area" @click="openChoiceModal">
        <template v-if="previewImage">
          <img :src="previewImage" alt="预览图片" class="preview-image" />
        </template>
        <template v-else>
          <i class="iconfont icon-paizhao"></i>
          <p>点击拍照或上传截图</p>
        </template>
      </div>

      <!-- 识别结果展示 -->
      <div class="content-wrapper">
        <template v-if="formattedContent.length">
          <p>识别的题目内容（可编辑）</p>
          <div v-for="(line, index) in formattedContent" :key="index" class="content-line" :contenteditable="isEditable"
            @blur="updateContent(index, $event)" @click="activateEdit">
            <span v-if="containsMath(line)" v-html="renderMath(line)"></span>
            <span v-else>{{ line }}</span>
          </div>
        </template>
      </div>

      <!-- 表单区域 -->
      <div class="form-container">
        <div class="form-item">
          <label>选择学科</label>
          <input type="text" v-model="subject" class="form-control" />
        </div>
        <div class="form-item">
          <label>选择知识点</label>
          <input type="text" v-model="chapter" class="form-control" />
        </div>
        <div class="form-item">
          <label>你的答案</label>
          <input type="text" v-model="yourAnswer" class="form-control" />
        </div>
        <div class="form-item">
          <label>错误类型</label>
          <div class="select-wrapper">
            <select v-model="errorType" class="form-control">
              <option v-for="type in errorTypes" :value="type.id" :key="type.id">{{ type.name }}</option>
            </select>
            <i class="iconfont icon-jiantou"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择方式弹出框 -->
    <van-popup v-model:show="isChoiceModalOpen" position="bottom" round>
      <div style="padding: 16px;">
        <div style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 16px;">选择输入方式</div>
        <van-button block @click="handleFileUploadChoice">
          <!-- 替换为 iconfont 图标 -->
          <i class="iconfont icon-upload"></i> 文件上传
        </van-button>
        <van-button block type="primary" @click="handlePhotoChoice" style="margin-top: 8px;">
          <!-- 替换为 iconfont 图标 -->
          <i class="iconfont icon-paizhao"></i> 拍照
        </van-button>
      </div>
    </van-popup>
    
    <!-- 拍照组件 -->
    <photo v-if="isPhotoModalOpen" @photo-captured="handlePhotoCaptured" @close="closePhotoModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '../api/axios'
import { extractSubjectAndKnowledge, getErrorTypes } from '../api'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import Photo from '@/components/Photo.vue' // 引入 Photo 组件

// 表单数据
const subject = ref('')
const chapter = ref('')
const errorType = ref('')
const yourAnswer = ref('') // 新增字段
const errorTypes = ref([])

// 文件和 OCR 返回内容
const selectedFile = ref(null)
const questionData = ref('')
const previewImage = ref('')

// 在组件挂载时获取错误类型
onMounted(async () => {
  try {
    const result = await getErrorTypes()
    errorTypes.value = result
  } catch (error) {
    console.error('获取错误类型失败:', error)
  }
})

// OCR返回文本预处理逻辑
function preprocessContent(content) {
  let modified = content
  modified = modified.replace(/([A-D]\.)/g, '\n$1')
  modified = modified.replace(/(\(\d+\))/g, '\n$1')
  return modified
}

const formattedContent = computed(() => {
  if (!questionData.value) return []
  const modified = preprocessContent(questionData.value)
  return modified.split(/[\n\r]+/).map(line => line.trim()).filter(line => line)
})

function containsMath(text) {
  return /\$.*?\$/g.test(text) || /\$\$.*?\$\$/g.test(text) || /\\begin{array}/.test(text)
}

function renderMath(text) {
  try {
    return katex.renderToString(text, {
      throwOnError: false,
      displayMode: text.includes('\\begin{array}') || (text.startsWith('$$') && text.endsWith('$$'))
    })
  } catch (err) {
    console.error('公式渲染失败:', err)
    return text
  }
}

function handleFileChange(e) {
  selectedFile.value = e.target.files[0]
  if (selectedFile.value) {
    previewImage.value = URL.createObjectURL(selectedFile.value)
    uploadFile()
  }
}

async function uploadFile() {
  if (!selectedFile.value) {
    alert('请先选择图片')
    return
  }
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  try {
    const res = await axios.post('/api/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200 && res.data) {
      let dataField = res.data.Data
      if (typeof dataField === 'string') {
        try {
          const parsed = JSON.parse(dataField)
          questionData.value = parsed.content || ''
        } catch (e) {
          console.warn('解析 Data 字符串失败', e)
          questionData.value = dataField.content || ''
        }
      } else if (typeof dataField === 'object') {
        questionData.value = dataField.content || ''
      } else if (res.data.content) {
        questionData.value = res.data.content
      } else {
        alert('返回数据结构不符合预期')
      }

      // OCR识别成功后，调用AI接口获取学科和知识点
      if (questionData.value) {
        try {
          const aiResult = await extractSubjectAndKnowledge(questionData.value)
          if (aiResult.subject) {
            subject.value = aiResult.subject
          }
          if (aiResult.knowledgePoint) {
            chapter.value = aiResult.knowledgePoint
          }
        } catch (error) {
          console.error('获取学科和知识点失败:', error)
        }
      }
    } else {
      alert('返回数据结构不符合预期')
    }
  } catch (err) {
    console.error('OCR 识别失败:', err)
    alert('识别失败，请重试')
  }
}

// 编辑状态相关
const isEditable = ref(false)
const activateEdit = () => {
  isEditable.value = true
}
const updateContent = (index, event) => {
  const newText = event.target.innerText
  const newContent = [...formattedContent.value]
  newContent[index] = newText
  questionData.value = newContent.join('\n')
  isEditable.value = false
}

const router = useRouter()
const goBack = () => router.back()
const handleSave = () => {
  console.log('保存数据:', {
    subject: subject.value,
    chapter: chapter.value,
    content: questionData.value,
    errorType: errorType.value,
    yourAnswer: yourAnswer.value // 新增字段
  });
};

// 弹出框控制
const isChoiceModalOpen = ref(false)
const isPhotoModalOpen = ref(false)
const fileInput = ref(null)

const openChoiceModal = () => {
  isChoiceModalOpen.value = true
}

const closeChoiceModal = () => {
  isChoiceModalOpen.value = false
}

const handleFileUploadChoice = () => {
  closeChoiceModal()
  setTimeout(() => {
    fileInput.value.click()
  }, 100)
}

const handlePhotoChoice = () => {
  closeChoiceModal()
  isPhotoModalOpen.value = true
}

const handlePhotoCaptured = (dataUrl) => {
  if (dataUrl) {
    const blob = dataURLtoBlob(dataUrl)
    selectedFile.value = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
    previewImage.value = URL.createObjectURL(selectedFile.value)
    uploadFile()
  }
  closePhotoModal()
}

const closePhotoModal = () => {
  isPhotoModalOpen.value = false
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
</script>

<style lang="less" scoped>
@primary-color: #2196F3;

.upload-page {
  min-height: 100vh;
  box-sizing: border-box;
}

.upload-header {
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;

  .iconfont {
    color: @primary-color;
    font-size: 20px;
    cursor: pointer;
  }

  .header-title {
    color: #333;
    font-size: 18px;
    font-weight: 600;
    flex: 1;
    text-align: center;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .header-save-btn {
    background: none;
    border: none;
    color: @primary-color;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 0 8px;
  }
}

.upload-container {
  background-color: #fff;
  width: 100%;
  max-width: 600px;
  margin: auto;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 8px;
}

.upload-area {
  background-color: #F9FAFB;
  border: 2px dashed @primary-color;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 150px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  &:hover {
    background-color: #E3F2FD;
  }

  .iconfont {
    font-size: 36px;
    color: @primary-color;
    display: block;
    margin-bottom: 8px;
  }

  p {
    color: #666;
    margin: 0;
  }
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  width: auto;
  height: auto;
  margin: auto;
  object-fit: contain;
  border-radius: 8px;
}

.content-wrapper {
  background-color: #F9FAFB;
  border-radius: 8px;
  margin-top: 20px;

  p {
    padding: 8px;
    font-weight: bold;
    font-size: 15px;
  }

  .content-line {
    padding: 8px;
    border-radius: 4px;
    transition: all 0.3s;
    cursor: text;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;

    &:hover {
      background: #f8f9fa;
    }

    &:focus {
      outline: none;
      background: #fff;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }
  }
}

.form-container {
  margin-top: 24px;
  display: grid;
  gap: 24px;

  .form-item {
    display: flex;
    align-items: center;
    gap: 12px;

    label {
      width: 80px;
      color: #666;
      text-align: right;
      flex-shrink: 0;
    }

    .form-control {
      background-color: #F9FAFB;
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s;
      outline: none;

      &:focus {
        border-color: @primary-color;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
    }

    .select-wrapper {
      position: relative;
      flex: 1;

      select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 100%;
        padding: 12px;
        padding-right: 40px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #F9FAFB;
        font-size: 14px;
        outline: none;
        transition: all 0.3s;

        &:focus {
          border-color: @primary-color;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
      }

      .iconfont {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        pointer-events: none;
        font-size: 16px;
        color: @primary-color;
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slide-up 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.icon-close {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.icon-close:hover {
  color: #666;
}

.modal-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  background: @primary-color;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.modal-btn:hover {
  background: darken(@primary-color, 10%);
}

.modal-btn .iconfont {
  margin-right: 8px;
}

@keyframes slide-up {
  from {
    transform: translateY(50px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}
// 修改弹出框样式，去除边框和蓝色
.van-popup {
  border: none;
  background-color: #fff; // 设置背景颜色为白色，可按需调整
}

// 去除按钮的蓝色背景和边框，添加上边框
.van-button {
  background-color: transparent; // 去除背景颜色
  border: none; // 去除边框
  border-top: 1px solid #eee; // 添加上边框，颜色可按需调整
  color: #333; // 设置文字颜色，可按需调整
}

// 去除按钮悬停时的蓝色背景
.van-button:hover {
  background-color: transparent;
}
</style>