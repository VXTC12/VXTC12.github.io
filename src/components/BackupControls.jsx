import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'

export default function BackupControls({ data, onImport }) {
  const fileInput = useRef(null)
  const [message, setMessage] = useState('')

  const exportBackup = () => {
    const backup = {
      version: 1,
      site: '我们的小世界',
      exportedAt: new Date().toISOString(),
      data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `我们的小世界-备份-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('备份已导出')
    window.setTimeout(() => setMessage(''), 2200)
  }

  const importBackup = async (event) => {
    const [file] = event.target.files
    event.target.value = ''
    if (!file) return

    try {
      const parsed = JSON.parse(await file.text())
      const importedData = parsed.data ?? parsed
      const sections = ['timeline', 'daily', 'gallery', 'wishes', 'anniversaries', 'messages']
      if (!sections.every((section) => Array.isArray(importedData[section]))) {
        throw new Error('备份格式不完整')
      }
      if (window.confirm('导入会替换当前浏览器中的全部记录，确定继续吗？')) {
        onImport(importedData)
        setMessage('备份已导入')
      }
    } catch {
      setMessage('导入失败，请选择本站导出的 JSON 文件')
    }
    window.setTimeout(() => setMessage(''), 3200)
  }

  return (
    <div className="backup-controls">
      <button type="button" className="text-button" onClick={exportBackup}>
        <Download size={17} /> 导出备份
      </button>
      <button type="button" className="text-button" onClick={() => fileInput.current?.click()}>
        <Upload size={17} /> 导入备份
      </button>
      <input
        ref={fileInput}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={importBackup}
        aria-label="选择备份文件"
      />
      {message && <span className="backup-message" role="status">{message}</span>}
    </div>
  )
}
