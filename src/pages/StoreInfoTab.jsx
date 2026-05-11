import { useState, useEffect } from 'react';
import axios from 'axios';

function StoreInfoTab({ adminRole }) {
  const [stores, setStores] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState({
    store_id: '', store_name: '', email: '', role: '', status: '有効', remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stores`);
      if (res.data.success) setStores(res.data.stores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenNew = () => {
    setModalMode('create');
    setFormData({ store_id: '', store_name: '', email: '', role: '', status: '有効', remarks: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setModalMode('edit');
    setFormData({ ...store });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.store_id || !formData.store_name) return alert('店舗IDと店舗名は必須です');
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/stores/save`, {
        ...formData,
        isNew: modalMode === 'create'
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchStores();
      }
    } catch (err) {
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★追加：削除を実行する関数
  const handleDelete = async () => {
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/stores/${deleteTarget.store_id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        fetchData(); // 店舗一覧を再取得
      }
    } catch (err) {
      alert("削除に失敗しました: " + (err.response?.data?.error || "通信エラー"));
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex justify-between items-center shadow-sm">
        <div className="text-sm font-bold text-slate-500">
          登録店舗数: <span className="text-lg text-slate-800 ml-1">{stores.length}</span> 件
        </div>
        <button onClick={handleOpenNew} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm">
          + 新規店舗登録
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* ★修正：背景を bg-slate-100 に、下線を border-slate-300 に変更 */}
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">店舗ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">店舗名</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">メールアドレス</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">役割</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">状態</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">同期中...</td></tr>
              ) : stores.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">店舗が登録されていません</td></tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.store_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 font-mono">{store.store_id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{store.store_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{store.email || '-'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{store.role || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                        store.status === '有効' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(store)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-indigo-600 hover:text-indigo-600 text-xs font-bold transition-all shadow-sm">編集</button>
                      
                      {/* ★追加：全権管理者のみ削除ボタンを表示 */}
                      {adminRole === 'super_admin' && (
                        <button 
                          onClick={() => { setDeleteTarget(store); setIsDeleteModalOpen(true); }}
                          className="px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 text-xs font-bold transition-all shadow-sm"
                        >
                          削除
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 店舗登録・編集モーダル --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col">
            <div className="bg-indigo-600 p-6">
              <h3 className="text-white text-xl font-black tracking-tight">店舗情報の{modalMode === 'create' ? '登録' : '編集'}</h3>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">店舗ID *</label>
                  <input 
                    type="text" value={formData.store_id} disabled={modalMode === 'edit'}
                    onChange={e => setFormData({...formData, store_id: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm disabled:opacity-50"
                    placeholder="STORE001"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">店舗名 *</label>
                  <input 
                    type="text" value={formData.store_name}
                    onChange={e => setFormData({...formData, store_name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="〇〇店"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">メールアドレス</label>
                  <input 
                    type="email" value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="example@store.com"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">役割</label>
                  <input 
                    type="text" value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
                    placeholder="本店 / 支店など"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">状態</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm appearance-none"
                  >
                    <option value="有効">有効</option>
                    <option value="無効">無効</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">備考</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm"
                    rows="3"
                    placeholder="自由記入欄"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">キャンセル</button>
              <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★追加：削除確認モーダル */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col">
            <div className="bg-rose-600 p-6 text-center shrink-0">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-white text-xl font-black">店舗の削除確認</h3>
            </div>
            <div className="p-8 text-center overflow-y-auto">
              <p className="text-slate-600 font-bold mb-2">
                店舗「{deleteTarget?.store_name}」を完全に削除しますか？
              </p>
              <p className="text-rose-500 text-xs font-bold">※この店舗に紐づく利用者がいる場合、エラーになる可能性があります。</p>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3 shrink-0">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-colors">キャンセル</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95">
                削除を実行する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreInfoTab;