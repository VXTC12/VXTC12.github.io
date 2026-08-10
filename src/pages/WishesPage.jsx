import { useState } from 'react'
import { CheckCircle2, CircleDashed, Edit3, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { siteConfig } from '../data/siteConfig'
import { formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

const statusInfo = {
  todo: { label: '未完成', icon: CircleDashed },
  doing: { label: '进行中', icon: Sparkles },
  done: { label: '已完成', icon: CheckCircle2 },
}

function WishForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ?? {
    title: '',
    type: '想完成的事情',
    status: 'todo',
    completedDate: '',
    reflection: '',
  })
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    const normalized = form.status === 'done' && !form.completedDate
      ? { ...form, completedDate: todayInputValue() }
      : form
    onSave({ ...normalized, id: item?.id ?? createId('wish') })
    onClose()
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <label className="full-field">心愿内容<input required name="title" value={form.title} onChange={update} placeholder="例如：一起去看一次极光" /></label>
      <label>心愿类型<select name="type" value={form.type} onChange={update}>
        <option>想去的地方</option><option>想完成的事情</option>
      </select></label>
      <label>当前状态<select name="status" value={form.status} onChange={update}>
        <option value="todo">未完成</option><option value="doing">进行中</option><option value="done">已完成</option>
      </select></label>
      {form.status === 'done' && (
        <>
          <label>完成日期<input type="date" name="completedDate" value={form.completedDate} onChange={update} /></label>
          <label className="full-field">打卡感想<textarea name="reflection" value={form.reflection} onChange={update} rows="4" placeholder="完成这个心愿时，最想记住什么？" /></label>
        </>
      )}
      {form.status !== 'done' && (
        <label className="full-field">小计划（选填）<textarea name="reflection" value={form.reflection} onChange={update} rows="3" placeholder="可以写下准备从哪里开始……" /></label>
      )}
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose}>取消</button>
        <button type="submit" className="button primary">保存心愿</button>
      </div>
    </form>
  )
}

export default function WishesPage({ items, addItem, updateItem, deleteItem, pageText = siteConfig.pages.wishes, pageEditing = false, onPageTextChange }) {
  const [editing, setEditing] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const visibleItems = filter === 'all' ? items : items.filter((item) => item.status === filter)
  const counts = Object.keys(statusInfo).reduce((result, status) => ({
    ...result,
    [status]: items.filter((item) => item.status === status).length,
  }), {})

  const openNew = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (item) => { setEditing(item); setModalOpen(true) }
  const changeStatus = (item, status) => updateItem('wishes', {
    ...item,
    status,
    completedDate: status === 'done' ? (item.completedDate || todayInputValue()) : '',
  })

  return (
    <div className="page-container">
      <PageHeader
        eyebrow={pageText.eyebrow}
        title={pageText.title}
        description={pageText.description}
        editing={pageEditing}
        onTextChange={onPageTextChange}
        action={<button type="button" className="button primary" onClick={openNew}><Plus size={18} /> 新增心愿</button>}
      />

      <div className="wish-tabs">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 <span>{items.length}</span></button>
        {Object.entries(statusInfo).map(([status, info]) => (
          <button type="button" key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{info.label} <span>{counts[status]}</span></button>
        ))}
      </div>

      <section className="wish-grid">
        {visibleItems.map((item) => {
          const StatusIcon = statusInfo[item.status].icon
          return (
            <article className={`wish-card status-${item.status}`} key={item.id}>
              <div className="wish-card-top">
                <span className="wish-type"><MapPin size={15} /> {item.type}</span>
                <span className="wish-status"><StatusIcon size={17} /> {statusInfo[item.status].label}</span>
              </div>
              <h2>{item.title}</h2>
              {item.reflection && <p className="wish-note">“{item.reflection}”</p>}
              {item.status === 'done' && <p className="complete-date">✓ {formatDate(item.completedDate)} 完成打卡</p>}
              <label className="inline-status">切换状态<select value={item.status} onChange={(event) => changeStatus(item, event.target.value)}>
                <option value="todo">未完成</option><option value="doing">进行中</option><option value="done">已完成</option>
              </select></label>
              <div className="card-actions">
                <button type="button" onClick={() => openEdit(item)}><Edit3 size={16} /> 编辑 / 打卡</button>
                <button type="button" className="danger-link" onClick={() => {
                  if (window.confirm('确定删除这个心愿吗？')) deleteItem('wishes', item.id)
                }}><Trash2 size={16} /> 删除</button>
              </div>
            </article>
          )
        })}
      </section>

      {modalOpen && (
        <Modal title={editing ? '编辑心愿 / 完成打卡' : '许一个新心愿'} onClose={() => setModalOpen(false)}>
          <WishForm
            item={editing}
            onClose={() => setModalOpen(false)}
            onSave={(item) => editing ? updateItem('wishes', item) : addItem('wishes', item)}
          />
        </Modal>
      )}
    </div>
  )
}
