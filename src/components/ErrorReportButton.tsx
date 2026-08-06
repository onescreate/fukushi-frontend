import { useState, useEffect, useRef, type PointerEvent as RPointerEvent, type CSSProperties } from 'react';
import axios from 'axios';
import { domToJpeg } from 'modern-screenshot';
import { Bug, X, Loader2, Send, Camera, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

// 会計ポータルと同じ不具合報告ボタン。押すとその瞬間の画面を撮影し、内容と一緒に
// ポータルのバックエンド(公開受け口 /error-reports/external)へ送信＝ポータルの一覧に集約される。
// 送信先＝会計ポータルのバックエンド。環境変数(VITE_PORTAL_API_URL)が未設定でも動くよう本番URLを既定値にする。
const PORTAL_API = ((import.meta as any).env?.VITE_PORTAL_API_URL || 'https://accounting-api-v2-466112053259.asia-northeast1.run.app').replace(/\/$/, '');

export default function ErrorReportButton() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [autoFailed, setAutoFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<null | 'capturing' | 'sending'>(null);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const [btnBottom, setBtnBottom] = useState<number>(() => {
    const v = parseInt(localStorage.getItem('error_report_btn_bottom') || '', 10);
    return Number.isFinite(v) ? v : 176;
  });
  const dragRef = useRef({ dragging: false, startY: 0, startBottom: 176, moved: false });

  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type && i.type.startsWith('image/'));
      if (item) { const f = item.getAsFile(); if (f) readFile(f); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!firebaseUser) return null;

  const compress = (dataUrl: string): Promise<string> => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1600;
      const s = Math.min(1, maxW / (img.width || maxW));
      const c = document.createElement('canvas');
      c.width = Math.round((img.width || maxW) * s);
      c.height = Math.round((img.height || maxW) * s);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      try { resolve(c.toDataURL('image/jpeg', 0.7)); } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

  const readFile = (file?: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => { setShot(await compress(String(r.result))); setAutoFailed(false); };
    r.readAsDataURL(file);
  };

  const start = async () => {
    if (open) { setOpen(false); return; }
    setErr(''); setDone(false); setMessage(''); setShot(null); setAutoFailed(false);
    setBusy('capturing');
    let dataUrl: string | null = null;
    try {
      const raw = await domToJpeg(document.body, {
        quality: 0.85, scale: 1, backgroundColor: '#ffffff',
        filter: (node: any) => !(node && node.id === 'error-report-root'),
      });
      dataUrl = await compress(raw);
    } catch { dataUrl = null; }
    setShot(dataUrl);
    setAutoFailed(!dataUrl);
    setBusy(null);
    setOpen(true);
  };

  const submit = async () => {
    if (!shot) { setErr('スクリーンショットを添付してください（自動で撮れない場合は「画像を選ぶ」から）。'); return; }
    if (!message.trim()) { setErr('どんな不具合か入力してください。'); return; }
    if (!PORTAL_API) { setErr('報告先が未設定です（VITE_PORTAL_API_URL）。管理者にご連絡ください。'); return; }
    setBusy('sending'); setErr('');
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(`${PORTAL_API}/error-reports/external`,
        { message, url: window.location.href, screenshot: shot },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 });
      setDone(true);
    } catch (e: any) {
      setErr(e?.response?.data?.error || '送信に失敗しました。');
    } finally { setBusy(null); }
  };

  const close = () => { setOpen(false); setShot(null); setMessage(''); setDone(false); setErr(''); setAutoFailed(false); };

  const onDragStart = (e: RPointerEvent) => {
    dragRef.current = { dragging: true, startY: e.clientY, startBottom: btnBottom, moved: false };
    try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onDragMove = (e: RPointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dy) > 4) dragRef.current.moved = true;
    const maxB = (typeof window !== 'undefined' ? window.innerHeight : 800) - 72;
    const next = Math.max(16, Math.min(dragRef.current.startBottom - dy, Math.max(16, maxB)));
    setBtnBottom(next);
  };
  const onDragEnd = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.moved) localStorage.setItem('error_report_btn_bottom', String(Math.round(btnBottom)));
  };
  const handleClick = () => { const wasMoved = dragRef.current.moved; dragRef.current.moved = false; if (wasMoved) return; start(); };

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const popStyle: CSSProperties = (() => {
    if (btnBottom > vh * 0.5) {
      const top = Math.max(8, vh - btnBottom + 12);
      return { top, maxHeight: Math.max(200, vh - top - 12) };
    }
    const bot = btnBottom + 56;
    return { bottom: bot, maxHeight: Math.max(200, vh - bot - 12) };
  })();

  return (
    <div id="error-report-root">
      <button onClick={handleClick} onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
        disabled={busy === 'capturing'} title="不具合報告（ドラッグで上下に移動できます）"
        style={{ bottom: btnBottom }}
        className="fixed right-8 z-[100000] pl-3.5 pr-4 py-2.5 rounded-full bg-rose-600 text-white shadow-lg flex items-center gap-1.5 hover:bg-rose-500 transition-colors disabled:opacity-70 cursor-grab active:cursor-grabbing touch-none select-none">
        {busy === 'capturing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
        <span className="text-sm font-bold whitespace-nowrap">不具合報告</span>
      </button>

      {open && (
        <div style={popStyle} className="fixed right-8 z-[100000] w-[92vw] max-w-[380px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 shrink-0">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5"><Bug className="w-4 h-4 text-rose-600" /> 不具合報告</h3>
            <button onClick={close} className="w-7 h-7 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          {done ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">🙏</div>
              <div className="font-bold text-slate-800 mb-1 text-sm">報告を送信しました</div>
              <div className="text-xs text-slate-500 mb-4">ご協力ありがとうございます。</div>
              <button onClick={close} className="px-5 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-bold">閉じる</button>
            </div>
          ) : (
            <div className="p-4 space-y-3 overflow-y-auto">
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> スクリーンショット <span className="text-rose-500">必須</span></span>
                  <label className="text-[11px] font-bold text-[#1E40AF] hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> 画像を選ぶ
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
                  </label>
                </div>
                {shot ? (
                  <img src={shot} alt="screenshot" className="w-full rounded-lg border border-slate-200 max-h-44 object-contain bg-slate-50" />
                ) : (
                  <div className="text-[11px] bg-amber-50 border border-amber-100 rounded-lg px-3 py-3 text-center text-amber-700">
                    {autoFailed ? '自動でスクショを取得できませんでした。' : 'スクリーンショットがありません。'}<br />「画像を選ぶ」または <b>Ctrl+V で貼り付け</b>してください。
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500">どんな不具合ですか？<span className="text-rose-500">必須</span></label>
                <textarea autoFocus value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                  placeholder="例：保存ボタンを押すとエラーが出る／〇〇が表示されない など"
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1E40AF] resize-none" />
              </div>
              {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</div>}
              <button onClick={submit} disabled={busy === 'sending' || !shot || !message.trim()} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {busy === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 送信する
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
