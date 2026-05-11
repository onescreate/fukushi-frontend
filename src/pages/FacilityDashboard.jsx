import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function FacilityDashboard() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || '利用者'
  
  const statusKey = `stampStatus_${userName}`
  
  const getDailyStatus = () => {
    const stored = localStorage.getItem(statusKey);
    if (!stored) return 'out'; 
    try {
      const data = JSON.parse(stored);
      const todayStr = new Date().toLocaleDateString('ja-JP');
      if (data.date === todayStr) {
        return data.status;
      } else {
        return 'out';
      }
    } catch (e) {
      return 'out';
    }
  }

  const [currentStatus, setCurrentStatus] = useState(getDailyStatus())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stampMessage, setStampMessage] = useState('')
  const [todayData, setTodayData] = useState({ planIn: '-', planOut: '-', mealStatus: 'なし' })

  // 健康記録モーダル用のState
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [healthNote, setHealthNote] = useState('');
  const [isHealthSubmitting, setIsHealthSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // ★追加：過去の未記入欠席と理由モーダル用State
  const [pastAbsences, setPastAbsences] = useState([]);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonType, setReasonType] = useState('遅刻'); // '遅刻', '早退', '欠席'
  const [reasonDate, setReasonDate] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [pendingStampType, setPendingStampType] = useState(null); // 打刻再開用

  // ★追加：カスタム通知モーダル用のStateと関数
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // ★追加：過去の未記入欠席を取得する関数
  const fetchPastAbsences = async (uid) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/past-absences`, { params: { user_id: uid } });
      if (res.data.success) {
        setPastAbsences(res.data.list || []);
      }
    } catch (e) {
      console.error("過去欠席取得エラー:", e);
    }
  };

  useEffect(() => {
    const fetchTodayPlanAndHealthCheck = async () => {
      try {
        const token = localStorage.getItem('userToken')
        if (!token) return;
        const payload = JSON.parse(atob(token.split('.')[1]))
        const uid = payload.id
        setUserId(uid);
        
        // ★追加：過去の欠席をチェック
        fetchPastAbsences(uid);

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/today`, {
          params: { user_id: uid, date: dateStr }
        });
        if (res.data.success) {
          setTodayData(res.data.today);
        }
      } catch (error) {
        console.error("予定取得エラー:", error);
      }
    };
    fetchTodayPlanAndHealthCheck();
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }
  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userName')
    navigate('/facility-login') 
  }

  // ★追加：打刻ボタンを押した時の「遅刻・早退」自動判定
  const triggerStamp = (type) => {
    const timeString = formatTime(currentTime);
    let isLate = false;
    let isEarly = false;

    // 予定時間が設定されている場合のみ比較
    if (type === 'in' && todayData.planIn !== '-') {
      if (timeString > todayData.planIn) isLate = true;
    }
    if (type === 'out' && todayData.planOut !== '-') {
      if (timeString < todayData.planOut) isEarly = true;
    }

    if (isLate || isEarly) {
      // 理由モーダルを表示して打刻を一旦止める
      setReasonType(isLate ? '遅刻' : '早退');
      const d = new Date();
      setReasonDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setReasonText('');
      setPendingStampType(type);
      setShowReasonModal(true);
    } else {
      // 予定通りなら普通に打刻
      handleStamp(type, null, null);
    }
  };

  // ★追加：理由モーダルから送信された時の処理
  const submitReason = async () => {
    if (!reasonText.trim()) return showAlert('入力エラー', '理由を入力してください。', 'warning');

    if (pendingStampType) {
      // 遅刻・早退の場合（今日） -> 実際の打刻APIを呼ぶ
      setShowReasonModal(false);
      handleStamp(pendingStampType, reasonType, reasonText);
    } else {
      // 過去の欠席理由の場合 -> 欠席理由APIを呼ぶ
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/past-absences/reason`, {
          user_id: userId, date: reasonDate, reason: reasonText
        });
        if (res.data.success) {
          setShowReasonModal(false);
          fetchPastAbsences(userId); // リストを再取得
          showAlert('完了', '欠席理由を保存しました。', 'success');
        }
      } catch (e) {
        showAlert('エラー', '保存に失敗しました', 'error');
      }
    }
  };

  // ★修正：引数に reason, status_type を追加し、APIに送る
  const handleStamp = async (type, rType = null, rText = null) => {
    const timeString = formatTime(currentTime)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/stamp`, {
        user_id: userId,
        stamp_type: type,
        reason: rText,          // ★追加
        status_type: rType      // ★追加
      })

      const todayStr = new Date().toLocaleDateString('ja-JP');
      localStorage.setItem(statusKey, JSON.stringify({ status: type, date: todayStr }));
      setCurrentStatus(type);

      // 通所時のみ、健康記録が必要かチェック
      if (type === 'in') {
        try {
          const healthCheckRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/health-check`, {
            params: { user_id: userId }
          });
          if (healthCheckRes.data.success && healthCheckRes.data.needInput) {
            // ★ マスタの身長を初期値としてセット
            setHeight(healthCheckRes.data.defaultHeight || '');
            setShowHealthModal(true);
            return;
          }
        } catch (e) {
          console.error("健康チェックエラー:", e);
        }
        setStampMessage(`${timeString} - 通所を記録しました`)
      } else {
        setStampMessage(`${timeString} - 退所を記録しました`)
      }

      setTimeout(() => handleLogout(), 3000)
    } catch (error) {
      console.error(error)
      setStampMessage('エラー：通信に失敗しました。もう一度お試しください。')
      setTimeout(() => setStampMessage(''), 3000)
    }
  }

  // ★修正：alert() を撤廃し、カスタムモーダル(showAlert)で具体的なエラーを表示する
  const handleHealthSubmit = async () => {
    if (!weight || !height) {
      return showAlert('入力エラー', '身長と体重の数値を正しく入力してください。', 'warning');
    }
    setIsHealthSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/health-record`, {
        user_id: userId,
        weight: parseFloat(weight),
        height: parseFloat(height),
        note: healthNote
      });
      if (res.data.success) {
        setShowHealthModal(false);
        setStampMessage(`${formatTime(new Date())} - 通所と測定記録を完了しました`);
        setTimeout(() => handleLogout(), 3000);
      }
    } catch (error) {
      // データベース等から返ってきた具体的なエラー文面を表示
      const dbErrorMsg = error.response?.data?.error || '通信に失敗しました。';
      showAlert('保存に失敗しました', `エラー詳細: ${dbErrorMsg}`, 'error');
    } finally {
      setIsHealthSubmitting(false);
    }
  };

  // ★追加：入力をスキップする処理
  const handleSkipHealth = () => {
    setShowHealthModal(false);
    setStampMessage(`${formatTime(new Date())} - 通所を記録しました（測定は後回しにしました）`);
    setTimeout(() => handleLogout(), 3000);
  };

  return (
    // ★修正：文法エラーの原因だった justify-content を justifyContent に修正
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F1F5F9',
      padding: '20px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          box-sizing: border-box;
        }

        .dashboard-card {
          background: #FFFFFF;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          padding: 48px;
          width: 100%;
          max-width: 540px;
        }

        .time-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 88px;
          font-weight: 700;
          color: #0F172A;
          text-align: center;
          letter-spacing: -2px;
          line-height: 1;
          margin: 16px 0 40px 0;
        }

        .date-display {
          font-size: 18px;
          font-weight: 600;
          color: #64748B;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .action-btn {
          width: 100%;
          padding: 24px;
          font-size: 22px;
          font-weight: 700;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          letter-spacing: 2px;
        }
        
        .btn-start { background: #10B981; color: #FFFFFF; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .btn-start:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }

        .btn-end { background: #F87171; color: #FFFFFF; box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2); }
        .btn-end:hover { background: #EF4444; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(248, 113, 113, 0.3); }

        .schedule-container {
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid #E2E8F0;
        }

        .schedule-item {
          display: flex;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid #F1F5F9;
        }
        .schedule-item:last-child { border-bottom: none; }
        
        .schedule-time { font-family: 'JetBrains Mono', monospace; color: #64748B; font-size: 14px; font-weight: 500; }
        .schedule-task { color: #1E293B; font-weight: 600; font-size: 15px; }

        .success-overlay {
          background: #F8FAFC; border: 1px solid #E2E8F0; color: #0F172A;
          padding: 32px 24px; border-radius: 16px; text-align: center;
          font-weight: 600; font-size: 20px; margin-bottom: 24px;
          animation: fadeIn 0.3s ease;
        }

        .meal-badge {
          display: inline-block; padding: 4px 10px; border-radius: 8px;
          background: #FFF7ED; color: #EA580C; font-size: 13px; font-weight: 700; border: 1px solid #FED7AA;
        }

        .health-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
          padding: 20px; animation: fadeIn 0.3s ease;
        }
        .health-modal-content {
          background: #FFFFFF; border-radius: 24px; width: 100%; max-width: 400px;
          padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
        }
        .health-input-group { margin-bottom: 24px; text-align: left; }
        .health-label { display: block; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .health-input-wrapper { position: relative; }
        .health-input {
          width: 100%; padding: 16px 48px 16px 16px; font-size: 24px; font-weight: 700;
          color: #0F172A; background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px;
          text-align: center; transition: all 0.2s;
        }
        .health-input:focus { outline: none; border-color: #3B82F6; background: #FFFFFF; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .health-unit { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-weight: 700; color: #94A3B8; }
        .health-submit-btn {
          width: 100%; padding: 20px; background: #3B82F6; color: white; border: none;
          border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-bottom: 12px;
        }
        .health-submit-btn:hover { background: #2563EB; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
        .health-submit-btn:disabled { background: #94A3B8; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ★追加：スキップボタン用のスタイル */
        .health-skip-btn {
          width: 100%; padding: 12px; background: transparent; color: #64748B; border: none;
          border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .health-skip-btn:hover { background: #F1F5F9; color: #0F172A; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* ★追加：カスタム通知モーダル用のスタイル */
        .custom-alert-content {
          background: #FFFFFF; border-radius: 24px; width: 100%; max-width: 360px;
          padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); text-align: center;
        }
        .custom-alert-icon {
          width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 28px;
        }
        .icon-error { background: #FEF2F2; color: #EF4444; }
        .icon-warning { background: #FFFBEB; color: #F59E0B; }
        .custom-alert-title { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 12px; }
        .custom-alert-message { font-size: 14px; font-weight: 500; color: #64748B; margin-bottom: 24px; word-break: break-all; }
        .custom-alert-btn {
          width: 100%; padding: 16px; background: #0F172A; color: white; border: none;
          border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .custom-alert-btn:hover { background: #1E293B; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ★追加：カスタム通知モーダル */}
      {alertConfig.isOpen && (
        <div className="health-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="custom-alert-content animate-slide-up">
            <div className={`custom-alert-icon ${alertConfig.type === 'error' ? 'icon-error' : 'icon-warning'}`}>
              {alertConfig.type === 'error' ? '✖' : '！'}
            </div>
            <h3 className="custom-alert-title">{alertConfig.title}</h3>
            <p className="custom-alert-message">{alertConfig.message}</p>
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className="custom-alert-btn">
              確認して閉じる
            </button>
          </div>
        </div>
      )}

      {/* ★追加：理由入力モーダル（遅刻・早退・過去の欠席 共通） */}
      {showReasonModal && (
        <div className="health-modal-overlay" style={{ zIndex: 1050 }}>
          <div className="health-modal-content animate-slide-up" style={{ maxWidth: '450px' }}>
            <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              {reasonType}理由の入力
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', fontWeight: '600' }}>
              {reasonType === '欠席' ? `${reasonDate} は打刻がありませんでした。欠席理由を入力してください。` : `予定時間を過ぎているため、${reasonType}理由が必須です。`}
            </p>
            
            <div className="health-input-group">
              <textarea
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                className="w-full p-4 font-bold color-[#0F172A] bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-rose-400 transition-all"
                rows="3"
                placeholder="理由を入力してください..."
                style={{ resize: 'none' }}
              ></textarea>
            </div>

            <button onClick={submitReason} className="health-submit-btn" style={{ background: '#EF4444' }}>
              記録して進む
            </button>

            {/* 遅刻・早退の入力時のみ「キャンセルして戻る」を許可する */}
            {pendingStampType && (
              <button onClick={() => setShowReasonModal(false)} className="health-skip-btn">
                キャンセル
              </button>
            )}
          </div>
        </div>
      )}

      {showHealthModal && (
        <div className="health-modal-overlay">
          <div className="health-modal-content">
            <div style={{ width: '64px', height: '64px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <span style={{ fontSize: '32px' }}>📊</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>今月の健康記録</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px', fontWeight: '500' }}>月初めの記録をお願いします</p>
            
            <div className="health-input-group">
              <label className="health-label">現在の体重</label>
              <div className="health-input-wrapper">
                <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="health-input" placeholder="00.0" />
                <span className="health-unit">kg</span>
              </div>
            </div>
            
            <div className="health-input-group">
              <label className="health-label">現在の身長</label>
              <div className="health-input-wrapper">
                <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="health-input" placeholder="000.0" />
                <span className="health-unit">cm</span>
              </div>
            </div>

            <div className="health-input-group">
              <label className="health-label">特記事項（任意）</label>
              <textarea
                value={healthNote}
                onChange={e => setHealthNote(e.target.value)}
                className="w-full p-4 font-medium color-[#0F172A] bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#3B82F6] transition-all"
                rows="2"
                placeholder="気になる症状などがあればご記入ください"
                style={{ resize: 'none' }}
              ></textarea>
            </div>

            <button onClick={handleHealthSubmit} disabled={isHealthSubmitting} className="health-submit-btn">
              {isHealthSubmitting ? '保存中...' : '記録して通所する'}
            </button>
            
            {/* ★追加：スキップボタン */}
            <button onClick={handleSkipHealth} disabled={isHealthSubmitting} className="health-skip-btn">
              後で入力する（スキップ）
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        {/* ★追加：過去の未記入欠席がある場合の警告バナー */}
        {pastAbsences.length > 0 && !stampMessage && (
          <div 
            onClick={() => {
              setReasonType('欠席');
              setReasonDate(pastAbsences[0].date);
              setReasonText('');
              setPendingStampType(null); // 欠席理由モード
              setShowReasonModal(true);
            }}
            style={{
              background: '#FEF2F2', border: '2px solid #FCA5A5', color: '#EF4444',
              padding: '16px 20px', borderRadius: '16px', margin: '0 0 24px 0',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
              fontWeight: '700', fontSize: '15px', animation: 'fadeIn 0.3s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
            }}
          >
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              過去の欠席（{pastAbsences[0].date}等）の理由が未入力です。
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>タップして入力画面を開く</span>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '20px', color: '#1E293B', marginBottom: '16px', fontWeight: '700', textAlign: 'center' }}>
          {userName} さん
        </h2>

        {stampMessage ? (
          <div className="success-overlay" style={{ color: stampMessage.includes('エラー') ? '#EF4444' : '#0F172A', borderColor: stampMessage.includes('エラー') ? '#FCA5A5' : '#E2E8F0' }}>
            {stampMessage}
            {!stampMessage.includes('エラー') && (
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '16px', fontWeight: '500' }}>
                まもなく自動的に画面が戻ります...
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="date-display">{formatDate(currentTime)}</div>
            <div className="time-display">{formatTime(currentTime)}</div>

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
              {currentStatus !== 'in' ? (
                <button className="action-btn btn-start" onClick={() => triggerStamp('in')}>通所</button>
              ) : (
                <button className="action-btn btn-end" onClick={() => triggerStamp('out')}>退所</button>
              )}
            </div>
          </>
        )}

        <div className="schedule-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px' }}>本日の予定</div>
            {todayData.mealStatus === '予約' && <span className="meal-badge">🍱 お弁当あり</span>}
          </div>
          
          <div className="schedule-item">
            <span className="schedule-time">通所予定</span>
            <span className="schedule-task">{todayData.planIn}</span>
          </div>
          <div className="schedule-item">
            <span className="schedule-time">退所予定</span>
            <span className="schedule-task">{todayData.planOut}</span>
          </div>
        </div>

        {!stampMessage && (
          <button onClick={handleLogout} style={{ width: '100%', marginTop: '32px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
            キャンセル（ログアウト）
          </button>
        )}
      </div>
    </div>
  )
}

export default FacilityDashboard