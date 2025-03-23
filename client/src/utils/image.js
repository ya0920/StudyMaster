export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject('请选择图片')
      
      // 格式校验
      const ALLOW_TYPES = ['image/jpeg', 'image/png']
      if (!ALLOW_TYPES.includes(file.type)) 
        return reject('仅支持JPG/PNG格式')
  
      // 大小校验 (5MB)
      if (file.size > 5 * 1024 * 1024) 
        return reject('图片不能超过5MB')
  
      const reader = new FileReader()
      reader.onload = () => {
        // ✅ 关键：去除Base64前缀
        resolve(reader.result.split(',')[1]) 
      }
      reader.onerror = () => reject('文件读取失败')
      reader.readAsDataURL(file)
    })
  }