import { useState, useEffect } from 'react';
import axios from 'axios';

function ScheduleListTab({ selectedStoreId }) { // ★修正1: Propsの追加
  const adminName = localStorage.getItem('adminName') || '管理者';
  // --- 共通 State ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tabMode, setTabMode] = useState('view'); // 'view': 閲覧モード, 'register': 一括登録モード

  // --- 閲覧モード用 State ---
  const [monthlySchedules, setMonthlySchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // --- 一括登録モード用 State ---
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSchedule, setUserSchedule] = useState({});
  const [actionTab, setActionTab] = useState('schedule');
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedMealDates, setSelectedMealDates] = useState([]);
  const [planIn, setPlanIn] = useState('10:00');
  const [planOut, setPlanOut] = useState('15:00');
  const [note, setNote] = useState('');

  // アラートモーダル用 (PersonalDashboardから移植)
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });
  const showAlert = (title, message) => setAlertModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setAlertModal({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const closeAlertModal = () => setAlertModal(prev => ({ ...prev, isOpen: false }));

  // ==========================================
  // データ取得ロジック
  // ==========================================

  // 全利用者のリストを取得 (一括登録の検索用)
  const fetchUsers = async () => {
    if (!selectedStoreId) return; // ★追加
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/user-master`, { params: { store_id: selectedStoreId } }); // ★修正2
      if (res.data.success) {
        // user-master APIは last_name 等の形式が一部異なるため、既存コードに合うよう整形します
        const formattedUsers = res.data.users.map(u => ({
          user_id: u.id,
          last_name: u.lastName,
          first_name: u.firstName
        }));
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 閲覧モード：全体の月間データを取得
  const fetchMonthlyData = async () => {
    if (!selectedStoreId) return; // ★追加
    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const firstDayStr = `${year}-${month}-01`;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/schedule-list`, { 
        params: { date: firstDayStr, store_id: selectedStoreId } // ★修正2: store_id追加
      });
      if (res.data.success) setMonthlySchedules(res.data.list);
    } catch (err) {
      console.error(err);
    }
  };

  // 一括登録モード：選択した個人の月間データを取得
  const fetchUserMonthly = async () => {
    if (!selectedUserId) {
      setUserSchedule({});
      return;
    }
    try {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/schedule/monthly`, {
        params: { user_id: selectedUserId, year: y, month: m }
      });
      if (res.data.success) {
        setUserSchedule(res.data.schedule);
      }
    } catch (err) {
      console.error('個人データ取得エラー:', err);
    }
  };

  // マウント時・月変更時・モード変更時のフック
  useEffect(() => {
    fetchUsers();
  }, [selectedStoreId]); // ★修正3: 依存配列に追加

  useEffect(() => {
    if (tabMode === 'view') {
      fetchMonthlyData();
    } else if (tabMode === 'register') {
      fetchUserMonthly();
    }
  }, [currentMonth, tabMode, selectedUserId, selectedStoreId]); // ★修正3: 依存配列に追加


  // ==========================================
  // 共通ロジック
  // ==========================================
  const changeMonth = (diff) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
    setSelectedDates([]);
    setSelectedMealDates([]);
  };

  // ==========================================
  // 閲覧モード (View) ロジック
  // ==========================================
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) days.push(new Date(year, month, d));
    return days;
  };

  const getDayData = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const matchStr = `${y}/${m}/${d}`; 
    
    const list = monthlySchedules.filter(s => s.date === matchStr);
    return {
      dateStr: matchStr,
      count: list.length,
      meals: list.filter(s => s.meal === '予約' || s.meal === '喫食').length,
      list: list
    };
  };

  const openModal = (dateObj) => {
    const data = getDayData(dateObj);
    if (data && data.count > 0) setSelectedDay(data);
  };


  // ==========================================
  // 一括登録モード (Register) ロジック
  // ==========================================
  const submitBulkSchedule = () => {
    if (selectedDates.length === 0) return;
    showConfirm('確認', `${selectedDates.length}日分の予定を登録しますか？`, async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/schedule/submit`, {
          user_id: selectedUserId, dates: selectedDates, plan_in: planIn, plan_out: planOut, note: note,
          is_admin: true,
          operator: adminName
        });
        if (res.data.success) {
          showAlert('完了', '一括登録が完了しました');
          setSelectedDates([]); setNote(''); fetchUserMonthly(); 
        }
      } catch (err) {
        showAlert('通信エラー', `エラーが発生しました。\n詳細: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const submitMealRegistration = (isRegister) => {
    if (selectedMealDates.length === 0) return;
    const actionText = isRegister ? '予約' : '取消 / キャンセル';
    showConfirm('確認', `${selectedMealDates.length}日分を${actionText}しますか？`, async () => {
      try {
        const reqBody = { 
          user_id: selectedUserId, registers: isRegister ? selectedMealDates : [], cancels: isRegister ? [] : selectedMealDates,
          operator: adminName
        };
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/meal/submit`, reqBody);
        if (res.data.success) { 
          showAlert('完了', '食事の処理が完了しました'); 
          setSelectedMealDates([]); fetchUserMonthly(); 
        }
      } catch (err) {
        showAlert('通信エラー', `エラーが発生しました。\n詳細: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const renderRegisterCalendarGrid = () => {
    const y = currentMonth.getFullYear(); const m = currentMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay(); const lastDate = new Date(y, m + 1, 0).getDate();
    
    const todayObj = new Date(); 
    const cY = todayObj.getFullYear(), cM = todayObj.getMonth(), cDate = todayObj.getDate();
    const todayStr = `${cY}/${String(cM+1).padStart(2,'0')}/${String(cDate).padStart(2,'0')}`;
    
    let days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`}></div>);

    for (let d = 1; d <= lastDate; d++) {
      const targetDateStr = `${y}/${String(m+1).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
      const h = targetDateStr.replace(/\//g, '-');
      const dt = userSchedule[targetDateStr];
      const selSched = selectedDates.includes(h); const selMeal = selectedMealDates.includes(h);
      
        let isSelectable = true;
        if (actionTab === 'meal' && !dt) {
          isSelectable = false;
        }

      let baseClass = "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border text-sm overflow-hidden ";
      
      if (!isSelectable) {
        if (dt) {
          if (dt.note && dt.note.includes('【欠席】')) baseClass += "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed";
          else if (dt.note && dt.note.includes('【実習先:')) baseClass += "bg-teal-50 border-teal-100 text-teal-400 cursor-not-allowed";
          else if (dt.status === '承認済') baseClass += "bg-blue-50 border-blue-100 text-blue-400 cursor-not-allowed";
          else baseClass += "bg-orange-50 border-orange-100 text-orange-400 cursor-not-allowed";
        } else { baseClass += "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"; }
      } else {
        if (dt) {
          if (dt.note && dt.note.includes('【欠席】')) baseClass += "bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300";
          else if (dt.note && dt.note.includes('【実習先:')) baseClass += "bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200";
          else if (dt.status === '承認済') baseClass += "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200";
          else baseClass += "bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200";
        } else { baseClass += "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"; }
      }

      if (actionTab === 'schedule' && selSched) baseClass = "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border text-sm overflow-hidden bg-indigo-600 text-white font-bold scale-105 shadow-md z-10 border-indigo-600 cursor-pointer";
      else if (actionTab === 'meal' && selMeal) baseClass = "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border text-sm overflow-hidden bg-orange-500 text-white font-bold scale-105 shadow-md z-10 border-orange-500 cursor-pointer";

      const onDateClick = () => {
        if (!isSelectable && !dt) return;
        if (actionTab === 'schedule') {
          setSelectedDates(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
        } else {
          if (dt) setSelectedMealDates(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
        }
      };

      let b = [];
      if(dt){
        if (dt.note && dt.note.includes('【欠席】')) b.push(<div key="abs" className="absolute inset-0 flex items-center justify-center text-rose-500 font-black text-4xl opacity-60 pointer-events-none z-0">×</div>);
        if(dt.meal) b.push(<div key="meal" className={`absolute bottom-1 right-1 ${isSelectable ? "text-slate-500" : "text-slate-400"} z-10`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>);
      }
      days.push(<button key={d} onClick={onDateClick} className={baseClass} disabled={!isSelectable && !dt}><span className="relative z-10">{d}</span>{b}</button>);
    }
    return days;
  };

  return (
    <div className="animate-fade-in relative pb-20">
      <style>{`
        /* ★修正：背景を #f1f5f9 に、下線を #cbd5e1 に変更 */
        .admin-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 1rem; text-align: left; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        .admin-table td { padding: 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .admin-table tr:hover td { background-color: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* --- 操作バー --- */}
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* モード切替タブ */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full md:w-auto shrink-0">
          <button onClick={() => setTabMode('view')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tabMode === 'view' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}>閲覧モード</button>
          <button onClick={() => setTabMode('register')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tabMode === 'register' ? 'bg-white shadow text-teal-600' : 'text-slate-500 hover:bg-slate-200'}`}>個人別一括登録</button>
        </div>

        {/* 月めくり */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-bold shadow-sm">◀</button>
          <span className="text-xl font-bold text-slate-800 w-36 text-center tracking-widest">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-bold shadow-sm">▶</button>
        </div>

      </div>


      {/* ========================================================= */}
      {/* 閲覧モード (View Mode) */}
      {/* ========================================================= */}
      {tabMode === 'view' && (
        <div className="animate-fade-in bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            <div className="text-rose-500 font-bold text-sm">日</div><div className="text-slate-500 font-bold text-sm">月</div><div className="text-slate-500 font-bold text-sm">火</div><div className="text-slate-500 font-bold text-sm">水</div><div className="text-slate-500 font-bold text-sm">木</div><div className="text-slate-500 font-bold text-sm">金</div><div className="text-blue-500 font-bold text-sm">土</div>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {generateCalendar().map((date, idx) => {
              const data = getDayData(date);
              return (
                <div 
                  key={idx} 
                  onClick={() => openModal(date)}
                  className={`relative min-h-[120px] border border-slate-200 rounded-xl p-2 transition-all flex flex-col ${date ? 'hover:border-indigo-400 hover:shadow-md cursor-pointer bg-white' : 'bg-transparent border-none'}`}
                >
                  {date && (
                    <>
                      {/* 日付を左上に配置 */}
                      <span className="absolute top-2 left-3 text-sm font-bold text-slate-700">{date.getDate()}</span>
                      
                      {/* バッジを中央に大きく配置 */}
                      {data.count > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 mt-5">
                          <div className="w-full text-center text-sm sm:text-base font-bold text-indigo-700 bg-indigo-50 py-1.5 rounded-lg border border-indigo-200 shadow-sm truncate">
                            通所: {data.count}名
                          </div>
                          {data.meals > 0 && (
                            <div className="w-full text-center text-sm sm:text-base font-bold text-orange-700 bg-orange-50 py-1.5 rounded-lg border border-orange-200 shadow-sm truncate">
                              食事: {data.meals}食
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* 一括登録モード (Register Mode) */}
      {/* ========================================================= */}
      {tabMode === 'register' && (
        <div className="animate-fade-in max-w-5xl mx-auto">
          
          {/* 検索ドロップダウン (カスタムUI版) */}
          {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center relative z-20">
            <label className="font-bold text-slate-700 whitespace-nowrap">対象の利用者：</label>
            <div className="relative w-full sm:w-96">
              {/* 検索アイコン */}
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <input
                type="text"
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  setIsUserDropdownOpen(true);
                  setSelectedUserId(''); 
                }}
                onFocus={() => setIsUserDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsUserDropdownOpen(false), 200)} 
                className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none font-bold text-slate-700 shadow-sm transition-all bg-slate-50 focus:bg-white cursor-pointer"
                placeholder="名前を入力して検索・選択..."
              />
              
              {/* 開閉状態を示す矢印アイコン */}
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              {/* カスタムドロップダウンメニュー */}
              {isUserDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchUser)).length === 0 ? (
                      <div className="p-4 text-center text-sm font-bold text-slate-400 bg-slate-50">一致する利用者がいません</div>
                    ) : (
                      users.filter(u => `${u.last_name} ${u.first_name}`.includes(searchUser)).map(u => {
                        const fullName = `${u.last_name} ${u.first_name}`;
                        const isSelected = selectedUserId === u.user_id;
                        return (
                          <button
                            key={u.user_id}
                            className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between ${isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            onClick={() => {
                              setSearchUser(fullName);
                              setSelectedUserId(u.user_id);
                              setIsUserDropdownOpen(false);
                            }}
                          >
                            {fullName}
                            {isSelected && <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!selectedUserId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold">
              上の検索ボックスから対象の利用者を選択してください。
            </div>
          ) : (
            <>
              {/* カレンダー本体 */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                  <div className="text-rose-500 font-bold text-sm">日</div><div className="text-slate-500 font-bold text-sm">月</div><div className="text-slate-500 font-bold text-sm">火</div><div className="text-slate-500 font-bold text-sm">水</div><div className="text-slate-500 font-bold text-sm">木</div><div className="text-slate-500 font-bold text-sm">金</div><div className="text-blue-500 font-bold text-sm">土</div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {renderRegisterCalendarGrid()}
                </div>
              </div>

              {/* 下部操作パネル */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className={`font-bold mb-4 text-center ${actionTab === 'schedule' ? 'text-indigo-600 text-lg' : 'text-orange-600 text-lg'}`}>
                  {actionTab === 'schedule' ? `${selectedDates.length}日 選択中` : `${selectedMealDates.length}日 選択中`}
                </p>
                <div className="flex gap-2 mb-6 p-1 bg-slate-200 rounded-xl">
                  <button onClick={() => setActionTab('schedule')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionTab === 'schedule' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-300'}`}>予定の申請</button>
                  <button onClick={() => setActionTab('meal')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionTab === 'meal' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:bg-slate-300'}`}>食事の注文</button>
                </div>

                {actionTab === 'schedule' && (
                  <div className="animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">基本の通所時間</label><input type="time" value={planIn} onChange={e => setPlanIn(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold text-slate-700" /></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">基本の退所時間</label><input type="time" value={planOut} onChange={e => setPlanOut(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none font-bold text-slate-700" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">備考・連絡事項</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none" placeholder="特記事項などを入力" /></div>
                    </div>
                    <button onClick={submitBulkSchedule} disabled={selectedDates.length === 0} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 予定を一括登録
                    </button>
                  </div>
                )}

                {actionTab === 'meal' && (
                  <div className="animate-fade-in flex flex-col sm:flex-row gap-4">
                    <button onClick={() => submitMealRegistration(true)} disabled={selectedMealDates.length === 0} className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"><span className="text-xl"></span> 予約する</button>
                    <button onClick={() => submitMealRegistration(false)} disabled={selectedMealDates.length === 0} className="flex-1 py-4 bg-white text-rose-500 font-bold rounded-xl border border-rose-200 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> 取り消す</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}


      {/* ========================================================= */}
      {/* モーダル群 */}
      {/* ========================================================= */}
      
      {/* 日別詳細モーダル (閲覧モード用) */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 transform transition-all scale-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">{selectedDay.dateStr} の予定詳細</h3>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6 shrink-0">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest">通所予定人数</span>
                <span className="text-3xl font-black text-indigo-700">{selectedDay.count}<span className="text-base ml-1">名</span></span>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex items-center justify-between">
                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">食事 (予約・喫食)</span>
                <span className="text-3xl font-black text-orange-700">{selectedDay.meals}<span className="text-base ml-1">食</span></span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl custom-scrollbar">
              <table className="w-full admin-table text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>利用者名</th>
                    <th className="w-24">予定IN</th>
                    <th className="w-24">予定OUT</th>
                    <th className="w-24">食事</th>
                    <th>備考</th>
                    <th className="w-24 text-center">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDay.list.map((s, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-800">{s.name}</td>
                      <td className="text-slate-600">{s.planIn}</td>
                      <td className="text-slate-600">{s.planOut}</td>
                      <td className="font-bold">
                        {(s.meal === '予約' || s.meal === '喫食') ? <span className="text-orange-500">🍱 {s.meal}</span> : '-'}
                      </td>
                      <td className="text-xs text-slate-500">{s.note}</td>
                      <td className="text-center">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${s.status === '承認済' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* アラートモーダル (一括登録用) */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
            {alertModal.type === 'confirm' ? (
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg></div>
            ) : alertModal.title.includes('エラー') ? (
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-2">{alertModal.title}</h3>
            <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">{alertModal.message}</p>
            <div className="flex gap-3 w-full">
              {alertModal.type === 'confirm' && <button onClick={closeAlertModal} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">キャンセル</button>}
              <button onClick={() => { if (alertModal.onConfirm) alertModal.onConfirm(); closeAlertModal(); }} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${alertModal.type === 'confirm' ? 'bg-orange-500 hover:bg-orange-600' : alertModal.title.includes('エラー') ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {alertModal.type === 'confirm' ? 'OK' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ScheduleListTab;