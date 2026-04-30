import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function PersonalDashboard() {
  const navigate = useNavigate()
  
  const token = localStorage.getItem('userToken')
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null
  const userId = payload ? payload.id : ''
  const userName = localStorage.getItem('userName') || '利用者'

  const [viewMode, setViewMode] = useState('calendar') 
  const [actionTab, setActionTab] = useState('schedule') 
  const [currentCalDate, setCurrentCalDate] = useState(new Date())
  
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedMealDates, setSelectedMealDates] = useState([])
  const [currentMonthSchedule, setCurrentMonthSchedule] = useState({}) 
  
  const [historyList, setHistoryList] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  
  const [planIn, setPlanIn] = useState('10:00')
  const [planOut, setPlanOut] = useState('15:00')
  const [note, setNote] = useState('')

  const [detailMode, setDetailMode] = useState(false)
  const [detailTargetDate, setDetailTargetDate] = useState('') 
  const [detailType, setDetailType] = useState('normal') 
  const [singlePlanIn, setSinglePlanIn] = useState('10:00')
  const [singlePlanOut, setSinglePlanOut] = useState('15:00')
  const [singleNote, setSingleNote] = useState('')
  const [singleDest, setSingleDest] = useState('')
  const [subEvents, setSubEvents] = useState([]) 

  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null })

  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null })
  const showConfirm = (title, message, onConfirm) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm })
  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const customStyles = `
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
    .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  const fetchMonthlyData = async () => {
    if (!userId) return;
    try {
      const y = currentCalDate.getFullYear();
      const m = currentCalDate.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/schedule/monthly`, {
        params: { user_id: userId, year: y, month: m }
      });
      if (res.data.success) {
        setCurrentMonthSchedule(res.data.schedule);
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
    }
  };

  const fetchHistoryData = async () => {
    if (!userId) return;
    setIsHistoryLoading(true);
    try {
      const y = currentCalDate.getFullYear();
      const m = currentCalDate.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/history/monthly`, {
        params: { user_id: userId, year: y, month: m }
      });
      if (res.data.success) {
        setHistoryList(res.data.list);
      }
    } catch (err) {
      console.error('履歴取得エラー:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'calendar') fetchMonthlyData();
    else if (viewMode === 'history') fetchHistoryData();
  }, [currentCalDate, userId, viewMode]);

  const changeMonth = (d) => {
    const newDate = new Date(currentCalDate)
    newDate.setDate(1)
    newDate.setMonth(newDate.getMonth() + d)
    setCurrentCalDate(newDate)
    setSelectedDates([])
    setSelectedMealDates([])
  }

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userName')
    navigate('/personal-login')
  }

  const submitBulkSchedule = () => {
    if (selectedDates.length === 0) return;
    showConfirm('確認', `${selectedDates.length}日分の予定を申請しますか？`, async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/schedule/submit`, {
          user_id: userId, dates: selectedDates, plan_in: planIn, plan_out: planOut, note: note
        });
        if (res.data.success) {
          showAlert('完了', '申請が完了しました');
          setSelectedDates([]); setNote(''); fetchMonthlyData(); 
        }
      } catch (err) {
        showAlert('通信エラー', `エラーが発生しました。\n詳細: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const submitSingleSchedule = () => {
    let pIn = singlePlanIn;
    let pOut = singlePlanOut;
    let finalNote = singleNote.trim();

    if (detailType === 'absence') {
      if (!finalNote) { showAlert('入力エラー', '欠席の理由は必ず入力してください。'); return; }
      pIn = null; pOut = null;
      finalNote = '【欠席】 ' + finalNote;
    } else if (detailType === 'training') {
      if (!singleDest.trim()) { showAlert('入力エラー', '実習先・行き先を入力してください。'); return; }
      finalNote = '【実習先:' + singleDest.trim() + '】 ' + finalNote;
    }

    showConfirm('確認', `${detailTargetDate} の予定を申請しますか？`, async () => {
      try {
        const dStr = detailTargetDate.replace(/\//g, '-');
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/schedule/detail`, {
          user_id: userId, date: dStr, plan_in: pIn, plan_out: pOut, note: finalNote, sub_events: subEvents
        });
        if (res.data.success) {
          showAlert('完了', '詳細データを保存しました');
          setDetailMode(false);
          fetchMonthlyData();
        }
      } catch (err) {
        showAlert('通信エラー', `エラーが発生しました。\n詳細: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const addSubEvent = () => setSubEvents([...subEvents, { id: Date.now(), start: '12:00', end: '13:00', category: '通院', detail: '精神科' }]);
  const removeSubEvent = (id) => setSubEvents(subEvents.filter(ev => ev.id !== id));
  const updateSubEvent = (id, field, value) => {
    setSubEvents(subEvents.map(ev => {
      if (ev.id === id) {
        let newEv = { ...ev, [field]: value };
        if (field === 'category') {
          if (value === '通院') newEv.detail = '精神科';
          else if (value === 'ハローワーク') newEv.detail = '失業認定日';
          else newEv.detail = '';
        }
        return newEv;
      }
      return ev;
    }));
  };

  const submitMealRegistration = (isRegister) => {
    if (selectedMealDates.length === 0) return;
    let warning = '';
    const todayZero = new Date(); todayZero.setHours(0,0,0,0);
    if (!isRegister) {
      for (const d of selectedMealDates) {
        if ((new Date(d.replace(/-/g, '/')) - todayZero) / (1000 * 3600 * 24) < 14) {
           warning = '※14日以内の日程が含まれるため、キャンセル料が発生します。\n\n'; break;
        }
      }
    }
    const actionText = isRegister ? '予約' : '取消 / キャンセル';
    showConfirm('確認', `${warning}${selectedMealDates.length}日分を${actionText}しますか？`, async () => {
      try {
        const reqBody = { user_id: userId, registers: isRegister ? selectedMealDates : [], cancels: isRegister ? [] : selectedMealDates };
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/meal/submit`, reqBody);
        if (res.data.success) { showAlert('完了', '処理が完了しました'); setSelectedMealDates([]); fetchMonthlyData(); }
      } catch (err) {
        showAlert('通信エラー', `エラーが発生しました。\n詳細: ${err.response?.data?.error || err.message}`);
      }
    });
  };

  const renderCalendarGrid = () => {
    const y = currentCalDate.getFullYear(); const m = currentCalDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay(); const lastDate = new Date(y, m + 1, 0).getDate();
    
    // ★ 今日の日付を文字列で作成
    const todayObj = new Date(); 
    const cY = todayObj.getFullYear(), cM = todayObj.getMonth(), cDate = todayObj.getDate();
    const todayStr = `${cY}/${String(cM+1).padStart(2,'0')}/${String(cDate).padStart(2,'0')}`;
    
    let days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`}></div>);

    for (let d = 1; d <= lastDate; d++) {
      const targetDateStr = `${y}/${String(m+1).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
      const h = targetDateStr.replace(/\//g, '-');
      const dt = currentMonthSchedule[targetDateStr];
      const selSched = selectedDates.includes(h); const selMeal = selectedMealDates.includes(h);
      
      let isSelectable = true;

      // ★ 修正：今日以前（今日を含む）は選択不可にする
      if (actionTab === 'schedule') {
        if (!dt && targetDateStr <= todayStr) isSelectable = false;
      } else {
        if (!dt || targetDateStr <= todayStr) isSelectable = false;
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
        } else { baseClass += "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"; }
      }

      if (actionTab === 'schedule' && selSched) baseClass = "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border text-sm overflow-hidden bg-indigo-600 text-white font-bold scale-105 shadow-md z-10 border-indigo-600";
      else if (actionTab === 'meal' && selMeal) baseClass = "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border text-sm overflow-hidden bg-orange-500 text-white font-bold scale-105 shadow-md z-10 border-orange-500";

      const onDateClick = () => {
        if (!isSelectable && !dt) return;
        if (actionTab === 'schedule') {
          if (dt) {
            setDetailTargetDate(targetDateStr);
            setSinglePlanIn(dt.planIn || '10:00'); setSinglePlanOut(dt.planOut || '15:00');
            let noteText = dt.note || ''; let initialType = 'normal'; let destText = '';
            if (noteText.includes('【欠席】')) { initialType = 'absence'; noteText = noteText.replace('【欠席】', '').trim(); }
            else if (noteText.includes('【実習先:')) { initialType = 'training'; const match = noteText.match(/【実習先:(.*?)】/); if (match) destText = match[1].trim(); noteText = noteText.replace(/【実習先:.*?】/, '').trim(); }
            setSingleNote(noteText); setSingleDest(destText); setDetailType(initialType);
            setSubEvents(dt.subEvents || []); 
            setDetailMode(true);
          } else { setSelectedDates(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]); }
        } else {
          if (dt) setSelectedMealDates(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
        }
      }

      let b = [];
      if(dt){
        if (dt.note && dt.note.includes('【欠席】')) b.push(<div key="abs" className="absolute inset-0 flex items-center justify-center text-rose-500 font-black text-4xl opacity-60 pointer-events-none z-0">×</div>);
        if(dt.meal) b.push(<div key="meal" className={`absolute bottom-1 right-1 ${isSelectable ? "text-slate-500" : "text-slate-400"} z-10`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>);
      }
      days.push(<button key={d} onClick={onDateClick} className={baseClass} disabled={!isSelectable && !dt}><span className="relative z-10">{d}</span>{b}</button>)
    }
    return days;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100 p-2 sm:p-4 font-sans relative">
      <style>{customStyles}</style>

      <div className="glass-card p-4 sm:p-8 rounded-3xl mt-2 sm:mt-4 max-w-4xl mx-auto shadow-xl relative transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200/50 gap-4">
          <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            予定・食事管理 ({userName})
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl flex-1 sm:flex-none">
              <button onClick={() => {setViewMode('calendar'); setDetailMode(false);}} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}>カレンダー</button>
              <button onClick={() => {setViewMode('history'); setDetailMode(false);}} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${viewMode === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}>予定・打刻・食事 一覧</button>
            </div>
            <button onClick={() => setShowHelpModal(true)} className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors active:scale-95 shrink-0" title="使い方を見る"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors active:scale-95 shrink-0" title="ログアウト"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="animate-fade-in">
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold leading-relaxed shadow-sm">
              <div className="flex flex-wrap gap-x-5 gap-y-3 mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-blue-300 bg-blue-100 shadow-sm inline-block"></span> <span className="text-slate-700 text-sm">承認済</span></div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-orange-300 bg-orange-100 shadow-sm inline-block"></span> <span className="text-slate-700 text-sm">承認待ち</span></div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-teal-300 bg-teal-100 shadow-sm inline-block"></span> <span className="text-slate-700 text-sm">実習</span></div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-slate-300 bg-slate-200 shadow-sm inline-block"></span> <span className="text-slate-700 text-sm">欠席</span></div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 flex items-center justify-center text-slate-500"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></span> <span className="text-slate-700 text-sm">食事注文</span></div>
              </div>
              <p className="text-rose-500">⚠️ 翌月分の予定・食事申請は【毎月15日】までに行うと自動承認されます。<br/>16日以降の新規申請や変更は施設側の「承認待ち」となります。</p>
            </div>

            {!detailMode ? (
              <>
                <div className="flex justify-between items-center mb-4 mt-2">
                  <h3 className="text-lg font-bold text-indigo-800">日付を選んでください</h3>
                  <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                    <span className="py-2 px-4 bg-white font-bold text-slate-700 rounded-lg shadow-sm border border-slate-200">{currentCalDate.getFullYear()}年 {currentCalDate.getMonth()+1}月</span>
                    <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                    <div className="text-rose-500 font-bold text-sm">日</div><div className="text-slate-500 font-bold text-sm">月</div><div className="text-slate-500 font-bold text-sm">火</div><div className="text-slate-500 font-bold text-sm">水</div><div className="text-slate-500 font-bold text-sm">木</div><div className="text-slate-500 font-bold text-sm">金</div><div className="text-blue-500 font-bold text-sm">土</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {renderCalendarGrid()}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <p className={`font-bold mb-4 text-center ${actionTab === 'schedule' ? 'text-indigo-600 text-lg' : 'text-orange-600 text-lg'}`}>
                    {actionTab === 'schedule' ? `${selectedDates.length}日 選択中` : `${selectedMealDates.length}日 選択中`}
                  </p>
                  <div className="flex gap-2 mb-4 p-1 bg-slate-200 rounded-xl">
                    <button onClick={() => setActionTab('schedule')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${actionTab === 'schedule' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-300'}`}>予定の申請</button>
                    <button onClick={() => setActionTab('meal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${actionTab === 'meal' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:bg-slate-300'}`}>食事の注文</button>
                  </div>

                  {actionTab === 'schedule' && (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">基本の通所時間</label><input type="time" value={planIn} onChange={e => setPlanIn(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-shadow" /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">基本の退所時間</label><input type="time" value={planOut} onChange={e => setPlanOut(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-shadow" /></div>
                        <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">備考・連絡事項</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-shadow" placeholder="連絡事項などを入力" /></div>
                      </div>
                      <button onClick={submitBulkSchedule} disabled={selectedDates.length === 0} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 予定を一括申請</button>
                    </div>
                  )}

                  {actionTab === 'meal' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => submitMealRegistration(true)} disabled={selectedMealDates.length === 0} className="flex-1 py-3.5 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"><span className="text-xl">🍱</span> 注文する</button>
                      <button onClick={() => submitMealRegistration(false)} disabled={selectedMealDates.length === 0} className="flex-1 py-3.5 bg-white text-rose-500 font-bold rounded-xl border border-rose-200 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> 取り消す</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setDetailMode(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                  <h3 className="text-lg font-bold text-indigo-800">{detailTargetDate} の詳細設定</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
                  <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setDetailType('normal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${detailType === 'normal' ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>通常通所</button>
                    <button onClick={() => setDetailType('training')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${detailType === 'training' ? 'bg-teal-500 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>実習</button>
                    <button onClick={() => setDetailType('absence')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${detailType === 'absence' ? 'bg-rose-500 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>欠席</button>
                  </div>

                  {detailType !== 'absence' && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">予定通所</label><input type="time" value={singlePlanIn || ''} onChange={e => setSinglePlanIn(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" /></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">予定退所</label><input type="time" value={singlePlanOut || ''} onChange={e => setSinglePlanOut(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" /></div>
                    </div>
                  )}

                  {detailType === 'training' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-teal-600 mb-1">実習先・行き先 <span className="text-rose-500">*</span></label>
                      <input type="text" value={singleDest} onChange={e => setSingleDest(e.target.value)} className="w-full p-3 rounded-xl border border-teal-200 bg-teal-50 focus:bg-white focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all" placeholder="例: 〇〇株式会社" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">備考・理由 {detailType === 'absence' && <span className="text-rose-500">*欠席理由は必須です</span>}</label>
                    <input type="text" value={singleNote} onChange={e => setSingleNote(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all" placeholder="連絡事項や欠席理由を入力してください" />
                  </div>
                </div>

                {detailType !== 'absence' && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 pl-2 border-l-4 border-emerald-400">
                      <h3 className="text-lg font-bold text-slate-700">中抜け（通院・ハローワーク等）</h3>
                      <button onClick={addSubEvent} className="px-3 py-2 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> 追加</button>
                    </div>
                    <div className="space-y-4">
                      {subEvents.map((ev) => (
                        <div key={ev.id} className="bg-slate-50 p-4 rounded border border-slate-200">
                          <button onClick={() => removeSubEvent(ev.id)} className="float-right text-rose-500 font-bold">✕</button>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div><label className="text-xs font-bold text-slate-500">開始(OUT)</label><input type="time" value={ev.start} onChange={e => updateSubEvent(ev.id, 'start', e.target.value)} className="w-full border p-2 rounded" /></div>
                            <div><label className="text-xs font-bold text-slate-500">終了(IN)</label><input type="time" value={ev.end} onChange={e => updateSubEvent(ev.id, 'end', e.target.value)} className="w-full border p-2 rounded" /></div>
                          </div>
                          <div className="mb-2">
                            <label className="text-xs font-bold text-slate-500">用件</label>
                            <select value={ev.category} onChange={e => updateSubEvent(ev.id, 'category', e.target.value)} className="w-full border p-2 rounded bg-white">
                              <option value="通院">通院</option><option value="ハローワーク">ハローワーク</option><option value="その他">その他</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500">詳細</label>
                            {ev.category === '通院' ? (
                              <select value={ev.detail} onChange={e => updateSubEvent(ev.id, 'detail', e.target.value)} className="w-full border p-2 rounded bg-white"><option value="精神科">精神科</option><option value="その他">その他</option></select>
                            ) : ev.category === 'ハローワーク' ? (
                              <select value={ev.detail} onChange={e => updateSubEvent(ev.id, 'detail', e.target.value)} className="w-full border p-2 rounded bg-white"><option value="失業認定日">失業認定日</option><option value="面談日">面談日</option><option value="その他">その他</option></select>
                            ) : (
                              <input type="text" value={ev.detail} onChange={e => updateSubEvent(ev.id, 'detail', e.target.value)} className="w-full border p-2 rounded" placeholder="詳細を入力" />
                            )}
                            {(ev.category === '通院' || ev.category === 'ハローワーク') && ev.detail === 'その他' && (
                              <input type="text" onChange={e => updateSubEvent(ev.id, 'detail', e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="詳細を入力" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={submitSingleSchedule} className="w-full py-4 bg-indigo-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex justify-center items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> この内容で申請する
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'history' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4 mt-2">
              <h3 className="text-lg font-bold text-indigo-800">予定・打刻・食事 一覧</h3>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                <span className="py-2 px-4 bg-white font-bold text-slate-700 rounded-lg shadow-sm border border-slate-200">{currentCalDate.getFullYear()}年 {currentCalDate.getMonth()+1}月</span>
                <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                    <tr><th className="p-4 font-bold">日付</th><th className="p-4 font-bold">予定時間</th><th className="p-4 font-bold">打刻実績</th><th className="p-4 font-bold text-center">食事</th><th className="p-4 font-bold">状態 / 備考</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isHistoryLoading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">データを取得しています...</td></tr>
                    ) : historyList.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">この月の予定・履歴はありません</td></tr>
                    ) : (
                      historyList.map((item, idx) => {
                        let badgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                        if (item.status === '承認済') badgeClass = "bg-blue-50 text-blue-600 border-blue-200";
                        else if (item.status === '承認待ち') badgeClass = "bg-orange-50 text-orange-600 border-orange-200";
                        let statusHtml = <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${badgeClass}`}>{item.status || '-'}</span>;
                        if (item.note && item.note.includes('【欠席】')) statusHtml = <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-slate-200 text-slate-600 border-slate-300">欠席</span>;
                        else if (item.note && item.note.includes('【実習先:')) statusHtml = <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-teal-100 text-teal-700 border-teal-300">実習</span>;
                        let mealHtml = item.mealStatus === 'なし' ? <span className="text-slate-300">-</span> : <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-600">{item.mealStatus}</span>;
                        let pTime = (item.planIn !== '-' || item.planOut !== '-') ? `${item.planIn} ~ ${item.planOut}` : '-';
                        let aTime = (item.actIn !== '-' || item.actOut !== '-') ? `${item.actIn} ~ ${item.actOut}` : '-';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-700 text-sm">{item.date.slice(5)}</td>
                            <td className="p-4 text-slate-600 text-xs">{pTime}</td>
                            <td className="p-4 font-bold text-indigo-600 text-sm">{aTime}</td>
                            <td className="p-4 text-center">{mealHtml}</td>
                            <td className="p-4">{statusHtml}{item.note && <div className="text-xs text-slate-500 mt-1 break-words whitespace-normal max-w-[200px]">{item.note}</div>}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center">
            {modal.type === 'confirm' ? (
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg></div>
            ) : modal.title.includes('エラー') ? (
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-2">{modal.title}</h3>
            <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">{modal.message}</p>
            <div className="flex gap-3 w-full">
              {modal.type === 'confirm' && <button onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">キャンセル</button>}
              <button onClick={() => { if (modal.onConfirm) modal.onConfirm(); closeModal(); }} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${modal.type === 'confirm' ? 'bg-orange-500 hover:bg-orange-600' : modal.title.includes('エラー') ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {modal.type === 'confirm' ? 'OK' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">?</span>使い方ガイド</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 space-y-6 text-sm text-slate-600 custom-scrollbar">
              <div><h4 className="font-bold text-indigo-600 mb-2 border-l-4 border-indigo-500 pl-2">📅 予定の申請・変更について</h4><ul className="list-disc pl-5 space-y-1.5 leading-relaxed"><li><strong>翌月分の申請は【毎月15日】が締め切り</strong>です。16日以降の申請は自動承認されず、「承認待ち」となります。</li><li>複数の日を選んで、まとめて同じ時間を申請することができます。</li><li>すでに申請済みの予定がある日をクリックすると、詳細画面が開き、時間の変更や<strong>欠席・実習</strong>の申請ができます。</li></ul></div>
              <div><h4 className="font-bold text-orange-600 mb-2 border-l-4 border-orange-500 pl-2">🍱 食事の注文・取り消しについて</h4><ul className="list-disc pl-5 space-y-1.5 leading-relaxed"><li>「食事の注文」タブに切り替えて、日付を選択してください。</li><li><strong>14日以内の取り消し（キャンセル）</strong>は、キャンセル料が発生する場合がありますのでご注意ください。</li><li className="text-rose-500 font-bold">予定登録をしている日付でないと選択できません。予定登録を先にしてください。</li></ul></div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0"><button onClick={() => setShowHelpModal(false)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">閉じる</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalDashboard