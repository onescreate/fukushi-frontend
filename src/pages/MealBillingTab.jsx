import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

function MealBillingTab({ selectedStoreId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [billingList, setBillingList] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pdfTargets, setPdfTargets] = useState([]); 
  const invoiceRef = useRef(null);
  
  // ★追加：入金日選択モーダル用
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, userId: null, date: '' });

  const fetchData = async () => {
    if (!selectedStoreId) return;
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const lastDay = new Date(year, month, 0).getDate();
      const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 1. 請求一覧の取得
      try {
        const listRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/billing-list`, { 
          params: { year, month, store_id: selectedStoreId } 
        });
        if (listRes.data.success) {
          setBillingList(listRes.data.list || []);
        }
      } catch (listErr) {
        console.error("❌ 請求リスト取得エラー:", listErr);
        setBillingList([]); 
      }

      // 2. インボイス設定の取得
      try {
        const invRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings/invoice/active`, { params: { date: targetDate, store_id: selectedStoreId } });
        if (invRes.data.success) {
          setInvoiceSettings(invRes.data.settings || {});
        }
      } catch (invErr) {
        console.error("❌ インボイス取得エラー:", invErr);
      }
      
    } catch (err) { 
      console.error("予期せぬエラー:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [currentMonth, selectedStoreId]);

  const changeMonth = (diff) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + diff, 1));

  const handleNoteBlur = async (userId, note) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/billing/note`, {
        user_id: userId, year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1, note
      });
    } catch (err) { console.error("備考保存エラー", err); }
  };

  const handleNoteChange = (index, value) => {
    const newList = [...billingList];
    newList[index].note = value;
    setBillingList(newList);
  };

  // ★追加：支払い状態を切り替える関数（トグル）
  // ★修正：支払い状態を切り替える（未払いの場合はモーダルを開く）
  const togglePaymentStatus = async (userId, currentPaymentDate) => {
    if (!currentPaymentDate) {
      // 未払いの場合：モーダルを開く（初期値は今日）
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setPaymentModal({ isOpen: true, userId: userId, date: todayStr });
    } else {
      // 支払済の場合：確認ダイアログを出して未払いに戻す（NULL送信）
      if (!window.confirm("未払いの状態に戻しますか？（入金記録は空白にリセットされます）")) return;
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/billing/payment`, {
          user_id: userId, year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1, payment_date: null
        });
        if (res.data.success) fetchData();
      } catch (err) { alert("更新に失敗しました"); }
    }
  };

  // ★追加：モーダルから日付を確定してDBへ保存する関数
  const submitPaymentDate = async () => {
    if (!paymentModal.date) return alert("入金日を選択してください");
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/billing/payment`, {
        user_id: paymentModal.userId, year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1, payment_date: paymentModal.date
      });
      if (res.data.success) {
        setPaymentModal({ isOpen: false, userId: null, date: '' }); // モーダルを閉じる
        fetchData(); // 一覧を再取得
      }
    } catch (err) { alert("保存に失敗しました"); }
  };

  const generatePDF = (targets) => {
    setPdfTargets(targets);
    setTimeout(() => {
      const element = invoiceRef.current;
      const opt = {
        margin: 10,
        filename: targets.length === 1 ? `${targets[0].name}_${currentMonth.getMonth()+1}月請求書.pdf` : `${currentMonth.getMonth()+1}月_請求書一括.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => setPdfTargets([]));
    }, 500); 
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        /* ★修正：背景を #f1f5f9 に、下線を #cbd5e1 に変更 */
        .admin-table th { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #64748b; background-color: #f1f5f9; padding: 1rem; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        .admin-table td { padding: 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .invoice-table th, .invoice-table td { border: 1px solid #333; padding: 8px; font-size: 13px; }
      `}</style>

      {/* ★修正：背景を bg-slate-100 に、枠線を border-slate-300 に変更 */}
      <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 mb-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-indigo-50 font-bold shadow-sm">◀</button>
          <span className="text-lg font-bold text-slate-800 w-36 text-center">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-indigo-50 font-bold shadow-sm">▶</button>
        </div>
        <button onClick={() => { if(billingList.length > 0) generatePDF(billingList); }} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm">
          全件PDF一括出力
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full admin-table text-left border-collapse">
            <thead>
              <tr>
                <th className="w-48">利用者名</th>
                <th className="w-24 text-center">ステータス</th>
                <th className="w-24 text-center">回数</th>
                <th className="w-32 text-right">請求金額</th>
                <th>備考 (PDF印字)</th>
                <th className="w-48 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan="6" className="text-center py-12 font-bold text-slate-400">読込中...</td></tr> : 
               billingList.length === 0 ? <tr><td colSpan="6" className="text-center py-12 font-bold text-slate-400">データなし</td></tr> : 
               billingList.map((item, idx) => {
                 // ★未払いの判定
                 const isUnpaid = !item.paymentDate && item.totalAmount > 0;

                 return (
                  <tr key={item.userId} className={`transition-colors ${isUnpaid ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
                    <td className="font-bold text-slate-800">{item.name}</td>
                    
                    {/* ★ステータスバッジの表示 */}
                    <td className="text-center">
                      {item.totalAmount === 0 ? (
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black tracking-widest">請求なし</span>
                      ) : isUnpaid ? (
                        <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded text-[10px] font-black tracking-widest animate-pulse">未請求</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black tracking-widest">入金済</span>
                      )}
                    </td>

                    <td className="text-slate-600 text-center">{item.mealCount} 回</td>
                    <td className="font-black text-indigo-700 text-right pr-6">¥{item.totalAmount?.toLocaleString() || 0}</td>
                    
                    <td>
                      <input 
                        type="text" 
                        value={item.note || ''} 
                        onChange={e => handleNoteChange(idx, e.target.value)} 
                        onBlur={() => handleNoteBlur(item.userId, item.note)} 
                        placeholder="備考を入力" 
                        className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all ${isUnpaid ? 'bg-white border-rose-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'}`} 
                      />
                    </td>
                    
                    <td className="text-center flex justify-center gap-2 px-2">
                      <button 
                        onClick={() => generatePDF([item])} 
                        className="flex-1 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:border-indigo-600 hover:text-indigo-600 shadow-sm transition-all"
                      >
                        PDF
                      </button>
                      
                      {/* ★支払済/未払いの切り替えボタン */}
                      {item.totalAmount > 0 && (
                        <button 
                          onClick={() => togglePaymentStatus(item.userId, item.paymentDate)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold shadow-sm transition-all ${isUnpaid ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                        >
                          {isUnpaid ? '入金済にする' : '未払いに戻す'}
                        </button>
                      )}
                    </td>
                  </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ★追加：入金日選択モーダル */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                入金日の選択
              </h3>
              <input 
                type="date" 
                value={paymentModal.date} 
                onChange={(e) => setPaymentModal({ ...paymentModal, date: e.target.value })}
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 font-black text-slate-700 outline-none shadow-sm cursor-pointer"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setPaymentModal({ isOpen: false, userId: null, date: '' })} className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-100 shadow-sm transition-colors">キャンセル</button>
              <button onClick={submitPaymentDate} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md active:scale-95 transition-all">確定する</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PDF出力用テンプレート (画面には非表示) --- */}
      {pdfTargets.length > 0 && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={invoiceRef}>
            {pdfTargets.map((invoice, index) => {
              const total = invoice.totalAmount || 0;
              const tax = Math.floor(total - (total / 1.1)); 
              const subtotal = total - tax;

              return (
                <div key={invoice.userId} style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm', backgroundColor: 'white', color: '#333', fontFamily: 'sans-serif', boxSizing: 'border-box', pageBreakAfter: index < pdfTargets.length - 1 ? 'always' : 'auto' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', marginBottom: '15px' }}>
                    <div>
                      <p>請求日: {new Date().toLocaleDateString()}</p>
                      <p>請求番号: {currentMonth.getFullYear()}{String(currentMonth.getMonth()+1).padStart(2,'0')}-{invoice.userId}</p>
                    </div>
                  </div>

                  <h1 style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '10px', marginBottom: '30px' }}>請求書</h1>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div style={{ width: '50%' }}>
                      <h2 style={{ fontSize: '20px', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '20px' }}>{invoice.name} 様</h2>
                      <p style={{ fontSize: '13px', marginBottom: '10px' }}>下記のとおりご請求申し上げます。</p>
                      <div style={{ display: 'flex', borderBottom: '2px solid #333', paddingBottom: '5px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>ご請求金額：</span>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', marginLeft: '10px' }}>¥{total.toLocaleString()} -</span>
                      </div>
                    </div>
                    
                    <div style={{ width: '45%', fontSize: '12px', lineHeight: '1.6' }}>
                      <p style={{ fontWeight: 'bold' }}>{invoiceSettings.company_name}</p>
                      <p>〒{invoiceSettings.postal_code}<br/>{invoiceSettings.address}</p>
                      <p>TEL: {invoiceSettings.phone_number}</p>
                      <p>登録番号: {invoiceSettings.invoice_number}</p>
                    </div>
                  </div>

                  <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                      <tr>
                        <th style={{ width: '40%', textAlign: 'center' }}>品名</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>数量</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>単位</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>単価</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>金額 (税抜)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{currentMonth.getMonth() + 1}月分 食事代等</td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'center' }}>式</td>
                        <td style={{ textAlign: 'right' }}>¥{subtotal.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>¥{subtotal.toLocaleString()}</td>
                      </tr>
                      {[...Array(5)].map((_, i) => (
                        <tr key={`empty-${i}`}><td style={{ color: 'transparent' }}>-</td><td></td><td></td><td></td><td></td></tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                    <table className="invoice-table" style={{ width: '40%', borderCollapse: 'collapse', borderTop: 'none' }}>
                      <tbody>
                        <tr><td style={{ backgroundColor: '#f3f4f6', textAlign: 'center', fontWeight: 'bold' }}>小計</td><td style={{ textAlign: 'right' }}>¥{subtotal.toLocaleString()}</td></tr>
                        <tr><td style={{ backgroundColor: '#f3f4f6', textAlign: 'center', fontWeight: 'bold' }}>消費税 (10%)</td><td style={{ textAlign: 'right' }}>¥{tax.toLocaleString()}</td></tr>
                        <tr><td style={{ backgroundColor: '#f3f4f6', textAlign: 'center', fontWeight: 'bold' }}>合計</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>¥{total.toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1, border: '1px solid #333', padding: '10px', fontSize: '12px', minHeight: '80px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>備考</p>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{invoice.note}</p>
                    </div>
                    <div style={{ flex: 1, border: '1px solid #333', padding: '10px', fontSize: '12px', minHeight: '80px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>振込先</p>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{invoiceSettings.bank_info}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MealBillingTab;