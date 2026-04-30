import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function AdminDashboard() {
  const navigate = useNavigate()
  const adminName = localStorage.getItem('adminName') || '管理者'
  
  // 打刻記録を保存する状態
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 画面が開いた瞬間に、バックエンドから打刻記録を取得する
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attendance`)
        setAttendanceRecords(response.data.records)
      } catch (err) {
        setError('データの取得に失敗しました。')
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminName')
    navigate('/admin-login') // ★修正：管理者のログイン画面に戻る！
  }

  // 時刻を美しくフォーマットする関数
  const formatDateTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC', 
      padding: '40px 20px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        
        .admin-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .data-card {
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 15px rgba(0, 0, 0, 0.04);
          overflow: hidden; /* 角丸からテーブルがはみ出さないようにする */
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          background-color: #F1F5F9;
          color: #475569;
          font-weight: 600;
          font-size: 14px;
          padding: 16px 24px;
          border-bottom: 1px solid #E2E8F0;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 16px 24px;
          border-bottom: 1px solid #F1F5F9;
          color: #1E293B;
          font-size: 15px;
        }

        .data-table tr:last-child td {
          border-bottom: none;
        }

        .data-table tr:hover {
          background-color: #F8FAFC;
        }

        .badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .badge-in {
          background-color: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }
        .badge-out {
          background-color: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .logout-btn {
          padding: 10px 20px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #64748B;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
      `}</style>

      <div className="admin-container">
        <div className="header-section">
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#0F172A', fontWeight: '700' }}>
              管理者ダッシュボード
            </h2>
            <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
              {adminName} さん、お疲れ様です。
            </p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            ログアウト
          </button>
        </div>

        <div className="data-card">
          <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A', fontWeight: '600' }}>
              本日の打刻ログ
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>データを読み込み中...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>{error}</div>
          ) : attendanceRecords.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>打刻記録がありません。</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>利用者名</th>
                  <th>種別</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {formatDateTime(record.stamp_time)}
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {record.last_name} {record.first_name}
                    </td>
                    <td>
                      <span className={`badge ${record.stamp_type === 'in' ? 'badge-in' : 'badge-out'}`}>
                        {record.stamp_type === 'in' ? '通所' : '退所'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard