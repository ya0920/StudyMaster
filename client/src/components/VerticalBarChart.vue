<template>
  <div class="chart-container" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: Array
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return

  // 每次初始化前清除旧实例
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)

  // 空状态判断
  if (props.data.length === 0 || props.data.every(item => item.value === 0)) {
    chartInstance.setOption({
      graphic: [{
        type: 'text',
        left: 'center',   // 使用 left 和 top 定位
        top: 'middle',
        style: {
          text: '🎉 本周表现完美，无错题记录！',
          fontSize: 16,
          fill: '#999'
        }
      }]
    })
    return // 停止后续执行
  }
  const option = {
    // 新增grid配置减少顶部留白
    grid: {
        top: '15%',
        bottom: '30%'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLabel: {
        color: '#666',
        rotate: 45
      },
      axisLine: {
        lineStyle: {
          color: '#DCDFE6'
        }
      }
    },
    yAxis: {
      type: 'value',
      // 动态设置最大值：取数据最大值 + 20%缓冲空间
      max: value => {
        const maxVal = Math.max(...props.data.map(item => item.value))
        return maxVal > 0 ? Math.ceil(maxVal * 1.2) : 10
      },
      min: 0,
      axisLabel: {
        formatter: value => Math.floor(value) === value ? value : '' // 只显示整数
      }
    },
    series: [{
      type: 'bar',
      data: props.data.map(item => ({
        value: item.value,
        itemStyle: {
          color: getColor(item.value)
        }
      })),
      barWidth: '60%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  chartInstance.setOption(option)
}

const getColor = (value) => {
  // 获取数据中的最大值
  const maxVal = Math.max(...props.data.map(item => item.value)) || 1

  // 动态计算阈值（可根据实际需求调整比例）
  const highThreshold = maxVal * 0.6  // 前40%为红色
  const mediumThreshold = maxVal * 0.3 // 30%-60%为橙色

  // 按动态阈值返回颜色
  if (value >= highThreshold) return '#ff4444'    // 严重问题区
  if (value >= mediumThreshold) return '#ffa500' // 需要注意区
  return '#4CAF50'                               // 正常区
}

const resizeHandler = () => {
  chartInstance?.resize()
}

// 原来的onMounted和onBeforeUnmount保持不变
onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  chartInstance?.dispose()
})

watch(() => props.data, () => {
  initChart()
}, { deep: true })

</script>

<style lang="less" scoped>
.chart-container {
  width: 100%;
  height: 400px; // 从400px调整为300px
  background: white;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 300px; // 同时调整移动端高度

    :deep(.echarts) {
      .xAxis .label {
        font-size: 12px;
      }

      .bar-label {
        font-size: 10px;
      }
    }
  }
}
</style>