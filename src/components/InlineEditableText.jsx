import { useEffect, useRef } from 'react'

export default function InlineEditableText({ as: Tag = 'span', value, editing, onChange, className = '', ariaLabel }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value
    }
  }, [value])

  if (!editing) return <Tag className={className}>{value}</Tag>

  const finishEditing = (event) => {
    const nextValue = event.currentTarget.innerText.replace(/\s+/g, ' ').trim()
    if (!nextValue) {
      event.currentTarget.innerText = value
      return
    }
    if (nextValue !== value) onChange(nextValue)
  }

  return (
    <Tag
      ref={ref}
      className={`${className} inline-editable`.trim()}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex="0"
      aria-label={ariaLabel || '可编辑文字'}
      title="点击后直接修改"
      onBlur={finishEditing}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          event.currentTarget.innerText = value
          event.currentTarget.blur()
        }
      }}
    >
      {value}
    </Tag>
  )
}
