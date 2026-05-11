import { useState, useEffect } from 'react';
import axios from 'axios';

function AttendanceListTab({ selectedStoreId }) {
  const adminName = localStorage.getItem('adminName') || '管理者'; // ★この1行を追加
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // フィルター用State
  const [users, setUsers] = useState([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [filterLate, setFilterLate] = useState(false);

  // ★ここを追加：編集モーダル用のState
  const [editModal, setEditModal] = useState({
    isOpen: false, item: null,
    planIn: '', planOut: '', actIn: '', actOut: '', note: ''
  });

  // ★追加：新規登録モーダル用のState
  const [newModal, setNewModal] = useState({
    isOpen: false, userId: '', date: '', planIn: '', planOut: '', actIn: '', actOut: '', note: ''
  });
  // ★追加：新規登録の利用者検索用State
  const [newUserSearch, setNewUserSearch] = useState('');
  const [isNewUserDropdownOpen, setIsNewUserDropdownOpen] = useState(false);

  const fetchAttendanceList = async () => {
    if (!selectedStoreId) return; // ★追加
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      // ★ store_id を追加
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attendance-list`, { params: { year, month, store_id: selectedStoreId } });
      if (res.data.success) setAttendanceList(res.data.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAttendanceList();
  }, [currentMonth, selectedStoreId]);

  const clearFilters = () => {
    setSearchName('');
    setStartDate('');
    setEndDate('');
    setFilterMissing(false);
    setFilterLate(false);
  };

  const changeMonth = (diff) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
  };

  // ★編集内容を保存する処理
  const handleUpdate = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/attendance/update-time`, {
        plan_id: editModal.item.id,
        plan_in: editModal.planIn,
        plan_out: editModal.planOut,
        act_in: editModal.actIn,
        act_out: editModal.actOut,
        note: editModal.note,
        operator: adminName // ★operator追加
      });
      setEditModal({ ...editModal, isOpen: false });
      fetchAttendanceList(); // 最新データを再取得
    } catch (err) {
      alert("更新に失敗しました");
    }
  };

  // ★追加：新規登録を保存する処理
  const handleCreateNew = async () => {
    if (!newModal.userId || !newModal.date) {
      alert("「利用者」と「対象日」は必須項目です。");
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/attendance/create-new`, {
        ...newModal,
        operator: adminName
      });
      setNewModal({ isOpen: false, userId: '', date: '', planIn: '', planOut: '', actIn: '', actOut: '', note: '' });
      fetchAttendanceList(); // 一覧を再取得
    } catch (err) {
      alert("新規登録に失敗しました。");
    }
  };

  // フィルタリング処理
  const filteredList = attendanceList.filter(item => {
    if (searchName && !item.name.includes(searchName)) return false;
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    if (filterMissing && item.status !== '打刻漏れ') return false;
    if (filterLate && item.status !== '遅刻' && item.status !== '早退') return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <style>{`
        /* ★修正：背景を #f1f5f9 に、下線を #cbd5e1 に変更 */
        .admin-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 1rem; text-align: left; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        .admin-table td { padding: 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .admin-table tr:hover td { background-color: #f8fafc; }
      `}</style>

      {/* 検索・絞り込みバー */}
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-bold">◀</button>
            <span className="text-lg font-bold text-slate-800 w-36 text-center tracking-widest">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-bold">▶</button>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto relative z-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">NAME</span>
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setIsUserDropdownOpen(true);
                }}
                onFocus={() => setIsUserDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsUserDropdownOpen(false), 200)}
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-bold text-slate-700 shadow-sm transition-all bg-white cursor-pointer"
                placeholder="名前を入力して検索..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              {isUserDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden z-50 animate-fade-in">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors border-b border-slate-50 text-slate-500 hover:bg-slate-50"
                      onClick={() => { setSearchName(''); setIsUserDropdownOpen(false); }}
                    >
                      全員を表示 (クリア)
                    </button>
                    {users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchName)).length === 0 ? (
                      <div className="p-3 text-center text-xs font-bold text-slate-400 bg-slate-50">一致する利用者がいません</div>
                    ) : (
                      users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchName)).map(u => {
                        const fullName = `${u.last_name} ${u.first_name}`;
                        return (
                          <button
                            key={u.user_id}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 hover:bg-indigo-50 text-slate-700"
                            onClick={() => {
                              setSearchName(fullName);
                              setIsUserDropdownOpen(false);
                            }}
                          >
                            {fullName}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PERIOD</span>
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500" />
              <span className="text-slate-300">~</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS</span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={filterMissing} onChange={(e) => setFilterMissing(e.target.checked)} className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500 border-slate-300" />
              <span className="text-xs font-bold text-slate-600 group-hover:text-rose-500 transition-colors">打刻漏れ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={filterLate} onChange={(e) => setFilterLate(e.target.checked)} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 border-slate-300" />
              <span className="text-xs font-bold text-slate-600 group-hover:text-amber-500 transition-colors">遅刻・早退</span>
            </label>
          </div>
          <button onClick={clearFilters} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline font-bold">条件クリア</button>
        </div>
      </div>

      {/* ★追加：新規データ登録ボタン */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => {
            setNewModal({ isOpen: true, userId: '', date: '', planIn: '', planOut: '', actIn: '', actOut: '', note: '' });
            setNewUserSearch(''); // ★追加：開くときに検索をリセット
            setIsNewUserDropdownOpen(false);
          }}
          className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-slate-900 transition-all flex items-center gap-2 text-sm"
        >
          <span className="text-lg leading-none">+</span> 新規データ登録
        </button>
      </div>

      {/* データテーブル */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full admin-table text-left border-collapse">
            <thead>
              <tr>
                <th className="w-24">日付</th>
                <th>利用者名</th>
                <th className="w-20">予定IN</th>
                <th className="w-20">予定OUT</th>
                <th className="w-20">実績IN</th>
                <th className="w-20">実績OUT</th>
                <th className="min-w-[150px]">変更理由</th>
                <th className="w-24">状態</th>
                <th className="w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="text-center py-12 text-slate-400 font-bold">データを読み込んでいます...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-12 text-slate-400 font-bold">該当する打刻データはありません</td></tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={idx} className={item.status === '打刻漏れ' ? 'bg-rose-50/70 hover:bg-rose-100/80 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="font-bold text-slate-700">{item.date}</td>
                    <td className="font-bold text-slate-800">{item.name}</td>
                    <td className="text-slate-500">{item.planIn || '--:--'}</td>
                    <td className="text-slate-500">{item.planOut || '--:--'}</td>
                    <td className="font-bold text-indigo-600">{item.actIn || '--:--'}</td>
                    <td className="font-bold text-indigo-600">{item.actOut || '--:--'}</td>
                    <td className="text-xs text-slate-500 max-w-[150px] truncate">{item.note || '-'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === '正常' ? 'bg-emerald-100 text-emerald-700' : item.status === '打刻漏れ' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => setEditModal({
                          isOpen: true, item: item, 
                          planIn: item.planIn || '', planOut: item.planOut || '', 
                          actIn: item.actIn || '', actOut: item.actOut || '', note: item.note || ''
                        })} 
                        className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 text-xs font-bold transition-colors"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ★ スタイリッシュな編集モーダル */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
              <h3 className="text-white text-xl font-black tracking-wider">{editModal.item?.name} の打刻編集</h3>
              <button onClick={() => setEditModal({...editModal, isOpen: false})} className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">予定時間 (IN / OUT)</label>
                  <div className="flex items-center gap-3">
                    <input type="time" value={editModal.planIn} onChange={e => setEditModal({...editModal, planIn: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm" />
                    <span className="text-slate-300 font-black">~</span>
                    <input type="time" value={editModal.planOut} onChange={e => setEditModal({...editModal, planOut: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">実績時間 (IN / OUT)</label>
                  <div className="flex items-center gap-3">
                    <input type="time" value={editModal.actIn} onChange={e => setEditModal({...editModal, actIn: e.target.value})} className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-indigo-700 transition-all shadow-sm" />
                    <span className="text-slate-300 font-black">~</span>
                    <input type="time" value={editModal.actOut} onChange={e => setEditModal({...editModal, actOut: e.target.value})} className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-indigo-700 transition-all shadow-sm" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">備考・特記事項</label>
                <textarea value={editModal.note} onChange={e => setEditModal({...editModal, note: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 text-sm font-bold resize-none h-24 transition-all shadow-sm" placeholder="打刻修正の理由など..."></textarea>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button onClick={() => setEditModal({...editModal, isOpen: false})} className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-black hover:border-slate-300 hover:bg-slate-50 transition-all">キャンセル</button>
              <button onClick={handleUpdate} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 shadow-md transition-all">保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* ★ スタイリッシュな新規データ登録モーダル（検索付き） */}
      {newModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
              <h3 className="text-white text-xl font-black tracking-wider">新規データ登録</h3>
              <button onClick={() => setNewModal({...newModal, isOpen: false})} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">対象日 *</label>
                  <input 
                    type="date" 
                    value={newModal.date} 
                    onChange={(e) => setNewModal({...newModal, date: e.target.value})} 
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm" 
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">利用者 *</label>
                  <div className="relative z-50">
                    <input
                      type="text"
                      value={newUserSearch}
                      onChange={(e) => {
                        setNewUserSearch(e.target.value);
                        setNewModal({...newModal, userId: ''}); // IDを一旦リセット
                        setIsNewUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsNewUserDropdownOpen(true)}
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm pr-10"
                      placeholder="名前を入力して検索..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isNewUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  {isNewUserDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-[60] animate-fade-in">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {users.filter(u => `${u.last_name} ${u.first_name}`.includes(newUserSearch)).length === 0 ? (
                          <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50">一致する利用者がいません</div>
                        ) : (
                          users.filter(u => `${u.last_name} ${u.first_name}`.includes(newUserSearch)).map(u => {
                            const fullName = `${u.last_name} ${u.first_name}`;
                            return (
                              <button
                                key={u.user_id}
                                className="w-full text-left px-5 py-3 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700"
                                onClick={() => {
                                  setNewModal({...newModal, userId: u.user_id});
                                  setNewUserSearch(fullName);
                                  setIsNewUserDropdownOpen(false);
                                }}
                              >
                                {fullName}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {/* プルダウン外側をクリックした時に閉じるための透明な幕 */}
                  {isNewUserDropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsNewUserDropdownOpen(false)}></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">予定時間 (IN / OUT)</label>
                  <div className="flex items-center gap-3">
                    <input type="time" value={newModal.planIn} onChange={e => setNewModal({...newModal, planIn: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm" />
                    <span className="text-slate-300 font-black">~</span>
                    <input type="time" value={newModal.planOut} onChange={e => setNewModal({...newModal, planOut: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-slate-700 transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">実績時間 (IN / OUT)</label>
                  <div className="flex items-center gap-3">
                    <input type="time" value={newModal.actIn} onChange={e => setNewModal({...newModal, actIn: e.target.value})} className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-indigo-700 transition-all shadow-sm" />
                    <span className="text-slate-300 font-black">~</span>
                    <input type="time" value={newModal.actOut} onChange={e => setNewModal({...newModal, actOut: e.target.value})} className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 font-bold text-indigo-700 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">備考・特記事項</label>
                <textarea 
                  value={newModal.note} 
                  onChange={e => setNewModal({...newModal, note: e.target.value})} 
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 text-sm font-bold resize-none h-24 transition-all shadow-sm" 
                  placeholder="備考を入力..."
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button onClick={() => setNewModal({...newModal, isOpen: false})} className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-black hover:border-slate-300 hover:bg-slate-50 transition-all">キャンセル</button>
              <button onClick={handleCreateNew} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 shadow-md transition-all">登録する</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AttendanceListTab;