import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DailyRosterTab from './DailyRosterTab';
import ScheduleListTab from './ScheduleListTab';
import AttendanceListTab from './AttendanceListTab';
import MealListTab from './MealListTab';
import MealBillingTab from './MealBillingTab';
import MealDeliveryTab from './MealDeliveryTab';
import WeightBmiTab from './WeightBmiTab';
import UserMasterTab from './UserMasterTab';
import SystemSettingsTab from './SystemSettingsTab';
import StoreInfoTab from './StoreInfoTab';
import AdminMasterTab from './AdminMasterTab';
import ClosingOperationsTab from './ClosingOperationsTab';

function AdminDashboard() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminName') || '管理者';
  const [activeTab, setActiveTab] = useState('daily');
  
  // ★RBAC（権限管理）と店舗選択用のState
  const [adminRole, setAdminRole] = useState('store_admin');
  const [targetDate, setTargetDate] = useState(new Date());
  const [myStoreId, setMyStoreId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(''); // 子タブに渡す「現在選択中の店舗ID」
  const [stores, setStores] = useState([]);

  // バッジ（通知）用のState
  const [missingCount, setMissingCount] = useState(0);
  const [mealPendingCount, setMealPendingCount] = useState(0);
  const [healthMissingCount, setHealthMissingCount] = useState(0);
  // ★この2行を追加
  const [isDeliveryMissing, setIsDeliveryMissing] = useState(false);
  const [unpaidCount, setUnpaidCount] = useState(0);

  // 1. トークンを解析して権限と所属店舗を特定する
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 古いトークン('admin')も全権管理者('super_admin')として扱うよう修正
      const role = (payload.role === 'super_admin' || payload.role === 'admin') ? 'super_admin' : 'store_admin';
      const sId = payload.store_id || 'all';
      
      setAdminRole(role);
      setMyStoreId(sId);

      if (role === 'super_admin') {
        setSelectedStoreId('all'); 
      } else {
        setSelectedStoreId(sId);   
      }
      
      // ★全権管理者でなくても「自分の店舗名」を表示するため、全員が店舗一覧を取得する
      fetchStores();
      
    } catch (e) {
      console.error('トークン解析エラー', e);
      navigate('/admin-login');
    }
  }, [navigate]);

  // 全権管理者用の店舗マスタ取得
  const fetchStores = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stores`);
      if (res.data.success) setStores(res.data.stores || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 各種通知カウントを取得する関数（選択された店舗に連動）
  const fetchCounts = async () => {
    if (!selectedStoreId) return; // 初期化前はスキップ
    try {
      const opts = { params: { store_id: selectedStoreId } };
      
      const attendanceRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attendance/missing-count`, opts);
      if (attendanceRes.data.success) setMissingCount(attendanceRes.data.count);

      const healthRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/health/missing-count`, opts);
      if (healthRes.data.success) setHealthMissingCount(healthRes.data.count);

      const mealRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/meal/pending-count`, opts);
      if (mealRes.data.success) setMealPendingCount(mealRes.data.count);

      // ★ここから追加
      const deliveryRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/delivery/today-status`, opts);
      if (deliveryRes.data.success) {
        setIsDeliveryMissing(!deliveryRes.data.isRegistered);
      }

      const unpaidRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/billing/unpaid-count`, opts);
      if (unpaidRes.data.success) setUnpaidCount(unpaidRes.data.count);
      // ★ここまで追加

    } catch (err) {
      console.error("通知カウント取得エラー:", err);
    }
  };

  // 店舗が切り替わるか、タブが変わるたびにバッジの数字を更新
  useEffect(() => {
    fetchCounts();
  }, [selectedStoreId, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    navigate('/admin-login');
  };

  const getTargetDateStr = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTodayStrDisplay = () => {
    const d = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日(${days[d.getDay()]})`;
  };

  const customStyles = `
    body { font-family: 'Inter', 'Noto Sans JP', sans-serif; }
    .nav-item { transition: all 0.2s ease; border-radius: 8px; font-size: 0.9rem; padding-left: 1rem; display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; cursor: pointer; }
    .nav-item { color: #94a3b8; } 
    .nav-item:hover { background-color: #334155; color: #ffffff; padding-left: 1.25rem; } 
    /* ★修正：影を削除し、フラットで洗練されたデザインに変更 */
    .nav-item.active { 
      background-color: ${adminRole === 'super_admin' ? '#6366f1' : '#10b981'}; 
      color: #ffffff; 
      font-weight: 700; 
      padding-left: 1.25rem; 
    } 
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  // selectedStoreId が決まるまではローディング表示でチラつきを防止
  if (!selectedStoreId) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center font-bold text-slate-400">
        Loading Configuration...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-600">
      <style>{customStyles}</style>

      {/* 左サイドバー */}
      {/* ★修正：bg-slate-800 と border-slate-700 に変更し、文字色を全体的に明るく */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-20 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.1)]">
        <div className="p-8 pb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans break-words leading-tight">福祉管理システム</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest text-white ${adminRole === 'super_admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
              {adminRole === 'super_admin' ? 'SUPER ADMIN' : 'STORE ADMIN'}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-6 space-y-8 no-scrollbar">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">Main</p>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('daily')} className={`nav-item py-2.5 font-medium ${activeTab === 'daily' ? 'active' : ''}`}>Dashboard</button>
              <button onClick={() => setActiveTab('closing')} className={`nav-item py-2.5 font-medium ${activeTab === 'closing' ? 'active' : ''}`}>締め業務</button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">Operation</p>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('applications')} className={`nav-item py-2.5 font-medium ${activeTab === 'applications' ? 'active' : ''}`}>予定表一覧</button>
              
              <button onClick={() => setActiveTab('attendance')} className={`nav-item py-2.5 font-medium ${activeTab === 'attendance' ? 'active' : ''}`}>
                打刻データ一覧
                {missingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">{missingCount}</span>
                )}
              </button>
              
              <button onClick={() => setActiveTab('meal')} className={`nav-item py-2.5 font-medium ${activeTab === 'meal' ? 'active' : ''}`}>
                食事注文リスト
                {mealPendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">{mealPendingCount}</span>
                )}
              </button>
              
              <button onClick={() => setActiveTab('billing')} className={`nav-item py-2.5 font-medium ${activeTab === 'billing' ? 'active' : ''}`}>
                食事料金請求
                {unpaidCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">{unpaidCount}</span>
                )}
              </button>
              <button onClick={() => setActiveTab('delivery')} className={`nav-item py-2.5 font-medium ${activeTab === 'delivery' ? 'active' : ''}`}>食事納品管理
                {isDeliveryMissing && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-rose-500 rounded-full shadow-sm animate-pulse">!</span>
                )}
              </button>
              
              <button onClick={() => setActiveTab('weight')} className={`nav-item py-2.5 font-medium ${activeTab === 'weight' ? 'active' : ''}`}>
                体重・BMI記録
                {healthMissingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm">{healthMissingCount}</span>
                )}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-1">Settings</p>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('userMaster')} className={`nav-item py-2.5 font-medium ${activeTab === 'userMaster' ? 'active' : ''}`}>利用者マスタ</button>
              <button onClick={() => setActiveTab('system')} className={`nav-item py-2.5 font-medium ${activeTab === 'system' ? 'active' : ''}`}>システム設定</button>
              
              {adminRole === 'super_admin' && (
                <>
                  <button onClick={() => setActiveTab('store')} className={`nav-item py-2.5 font-medium ${activeTab === 'store' ? 'active' : ''}`}>店舗情報</button>
                  <button onClick={() => setActiveTab('adminMaster')} className={`nav-item py-2.5 font-medium ${activeTab === 'adminMaster' ? 'active' : ''}`}>管理者マスタ</button>
                </>
              )}
            </div>
          </div>
        </nav>
        
        {/* ★修正：ボトムエリア。ログアウトをスタイリッシュなボタンに変更 */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="text-xs font-bold text-slate-300 mb-4 truncate flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {adminName}
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-2.5 px-4 bg-slate-700/50 hover:bg-rose-500 border border-slate-600 hover:border-rose-500 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-between group"
          >
            <span>ログアウト</span>
            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* 右メインコンテンツ */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        <header className="bg-white/90 backdrop-blur-sm px-10 py-6 sticky top-0 z-10 flex justify-between items-end border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1 tracking-wide">
              {activeTab === 'daily' ? 'Main / Dashboard' : 
               activeTab === 'applications' ? 'Operation / 予定表一覧' : 
               activeTab === 'attendance' ? 'Operation / 打刻データ一覧' : 
               activeTab === 'meal' ? 'Operation / 食事注文リスト' : 
               activeTab === 'billing' ? 'Operation / 食事料金請求' : 
               activeTab === 'delivery' ? 'Operation / 食事納品管理' : 
               activeTab === 'weight' ? 'Operation / 体重・BMI記録' : 
               activeTab === 'userMaster' ? 'Settings / 利用者マスタ' : 
               activeTab === 'system' ? 'Settings / システム設定' : 
               activeTab === 'store' ? 'Settings / 店舗情報' : 
               'Settings / 管理者マスタ'}
            </p>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{getTodayStrDisplay()}</h2>
          </div>

          {/* ★追加: 右上の店舗絞り込みセレクター */}
          <div className="flex items-end gap-6">
            {(activeTab === 'daily' || activeTab === 'closing') && (
              <div className="flex flex-col items-start">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">表示日付</label>
                <input 
                  type="date" 
                  value={getTargetDateStr(targetDate)} 
                  onChange={(e) => setTargetDate(new Date(e.target.value))} 
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer h-[38px]"
                />
              </div>
            )}

            <div className="flex flex-col items-end">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">表示対象店舗</label>
              {adminRole === 'super_admin' ? (
                <div className="relative">
                  <select 
                    value={selectedStoreId} 
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="pl-4 pr-10 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer appearance-none shadow-sm min-w-[200px]"
                  >
                    <option value="all">全店舗 総合データ</option>
                    {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    disabled
                    value={myStoreId} 
                    className="pl-4 pr-10 py-2 bg-slate-200 border border-slate-300 rounded-xl text-sm font-bold text-slate-500 focus:outline-none transition-all cursor-not-allowed appearance-none shadow-sm min-w-[200px]"
                  >
                    <option value={myStoreId}>
                      {stores.find(s => s.store_id === myStoreId)?.store_name || myStoreId || '店舗未設定'}
                    </option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">🔒</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-10 py-8 max-w-7xl mx-auto pb-32">
          {activeTab === 'closing' && <ClosingOperationsTab selectedStoreId={selectedStoreId} targetDate={targetDate} />}
          {activeTab === 'daily' && <DailyRosterTab selectedStoreId={selectedStoreId} targetDate={targetDate} />}
          {activeTab === 'applications' && <ScheduleListTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'attendance' && <AttendanceListTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'meal' && <MealListTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'billing' && <MealBillingTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'delivery' && <MealDeliveryTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'weight' && <WeightBmiTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'userMaster' && <UserMasterTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'system' && <SystemSettingsTab selectedStoreId={selectedStoreId} />}
          {activeTab === 'store' && <StoreInfoTab adminRole={adminRole} />}
          {activeTab === 'adminMaster' && <AdminMasterTab adminRole={adminRole} />}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;