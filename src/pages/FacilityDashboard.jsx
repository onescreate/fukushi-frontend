import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function FacilityDashboard() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || '利用者'
  
  const statusKey = `stampStatus_${userName}`
  
  // ★追加・修正：保存されている状態が「今日のものか」を判定し、過去ならリセットする
  const getDailyStatus = () => {
    const stored = localStorage.getItem(statusKey);
    if (!stored) return 'out'; // 何もなければ「通所(out状態)」
    
    try {
      const data = JSON.parse(stored);
      const todayStr = new Date().toLocaleDateString('ja-JP');
      // 保存されている日付が今日と同じならその状態を返し、違うならリセット
      if (data.date === todayStr) {
        return data.status;
      } else {
        return 'out';
      }
    } catch (e) {
      // 古い形式（単なる 'in' や 'out' の文字列）が残っていた場合の安全策
      return 'out';
    }
  }

  const [currentStatus, setCurrentStatus] = useState(getDailyStatus())
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stampMessage, setStampMessage] = useState('')

  const [todayData, setTodayData] = useState({ planIn: '-', planOut: '-', mealStatus: 'なし' })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchTodayPlan = async () => {
      try {
        const token = localStorage.getItem('userToken')
        if (!token) return;
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userId = payload.id
        
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/today`, {
          params: { user_id: userId, date: dateStr }
        });

        if (res.data.success) {
          setTodayData(res.data.today);
        }
      } catch (error) {
        console.error("予定取得エラー:", error);
      }
    };
    fetchTodayPlan();
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

  const handleStamp = async (type) => {
    const timeString = formatTime(currentTime)
    try {
      const token = localStorage.getItem('userToken')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.id

      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/stamp`, {
        user_id: userId,
        stamp_type: type
      })

      // ★追加・修正：打刻した「日付」と一緒にステータスを保存する
      const todayStr = new Date().toLocaleDateString('ja-JP');
      localStorage.setItem(statusKey, JSON.stringify({ status: type, date: todayStr }));
      setCurrentStatus(type); // ボタンを即座に切り替える

      if (type === 'in') {
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

  return (
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

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="dashboard-card">
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
                <button className="action-btn btn-start" onClick={() => handleStamp('in')}>通所</button>
              ) : (
                <button className="action-btn btn-end" onClick={() => handleStamp('out')}>退所</button>
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