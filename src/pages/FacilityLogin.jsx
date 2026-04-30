import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function FacilityLogin() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [pinCode, setPinCode] = useState('')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`)
        setUsers(response.data.users)
      } catch (error) {
        setMessage('エラー：利用者リストを取得できませんでした')
      }
    }
    fetchUsers()
  }, [])

  const attemptLogin = async (currentPin) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, {
        user_id: selectedUser.user_id,
        pin_code: currentPin
      })
      localStorage.setItem('userToken', response.data.token)
      localStorage.setItem('userName', response.data.user.name)
      // ★修正：新しい施設用ダッシュボードのURLへ移動する！
      navigate('/facility')
    } catch (error) {
      setMessage('PINコードが正しくありません')
      setPinCode('')
    }
  }

  const handleKeypadClick = (num) => {
    if (pinCode.length < 4) {
      const newPin = pinCode + num
      setPinCode(newPin)
      if (newPin.length === 4) attemptLogin(newPin)
    }
  }

  const handleDelete = () => setPinCode(pinCode.slice(0, -1))

  const filteredUsers = users.filter(user => {
    const fullName = `${user.last_name}${user.first_name}`
    const fullNameSpace = `${user.last_name} ${user.first_name}`
    return fullName.includes(searchQuery) || fullNameSpace.includes(searchQuery)
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', padding: '20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .glass-card { background: #FFFFFF; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); padding: 40px; width: 100%; max-width: 480px; text-align: center; }
        .search-box { width: 100%; padding: 16px 20px; font-size: 16px; border: 2px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC; outline: none; }
        .search-box:focus { border-color: #3B82F6; background-color: #FFFFFF; }
        .user-list-container { max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 8px; }
        .user-btn { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; font-size: 18px; font-weight: 600; color: #1E293B; cursor: pointer; }
        .user-btn:hover { border-color: #3B82F6; transform: translateY(-3px); box-shadow: 0 10px 15px rgba(59,130,246,0.1); color: #3B82F6; }
        .keypad-btn { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 50%; aspect-ratio: 1/1; font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 500; cursor: pointer; }
        .keypad-btn:active { transform: scale(0.9); background: #CBD5E1; }
        .keypad-action-btn { background: transparent; border: none; font-size: 16px; font-weight: 600; color: #64748B; cursor: pointer; }
      `}</style>
      <div className="glass-card">
        {!selectedUser ? (
          <>
            <h2 style={{ fontSize: '24px', color: '#0F172A', marginBottom: '8px', fontWeight: '700' }}>利用者ログイン</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input type="text" className="search-box" placeholder="名前で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <div className="user-list-container">
                {filteredUsers.map((user) => (
                  <button key={user.user_id} className="user-btn" onClick={() => { setSelectedUser(user); setSearchQuery(''); }}>
                    {user.last_name} {user.first_name}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => navigate('/')} style={{ marginTop: '30px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: '500' }}>ポータルに戻る</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#F0FDF4', color: '#166534', padding: '12px 24px', borderRadius: '100px', fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              {selectedUser.last_name} {selectedUser.first_name}
            </div>
            <div style={{ display: 'flex', gap: '20px', margin: '24px 0 40px' }}>
              {[0, 1, 2, 3].map((index) => (
                <div key={index} style={{ width: '20px', height: '20px', borderRadius: '50%', background: pinCode.length > index ? '#0F172A' : '#E2E8F0', transition: 'background 0.2s ease' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '280px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (<button key={num} className="keypad-btn" onClick={() => handleKeypadClick(num.toString())}>{num}</button>))}
              <button className="keypad-action-btn" onClick={() => setPinCode('')}>クリア</button>
              <button className="keypad-btn" onClick={() => handleKeypadClick('0')}>0</button>
              <button className="keypad-action-btn" onClick={handleDelete}>削除</button>
            </div>
            <button onClick={() => { setSelectedUser(null); setPinCode(''); setMessage(''); }} style={{ marginTop: '24px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: '500' }}>名前を選び直す</button>
          </div>
        )}
        {message && <p style={{ marginTop: '20px', color: '#EF4444', fontWeight: '600', backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px' }}>{message}</p>}
      </div>
    </div>
  )
}
export default FacilityLogin