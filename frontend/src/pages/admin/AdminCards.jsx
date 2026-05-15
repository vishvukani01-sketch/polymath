import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { DOMAINS, getDomainById } from '../../lib/domains'
import { KNOWLEDGE_CARDS } from '../../lib/knowledge'
import { Plus, Pencil, Trash2, X, Check, Search, Filter } from 'lucide-react'

const EMPTY_CARD = {
  id: '', topic: '', title: '', content: '', funFact: '', xp: 10, difficulty: 'beginner',
}

export default function AdminCards() {
  const [cards, setCards] = useState(() => {
    // Merge all static cards into a flat list with domainId
    const all = []
    Object.entries(KNOWLEDGE_CARDS).forEach(([domainId, domainCards]) => {
      domainCards.forEach(c => all.push({ ...c, domainId }))
    })
    return all
  })

  const [filterDomain, setFilterDomain] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCard, setEditCard] = useState(null)   // null = new card
  const [form, setForm] = useState(EMPTY_CARD)
  const [formDomain, setFormDomain] = useState('science')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = useMemo(() => {
    return cards.filter(c => {
      if (filterDomain !== 'all' && c.domainId !== filterDomain) return false
      if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !c.content.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [cards, filterDomain, filterDifficulty, search])

  const openNew = () => {
    setEditCard(null)
    setForm({ ...EMPTY_CARD, id: `custom_${Date.now()}` })
    setFormDomain('science')
    setShowModal(true)
  }

  const openEdit = (card) => {
    setEditCard(card)
    setForm({ ...card })
    setFormDomain(card.domainId)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required')
    if (!form.topic.trim()) return toast.error('Topic is required')

    if (editCard) {
      setCards(prev => prev.map(c => c.id === editCard.id ? { ...form, domainId: formDomain } : c))
      toast.success('Card updated!')
    } else {
      setCards(prev => [...prev, { ...form, domainId: formDomain }])
      toast.success('Card added!')
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    setCards(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
    toast.success('Card deleted')
  }

  const exportCards = () => {
    // Group back by domain
    const grouped = {}
    cards.forEach(c => {
      const { domainId, ...card } = c
      if (!grouped[domainId]) grouped[domainId] = []
      grouped[domainId].push(card)
    })
    const blob = new Blob([
      `// Auto-exported from Polymath Admin\n// Paste this into frontend/src/lib/knowledge.js\n\nexport const KNOWLEDGE_CARDS = ${JSON.stringify(grouped, null, 2)}\n`
    ], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'knowledge_cards.js'; a.click()
    toast.success('Exported! Replace your knowledge.js with this file.')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Knowledge Cards</h1>
          <p className="text-white/40 font-body text-sm">{cards.length} total cards across {Object.keys(KNOWLEDGE_CARDS).length} domains</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCards} className="btn-secondary text-sm py-2 px-4">⬇️ Export JS</button>
          <button onClick={openNew} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            <Plus size={16} /> New Card
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search cards..." className="input-field pl-9 py-2 text-sm" />
        </div>
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}
          className="input-field py-2 text-sm w-auto">
          <option value="all">All Domains</option>
          {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
        </select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
          className="input-field py-2 text-sm w-auto">
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Cards table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase">Card</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase hidden md:table-cell">Domain</th>
              <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase hidden md:table-cell">Difficulty</th>
              <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">XP</th>
              <th className="text-right px-4 py-3 text-white/40 text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-white/30 font-body">No cards found</td></tr>
            )}
            {filtered.map(card => {
              const domain = getDomainById(card.domainId)
              return (
                <tr key={card.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white leading-tight">{card.title}</p>
                    <p className="text-white/30 text-xs mt-0.5 font-body truncate max-w-[220px]">{card.topic}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {domain && (
                      <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: domain.color }}>
                        {domain.emoji} {domain.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize
                      ${card.difficulty === 'beginner' ? 'bg-green-500/15 text-green-400' :
                        card.difficulty === 'intermediate' ? 'bg-orange-500/15 text-orange-400' :
                        'bg-red-500/15 text-red-400'}`}>
                      {card.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-accent-yellow font-bold">+{card.xp}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(card)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all">
                        <Pencil size={14} />
                      </button>
                      {deleteConfirm === card.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(card.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-all">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(card.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl text-white">{editCard ? 'Edit Card' : 'New Card'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Domain + Topic row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Domain</label>
                    <select value={formDomain} onChange={e => setFormDomain(e.target.value)} className="input-field text-sm">
                      {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Topic</label>
                    <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                      className="input-field text-sm" placeholder="e.g. Physics" />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="input-field" placeholder="Card title" />
                </div>

                {/* Content */}
                <div>
                  <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Content * <span className="text-white/20 normal-case font-normal">(main explanation)</span></label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    className="input-field min-h-[100px] resize-y" placeholder="Explain the concept clearly in 2-4 sentences..." />
                </div>

                {/* Fun fact */}
                <div>
                  <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Fun Fact <span className="text-white/20 normal-case font-normal">(shown on card flip)</span></label>
                  <textarea value={form.funFact} onChange={e => setForm({ ...form, funFact: e.target.value })}
                    className="input-field min-h-[80px] resize-y" placeholder="🤯 An interesting related fact..." />
                </div>

                {/* XP + Difficulty row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">XP Reward</label>
                    <input type="number" min={5} max={50} step={5}
                      value={form.xp} onChange={e => setForm({ ...form, xp: parseInt(e.target.value) || 10 })}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Difficulty</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="input-field text-sm">
                      <option value="beginner">🌱 Beginner</option>
                      <option value="intermediate">🔥 Intermediate</option>
                      <option value="advanced">⚡ Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {form.title && (
                  <div>
                    <label className="text-white/60 text-xs font-bold mb-1.5 block uppercase">Preview</label>
                    <div className="card p-4 border border-white/10">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: getDomainById(formDomain)?.color }}>{form.topic}</p>
                      <p className="font-display text-lg text-white mb-2">{form.title}</p>
                      <p className="text-white/70 text-sm font-body leading-relaxed">{form.content}</p>
                      {form.funFact && (
                        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-white/60 text-xs font-body">{form.funFact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSave} className="btn-primary flex-1">
                    {editCard ? 'Save Changes' : 'Add Card'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
