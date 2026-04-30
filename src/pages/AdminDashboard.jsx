import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AdminDashboard() {
  const navigate = useNavigate()
  const adminName = localStorage.getItem('adminName') || '管理者'
  const [scheduleList, setScheduleList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterPending, setFilterPending] = useState(false) // 承認待ちのみ表示フラグ

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) navigate('/admin-login')
    fetchScheduleList()
  }, [])

  const fetchScheduleList = async () => {
    setIsLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/schedule-list`)
      if (res.data.success) setScheduleList(res.data.list)
    } catch (err) {
      console.error(err)
    } finally { setIsLoading(false) }
  }

  const updateStatus = async (planId, newStatus) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/schedule/update-status`, { plan_id: planId, status: newStatus })
      fetchScheduleList()
    } catch (err) { alert("更新に失敗しました") }
  }

  // フィルタリング処理
  const displayList = filterPending ? scheduleList.filter(s => s.status === '承認待ち') : scheduleList;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            予定申請一覧（承認管理）
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200 cursor-pointer">
              <input type="checkbox" checked={filterPending} onChange={() => setFilterPending(!filterPending)} className="w-4 h-4" />
              承認待ちのみ表示
            </label>
            <button onClick={() => { localStorage.clear(); navigate('/admin-login'); }} className="text-sm text-slate-400 hover:text-slate-600">ログアウト</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b">
              <tr>
                <th className="p-4">日付</th>
                <th className="p-4">氏名</th>
                <th className="p-4">予定時間</th>
                <th className="p-4">食事</th>
                <th className="p-4">状態</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">読み込み中...</td></tr>
              ) : displayList.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">該当する申請はありません</td></tr>
              ) : (
                displayList.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-600">{s.date}</td>
                    <td className="p-4 font-bold text-slate-800">{s.name}</td>
                    <td className="p-4 text-slate-600 text-sm">{s.planIn} ~ {s.planOut}</td>
                    <td className="p-4 text-sm">{s.meal === '予約' ? <span className="text-orange-500 font-bold">🍱 予約</span> : <span className="text-slate-300">-</span>}</td>
                    <td className="p-4">
                      {s.status === '承認待ち' ? <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-[10px] font-bold border border-orange-200">承認待ち</span> : 
                       s.status === '承認済' ? <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-[10px] font-bold border border-blue-200">承認済</span> :
                       <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200">{s.status}</span>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {s.status === '承認待ち' ? (
                          <>
                            <button onClick={() => updateStatus(s.planId, '承認済')} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-all">承認</button>
                            <button onClick={() => updateStatus(s.planId, '差戻し')} className="px-3 py-1 bg-white border border-rose-200 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-50 transition-all">差戻し</button>
                          </>
                        ) : (
                          <button onClick={() => updateStatus(s.planId, '承認待ち')} className="text-xs text-slate-400 hover:text-indigo-600 underline">変更</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard