import { Heart } from 'lucide-react'

export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-heart"><Heart size={28} fill="currentColor" /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
