import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function WeightBmiTab({ selectedStoreId }) { // ★修正1
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 編集モーダル用State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editNote, setEditNote] = useState('');

  // BMIの自動計算ロジック
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(editWeight);
    const h = parseFloat(editHeight);
    if (w > 0 && h > 0) {
      return (w / ((h / 100) * (h / 100))).toFixed(2);
    }
    return '0.00';
  }, [editWeight, editHeight]);

  const fetchRecords = async () => {
    if (!selectedStoreId) return; // ★追加
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/health-records`, { 
        params: { year, month, store_id: selectedStoreId } // ★修正2
      });
      if (res.data.success) setRecords(res.data.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentMonth, selectedStoreId]); // ★修正3

  const changeMonth = (diff) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
  };

  const handleEditOpen = (record) => {
    setSelectedUser(record);
    setEditWeight(record.weight !== '-' ? record.weight : '');
    setEditHeight(record.height !== '-' ? record.height : '');
    setEditNote(record.note || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/health-record/update`, {
        user_id: selectedUser.userId,
        year: currentMonth.getFullYear(),
        month: currentMonth.getMonth() + 1,
        weight: parseFloat(editWeight),
        height: parseFloat(editHeight),
        note: editNote
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      alert("保存に失敗しました");
    }
  };

  const getBmiStyle = (bmi) => {
    if (bmi === '-') return "bg-slate-100 text-slate-400";
    const val = parseFloat(bmi);
    if (val >= 25) return "bg-rose-50 text-rose-600 border border-rose-100";
    if (val < 18.5) return "bg-amber-50 text-amber-600 border border-amber-100";
    return "bg-emerald-50 text-emerald-600 border border-emerald-100";
  };

  return (
    <div className="animate-fade-in">
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm font-bold">◀</button>
          <span className="text-xl font-black text-slate-800 w-44 text-center tracking-tighter">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm font-bold">▶</button>
        </div>
        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
          利用者の健康状態を一括管理します
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* ★修正：背景を bg-slate-100 に、下線を border-slate-300 に変更 */}
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">利用者名</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">身長 (cm)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">体重 (kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">BMI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">最終測定日</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">備考</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-20 text-slate-400 font-bold animate-pulse">データを同期中...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-20 text-slate-400 font-bold">データがありません</td></tr>
              ) : (
                records.map((item, idx) => {
                  // 未入力（最終測定日が '-'）かどうかを判定
                  const isNotEntered = item.date === '-';
                  
                  return (
                  <tr 
                    key={idx} 
                    className={`transition-colors group ${isNotEntered ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{item.userId.substring(0,2)}</div>
                            <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{item.height}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{item.weight}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black transition-all ${getBmiStyle(item.bmi)}`}>
                        {item.bmi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.date}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">{item.note}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditOpen(item)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all shadow-sm group-hover:shadow-md">
                        数値を修正
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- 編集モーダル --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-indigo-600 p-6">
              <h3 className="text-white text-lg font-black tracking-tight">{selectedUser.name} さんの記録修正</h3>
              <p className="text-indigo-100 text-xs mt-1 font-bold">{currentMonth.getFullYear()}年 {currentMonth.getMonth()+1}月分</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">身長 (cm)</label>
                  <input type="number" step="0.1" value={editHeight} onChange={e => setEditHeight(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">体重 (kg)</label>
                  <input type="number" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-lg" />
                </div>
              </div>

              {/* 自動計算BMI表示エリア */}
              <div className="bg-indigo-50 rounded-2xl p-6 flex justify-between items-center border border-indigo-100">
                <span className="text-sm font-bold text-indigo-600">自動計算 BMI</span>
                <span className="text-3xl font-black text-indigo-700">{calculatedBmi}</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">備考・特記事項</label>
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" rows="3" />
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">キャンセル</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">更新を保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeightBmiTab;