import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function MealDeliveryTab({ selectedStoreId }) { // ★修正1
  const adminName = localStorage.getItem('adminName') || '管理者';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deliveryData, setDeliveryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // モーダル用State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputDeliveryCount, setInputDeliveryCount] = useState('');
  
  // 備考（note）のState定義
  const [note, setNote] = useState(''); 
  const inputRef = useRef(null);

  const fetchDeliveryData = async () => {
    if (!selectedStoreId) return; // ★追加
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/meal-delivery/monthly`, { 
        params: { year, month, store_id: selectedStoreId } // ★修正2
      });
      if (res.data.success) {
        setDeliveryData(res.data.summary || {});
      }
    } catch (err) {
      console.error("データ取得エラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, [currentMonth, selectedStoreId]); // ★修正3

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  const changeMonth = (diff) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) days.push(new Date(year, month, d));
    return days;
  };

  const formatDate = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDayData = (date) => {
    const dateStr = formatDate(date);
    if (!dateStr) return null;
    return deliveryData[dateStr] || { orderCount: 0, deliveryCount: 0, note: '' };
  };

  // 日付クリック時の処理
  const handleDayClick = (date) => {
    if (!date) return;
    const data = getDayData(date);
    setSelectedDate(date);
    setInputDeliveryCount(data.deliveryCount > 0 ? data.deliveryCount : data.orderCount);
    setNote(''); // モーダルを開くたびに備考をリセット
    setIsModalOpen(true);
  };

  // 納品と備考の保存処理
  const handleSaveDelivery = async () => {
    if (inputDeliveryCount === '' || parseInt(inputDeliveryCount, 10) < 0) return alert('正しい数値を入力してください');
    
    // 発注数と納品数に差があるのに、備考が空の場合は保存させない
    const orderCount = getDayData(selectedDate).orderCount;
    if (orderCount !== parseInt(inputDeliveryCount, 10) && (!note || note.trim() === '')) {
        return; 
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/meal-delivery/save`, {
        date: formatDate(selectedDate),
        deliveredCount: parseInt(inputDeliveryCount, 10),
        orderedCount: orderCount, 
        note: note, 
        operator: adminName,
        store_id: selectedStoreId // ★修正2
      });
      
      if (res.data.success) {
        setIsModalOpen(false);
        fetchDeliveryData(); // 再取得してカレンダーを更新
      }
    } catch (err) {
      alert(err.response?.data?.error || "保存に失敗しました");
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold">◀</button>
          <span className="text-lg font-bold text-slate-800 w-36 text-center tracking-widest">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold">▶</button>
        </div>
        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
          {isLoading ? '集計中...' : '発注と納品の差分を管理します'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          <div className="text-rose-500 font-bold text-sm">日</div><div className="text-slate-500 font-bold text-sm">月</div><div className="text-slate-500 font-bold text-sm">火</div><div className="text-slate-500 font-bold text-sm">水</div><div className="text-slate-500 font-bold text-sm">木</div><div className="text-slate-500 font-bold text-sm">金</div><div className="text-blue-500 font-bold text-sm">土</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {generateCalendar().map((date, idx) => {
            const data = getDayData(date);
            const hasError = data && data.orderCount > 0 && data.orderCount !== data.deliveryCount;

            return (
              <div 
                key={idx} 
                onClick={() => handleDayClick(date)}
                className={`min-h-[100px] border rounded-lg p-2 flex flex-col transition-colors
                  ${date ? 'cursor-pointer hover:border-emerald-400 hover:shadow-md' : 'bg-transparent border-none'}
                  ${date && hasError ? 'border-rose-300 bg-rose-50' : date ? 'border-slate-200 bg-white' : ''}
                `}
              >
                {date && (
                  <>
                    <span className={`text-sm font-bold mb-2 ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>{date.getDate()}</span>
                    <div className="space-y-1 mt-auto">
                      <div className="text-[10px] font-bold text-slate-600 flex justify-between">
                        <span>発注:</span><span>{data.orderCount} 食</span>
                      </div>
                      <div className={`text-[10px] font-bold flex justify-between ${hasError ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <span>納品:</span><span>{data.deliveryCount} 食</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 納品数登録モーダル --- */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="bg-emerald-600 p-4 text-center">
              <h3 className="text-lg font-black text-white tracking-widest">
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月 {selectedDate.getDate()}日
              </h3>
              <p className="text-emerald-100 text-xs font-bold mt-1">納品情報の詳細を登録してください</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-600">システム上の発注数</span>
                <span className="text-2xl font-black text-slate-800">{getDayData(selectedDate).orderCount} <span className="text-sm text-slate-500">食</span></span>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">実際の納品数</label>
                <div className="relative">
                  <input 
                    type="number" 
                    ref={inputRef}
                    value={inputDeliveryCount} 
                    onChange={e => setInputDeliveryCount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveDelivery()}
                    className="w-full text-center text-3xl font-black text-emerald-600 p-4 pr-12 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">食</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  備考 {getDayData(selectedDate).orderCount !== parseInt(inputDeliveryCount, 10) && <span className="text-rose-500 ml-1">※差異があるため必須</span>}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm font-bold"
                  rows="3"
                  placeholder="差異の理由などを記入してください"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">閉じる</button>
                <button 
                  onClick={handleSaveDelivery} 
                  disabled={getDayData(selectedDate).orderCount !== parseInt(inputDeliveryCount, 10) && (!note || note.trim() === '')}
                  className={`flex-1 py-3 font-bold rounded-xl shadow-md transition-all active:scale-95 ${
                    getDayData(selectedDate).orderCount !== parseInt(inputDeliveryCount, 10) && (!note || note.trim() === '')
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  納品を確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MealDeliveryTab;