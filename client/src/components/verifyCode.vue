<template>
  <div>
    <canvas @click="changeImgCode" ref="canvasRef" :width="props.width" :height="height"></canvas>
  </div>
</template>

<script setup>
import { reactive, defineProps, onMounted, ref, defineExpose, toRef } from 'vue'

const props = defineProps({
  width: {
    type: Number,
    default: 120
  },
  height: {
    type: Number,
    default: 40
  },
  length: {
    type: Number,
    default: 4
  }
})
const state = reactive({
  pool: 'ACDEFHJKLMNPRTUVWXY347',
  imgCode: ''
})

onMounted(() => {
  state.imgCode = createImgCode()
})

// 生成验证码
const canvasRef = ref(null)
const createImgCode = () => {
  // 获取画布
  const ctx = canvasRef.value.getContext('2d')
  // 填充颜色
  ctx.fillStyle = randomColor(160, 220)
  // 填充位置
  ctx.fillRect(0, 0, props.width, props.height)
  // 填充文字
  let imgCode = ''
  let length = props.length
  for (let i = 0; i < length; i++) {
    const text = state.pool[randomNum(0, state.pool.length)]
    imgCode += text
    const fontSize = randomNum(18, 40)
    const deg = randomNum(-45, 45)
    // 绘制文字
    ctx.font = `${fontSize}px SimHei`
    ctx.textBaseline = 'top'
    // 填充的文字颜色
    ctx.fillStyle = randomColor(80, 160)
    ctx.save()
    ctx.translate(30 * i + 15, 15)
    ctx.rotate((Math.PI * deg) / 180)
    ctx.fillText(text, -10, -15)
    ctx.restore()
  }
  // 绘制干扰线
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(randomNum(0, props.width), randomNum(0, props.height))
    ctx.lineTo(randomNum(0, props.width), randomNum(0, props.height))
    ctx.strokeStyle = randomColor(180, 230)
    ctx.closePath()
    ctx.stroke()
  }
  // 绘制干扰点
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    ctx.arc(randomNum(0, props.width), randomNum(0, props.height), 1, 0, 2 * Math.PI)
    ctx.fillStyle = randomColor(150, 200)
    ctx.closePath()
    ctx.fill()
  }

  return imgCode
}

const randomNum = (min, max) => {
  return parseInt(Math.random() * (max - min) + min)
}
const randomColor = (min, max) => {
  const r = randomNum(min, max)
  const g = randomNum(min, max)
  const b = randomNum(min, max)
  return `rgb(${r},${g},${b})`  // rgb(0,0,0)
}


const changeImgCode = () => {
  state.imgCode = createImgCode()
  console.log('changeImgCode:', state.imgCode);
  
}

// 暴露给父组件
const verifyCode = toRef(state, 'imgCode')
defineExpose({
  verifyCode: verifyCode,
  changeImgCode: changeImgCode
})
</script>

<style lang="less" scoped>

</style>