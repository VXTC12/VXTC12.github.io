import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { validatePhoto } from '../services/photoStorage'
import CloudPhoto from './CloudPhoto'

export default function ContentPhotoField({ currentPath, currentImage, selectedFile, onSelect, onError }) {
  const input = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return undefined
    }

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  const choosePhoto = (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return

    try {
      validatePhoto(file)
      onError?.('')
      onSelect(file)
    } catch (error) {
      onError?.(error.message)
    }
  }

  const hasCurrentPhoto = currentPath || currentImage

  return (
    <div className="content-photo-field full-field">
      <span className="field-label">照片</span>
      <div className="content-photo-picker">
        {previewUrl ? (
          <img src={previewUrl} alt="待上传照片预览" />
        ) : hasCurrentPhoto ? (
          <CloudPhoto path={currentPath} fallback={currentImage} alt="当前照片预览" />
        ) : (
          <div className="content-photo-empty"><ImagePlus size={26} /><span>还没有选择照片</span></div>
        )}
        <div>
          <button type="button" className="button secondary" onClick={() => input.current?.click()}>
            <ImagePlus size={17} /> {hasCurrentPhoto || selectedFile ? '更换照片' : '选择照片'}
          </button>
          <small>支持 JPG、PNG、WebP、GIF，单张不超过 8MB。</small>
        </div>
      </div>
      <input ref={input} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choosePhoto} />
    </div>
  )
}
