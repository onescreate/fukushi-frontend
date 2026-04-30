import { useNavigate } from 'react-router-dom'

function Portal() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', padding: '20px' }}>
      <style>{`
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .portal-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); padding: 48px 40px; width: 100%; max-width: 500px; text-align: center; }
        .menu-btn { width: 100%; padding: 24px; border-radius: 16px; border: none; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; alignItems: center; gap: 8px; margin-bottom: 16px; }
        .btn-personal { background: #10B981; color: #FFFFFF; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
        .btn-personal:hover { background: #059669; transform: translateY(-2px); }
        .btn-facility { background: #3B82F6; color: #FFFFFF; box-shadow: 0 4px 12px rgba(59,130,246,0.2); }
        .btn-facility:hover { background: #2563EB; transform: translateY(-2px); }
        .btn-admin { background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; padding: 16px; }
        .btn-admin:hover { background: #F1F5F9; border-color: #CBD5E1; color: #0F172A; }
        .btn-title { font-size: 18px; font-weight: 700; }
        .btn-desc { font-size: 13px; font-weight: 500; opacity: 0.9; }
      `}</style>
      <div className="portal-card">
        <h1 style={{ fontSize: '28px', color: '#0F172A', fontWeight: '700', margin: '0 0 8px 0' }}>福祉施設システム</h1>
        <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 40px 0' }}>ご利用の端末・目的に合わせて選択してください</p>

        <button className="menu-btn btn-personal" onClick={() => navigate('/personal-login')}>
          <span className="btn-title">個人の端末から利用</span>
          <span className="btn-desc">食事の発注・マイページの確認はこちら</span>
        </button>

        <button className="menu-btn btn-facility" onClick={() => navigate('/facility-login')}>
          <span className="btn-title">施設タブレット（打刻専用）</span>
          <span className="btn-desc">通所・退所の記録はこちら</span>
        </button>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
          <button className="menu-btn btn-admin" onClick={() => navigate('/admin-login')} style={{ marginBottom: 0 }}>
            <span className="btn-title">管理者ダッシュボード</span>
          </button>
        </div>
      </div>
    </div>
  )
}
export default Portal