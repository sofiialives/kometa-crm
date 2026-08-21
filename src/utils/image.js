/**
 * Отдельного хранилища файлов нет — фото аватарки хранится прямо
 * в базе как data URL (в том же поле avatarUrl, куда обычно попадает
 * ссылка на гугл-фото). Чтобы строка не разрослась, сжимаем и
 * уменьшаем картинку до разумного размера перед отправкой.
 */
export function compressImageToDataUrl(file, maxSize = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Выберите файл изображения'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Файл повреждён или не является изображением'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
