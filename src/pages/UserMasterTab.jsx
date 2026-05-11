import { useState, useEffect } from 'react';
import axios from 'axios';

function UserMasterTab({ selectedStoreId }) {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ★追加1：ステータスフィルター用のState
  const [filterStatus, setFilterStatus] = useState('all');

  // ★追加2：全権管理者かどうかの判定
  // ※ログイン時に localStorage に保存された権限情報（adminRole）が 'super_admin' であるかを判定しています。
  // もしシステム上の名称が違う場合（例：'admin' など）は、ここの 'super_admin' を書き換えてください。
  const isSuperAdmin = localStorage.getItem('adminRole') === 'super_admin';

  // モーダル用のState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [formData, setFormData] = useState({
    id: '', lastName: '', firstName: '', pinCode: '', certNumber: '', specialMealFee: '', heightCm: '', status: '利用中', storeId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 利用者一覧と店舗一覧を同時に取得
  const fetchData = async () => {
    if (!selectedStoreId) return;
    setIsLoading(true);
    try {
      const [userRes, storeRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/user-master`, { params: { store_id: selectedStoreId } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stores`)
      ]);
      
      if (userRes.data.success) setUsers(userRes.data.users || []);
      if (storeRes.data.success) {
        setStores(storeRes.data.stores || []);
        if (storeRes.data.stores?.length > 0 && !formData.storeId) {
          setFormData(prev => ({ ...prev, storeId: storeRes.data.stores[0].store_id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStoreId]);

  // ★修正1：名前検索 ＋ ステータスフィルターの両方で絞り込むロジック
  const filteredUsers = users.filter(u => {
    const matchName = u.name.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchName && matchStatus;
  });

  const handleOpenNew = () => {
    setModalMode('create');
    setFormData({ 
      id: '', lastName: '', firstName: '', pinCode: '', certNumber: '', 
      specialMealFee: '', heightCm: '', status: '利用中', // 新規時は「利用中」固定
      storeId: stores.length > 0 ? stores[0].store_id : ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setFormData({
      id: user.id,
      lastName: user.lastName || '',
      firstName: user.firstName || '',
      pinCode: '',
      certNumber: user.certNumber || '',
      specialMealFee: user.specialMealFee || '',
      heightCm: user.heightCm || '',
      status: user.status || '利用中', // 空ならデフォルトで利用中
      storeId: user.storeId || ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.id || !formData.lastName || !formData.firstName || !formData.storeId) {
      setErrorMessage('ID、氏名、所属店舗は必須入力です。');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const payload = { ...formData, isNew: modalMode === 'create' };
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/user-master/save`, payload);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      const dbErrorMsg = err.response?.data?.error || '通信に失敗しました。';
      setErrorMessage(`保存失敗: ${dbErrorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★追加3：削除ボタンを押したときの処理
  const handleDelete = async () => {
    if (!window.confirm(`本当に ${formData.lastName} ${formData.firstName} さんを削除しますか？\n※この操作は元に戻せません。`)) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/user-master/${formData.id}`);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      const dbErrorMsg = err.response?.data?.error || '削除処理に失敗しました。';
      setErrorMessage(`削除失敗: ${dbErrorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* 検索・新規ボタンエリア */}
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {/* ★修正2：ステータス絞り込みフィルターの追加 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-40 p-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="all">すべてのステータス</option>
            <option value="利用中">利用中</option>
            <option value="休止中">休止中</option>
            <option value="退所">退所</option>
          </select>

          <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 shrink-0">SEARCH</span>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="利用者名で検索..." 
              className="w-full sm:w-64 p-2 text-sm font-bold text-slate-700 bg-transparent focus:outline-none" 
            />
          </div>
        </div>

        <button onClick={handleOpenNew} className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-slate-900 transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
          <span className="text-lg leading-none">+</span> 新規利用者登録
        </button>
      </div>

      {/* テーブルエリア */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* ★修正：背景を濃く(100)、下線を濃く(300) */}
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-24">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">氏名</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ステータス</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">所属店舗</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-40">受給者証番号</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold animate-pulse">同期中...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">該当者がいません</td></tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{user.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{user.name}</td>
                    
                    {/* ★一覧にもステータスをバッジで表示 */}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.status === '退所' ? 'bg-slate-100 text-slate-500' : user.status === '休止中' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {user.status || '利用中'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {stores.find(s => s.store_id === user.storeId)?.store_name || user.storeId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.certNumber || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenEdit(user)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-slate-800 text-xs font-bold transition-all shadow-sm">
                        詳細・編集
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6">
              <h3 className="text-white text-xl font-black">{modalMode === 'create' ? '新規利用者登録' : '利用者情報の編集'}</h3>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto">
              {errorMessage && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100">{errorMessage}</div>}

              <div className="grid grid-cols-2 gap-5">
                
                {/* ★修正3：ステータス選択（一番上に配置し、3択に固定） */}
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ステータス *</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 font-bold text-sm"
                  >
                    <option value="利用中">利用中</option>
                    <option value="休止中">休止中</option>
                    <option value="退所">退所</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">所属店舗 *</label>
                  <select 
                    value={formData.storeId} 
                    onChange={e => setFormData({...formData, storeId: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-slate-400 font-bold text-sm"
                  >
                    <option value="">店舗を選択してください</option>
                    {stores.map(store => (
                      <option key={store.store_id} value={store.store_id}>{store.store_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ログインID *</label>
                  <input type="text" value={formData.id} disabled={modalMode === 'edit'} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm disabled:opacity-50" placeholder="U001" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">姓 *</label>
                  <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">名 *</label>
                  <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">特別食事料金</label>
                  <input type="number" value={formData.specialMealFee} onChange={e => setFormData({...formData, specialMealFee: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-right" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">マスタ身長</label>
                  <input type="number" step="0.1" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-right" placeholder="160.0" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-4">
              {/* ★追加4：全権管理者（super_admin）かつ 編集モードの時だけ削除ボタンを表示 */}
              {modalMode === 'edit' && isSuperAdmin && (
                <button 
                  onClick={handleDelete} 
                  disabled={isSubmitting} 
                  className="px-6 py-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-2xl transition-colors shadow-sm"
                >
                  削除
                </button>
              )}
              
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl">キャンセル</button>
              <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 shadow-md">
                {isSubmitting ? '保存中...' : '設定を保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMasterTab;