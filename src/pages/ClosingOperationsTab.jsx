import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

function ClosingOperationsTab({ selectedStoreId, targetDate }) {
  const adminName = localStorage.getItem('adminName') || '管理者';
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // ★ 追加：洗練された通知（トースト）用の状態
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const pdfRef = useRef(null);

  // 通知を表示するスマートな関数
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000); // 4秒後に自動で消える
  };

  const getTargetDateStr = () => {
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  };

  const fetchData = async () => {
    if (!selectedStoreId) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/closing-operations`, {
        params: { date: getTargetDateStr(), store_id: selectedStoreId }
      });
      if (res.data.success) {
        setList(res.data.list);
      }
    } catch (err) {
      // エラー時もスタイリッシュな通知を使用
      showToast("データの読み込みに失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStoreId, targetDate]);

  const attendanceCount = list.filter(item => item.act_in).length;

  const toggleAddition = async (userId, field, currentValue, userStoreId) => {
    // ★追加：全店舗共通モードの時は操作をブロックして通知を出す
    if (selectedStoreId === 'all') {
      showToast("操作するには右上のメニューから対象店舗を選択してください", "error");
      return;
    }

    const newValue = !currentValue;
    // 画面を素早く切り替える（楽観的UI更新）
    setList(prev => prev.map(item => item.user_id === userId ? { ...item, [field]: newValue } : item));
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/closing-operations/save`, {
        user_id: userId,
        date: getTargetDateStr(),
        field: field,
        value: newValue,
        store_id: userStoreId || selectedStoreId
      });
      
      if (res.data.success) {
        // 保存成功時はあえて通知を出さず、シームレスな操作感を優先（エラー時のみ通知）
      }
    } catch (err) {
      // ★ 修正：バックエンドの具体的なエラーメッセージを通知に表示する
      const errorMsg = err.response?.data?.error || "サーバーと通信できませんでした";
      showToast(`保存失敗: ${errorMsg}`, "error");
      fetchData(); // 失敗したら元の状態に戻す
    }
  };

  const handlePrintPDF = () => {
    const element = pdfRef.current;
    const opt = {
      margin: [10, 10, 10, 10], // 上下左右 10mm の余白
      filename: `${getTargetDateStr()}_実績記録.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      // ★修正：用紙を landscape（横向き）に設定
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="animate-fade-in space-y-6 relative">
      
      {/* ★ 追加：洗練されたトースト通知UI（右下固定） */}
      <div className={`fixed bottom-10 right-10 z-[100] transition-all duration-500 ease-out transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm ${toast.type === 'error' ? 'bg-rose-600/95 border-rose-500 text-white' : 'bg-slate-800/95 border-slate-700 text-white'}`}>
          {toast.type === 'error' ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">締め業務（実績記録）</h2>
          <p className="text-sm font-bold text-indigo-600 mt-1">当日通所人数：{attendanceCount} 名</p>
        </div>
        <button 
          onClick={handlePrintPDF} 
          className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          PDFで印刷
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              {/* ★修正：背景を濃く(100)、下線を濃く(300) */}
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">名前</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">予定時間</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">打刻時間</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">食事提供加算</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">地域連携会議</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">移行準備支援</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">欠席時対応</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-12 font-bold text-slate-400">読込中...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 font-bold text-slate-400">該当する予定・打刻データがありません</td></tr>
              ) : (
                list.map((item) => {
                  const isAbsent = item.plan_in && !item.act_in;
                  const planText = item.plan_in ? `${item.plan_in.substring(0,5)}〜${item.plan_out ? item.plan_out.substring(0,5) : ''}` : '';
                  let actText = '';
                  if (isAbsent) {
                    actText = <span className="text-rose-500 font-black">欠席</span>;
                  } else if (item.act_in) {
                    actText = `${item.act_in.substring(0,5)}〜${item.act_out ? item.act_out.substring(0,5) : ''}`;
                  }
                  const hasMeal = item.meal_status === '喫食済';

                  return (
                    <tr key={item.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{item.last_name} {item.first_name}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-500 font-mono">{planText}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-700 font-mono font-bold">{actText}</td>
                      
                      <td className="px-6 py-4 text-center">
                        {hasMeal && <span className="text-emerald-500 font-black text-lg">◯</span>}
                      </td>

                      {/* 手入力の加算（全店舗時は opacity を下げてカーソルを禁止マークに） */}
                      <td 
                        className={`px-6 py-4 text-center select-none transition-colors ${selectedStoreId === 'all' ? 'cursor-not-allowed opacity-40 bg-slate-50' : 'cursor-pointer hover:bg-indigo-50'}`}
                        onClick={() => toggleAddition(item.user_id, 'regional_cooperation_addition', item.regional_cooperation_addition, item.store_id)}
                      >
                        {item.regional_cooperation_addition && <span className="text-indigo-600 font-black text-lg">◯</span>}
                      </td>
                      <td 
                        className={`px-6 py-4 text-center select-none transition-colors ${selectedStoreId === 'all' ? 'cursor-not-allowed opacity-40 bg-slate-50' : 'cursor-pointer hover:bg-indigo-50'}`}
                        onClick={() => toggleAddition(item.user_id, 'transition_prep_addition', item.transition_prep_addition, item.store_id)}
                      >
                        {item.transition_prep_addition && <span className="text-indigo-600 font-black text-lg">◯</span>}
                      </td>
                      <td 
                        className={`px-6 py-4 text-center select-none transition-colors ${selectedStoreId === 'all' ? 'cursor-not-allowed opacity-40 bg-slate-50' : 'cursor-pointer hover:bg-indigo-50'}`}
                        onClick={() => toggleAddition(item.user_id, 'absence_handling_addition', item.absence_handling_addition, item.store_id)}
                      >
                        {item.absence_handling_addition && <span className="text-indigo-600 font-black text-lg">◯</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PDF出力用の隠しテンプレート --- */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {/* ★修正：minHeight: '190mm' を削除し、高さの計算ズレによる白紙の2枚目出力を防ぐ */}
        <div ref={pdfRef} style={{ width: '277mm', padding: '0', backgroundColor: 'white', color: '#000', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '20px', letterSpacing: '4px' }}>実績記録</h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
            <p>対象日：{getTargetDateStr()}</p>
            <p>当日通所人数：{attendanceCount}名</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                {/* すべて textAlign: 'center', verticalAlign: 'middle' で中央揃え */}
                <th style={{ border: '1px solid #333', padding: '10px', width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>名前</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>予定時間</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>打刻時間</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '13%', textAlign: 'center', verticalAlign: 'middle' }}>食事提供</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '13%', textAlign: 'center', verticalAlign: 'middle' }}>地域連携会議</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '13%', textAlign: 'center', verticalAlign: 'middle' }}>移行準備支援</th>
                <th style={{ border: '1px solid #333', padding: '10px', width: '13%', textAlign: 'center', verticalAlign: 'middle' }}>欠席時対応</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                const isAbsent = item.plan_in && !item.act_in;
                const planText = item.plan_in ? `${item.plan_in.substring(0,5)}〜${item.plan_out ? item.plan_out.substring(0,5) : ''}` : '';
                const actText = isAbsent ? '欠席' : (item.act_in ? `${item.act_in.substring(0,5)}〜${item.act_out ? item.act_out.substring(0,5) : ''}` : '');
                const hasMeal = item.meal_status === '喫食済';

                return (
                  <tr key={`pdf-${item.user_id}`}>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{item.last_name} {item.first_name}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{planText}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{actText}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{hasMeal ? '◯' : ''}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{item.regional_cooperation_addition ? '◯' : ''}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{item.transition_prep_addition ? '◯' : ''}</td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>{item.absence_handling_addition ? '◯' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClosingOperationsTab;