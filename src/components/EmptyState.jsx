import { Heart } from 'lucide-react'
import InlineEditableText from './InlineEditableText'

export default function EmptyState({ title, description, editing = false, onTextChange }) {
  return (
    <div className="empty-state">
      <span className="empty-heart"><Heart size={28} fill="currentColor" /></span>
      <InlineEditableText as="h3" value={title} editing={editing} onChange={(value) => onTextChange?.('emptyTitle', value)} ariaLabel="空状态标题" />
      <InlineEditableText as="p" value={description} editing={editing} onChange={(value) => onTextChange?.('emptyDescription', value)} ariaLabel="空状态说明" />
    </div>
  )
}
