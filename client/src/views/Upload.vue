<template>
  <!-- 拍题录入页面 -->
  <div class="upload-page">
    <!-- 页面头部 -->
    <header class="upload-header">
      <i class="iconfont icon-jiantou" @click="goBack"></i>
      <h1 class="header-title">拍题录入</h1>
      <button class="header-save-btn" @click="handleSave">保存</button>
    </header>

    <!-- 上传容器 -->
    <div class="upload-container">
      <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;" />

      <!-- 拍照区域，点击弹出选择框选择输入方式 -->
      <div class="upload-area" @click="openChoiceModal">
        <template v-if="previewImage">
          <img :src="previewImage" alt="预览图片" class="preview-image" />
        </template>
        <template v-else>
          <i class="iconfont icon-paizhao"></i>
          <p>点击拍照或上传截图</p>
        </template>
      </div>

      <!-- 识别结果展示区域 -->
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

      <!-- 表单区域，用于输入题目相关信息 -->
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

      <!-- 遮罩层和加载组件 -->
      <div v-if="loading" class="loading-overlay">
        <van-loading size="40px" text-color="#fff" color="#fff" vertical type="spinner">解析学科和知识点中...</van-loading>
      </div>
    </div>

    <!-- 选择输入方式的弹出框 -->
    <van-popup v-model:show="isChoiceModalOpen" position="bottom" round>
      <div style="padding: 16px;">
        <div style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 16px;">选择输入方式</div>
        <van-button block @click="handleFileUploadChoice">
          <i class="iconfont icon-upload"></i> 文件上传
        </van-button>
        <van-button block type="primary" @click="handlePhotoChoice" style="margin-top: 8px;">
          <i class="iconfont icon-paizhao"></i> 拍照
        </van-button>
      </div>
    </van-popup>

    <!-- 拍照组件，显示相机界面 -->
    <photo v-if="isPhotoModalOpen" @photo-captured="handlePhotoCaptured" @close="closePhotoModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '../api/axios'
import { extractSubjectAndKnowledge, getErrorTypes, saveWrongQuestion } from '../api'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import Photo from '@/components/Photo.vue'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'

// 表单数据
const subject = ref('')
const chapter = ref('')
const errorType = ref('')
const yourAnswer = ref('')
const errorTypes = ref([])

// 文件和 OCR 返回内容
const selectedFile = ref(null)
const questionData = ref('')
const previewImage = ref('')

// 编辑状态相关
const isEditable = ref(false)

// 弹出框控制
const isChoiceModalOpen = ref(false)
const isPhotoModalOpen = ref(false)
const fileInput = ref(null)

// 路由实例
const router = useRouter()

// 添加加载状态
const loading = ref(false)

onMounted(async () => {
  try {
    const result = await getErrorTypes()
    errorTypes.value = result
  } catch (error) {
    console.error('获取错误类型失败:', error)
  }
})

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
    showFailToast('请先选择图片')
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
          showFailToast('解析数据失败')
          questionData.value = dataField.content || ''
        }
      } else if (typeof dataField === 'object') {
        questionData.value = dataField.content || ''
      } else if (res.data.content) {
        questionData.value = res.data.content
      } else {
        showFailToast('返回数据结构不符合预期')
      }

      if (questionData.value) {
        loading.value = true
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
          showFailToast('获取学科和知识点失败')
        } finally {
          loading.value = false
        }
      }
    } else {
      showFailToast('返回数据结构不符合预期')
    }
  } catch (err) {
    console.error('OCR 识别失败:', err)
    showFailToast('识别失败，请重试')
  }
}

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

const goBack = () => router.back()

const handleSave = async () => {
  if (!subject.value || !chapter.value || !questionData.value || !errorType.value || !yourAnswer.value) {
    showFailToast('请填写完整后再保存')
    return
  }

  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))
    if (!userInfo?.id) {
      showFailToast('用户信息异常，请重新登录')
      await router.push('/login')
      return
    }
    console.log('点击保存，准备提交错题');
    // 修改响应处理方式
    const { data: saveResult } = await saveWrongQuestion({
      studentId: userInfo.id,
      subject: subject.value,
      chapter: chapter.value,
      content: questionData.value,
      errorType: errorType.value,
      yourAnswer: yourAnswer.value
    })

    // 添加结果校验（新增代码）
    if (!saveResult?.id) {
      throw new Error('保存成功但未返回错题ID')
    }

    showConfirmDialog({
      title: '保存成功',
      message: '题目已成功加入错题本，是否立即查看？',
      confirmButtonText: '查看详情',
      cancelButtonText: '继续录入'
    })
      .then(() => {
        router.push({
          name: 'detail',
          params: {  
            id: saveResult.id
          }
        })
      })
      .catch(() => {
        // 当用户点击“继续录入”时，重置表单和状态
        subject.value = '';
        chapter.value = '';
        questionData.value = '';
        errorType.value = '';
        yourAnswer.value = '';
        selectedFile.value = null;
        previewImage.value = '';
        isEditable.value = false;
        // 提示用户可以继续录入
        showSuccessToast('可以继续录入错题啦');
      })
  } catch (error) {
    // 修改错误处理逻辑（新增代码）
    console.error('保存全过程错误:', error)
    showFailToast(error.response?.data?.message || error.message || '未知错误')
  }
}

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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.van-popup {
  border: none;
  background-color: #fff;
}

.van-button {
  background-color: transparent;
  border: none;
  border-top: 1px solid #eee;
  color: #000000;
}

.van-button:hover {
  background-color: transparent;
}
</style>
