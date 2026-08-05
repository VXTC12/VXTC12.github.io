import { useMemo, useState } from 'react'
import { Camera, Heart, X } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function GalleryPage({ items }) {
  const [category, setCategory] = useState('全部')
  const [year, setYear] = useState('全部年份')
  const [selected, setSelected] = useState(null)
  const categories = ['全部', ...new Set(items.map((item) => item.category))]
  const years = useMemo(() => ['全部年份', ...new Set(items.map((item) => item.year).sort().reverse())], [items])
  const visibleItems = items.filter((item) =>
    (category === '全部' || item.category === category) &&
    (year === '全部年份' || item.year === year),
  )

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="PHOTO ALBUM"
        title="情侣相册"
        description="照片留住样子，故事留住当时的心情。"
      />

      <div className="gallery-filters">
        <div className="chip-group" aria-label="相册主题筛选">
          {categories.map((item) => (
            <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <label className="year-filter">年份<select value={year} onChange={(event) => setYear(event.target.value)}>
          {years.map((item) => <option key={item}>{item}</option>)}
        </select></label>
      </div>

      <section className="photo-wall">
        {visibleItems.map((item, index) => (
          <button
            type="button"
            className={`gallery-polaroid photo-tilt-${index % 4}`}
            key={item.id}
            onClick={() => setSelected(item)}
            aria-label={`查看照片：${item.title}`}
          >
            <span className="photo-corner" aria-hidden="true"><Heart size={16} fill="currentColor" /></span>
            <img src={item.image} alt={item.title} />
            <span className="gallery-caption">
              <strong>{item.title}</strong>
              <small>{item.year} · {item.category}</small>
            </span>
          </button>
        ))}
      </section>

      {visibleItems.length === 0 && (
        <div className="empty-state"><Camera size={30} /><h3>这个分类还没有照片</h3><p>以后把新的合照放进这里吧。</p></div>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className="photo-story">
            <img src={selected.image} alt={selected.title} />
            <div>
              <p className="eyebrow">{selected.year} · {selected.category}</p>
              <h3>照片背后的故事</h3>
              <p>{selected.story}</p>
              <button type="button" className="button secondary" onClick={() => setSelected(null)}><X size={17} /> 收好照片</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
