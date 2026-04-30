import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios' // ★追加：通信用のツール

function FacilityDashboard() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || '利用者'
  
  const statusKey = `stampStatus_${userName}`
  const [currentStatus, setCurrentStatus] = useState(localStorage.getItem(statusKey) || 'out')
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stampMessage, setStampMessage] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }
  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userName')
    // ★ここだけ修正：新しいタブレットのログイン画面に戻るようにしています
    navigate('/facility-login') 
  }

  // ★大幅アップデート：ボタンを押した時にバックエンドへ通信する
  const handleStamp = async (type) => {
    const timeString = formatTime(currentTime)
    
    try {
      // プロのテクニック：通行証（トークン）を解読して、中に隠れている利用者のIDを取り出す
      const token = localStorage.getItem('userToken')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.id

      // バックエンドの打刻APIへデータを送信！
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/stamp`, {
        user_id: userId,
        stamp_type: type
      })

      // 通信が大成功したら、画面の表示を切り替える
      if (type === 'in') {
        localStorage.setItem(statusKey, 'in')
        setStampMessage(`${timeString} - 通所を記録しました`)
      } else {
        localStorage.setItem(statusKey, 'out')
        setStampMessage(`${timeString} - 退所を記録しました`)
      }

      // 3秒後に自動ログアウト
      setTimeout(() => {
        handleLogout()
      }, 3000)

    } catch (error) {
      console.error(error)
      // 万が一通信に失敗した場合は赤文字でエラーを出す
      setStampMessage('エラー：通信に失敗しました。もう一度お試しください。')
      setTimeout(() => setStampMessage(''), 3000)
    }
  }

  const todaySchedule = [
    { time: '10:00 - 12:00', task: '午前作業（軽作業）' },
    { time: '12:00 - 13:00', task: '昼食・休憩' },
    { time: '13:00 - 15:00', task: '午後作業（梱包）' }
  ]

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
        
        .btn-start {
          background: #10B981;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-start:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .btn-end {
          background: #F87171;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
        }
        .btn-end:hover {
          background: #EF4444;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(248, 113, 113, 0.3);
        }

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
        .schedule-item:last-child {
          border-bottom: none;
        }
        
        .schedule-time {
          font-family: 'JetBrains Mono', monospace;
          color: #64748B;
          font-size: 14px;
          font-weight: 500;
        }
        
        .schedule-task {
          color: #1E293B;
          font-weight: 600;
          font-size: 15px;
        }

        .success-overlay {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 32px 24px;
          border-radius: 16px;
          text-align: center;
          font-weight: 600;
          font-size: 20px;
          margin-bottom: 24px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
                <button className="action-btn btn-start" onClick={() => handleStamp('in')}>
                  通所
                </button>
              ) : (
                <button className="action-btn btn-end" onClick={() => handleStamp('out')}>
                  退所
                </button>
              )}
            </div>
          </>
        )}

        <div className="schedule-container">
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', letterSpacing: '1px', marginBottom: '12px' }}>
            本日の予定
          </div>
          {todaySchedule.map((item, index) => (
            <div key={index} className="schedule-item">
              <span className="schedule-time">{item.time}</span>
              <span className="schedule-task">{item.task}</span>
            </div>
          ))}
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