import { useState, useEffect } from 'react';
import axios from 'axios';

function SystemSettingsTab({ selectedStoreId }) {
  const adminName = localStorage.getItem('adminName') || '管理者';
  
  // 料金設定用
  const [mealFee, setMealFee] = useState('');
  const [cancelFee, setCancelFee] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [history, setHistory] = useState([]);

  // インボイス設定用
  const [invoice, setInvoice] = useState({ company_name: '', invoice_number: '', postal_code: '', address: '', phone_number: '', bank_info: '', effective_date: '' });
  const [invoiceHistory, setInvoiceHistory] = useState([]);

  // 「全店舗共通」が選ばれているかどうかの判定フラグ
  const isAllStores = selectedStoreId === 'all';

  useEffect(() => {
    // ★追加：店舗が切り替わった瞬間に、前の店舗のデータを一旦クリアする（誤保存・混入の防止）
    setHistory([]);
    setInvoiceHistory([]);
    setMealFee(''); setCancelFee(''); setEffectiveDate('');
    setInvoice({ company_name: '', invoice_number: '', postal_code: '', address: '', phone_number: '', bank_info: '', effective_date: '' });

    fetchSettings();
    fetchInvoiceHistory(); 
  }, [selectedStoreId]);

  const fetchSettings = async () => {
    if (!selectedStoreId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings/price`, { params: { store_id: selectedStoreId } });
      if (res.data.success && res.data.history.length > 0) {
        setHistory(res.data.history);
        // 次回の登録用に、最新の適用日の「翌日」を初期値にセットする
        const latestDate = new Date(res.data.history[0].effective_date);
        latestDate.setDate(latestDate.getDate() + 1);
        setEffectiveDate(`${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, '0')}-${String(latestDate.getDate()).padStart(2, '0')}`);
        setMealFee(res.data.history[0].meal_fee);
        setCancelFee(res.data.history[0].cancel_fee);
      } else {
        setHistory([]); 
        setMealFee(''); setCancelFee(''); setEffectiveDate('');
      }
    } catch (err) { console.error(err); }
  };

  const fetchInvoiceHistory = async () => {
    if (!selectedStoreId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings/invoice/history`, { params: { store_id: selectedStoreId } });
      if (res.data.success) {
        setInvoiceHistory(res.data.history);
        if (res.data.history.length > 0) {
          const latest = res.data.history[0];
          const latestDate = new Date(latest.effective_date);
          latestDate.setDate(latestDate.getDate() + 1);
          setInvoice({
            ...latest,
            effective_date: `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, '0')}-${String(latestDate.getDate()).padStart(2, '0')}`
          });
        } else {
          setInvoice({ company_name: '', invoice_number: '', postal_code: '', address: '', phone_number: '', bank_info: '', effective_date: '' });
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleSavePrice = async () => {
    if (isAllStores) return alert("対象の店舗を選択してください。");
    if (!mealFee || !cancelFee || !effectiveDate) return alert("すべての項目を入力してください");
    if (!window.confirm(`${effectiveDate} から適用する新料金を登録しますか？\n※過去の確定済みデータには影響しません`)) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/settings/price`, {
        meal_fee: mealFee, cancel_fee: cancelFee, effective_date: effectiveDate, operator: adminName, store_id: selectedStoreId
      });
      if (res.data.success) { 
        alert("新しい料金設定を登録しました。"); 
        fetchSettings(); 
      }
    } catch (err) { alert("保存に失敗しました"); }
  };

  const handleSaveInvoice = async () => {
    if (isAllStores) return alert("対象の店舗を選択してください。");
    if (!invoice.effective_date) return alert("適用開始日を入力してください");
    if (!window.confirm(`${invoice.effective_date} から適用する請求者情報を登録しますか？\n※過去に発行した請求書のPDFには影響しません`)) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/settings/invoice`, { 
        ...invoice, operator: adminName, store_id: selectedStoreId 
      });
      if (res.data.success) { 
        alert("請求者情報（インボイス）を登録しました。");
        fetchInvoiceHistory();
      }
    } catch (err) { alert("保存に失敗しました"); }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* 状態によってメッセージと色を切り替える */}
      <div className={`p-4 rounded-xl flex items-center gap-3 border ${isAllStores ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'}`}>
        <span className="text-2xl">{isAllStores ? '⚠️' : '⚙️'}</span>
        <div>
          <p className={`text-sm font-bold ${isAllStores ? 'text-amber-800' : 'text-indigo-800'}`}>
            現在選択中の店舗: <span className="text-lg font-black bg-white px-2 py-0.5 rounded mx-1 shadow-sm">{isAllStores ? '全店舗共通 (閲覧のみ)' : selectedStoreId}</span>
          </p>
          <p className={`text-xs font-bold mt-1 ${isAllStores ? 'text-amber-600' : 'text-indigo-600'}`}>
            {isAllStores 
              ? '「全店舗共通」を選択中は設定の新規登録はできません。右上のメニューから対象の店舗を選択してください。' 
              : '設定は「適用開始日」を基準に履歴として保存されます。過去のデータ（請求書や売上）を破壊することなく、未来の料金改定などを事前予約できます。'}
          </p>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. 食事料金・キャンセル料設定セクション */}
      {/* ==================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        
        {/* 左側：新規登録フォーム */}
        <div className="w-full lg:w-1/3 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col relative">
          {/* 全店舗共通時は半透明のオーバーレイを被せて操作不可をアピール */}
          {isAllStores && <div className="absolute inset-0 bg-slate-100/50 z-10 cursor-not-allowed"></div>}
          
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-3">新料金の追加登録</h3>
          
          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">適用開始日</label>
              <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} disabled={isAllStores} className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 shadow-sm disabled:opacity-50" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">食事料金 (1食)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                  <input type="number" value={mealFee} onChange={e => setMealFee(e.target.value)} disabled={isAllStores} className="w-full pl-8 pr-3 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold shadow-sm text-lg disabled:opacity-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">キャンセル料</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                  <input type="number" value={cancelFee} onChange={e => setCancelFee(e.target.value)} disabled={isAllStores} className="w-full pl-8 pr-3 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold shadow-sm text-lg disabled:opacity-50" />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSavePrice} 
            disabled={isAllStores}
            className={`w-full mt-6 py-3.5 font-bold rounded-xl shadow-md transition-all z-20 ${
              isAllStores ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isAllStores ? '店舗を選択して登録' : 'この内容で履歴を追加'}
          </button>
        </div>

        {/* 右側：適用履歴一覧 */}
        <div className="w-full lg:w-2/3 p-6">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">料金の適用履歴一覧</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                {/* ★修正：背景を bg-slate-100 に、下線を border-slate-300 に変更 */}
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 w-24">状態</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">適用開始日</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 text-right">食事料金</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 text-right">キャンセル料</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">登録者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-bold">登録されている料金履歴がありません</td></tr>
                ) : (
                  history.map((h, i) => {
                    const d = new Date(h.effective_date);
                    const isLatest = i === 0;
                    return (
                      <tr key={h.id} className={isLatest ? "bg-indigo-50/30" : "bg-white opacity-60"}>
                        <td className="px-4 py-3">
                          {isLatest ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-black tracking-widest">適用中</span> 
                                    : <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">過去</span>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-right">¥{h.meal_fee?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-rose-600 text-right">¥{h.cancel_fee?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]">{h.created_by || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* ==================================================== */}
      {/* 2. 請求者情報（インボイス設定）セクション */}
      {/* ==================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
        
        {/* 左側：新規登録フォーム */}
        <div className="w-full lg:w-1/3 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col relative">
          {/* 全店舗共通時は半透明のオーバーレイを被せて操作不可をアピール */}
          {isAllStores && <div className="absolute inset-0 bg-slate-100/50 z-10 cursor-not-allowed"></div>}

          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-3">インボイス設定の追加登録</h3>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">適用開始日</label>
              <input type="date" value={invoice.effective_date || ''} onChange={e => setInvoice({...invoice, effective_date: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 shadow-sm disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">事業所名 (会社名)</label>
              <input type="text" value={invoice.company_name || ''} onChange={e => setInvoice({...invoice, company_name: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">登録番号 (T+13桁)</label>
              <input type="text" value={invoice.invoice_number || ''} onChange={e => setInvoice({...invoice, invoice_number: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">郵便番号</label>
                <input type="text" value={invoice.postal_code || ''} onChange={e => setInvoice({...invoice, postal_code: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold shadow-sm disabled:opacity-50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">電話番号</label>
                <input type="text" value={invoice.phone_number || ''} onChange={e => setInvoice({...invoice, phone_number: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold shadow-sm disabled:opacity-50" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">住所</label>
              <input type="text" value={invoice.address || ''} onChange={e => setInvoice({...invoice, address: e.target.value})} disabled={isAllStores} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold shadow-sm disabled:opacity-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">振込先情報</label>
              <textarea value={invoice.bank_info || ''} onChange={e => setInvoice({...invoice, bank_info: e.target.value})} disabled={isAllStores} rows="3" className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-bold shadow-sm resize-none custom-scrollbar disabled:opacity-50" placeholder="〇〇銀行 〇〇支店&#13;&#10;普通 1234567&#13;&#10;口座名義 カ）サンプル" />
            </div>
          </div>

          <button 
            onClick={handleSaveInvoice} 
            disabled={isAllStores}
            className={`w-full mt-6 py-3.5 font-bold rounded-xl shadow-md transition-all z-20 ${
              isAllStores ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isAllStores ? '店舗を選択して登録' : 'この内容で履歴を追加'}
          </button>
        </div>

        {/* 右側：適用履歴一覧 */}
        <div className="w-full lg:w-2/3 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">インボイスの適用履歴一覧</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1 max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              {/* ★修正：背景を bg-slate-100 に、下線を border-slate-300 に変更 */}
              <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                <tr className="border-b border-slate-300">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 w-24">状態</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">適用開始日</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">事業所名</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500">登録番号</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceHistory.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold">登録されているインボイス履歴がありません</td></tr>
                ) : (
                  invoiceHistory.map((h, i) => {
                    const d = new Date(h.effective_date);
                    const isLatest = i === 0;
                    return (
                      <tr key={h.id} className={isLatest ? "bg-indigo-50/30" : "bg-white opacity-60"}>
                        <td className="px-4 py-4">
                          {isLatest ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px] font-black tracking-widest">適用中</span> 
                                    : <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold">過去</span>}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700">{`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`}</td>
                        <td className="px-4 py-4 font-bold text-slate-800 truncate max-w-[200px]">{h.company_name}</td>
                        <td className="px-4 py-4 text-sm font-mono text-slate-500">{h.invoice_number}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

export default SystemSettingsTab;