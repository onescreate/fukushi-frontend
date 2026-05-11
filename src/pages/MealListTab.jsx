import { useState, useEffect } from 'react';
import axios from 'axios';

function MealListTab({ selectedStoreId }) { // ★修正1: Propsの追加
  const adminName = localStorage.getItem('adminName') || '管理者';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mealList, setMealList] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // フィルター用State
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSituation, setFilterSituation] = useState('');

  // UI状態管理用State
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', id: '', userId: '', date: '', status: '予約', price: 300, situation: '' });
  const [activeModalDropdown, setActiveModalDropdown] = useState(null);
  // ★追加：モーダル内の利用者検索用State
  const [modalUserSearch, setModalUserSearch] = useState('');
  const [isModalUserDropdownOpen, setIsModalUserDropdownOpen] = useState(false);

  const fetchUsers = async () => {
    if (!selectedStoreId) return; // ★追加
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/user-master`, { params: { store_id: selectedStoreId } }); // ★修正2
      if (res.data.success) {
        const formattedUsers = res.data.users.map(u => ({
          user_id: u.id,
          last_name: u.lastName,
          first_name: u.firstName
        }));
        setUsers(formattedUsers);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMealList = async () => {
    if (!selectedStoreId) return; // ★追加
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/meal-list`, { 
        params: { year, month, store_id: selectedStoreId } // ★修正2: store_id追加
      });
      if (res.data.success) setMealList(res.data.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedStoreId]); // ★修正3: 依存配列に追加

  useEffect(() => {
    fetchMealList();
  }, [currentMonth, selectedStoreId]); // ★修正3: 依存配列に追加

  const clearFilters = () => {
    setSearchName(''); setFilterStatus(''); setFilterSituation('');
  };

  const changeMonth = (diff) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
  };

  const handleSave = async () => {
    if (!modal.userId || !modal.date) return alert("利用者と日付は必須です");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/meal/save`, {
        meal_id: modal.id, user_id: modal.userId, date: modal.date, status: modal.status, price: modal.price, situation: modal.situation, operator: adminName
      });
      if (res.data.success) {
        setModal({ ...modal, isOpen: false });
        fetchMealList();
      }
    } catch (err) {
      alert(err.response?.data?.message || "保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("この食事データを完全に削除しますか？")) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/meal/delete`, { meal_id: modal.id });
      if (res.data.success) {
        setModal({ ...modal, isOpen: false });
        fetchMealList();
      }
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  const filteredList = mealList.filter(item => {
    if (searchName && !item.name.includes(searchName)) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterSituation && filterSituation !== 'empty' && item.situation !== filterSituation) return false;
    if (filterSituation === 'empty' && item.situation) return false;
    return true;
  });

  return (
    <div className="animate-fade-in pb-20">
      <style>{`
        /* ★修正：背景を #f1f5f9 に、下線を #cbd5e1 に変更 */
        .admin-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 1rem; text-align: left; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        .admin-table td { padding: 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .admin-table tr:hover td { background-color: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* --- 検索・操作バー --- */}
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 space-y-4 relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold shadow-sm">◀</button>
            <span className="text-lg font-bold text-slate-800 w-32 text-center tracking-widest">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-orange-50 hover:text-orange-600 transition-colors font-bold shadow-sm">▶</button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            {/* ★入力検索付きカスタムドロップダウン (名前検索) */}
            <div className="flex items-center gap-2 w-full sm:w-auto relative z-30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">NAME</span>
              <div className="relative w-full sm:w-56">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => {
                    setSearchName(e.target.value);
                    setIsSearchDropdownOpen(true);
                  }}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 200)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none font-bold text-slate-700 shadow-sm transition-all bg-white cursor-pointer"
                  placeholder="名前を入力して検索..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSearchDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                {isSearchDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <button className="w-full text-left px-4 py-2.5 text-sm font-bold border-b border-slate-50 text-slate-500 hover:bg-slate-50 transition-colors" onClick={() => { setSearchName(''); setIsSearchDropdownOpen(false); }}>
                        全員を表示 (クリア)
                      </button>
                      {users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchName)).length === 0 ? (
                        <div className="p-3 text-center text-xs font-bold text-slate-400 bg-slate-50">一致する利用者がいません</div>
                      ) : (
                        users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchName)).map(u => (
                          <button
                            key={u.user_id}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 hover:bg-orange-50 text-slate-700"
                            onClick={() => { setSearchName(`${u.last_name} ${u.first_name}`); setIsSearchDropdownOpen(false); }}
                          >
                            {u.last_name} {u.first_name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ★修正：デザインを統一し、検索状態をリセットする処理を追加 */}
            <button 
              onClick={() => {
                setModal({ isOpen: true, mode: 'add', id: '', userId: '', date: '', status: '予約', price: 300, situation: '' });
                setModalUserSearch('');
                setIsModalUserDropdownOpen(false);
              }}
              className="w-full sm:w-auto shrink-0 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              <span className="text-lg leading-none">+</span> 食事注文登録
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-slate-200">
          
          {/* ★カスタムドロップダウン: ステータス */}
          <div className="flex items-center gap-3 relative z-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">STATUS</span>
            <div className="relative w-32">
              <button
                type="button"
                onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')}
                onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-lg flex items-center justify-between text-slate-600 bg-white hover:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
              >
                <span>{filterStatus || 'すべて'}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeFilterDropdown === 'status' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {activeFilterDropdown === 'status' && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                  {[{val: '', label: 'すべて'}, {val: '予約', label: '予約'}, {val: 'キャンセル', label: 'キャンセル'}, {val: '取消', label: '取消'}].map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => { setFilterStatus(opt.val); setActiveFilterDropdown(null); }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors border-b border-slate-50 last:border-0 ${filterStatus === opt.val ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ★カスタムドロップダウン: シチュエーション */}
          <div className="flex items-center gap-3 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">SITUATION</span>
            <div className="relative w-32">
              <button
                type="button"
                onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'situation' ? null : 'situation')}
                onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
                className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-lg flex items-center justify-between text-slate-600 bg-white hover:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
              >
                <span>{filterSituation === 'empty' ? '未入力' : (filterSituation || 'すべて')}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeFilterDropdown === 'situation' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {activeFilterDropdown === 'situation' && (
                <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                  {[{val: '', label: 'すべて'}, {val: 'empty', label: '未入力'}, {val: '喫食済', label: '喫食済'}, {val: '代替', label: '代替'}, {val: 'キャンセル', label: 'キャンセル'}].map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => { setFilterSituation(opt.val); setActiveFilterDropdown(null); }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors border-b border-slate-50 last:border-0 ${filterSituation === opt.val ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={clearFilters} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline font-bold">条件クリア</button>
        </div>
      </div>

      {/* --- データテーブル --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative z-0">
        <div className="overflow-x-auto">
          <table className="w-full admin-table text-left border-collapse">
            <thead>
              <tr>
                <th className="w-32">日付</th>
                <th>利用者名</th>
                <th className="w-32">ステータス</th>
                <th className="w-32">金額</th>
                <th className="w-32">状況</th>
                <th className="w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold">データを読み込んでいます...</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold">該当する食事データはありません</td></tr>
              ) : (
                filteredList.map((item, idx) => {
                  // ★ 15時を過ぎた未処理予約の判定
                  const now = new Date();
                  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                  const nowTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
                  
                  const isAlert = item.status === '予約' && (
                    item.date < todayStr || (item.date === todayStr && nowTime >= '15:00')
                  );

                  return (
                    <tr key={idx} className={isAlert ? 'bg-rose-50/70 hover:bg-rose-100 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      <td className="font-bold text-slate-700">{item.date}</td>
                      <td className="font-bold text-slate-800">{item.name}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === '予約' || item.status === '喫食済' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{item.status}</span>
                      </td>
                      <td className="text-slate-600 font-medium">¥{item.price}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${!item.situation ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-slate-100 text-slate-700'}`}>{item.situation || '未入力'}</span>
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={() => setModal({ isOpen: true, mode: 'edit', id: item.id, userId: item.userId, date: item.date, status: item.status, price: item.price, situation: item.situation })}
                          className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 text-xs font-bold transition-colors"
                        >
                          変更
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ★ スタイリッシュな追加・編集モーダル（検索付き） */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
              <h3 className="text-white text-xl font-black tracking-wider">{modal.mode === 'add' ? '食事注文の新規登録' : '食事データの編集'}</h3>
              <button onClick={() => setModal({...modal, isOpen: false})} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">対象日 *</label>
                  <input 
                    type="date" 
                    value={modal.date} 
                    onChange={e => setModal({...modal, date: e.target.value})} 
                    disabled={modal.mode === 'edit'}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 font-bold text-slate-700 transition-all shadow-sm disabled:opacity-50" 
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">対象利用者 *</label>
                  <div className="relative z-50">
                    <input
                      type="text"
                      disabled={modal.mode === 'edit'}
                      value={modal.mode === 'edit' ? `${users.find(u => u.user_id === modal.userId)?.last_name || ''} ${users.find(u => u.user_id === modal.userId)?.first_name || ''}` : modalUserSearch}
                      onChange={(e) => {
                        setModalUserSearch(e.target.value);
                        setModal({...modal, userId: ''});
                        setIsModalUserDropdownOpen(true);
                      }}
                      onFocus={() => { if(modal.mode !== 'edit') setIsModalUserDropdownOpen(true); }}
                      className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 font-bold text-slate-700 transition-all shadow-sm pr-10 disabled:opacity-50"
                      placeholder="名前を入力して検索..."
                    />
                    {modal.mode !== 'edit' && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isModalUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    )}
                  </div>
                  {isModalUserDropdownOpen && modal.mode !== 'edit' && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-[60] animate-fade-in">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {users.filter(u => `${u.last_name} ${u.first_name}`.includes(modalUserSearch)).length === 0 ? (
                          <div className="p-4 text-center text-xs font-bold text-slate-400 bg-slate-50">一致する利用者がいません</div>
                        ) : (
                          users.filter(u => `${u.last_name} ${u.first_name}`.includes(modalUserSearch)).map(u => {
                            const fullName = `${u.last_name} ${u.first_name}`;
                            return (
                              <button
                                key={u.user_id}
                                className="w-full text-left px-5 py-3 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 hover:bg-orange-50 hover:text-orange-700 text-slate-700"
                                onClick={() => {
                                  setModal({...modal, userId: u.user_id});
                                  setModalUserSearch(fullName);
                                  setIsModalUserDropdownOpen(false);
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
                  {isModalUserDropdownOpen && modal.mode !== 'edit' && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsModalUserDropdownOpen(false)}></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div className="relative">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ステータス</label>
                  <button
                    type="button"
                    onClick={() => setActiveModalDropdown(activeModalDropdown === 'status' ? null : 'status')}
                    onBlur={() => setTimeout(() => setActiveModalDropdown(null), 200)}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between font-bold text-slate-700 hover:border-orange-400 focus:outline-none transition-all shadow-sm"
                  >
                    <span>{modal.status}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeModalDropdown === 'status' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {activeModalDropdown === 'status' && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                      {['予約', '喫食済', 'キャンセル', '取消'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setModal({...modal, status: opt}); setActiveModalDropdown(null); }}
                          className={`w-full text-left px-5 py-4 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 ${modal.status === opt ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">金額</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">¥</span>
                    <input 
                      type="number" 
                      value={modal.price} 
                      onChange={e => setModal({...modal, price: parseInt(e.target.value) || 0})} 
                      className="w-full p-4 pl-10 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 font-bold text-slate-700 shadow-sm transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">状況 (提供実績など)</label>
                <button
                  type="button"
                  onClick={() => setActiveModalDropdown(activeModalDropdown === 'situation' ? null : 'situation')}
                  onBlur={() => setTimeout(() => setActiveModalDropdown(null), 200)}
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between font-bold text-slate-700 hover:border-orange-400 focus:outline-none transition-all shadow-sm"
                >
                  <span className={modal.situation ? 'text-slate-700' : 'text-slate-400'}>{modal.situation || '未入力'}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeModalDropdown === 'situation' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {activeModalDropdown === 'situation' && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                    {[{val: '', label: '未入力'}, {val: '予約', label: '予約'}, {val: '喫食済', label: '喫食済'}, {val: '代替', label: '代替'}, {val: 'キャンセル', label: 'キャンセル'}].map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => { setModal({...modal, situation: opt.val}); setActiveModalDropdown(null); }}
                        className={`w-full text-left px-5 py-4 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 ${modal.situation === opt.val ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-4 shrink-0">
              {modal.mode === 'edit' && (
                <button onClick={handleDelete} className="px-6 py-4 bg-white border-2 border-rose-200 text-rose-600 font-black rounded-2xl hover:bg-rose-50 transition-all shadow-sm">削除</button>
              )}
              <div className="flex-1 flex gap-4 ml-auto">
                <button onClick={() => setModal({...modal, isOpen: false})} className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-black hover:border-slate-300 hover:bg-slate-50 transition-all">キャンセル</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 shadow-md transition-all">保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MealListTab;