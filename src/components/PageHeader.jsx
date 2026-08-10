import InlineEditableText from './InlineEditableText'

export default function PageHeader({ eyebrow, title, description, action, editing = false, onTextChange }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <InlineEditableText as="p" className="eyebrow" value={eyebrow} editing={editing} onChange={(value) => onTextChange?.('eyebrow', value)} ariaLabel="英文小标题" />}
        <InlineEditableText as="h1" value={title} editing={editing} onChange={(value) => onTextChange?.('title', value)} ariaLabel="页面标题" />
        {description && <InlineEditableText as="p" className="page-description" value={description} editing={editing} onChange={(value) => onTextChange?.('description', value)} ariaLabel="页面说明" />}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  )
}
