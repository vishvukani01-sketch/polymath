import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { getDomainById } from '../../lib/domains'
import { Search, Flame, Zap, ChevronDown, ChevronUp } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('total_xp')
  const [sortDir, setSortDir] = useState('desc')
  const [expandedUser, setExpandedUser] = useState(null)

  useEffect(() => { fetchUsers() }, [sortKey, sortDir])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles')
      .select('*, activity_log(domain_id, xp_earned, created_at)')
      .order(sortKey, { ascending: sortDir === 'asc' })
      .limit(100)
    setLoading(false)
    setUsers(data || [])
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = users.filter(u =>
    !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const SortIcon = ({ col }) => sortKey === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronDown size={12} className="opacity-20" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Users</h1>
        <p className="text-white/40 font-body text-sm">{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..." className="input-field pl-9 py-2 text-sm" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase">User</th>
              <th className="px-4 py-3 text-white/40 text-xs font-bold uppercase cursor-pointer hover:text-white hidden md:table-cell"
                onClick={() => toggleSort('total_xp')}>
                <div className="flex items-center gap-1">XP <SortIcon col="total_xp" /></div>
              </th>
              <th className="px-4 py-3 text-white/40 text-xs font-bold uppercase cursor-pointer hover:text-white hidden md:table-cell"
                onClick={() => toggleSort('streak_days')}>
                <div className="flex items-center gap-1">Streak <SortIcon col="streak_days" /></div>
              </th>
              <th className="px-4 py-3 text-white/40 text-xs font-bold uppercase hidden md:table-cell">Level</th>
              <th className="px-4 py-3 text-white/40 text-xs font-bold uppercase hidden lg:table-cell">Domains</th>
              <th className="text-right px-4 py-3 text-white/40 text-xs font-bold uppercase">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-10 text-white/30 font-body">Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-white/30 font-body">No users found</td></tr>
            )}
            {filtered.map(user => (
              <>
                <tr key={user.id}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center font-display text-sm text-primary-400 flex-shrink-0">
                        {user.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{user.display_name}</p>
                        <p className="text-white/30 text-xs font-body">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-accent-yellow font-bold flex items-center gap-1">
                      <Zap size={12} /> {(user.total_xp || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-orange-400 font-bold flex items-center gap-1">
                      <Flame size={12} /> {user.streak_days || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-display text-white">Lv.{user.level || 1}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1">
                      {(user.selected_domains || []).slice(0, 4).map(id => {
                        const d = getDomainById(id)
                        return d ? <span key={id} title={d.name}>{d.emoji}</span> : null
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white/30 text-xs font-body">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>

                {/* Expanded row */}
                {expandedUser === user.id && (
                  <tr key={user.id + '_exp'} className="border-b border-white/5 bg-dark-600/50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {[
                          { label: 'Total XP', val: (user.total_xp || 0).toLocaleString(), color: 'text-accent-yellow' },
                          { label: 'Streak', val: `${user.streak_days || 0} days`, color: 'text-orange-400' },
                          { label: 'Level', val: user.level || 1, color: 'text-primary-400' },
                          { label: 'Last Active', val: user.last_activity_date || 'Never', color: 'text-white/60' },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="card p-3 text-center">
                            <p className={`font-bold text-sm ${color}`}>{val}</p>
                            <p className="text-white/30 text-xs mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-bold mb-2">SELECTED DOMAINS</p>
                        <div className="flex flex-wrap gap-2">
                          {(user.selected_domains || []).map(id => {
                            const d = getDomainById(id)
                            return d ? (
                              <span key={id} className="px-2 py-1 rounded-full text-xs font-bold"
                                style={{ color: d.color, backgroundColor: d.color + '20' }}>
                                {d.emoji} {d.name}
                              </span>
                            ) : null
                          })}
                          {(!user.selected_domains || user.selected_domains.length === 0) && (
                            <span className="text-white/20 text-xs">No domains selected</span>
                          )}
                        </div>
                      </div>
                      {user.activity_log && user.activity_log.length > 0 && (
                        <div className="mt-3">
                          <p className="text-white/40 text-xs font-bold mb-2">RECENT ACTIVITY</p>
                          <div className="flex flex-col gap-1">
                            {user.activity_log.slice(0, 5).map((log, i) => {
                              const d = getDomainById(log.domain_id)
                              return (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-white/60">{d ? `${d.emoji} ${d.name}` : log.domain_id}</span>
                                  <span className="text-accent-yellow font-bold">+{log.xp_earned} XP</span>
                                  <span className="text-white/30">{new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
