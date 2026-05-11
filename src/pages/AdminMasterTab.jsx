import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminMasterTab({ adminRole }) {
  const [admins, setAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // モーダル用のState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); 
  const [formData, setFormData] = useState({
    admin_id: '', last_name: '', first_name: '', display_name: '', email: '', status: '有効', admin_role: 'store_admin', store_id: '', password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ★2. 削除モーダル用のStateを追加
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. 管理者一覧の取得
    try {
      const adminRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/admin-master`);
      if (adminRes.data.success) setAdmins(adminRes.data.admins || []);
    } catch (err) {
      console.error("管理者マスタ取得エラー:", err);
    }

    // 2. 店舗一覧の取得（上でエラーが起きても必ず実行される）
    try {
      const storeRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stores`);
      if (storeRes.data.success) setStores(storeRes.data.stores || []);
    } catch (err) {
      console.error("店舗一覧取得エラー:", err);
    }

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenNew = () => {
    setModalMode('create');
    setFormData({ 
      admin_id: '', last_name: '', first_name: '', display_name: '', email: '', status: '有効', 
      admin_role: 'store_admin', store_id: stores.length > 0 ? stores[0].store_id : '', password: '' 
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin) => {
    setModalMode('edit');
    setFormData({
      admin_id: admin.admin_id,
      last_name: admin.last_name,
      first_name: admin.first_name,
      display_name: admin.display_name || '',
      email: admin.email || '',
      status: admin.status || '有効',
      admin_role: admin.admin_role || 'store_admin',
      store_id: admin.store_id || '',
      password: '' // パスワードは空のまま（入力した時だけ更新）
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.admin_id || !formData.last_name || !formData.first_name) {
      setErrorMessage('IDと氏名は必須入力です。');
      return;
    }
    // 店舗管理者の場合は店舗選択を必須にする
    if (formData.admin_role === 'store_admin' && !formData.store_id) {
      setErrorMessage('店舗管理者の場合は、所属店舗を選択してください。');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        store_id: formData.admin_role === 'super_admin' ? null : formData.store_id, // ★ 'all' を null に変更
        isNew: modalMode === 'create' 
      };
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/admin-master/save`, payload);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★追加：削除を実行する関数
  const handleDelete = async () => {
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/admin-master/${deleteTarget.admin_id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert("削除に失敗しました: " + (err.response?.data?.error || "通信エラー"));
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex justify-between items-center shadow-sm">
        <h3 className="font-bold text-slate-700">管理者アカウント管理</h3>
        <button onClick={handleOpenNew} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all text-sm">
          + 新規管理者登録
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* ★修正：背景を bg-slate-100 に、下線を border-slate-300 に変更 */}
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">権限</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">氏名</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">所属店舗</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map((admin) => (
                <tr key={admin.admin_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">{admin.admin_id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${admin.admin_role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {admin.admin_role === 'super_admin' ? '全権管理者' : '店舗管理者'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm">{admin.last_name} {admin.first_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                {admin.admin_role === 'super_admin' ? '全店舗 (ALL)' : (admin.store_name || admin.store_id)}
              </td>
              <td className="px-6 py-4 text-right flex justify-end gap-2">
                <button onClick={() => handleOpenEdit(admin)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-indigo-600 hover:text-indigo-600 text-xs font-bold transition-all shadow-sm">編集</button>
                
                {/* ★追加：全権管理者のみ削除ボタンを表示 */}
                {adminRole === 'super_admin' && (
                  <button 
                    onClick={() => { setDeleteTarget(admin); setIsDeleteModalOpen(true); }}
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 text-xs font-bold transition-all shadow-sm"
                  >
                    削除
                  </button>
                )}
              </td>
            </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 shrink-0">
              <h3 className="text-white text-xl font-black">{modalMode === 'create' ? '新規管理者登録' : '管理者情報の編集'}</h3>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
              {errorMessage && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100">{errorMessage}</div>}

              <div className="grid grid-cols-2 gap-5">
                {/* 権限選択 */}
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">管理者権限 *</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.admin_role === 'store_admin' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                      <input type="radio" className="hidden" name="role" value="store_admin" checked={formData.admin_role === 'store_admin'} onChange={e => setFormData({...formData, admin_role: e.target.value})} />
                      <div className="text-center font-bold text-sm text-slate-700">店舗管理者</div>
                    </label>
                    <label className={`flex-1 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.admin_role === 'super_admin' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                      <input type="radio" className="hidden" name="role" value="super_admin" checked={formData.admin_role === 'super_admin'} onChange={e => setFormData({...formData, admin_role: e.target.value, store_id: 'all'})} />
                      <div className="text-center font-bold text-sm text-slate-700">全権管理者</div>
                    </label>
                  </div>
                </div>

                {/* 所属店舗選択（店舗管理者の時のみ表示） */}
                {formData.admin_role === 'store_admin' && (
                  <div className="col-span-2 animate-fade-in">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">所属店舗 *</label>
                    <select value={formData.store_id} onChange={e => setFormData({...formData, store_id: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm focus:border-emerald-500 outline-none">
                      <option value="">店舗を選択してください</option>
                      {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
                    </select>
                  </div>
                )}

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">管理者ID *</label>
                  <input type="text" value={formData.admin_id} disabled={modalMode === 'edit'} onChange={e => setFormData({...formData, admin_id: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="admin_01" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">パスワード {modalMode === 'edit' && '(変更時のみ入力)'}</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="••••••••" />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">姓 *</label>
                  <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">名 *</label>
                  <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">メールアドレス (ログイン・通知用)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="admin@example.com" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl">キャンセル</button>
              <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 shadow-md">
                {isSubmitting ? '保存中...' : '管理者を保存する'}
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
              <h3 className="text-white text-xl font-black">管理者の削除確認</h3>
            </div>
            <div className="p-8 text-center overflow-y-auto">
              <p className="text-slate-600 font-bold mb-2">
                管理者「{deleteTarget?.last_name} {deleteTarget?.first_name}」を完全に削除しますか？
              </p>
              <p className="text-rose-500 text-xs font-bold">※この操作は取り消せません。ログインできなくなります。</p>
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

export default AdminMasterTab;