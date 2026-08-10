import { Check, PencilLine, X } from 'lucide-react'

export default function PageEditToolbar({ onSave, onCancel }) {
  return (
    <aside className="page-edit-toolbar" role="region" aria-label="页面文字编辑工具栏">
      <div><PencilLine size={18} /><span><strong>直接编辑中</strong><small>点击带虚线的文字修改，可切换页面继续编辑。</small></span></div>
      <div className="page-edit-actions">
        <button type="button" className="button secondary" onClick={onCancel}><X size={17} /> 取消</button>
        <button type="button" className="button primary" onClick={onSave}><Check size={17} /> 保存修改</button>
      </div>
    </aside>
  )
}
