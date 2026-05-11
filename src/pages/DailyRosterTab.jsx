import { useState, useEffect } from 'react';

import axios from 'axios';



function DailyRosterTab({ selectedStoreId, targetDate }) {

  const adminName = localStorage.getItem('adminName') || '管理者';

  const [roster, setRoster] = useState([]);

  const [pendingList, setPendingList] = useState([]);



  // モーダル用のState

  const [absentModal, setAbsentModal] = useState({ isOpen: false, user: null, reason: '' });

  const [mealModal, setMealModal] = useState({ isOpen: false, user: null, status: '喫食', subUserId: '' });

  const [editModal, setEditModal] = useState({

    isOpen: false, user: null,

    attendanceType: '通常通所',

    planIn: '', planOut: '',

    actIn: '', actOut: '',

    meal: 'なし', note: '',

    breakIn: '', breakOut: '',

    breakReason: '',

    breakDetailSelect: '',

    breakDetailText: '',

    trainingPlace: ''

  });



  const getTodayStr = (d = new Date()) => {

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  };



  const fetchData = async () => {

    if (!selectedStoreId) return; // ★追加: 店舗が確定するまで実行しない

    try {

      const dateStr = getTodayStr(targetDate);

      const [rosterRes, pendingRes] = await Promise.all([

        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/daily-roster`, { params: { date: dateStr, store_id: selectedStoreId } }), // ★store_id追加

        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/schedule-list`, { params: { date: dateStr, store_id: selectedStoreId } })  // ★store_id追加

      ]);

     

      if (rosterRes.data.success) setRoster(rosterRes.data.roster);

      if (pendingRes.data.success) setPendingList(pendingRes.data.list.filter(s => s.status === '承認待ち'));

    } catch (err) {

      console.error(err);

    }

  };



  useEffect(() => {

    fetchData();

  }, [targetDate, selectedStoreId]);



  const updateStatus = async (planId, newStatus) => {

    try {

      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/schedule/update-status`, {

        plan_id: planId, status: newStatus, operator: adminName // ★operator追加

      });

      fetchData();

    } catch (err) {

      alert("更新失敗");

    }

  };



  const handleAbsent = async () => {

    try {

      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/attendance/absent`, {

        userId: absentModal.user.userId,

        date: getTodayStr(targetDate),

        reason: absentModal.reason,

        operator: adminName // ★operator追加

      });

      setAbsentModal({ isOpen: false, user: null, reason: '' });

      fetchData();

    } catch (err) {

      alert("欠席処理に失敗しました");

    }

  };



  const handleMeal = async () => {

    try {

      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/meal/update-status`, {

        userId: mealModal.user.userId,

        date: getTodayStr(targetDate),

        status: mealModal.status,

        subUserId: mealModal.status === '代食' ? mealModal.subUserId : null,

        operator: adminName // ★operator追加

      });

      setMealModal({ isOpen: false, user: null, status: '喫食', subUserId: '' });

      fetchData();

    } catch (err) {

      alert("食事変更処理に失敗しました");

    }

  };



  const handleUpdateDetail = async () => {

    try {

      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/attendance/update-detail`, {

        userId: editModal.user.userId, date: getTodayStr(targetDate),

        attendanceType: editModal.attendanceType, planIn: editModal.planIn, planOut: editModal.planOut,

        actIn: editModal.actIn, actOut: editModal.actOut, meal: editModal.meal,

        note: editModal.note, breakIn: editModal.breakIn, breakOut: editModal.breakOut,

        breakReason: editModal.breakReason, breakDetailSelect: editModal.breakDetailSelect,

        breakDetailText: editModal.breakDetailText, trainingPlace: editModal.trainingPlace,

        operator: adminName // ★operator追加

      });

      setEditModal({

        isOpen: false, user: null, attendanceType: '通常通所',

        planIn: '', planOut: '', actIn: '', actOut: '', meal: 'なし',

        note: '', breakIn: '', breakOut: '', breakReason: '',

        breakDetailSelect: '', breakDetailText: '', trainingPlace: ''

      });

      fetchData();

    } catch (err) {

      alert("詳細の更新に失敗しました");

    }

  };



  const isValidTime = (timeStr) => {

    if (!timeStr) return false;

    return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());

  };



  const isLate = (planIn, actIn) => {

    if (!isValidTime(planIn) || !isValidTime(actIn)) return false;

    return actIn > planIn;

  };



  const isEarly = (planOut, actOut) => {

    if (!isValidTime(planOut) || !isValidTime(actOut)) return false;

    return actOut < planOut;

  };



  const isMissingAndPastPlan = (dateObj, planIn, currentStamp) => {

    if (currentStamp !== '未打刻') return false;

    if (!isValidTime(planIn)) return false;



    const now = new Date();

    const todayStr = getTodayStr(now);

    const targetStr = getTodayStr(dateObj);



    if (targetStr < todayStr) return true;

    if (targetStr > todayStr) return false;

   

    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return currentTimeStr > planIn;

  };



  const activePlanUsers = roster.filter(r => r.scheduleStatus !== '未登録' && !(r.note || '').includes('【欠席】'));

  const arrivedCount = roster.filter(r => r.currentStamp !== '未打刻').length;

  const notArrivedUsers = activePlanUsers.filter(r => r.currentStamp === '未打刻');

  const mealUsers = activePlanUsers.filter(r => r.meal === '予約');



  let missingCount = notArrivedUsers.length;

  let lateCount = 0;

  let earlyCount = 0;

  activePlanUsers.forEach(u => {

    if (isLate(u.planIn, u.actIn)) lateCount++;

    if (isEarly(u.planOut, u.actOut)) earlyCount++;

  });



  const openEditModal = (user) => {

    const isAbsent = (user.note || '').includes('【欠席】');

    setEditModal({

      isOpen: true,

      user: user,

      attendanceType: isAbsent ? '欠席' : '通常通所',

      planIn: user.planIn || '',

      planOut: user.planOut || '',

      actIn: user.actIn || '',

      actOut: user.actOut || '',

      meal: user.meal || 'なし',

      note: user.note || '',

      breakIn: user.breakIn || '',

      breakOut: user.breakOut || '',

      breakReason: user.breakReason || '',

      breakDetailSelect: user.breakDetailSelect || '',

      breakDetailText: user.breakDetailText || '',

      trainingPlace: user.trainingPlace || ''

    });

  };



  return (

    <div className="animate-fade-in relative pb-20">

      <style>{`
        /* ★修正: 表のヘッダー背景を #f1f5f9 (slate-100) にして濃くし、境界線も少し濃くする */
        .admin-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 1rem; text-align: left; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        .admin-table td { padding: 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .admin-table tr:hover td { background-color: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        
        .select-stylish { 
          appearance: none; 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 9l4-4 4 4m0 6l-4 4-4-4'%3E%3C/path%3E%3C/svg%3E"); 
          background-repeat: no-repeat; 
          background-position: right 0.75rem center; 
          background-size: 1.25rem; 
          padding-right: 2.5rem !important;
          background-color: #ffffff;
          transition: all 0.2s ease;
        }
        .select-stylish:hover { border-color: #94a3b8; }
      `}</style>



      <div className="space-y-12">

        {/* 1. サマリーセクション */}

        {/* 1. サマリーセクション */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="flex flex-col">
              <div className="flex justify-between items-end border-b-2 border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-700">通所状況</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">{arrivedCount}</span>
                  <span className="text-xl text-slate-300 font-light">/</span>
                  <span className="text-xl font-bold text-slate-400">{activePlanUsers.length}</span>
                  <span className="text-xs font-bold text-slate-400">名</span>
                </div>
              </div>
              {/* ★修正: bg-slate-50をbg-slate-100に変更、枠線も濃く */}
              <div className="bg-slate-100 rounded-xl p-5 flex-1 border border-slate-200">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">未打刻 (来所予定)</p>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {notArrivedUsers.length === 0 ? <p className="text-sm text-slate-400 italic">未打刻の利用者はいません</p> : 
                    notArrivedUsers.map(u => (
                      <div key={u.userId} onClick={() => setAbsentModal({ isOpen: true, user: u, reason: '' })} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
                        <span className="font-bold text-slate-700">{u.name}</span>
                        <span className="text-xs text-slate-400 font-bold">{u.planIn} ~ {u.planOut}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-end border-b-2 border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-700">昼食注文</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">{mealUsers.length}</span>
                  <span className="text-xs font-bold text-slate-400">食</span>
                </div>
              </div>
              {/* ★修正: bg-slate-50をbg-slate-100に変更、枠線も濃く */}
              <div className="bg-slate-100 rounded-xl p-5 flex-1 border border-slate-200">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3">食事予定者</p>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {mealUsers.length === 0 ? <p className="text-sm text-slate-400 italic">食事予定者はいません</p> :
                    mealUsers.map(u => (
                      <span key={u.userId} onClick={() => setMealModal({ isOpen: true, user: u, status: '喫食', subUserId: '' })} className="bg-white px-3 py-1.5 rounded border border-slate-200 text-sm font-bold text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-600 cursor-pointer transition-colors">
                        {u.name}
                      </span>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* 2. 名簿・打刻リスト */}

        <section>

          <div className="flex items-center gap-4 mb-6 border-b-2 border-slate-100 pb-4">

            <h3 className="text-lg font-bold text-slate-700">名簿・打刻リスト</h3>

            <div className="flex gap-2">

              {missingCount > 0 && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">未打刻 {missingCount}件</span>}

              {lateCount > 0 && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">遅刻 {lateCount}件</span>}

              {earlyCount > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">早退 {earlyCount}件</span>}

            </div>

          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full admin-table text-left border-collapse">

                <thead>

                  <tr>

                    <th>氏名</th>

                    <th>状態</th>

                    <th>予定時間</th>

                    <th>打刻実績</th>

                    <th>食事</th>

                    <th>備考</th>

                  </tr>

                </thead>

                <tbody>

                  {roster.filter(r => r.scheduleStatus !== '未登録' || r.currentStamp !== '未打刻' || r.meal !== 'なし').length === 0 ? (

                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">本日のデータはありません</td></tr>

                  ) : (

                    roster.filter(r => r.scheduleStatus !== '未登録' || r.currentStamp !== '未打刻' || r.meal !== 'なし').map(u => {

                      const isUserLate = isLate(u.planIn, u.actIn);

                      const isUserEarly = isEarly(u.planOut, u.actOut);

                      const isMissingLate = isMissingAndPastPlan(targetDate, u.planIn, u.currentStamp);

                      const hasWarning = isUserLate || isUserEarly || isMissingLate;

                     

                      let warningTitle = "";

                      if (isMissingLate) warningTitle = "予定時間を過ぎて未打刻";

                      else if (isUserLate && isUserEarly) warningTitle = "遅刻・早退";

                      else if (isUserLate) warningTitle = "遅刻";

                      else if (isUserEarly) warningTitle = "早退";



                      return (

                        <tr

                          key={u.userId}

                          onClick={() => openEditModal(u)}

                          className="cursor-pointer hover:bg-indigo-50/50 transition-colors"

                          title="クリックして詳細を編集"

                        >

                          <td className="font-bold text-slate-800 flex items-center gap-2">

                            {hasWarning && (

                              <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20" title={warningTitle}>

                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />

                              </svg>

                            )}

                            {u.name}

                          </td>

                          <td>

                            {u.currentStamp === 'in' ? <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded text-[11px] border border-emerald-100">通所中</span> :

                             u.currentStamp === 'out' ? <span className="text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded text-[11px] border border-slate-200">退所済</span> : '-'}

                          </td>

                          <td className="text-slate-600">{u.planIn} ~ {u.planOut}</td>

                          <td className="font-bold text-slate-700">

                            {u.actIn || '--:--'} ~ {u.actOut || '--:--'}

                          </td>

                          <td>{u.meal === '予約' ? <span className="text-orange-500 font-bold">🍱 予約</span> : '-'}</td>

                          <td className="text-[11px] text-slate-500 max-w-[200px] truncate">{u.note}</td>

                        </tr>

                      );

                    })

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>



        {/* 3. 承認待ちリスト */}

        <section>

          <div className="flex items-center gap-4 mb-6 border-b-2 border-slate-100 pb-4">

            <h3 className="text-lg font-bold text-slate-700">承認待ちリスト</h3>

            {pendingList.length > 0 && <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded">{pendingList.length}件</span>}

          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full admin-table text-left border-collapse">

                <thead>

                  <tr>
                    <th className="w-32">申請日時</th>
                    <th className="w-48">対象者 (対象日)</th>
                    <th className="min-w-[150px]">通所予定 (時間)</th>
                    <th className="w-24">食事注文</th>
                    <th className="min-w-[200px]">変更理由</th>
                    <th className="w-24 text-center">操作</th>
                  </tr>

                </thead>

                <tbody>

                  {pendingList.length === 0 ? (

                    <tr><td colSpan="5" className="text-center py-12 text-slate-400">現在、承認待ちの申請はありません。</td></tr>

                  ) : (

                    pendingList.map(p => (

                      <tr key={p.planId}>

                        <td className="text-[11px] text-slate-500">{p.appliedAt || '記録なし'}</td>

                        <td>

                          <div className="font-bold text-slate-800 text-base">{p.name}</div>

                          <div className="text-xs font-bold text-indigo-600 mt-0.5">{p.date}</div>

                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 line-through">{p.originalIn || '--:--'} ~ {p.originalOut || '--:--'}</span>
                            <span className="text-slate-300 text-xs font-bold">➔</span>
                            <span className="text-sm font-bold text-indigo-700">{p.planIn} ~ {p.planOut}</span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm font-bold">{p.meal === '予約' ? <span className="text-orange-500">あり</span> : <span className="text-slate-400">なし</span>}</div>
                        </td>
                        <td className="text-xs text-slate-600 font-medium break-all whitespace-normal">{p.note || '-'}</td>
                        <td className="text-center">

                          <button onClick={() => updateStatus(p.planId, '承認済')} className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded shadow-sm hover:bg-indigo-700 transition-all text-xs w-full">

                            承認

                          </button>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </div>



      {/* --- モーダル群 --- */}

     

      {/* ① 欠席入力モーダル */}

      {absentModal.isOpen && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">

            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">{absentModal.user?.name} の欠席処理</h3>

            <div className="space-y-4 mb-6">

              <div>

                <label className="block text-xs font-bold text-slate-500 mb-1">欠席理由</label>

                <textarea

                  value={absentModal.reason}

                  onChange={(e) => setAbsentModal({...absentModal, reason: e.target.value})}

                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none h-24 text-sm"

                  placeholder="体調不良のため、等"

                />

              </div>

            </div>

            <div className="flex justify-end gap-3">

              <button onClick={() => setAbsentModal({ isOpen: false, user: null, reason: '' })} className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-600 text-sm hover:bg-slate-50">キャンセル</button>

              <button onClick={handleAbsent} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700">欠席として処理</button>

            </div>

          </div>

        </div>

      )}



      {/* ② 食事変更モーダル */}

      {mealModal.isOpen && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">

            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">{mealModal.user?.name} の食事変更</h3>

            <div className="space-y-5 mb-6">

              <div>

                <label className="block text-xs font-bold text-slate-500 mb-2">状態の変更</label>

                <select

                value={mealModal.status}

                onChange={(e) => setMealModal({...mealModal, status: e.target.value, subUserId: ''})}

                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 select-stylish font-bold text-slate-700 shadow-sm cursor-pointer"

              >

                <option value="予約">予約</option>

                <option value="喫食">喫食</option>

                <option value="キャンセル">キャンセル</option>

                <option value="取消">取消</option>

                <option value="代食">代食</option>

              </select>

              </div>



              {mealModal.status === '代食' && (

                <div className="animate-fade-in">

                  <label className="block text-xs font-bold text-slate-500 mb-2">代わりの対象者を選択</label>

                  <select

                    value={mealModal.subUserId}

                    onChange={(e) => setMealModal({...mealModal, subUserId: e.target.value})}

                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 select-stylish font-bold text-slate-700 shadow-sm cursor-pointer"

                  >

                    <option value="">-- 選択してください --</option>

                    {roster.filter(r => r.meal !== '予約').map(u => (

                      <option key={u.userId} value={u.userId}>{u.name}</option>

                    ))}

                  </select>

                  <p className="text-[10px] text-slate-400 mt-2">※選択された利用者は承認なしで「喫食」扱いとなります。</p>

                </div>

              )}

            </div>

            <div className="flex justify-end gap-3">

              <button onClick={() => setMealModal({ isOpen: false, user: null, status: '喫食', subUserId: '' })} className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-600 text-sm hover:bg-slate-50">閉じる</button>

              <button onClick={handleMeal} disabled={mealModal.status === '代食' && !mealModal.subUserId} className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">更新する</button>

            </div>

          </div>

        </div>

      )}



      {/* ③ 総合編集モーダル */}

      {editModal.isOpen && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">

              <h3 className="text-xl font-bold text-slate-800">{editModal.user?.name} の詳細編集</h3>

              <button onClick={() => setEditModal({...editModal, isOpen: false})} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">✕</button>

            </div>

           

            <div className="p-6 overflow-y-auto custom-scrollbar">

             

              {/* ステータス切替タブ */}

              <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-lg shrink-0">

                {['通常通所', '実習', '欠席'].map(type => (

                  <button

                    key={type}

                    onClick={() => setEditModal({...editModal, attendanceType: type})}

                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${editModal.attendanceType === type ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}

                  >

                    {type}

                  </button>

                ))}

              </div>



              <div className="space-y-6">

                {/* ---------- 欠席の場合 ---------- */}

                {editModal.attendanceType === '欠席' && (

                  <div className="animate-fade-in">

                    <label className="block text-xs font-bold text-slate-500 mb-2">

                      備考・理由 <span className="text-rose-500 ml-1">*欠席理由は必須です</span>

                    </label>

                    <textarea

                      value={editModal.note}

                      onChange={(e) => setEditModal({...editModal, note: e.target.value})}

                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-sm resize-none h-32 bg-white"

                      placeholder="欠席理由を入力してください..."

                    ></textarea>

                  </div>

                )}



                {/* ---------- 通常通所 ＆ 実習の場合 ---------- */}

                {editModal.attendanceType !== '欠席' && (

                  <div className="animate-fade-in space-y-6">

                   

                    {/* 予定・実績時間 */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">

                      <div>

                        <label className="block text-xs font-bold text-slate-500 mb-2">予定時間 (IN / OUT)</label>

                        <div className="flex items-center gap-2">

                          <input type="time" value={editModal.planIn} onChange={(e) => setEditModal({...editModal, planIn: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-700 bg-white shadow-sm" />

                          <span className="text-slate-400 font-bold">~</span>

                          <input type="time" value={editModal.planOut} onChange={(e) => setEditModal({...editModal, planOut: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-700 bg-white shadow-sm" />

                        </div>

                      </div>

                      <div>

                        <label className="block text-xs font-bold text-indigo-500 mb-2">打刻実績 (IN / OUT)</label>

                        <div className="flex items-center gap-2">

                          <input type="time" value={editModal.actIn} onChange={(e) => setEditModal({...editModal, actIn: e.target.value})} className="w-full p-2.5 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-indigo-700 bg-indigo-50/50 shadow-sm" />

                          <span className="text-slate-400 font-bold">~</span>

                          <input type="time" value={editModal.actOut} onChange={(e) => setEditModal({...editModal, actOut: e.target.value})} className="w-full p-2.5 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-indigo-700 bg-indigo-50/50 shadow-sm" />

                        </div>

                      </div>

                    </div>



                    {/* 実習先 (実習のみ) */}

                    {editModal.attendanceType === '実習' && (

                      <div className="animate-fade-in p-4 bg-blue-50/50 rounded-xl border border-blue-100">

                        <label className="block text-xs font-bold text-blue-600 mb-2">実習先</label>

                        <input type="text" value={editModal.trainingPlace} onChange={(e) => setEditModal({...editModal, trainingPlace: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 bg-white shadow-sm" placeholder="実習先名を入力..." />

                      </div>

                    )}



                    {/* 中抜け */}

                    <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-5">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>

                          <label className="block text-xs font-bold text-amber-600 mb-2">中抜け (外出 / 戻り)</label>

                          <div className="flex items-center gap-2">

                            <input type="time" value={editModal.breakIn} onChange={(e) => setEditModal({...editModal, breakIn: e.target.value})} className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white shadow-sm" />

                            <span className="text-slate-400 font-bold">~</span>

                            <input type="time" value={editModal.breakOut} onChange={(e) => setEditModal({...editModal, breakOut: e.target.value})} className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white shadow-sm" />

                          </div>

                        </div>

                        <div>

                          <label className="block text-xs font-bold text-amber-600 mb-2">用件</label>

                          <select

                            value={editModal.breakReason}

                            onChange={(e) => setEditModal({...editModal, breakReason: e.target.value, breakDetailSelect: '', breakDetailText: ''})}

                            className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 select-stylish font-bold text-slate-700 bg-white shadow-sm cursor-pointer"

                          >

                            <option value="">なし</option>

                            <option value="通院">通院</option>

                            <option value="ハローワーク">ハローワーク</option>

                            <option value="その他">その他</option>

                          </select>

                        </div>

                      </div>



                      {/* 中抜け詳細ドロップダウン・手入力枠 */}

                      {editModal.breakReason === '通院' && (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-t border-amber-100 pt-4 mt-2">

                          <div>

                            <label className="block text-xs font-bold text-amber-600 mb-2">詳細</label>

                            <select

                              value={editModal.breakDetailSelect}

                              onChange={(e) => setEditModal({...editModal, breakDetailSelect: e.target.value, breakDetailText: ''})}

                              className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 select-stylish font-bold text-slate-700 bg-white shadow-sm cursor-pointer"

                            >

                              <option value="">選択してください</option>

                              <option value="精神科">精神科</option>

                              <option value="その他">その他</option>

                            </select>

                          </div>

                          {editModal.breakDetailSelect === 'その他' && (

                            <div className="animate-fade-in">

                              <label className="block text-xs font-bold text-amber-600 mb-2">詳細内容</label>

                              <input type="text" value={editModal.breakDetailText} onChange={(e) => setEditModal({...editModal, breakDetailText: e.target.value})} className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white shadow-sm" placeholder="詳細を入力..." />

                            </div>

                          )}

                        </div>

                      )}



                      {editModal.breakReason === 'ハローワーク' && (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-t border-amber-100 pt-4 mt-2">

                          <div>

                            <label className="block text-xs font-bold text-amber-600 mb-2">詳細</label>

                            <select

                              value={editModal.breakDetailSelect}

                              onChange={(e) => setEditModal({...editModal, breakDetailSelect: e.target.value, breakDetailText: ''})}

                              className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 select-stylish font-bold text-slate-700 bg-white shadow-sm cursor-pointer"

                            >

                              <option value="">選択してください</option>

                              <option value="失業認定日">失業認定日</option>

                              <option value="面談日">面談日</option>

                              <option value="その他">その他</option>

                            </select>

                          </div>

                          {editModal.breakDetailSelect === 'その他' && (

                            <div className="animate-fade-in">

                              <label className="block text-xs font-bold text-amber-600 mb-2">詳細内容</label>

                              <input type="text" value={editModal.breakDetailText} onChange={(e) => setEditModal({...editModal, breakDetailText: e.target.value})} className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white shadow-sm" placeholder="詳細を入力..." />

                            </div>

                          )}

                        </div>

                      )}



                      {editModal.breakReason === 'その他' && (

                        <div className="animate-fade-in border-t border-amber-100 pt-4 mt-2">

                          <label className="block text-xs font-bold text-amber-600 mb-2">詳細内容</label>

                          <input type="text" value={editModal.breakDetailText} onChange={(e) => setEditModal({...editModal, breakDetailText: e.target.value})} className="w-full p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white shadow-sm" placeholder="詳細を入力..." />

                        </div>

                      )}

                    </div>



                    {/* 食事・備考 */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* 実習の場合は食事を非表示にし、備考を全幅にする */}

                      {editModal.attendanceType === '通常通所' && (

                        <div>

                        <label className="block text-xs font-bold text-slate-500 mb-2">食事</label>

                        <select

                          value={editModal.meal}

                          onChange={(e) => setEditModal({...editModal, meal: e.target.value})}

                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 select-stylish font-bold text-slate-700 bg-white shadow-sm cursor-pointer"

                        >

                          <option value="なし">なし</option>

                          <option value="予約">予約</option>

                          <option value="喫食">喫食</option>

                          <option value="キャンセル">キャンセル</option>

                          <option value="取消">取消</option>

                        </select>

                      </div>

                      )}

                      <div className={editModal.attendanceType === '実習' ? "md:col-span-2" : ""}>

                        <label className="block text-xs font-bold text-slate-500 mb-2">備考 (特記事項など)</label>

                        <textarea value={editModal.note} onChange={(e) => setEditModal({...editModal, note: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm resize-none h-24 bg-white shadow-sm" placeholder="備考を入力..."></textarea>

                      </div>

                    </div>



                  </div>

                )}

              </div>

            </div>

           

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">

              <button onClick={() => setEditModal({...editModal, isOpen: false})} className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">キャンセル</button>

              <button

                onClick={handleUpdateDetail}

                disabled={editModal.attendanceType === '欠席' && !editModal.note.trim()}

                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

              >

                すべての変更を保存

              </button>

            </div>

          </div>

        </div>

      )}



    </div>

  );

}



export default DailyRosterTab;