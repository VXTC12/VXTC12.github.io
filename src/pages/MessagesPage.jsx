import { useState } from 'react'
import { Clock3, Heart, Mail, MailOpen, Plus, Send, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { siteConfig } from '../data/siteConfig'
import { countdownLabel, daysUntil, formatDate, todayInputValue } from '../utils/date'
import { createId } from '../utils/id'

function MessageForm({ couple, onSave, onClose }) {
  const [form, setForm] = useState({
    kind: 'message',
    author: couple.personOne.name,
    date: todayInputValue(),
    title: '',
    content: '',
    openDate: '',
  })
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...form, id: createId(form.kind) })
    onClose()
  }

  return (
    <form className="entry-form" onSubmit={submit}>
      <div className="message-kind-tabs full-field" role="group" aria-label="留言类型">
        <button type="button" className={form.kind === 'message' ? 'active' : ''} onClick={() => setForm({ ...form, kind: 'message' })}><Send size={17} /> 短留言</button>
        <button type="button" className={form.kind === 'letter' ? 'active' : ''} onClick={() => setForm({ ...form, kind: 'letter' })}><Mail size={17} /> 未来信箱</button>
      </div>
      <label>留言人<select name="author" value={form.author} onChange={update}>
        <option>{couple.personOne.name}</option>
        <option>{couple.personTwo.name}</option>
      </select></label>
      <label>写信日期<input required type="date" name="date" value={form.date} onChange={update} /></label>
      {form.kind === 'letter' && (
        <>
          <label>信件标题<input required name="title" value={form.title} onChange={update} placeholder="写给未来的我们" /></label>
          <label>允许打开日期<input required min={form.date} type="date" name="openDate" value={form.openDate} onChange={update} /></label>
        </>
      )}
      <label className="full-field">{form.kind === 'letter' ? '信的内容' : '想说的话'}<textarea required name="content" value={form.content} onChange={update} rows="6" placeholder={form.kind === 'letter' ? '写下只有到那一天才能读到的话……' : '留下一句今天想告诉对方的话……'} /></label>
      <div className="form-actions full-field">
        <button type="button" className="button secondary" onClick={onClose}>取消</button>
        <button type="submit" className="button primary">{form.kind === 'letter' ? '封存这封信' : '留下这句话'}</button>
      </div>
    </form>
  )
}

export default function MessagesPage({ items, settings = siteConfig, addItem, deleteItem }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [openedLetters, setOpenedLetters] = useState([])
  const messages = [...items].filter((item) => item.kind === 'message').sort((a, b) => b.date.localeCompare(a.date))
  const letters = [...items].filter((item) => item.kind === 'letter').sort((a, b) => a.openDate.localeCompare(b.openDate))

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="LOVE LETTERS"
        title="留言与情书"
        description="有些话现在就想告诉你，有些话想留给未来的我们。"
        action={<button type="button" className="button primary" onClick={() => setModalOpen(true)}><Plus size={18} /> 写留言 / 信</button>}
      />

      <section className="message-section">
        <div className="section-heading compact">
          <div><p className="eyebrow">NOTES FOR YOU</p><h2>给你的留言</h2></div>
          <span className="message-count">{messages.length} 条心里话</span>
        </div>
        <div className="message-grid">
          {messages.map((item, index) => (
            <article className={`message-note note-color-${index % 3}`} key={item.id}>
              <span className="pushpin" aria-hidden="true" />
              <Heart className="note-heart" size={18} fill="currentColor" />
              <p>{item.content}</p>
              <footer><strong>— {item.author}</strong><span>{formatDate(item.date)}</span></footer>
              <button type="button" className="delete-note" aria-label="删除留言" onClick={() => {
                if (window.confirm('确定删除这条留言吗？')) deleteItem('messages', item.id)
              }}><Trash2 size={15} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="letter-section">
        <div className="section-heading compact">
          <div><p className="eyebrow">FUTURE MAILBOX</p><h2>未来信箱</h2></div>
          <span className="handwritten-note">把期待寄给以后的我们。</span>
        </div>
        <div className="letter-grid">
          {letters.map((letter) => {
            const days = daysUntil(letter.openDate, false)
            const unlocked = days !== null && days <= 0
            const opened = openedLetters.includes(letter.id)
            return (
              <article className={`letter-card ${unlocked ? 'unlocked' : 'locked'}`} key={letter.id}>
                <div className="envelope" aria-hidden="true">
                  {unlocked ? <MailOpen size={39} /> : <Mail size={39} />}
                  {!unlocked && <span className="wax-seal"><Heart size={15} fill="currentColor" /></span>}
                </div>
                <div className="letter-info">
                  <p className="entry-date">{unlocked ? '信件已经抵达' : '一封等待时间开启的信'}</p>
                  <h3>{letter.title}</h3>
                  <p>写信人：{letter.author} · {formatDate(letter.date)}</p>
                  {!unlocked && <strong className="letter-countdown"><Clock3 size={17} /> {countdownLabel(days)}可以打开</strong>}
                  {unlocked && !opened && <button type="button" className="button primary small" onClick={() => setOpenedLetters([...openedLetters, letter.id])}><MailOpen size={17} /> 打开这封信</button>}
                  {unlocked && opened && <blockquote>{letter.content}</blockquote>}
                </div>
                <button type="button" className="delete-letter" aria-label="删除信件" onClick={() => {
                  if (window.confirm('确定删除这封未来信吗？')) deleteItem('messages', letter.id)
                }}><Trash2 size={16} /></button>
              </article>
            )
          })}
        </div>
      </section>

      {modalOpen && (
        <Modal title="写给重要的人" onClose={() => setModalOpen(false)}>
          <MessageForm couple={settings.couple} onClose={() => setModalOpen(false)} onSave={(item) => addItem('messages', item)} />
        </Modal>
      )}
    </div>
  )
}
