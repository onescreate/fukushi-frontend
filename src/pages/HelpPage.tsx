import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Compass,
  ListChecks,
  Network,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';

const TOC: { id: string; label: string }[] = [
  { id: 'structure', label: '1. システムの全体像' },
  { id: 'flow', label: '2. 業務の流れ' },
  { id: 'setup', label: '3. 初期設定の手順' },
  { id: 'kiosk', label: '4. タブレットで打刻する' },
  { id: 'approve', label: '5. 承認と打刻の補正' },
  { id: 'faq', label: '6. 困ったとき（Q&A）' },
];

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-bold text-slate-800">{children}</strong>
);

const PageLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
    {children}
  </Link>
);

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white tabular-nums">
            {i + 1}
          </span>
          <span className="text-[13px] leading-relaxed text-slate-600">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function FlowCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  items,
}: {
  icon: LucideIcon;
  tone: 'indigo' | 'emerald' | 'amber';
  title: string;
  subtitle: string;
  items: ReactNode[];
}) {
  const toneCls = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }[tone];
  return (
    <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex size-9 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-[14px] font-black text-slate-800">{title}</p>
          <p className="text-[11px] font-bold text-slate-400">{subtitle}</p>
        </div>
      </div>
      <Steps items={items} />
    </div>
  );
}

function Note({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'tip';
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    tip: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[type];
  const icon = { info: 'ℹ️', warning: '⚠️', tip: '💡' }[type];
  return (
    <div className={`rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${styles}`}>
      {title && <p className="mb-1 font-bold">{icon} {title}</p>}
      {!title && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="ヘルプ・使い方"
        description="システムの全体像と業務の流れ"
      />

      <div className="flex gap-8">
        {/* 目次 */}
        <nav className="sticky top-6 hidden h-fit w-52 shrink-0 lg:block">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">目次</p>
          <ul className="space-y-1">
            {TOC.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="block rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 本文 */}
        <div className="min-w-0 flex-1 space-y-10">
          {/* 1. 全体像 */}
          <section id="structure" className="scroll-mt-6">
            <SectionHeader icon={Network} title="1. システムの全体像" />
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                このシステムは<B>就労支援施設（事業所）の運営</B>を管理します。データは次の階層で成り立っています。
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#ECEDF1] bg-white p-4 text-[13px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">法人</span>
                <span className="text-slate-300">›</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">店舗（事業所）</span>
                <span className="text-slate-300">›</span>
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-700">職員（管理する人）</span>
                <span className="text-slate-400">＋</span>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">利用者（通う人）</span>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600">
                このシステムで管理できること：<B>通所予定</B>・<B>打刻（勤怠）</B>・<B>食事（予約〜提供〜納品〜請求）</B>・
                <B>健康記録（体重・BMI）</B>・<B>加算／締め業務</B>・<B>請求書の発行</B>・<B>分析</B>。
              </p>
              <Note type="info" title="メニューは権限で変わります">
                見えるメニューが、あなたのできる操作の範囲です。「法人管理」などはシステム管理者だけに表示されます。
              </Note>
            </div>
          </section>

          {/* 2. 業務の流れ */}
          <section id="flow" className="scroll-mt-6">
            <SectionHeader icon={Compass} title="2. 業務の流れ" />
            <p className="mb-4 text-[13px] leading-relaxed text-slate-600">
              「<B>初期設定（最初に1回）</B>」→「<B>毎日の業務</B>」→「<B>毎月の業務</B>」の順に回ります。
              各ステップの名前は、そのままサイドバーのメニュー名です。
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <FlowCard
                icon={SettingsIcon}
                tone="indigo"
                title="初期設定"
                subtitle="最初に1回・管理者"
                items={[
                  <><PageLink to="/corporations">法人</PageLink>を登録</>,
                  <><PageLink to="/facilities">店舗</PageLink>を登録</>,
                  <><PageLink to="/staff">職員</PageLink>を登録（＝ログイン発行）</>,
                  <><PageLink to="/users">利用者</PageLink>を登録（PIN・自宅ログイン）</>,
                  <><PageLink to="/devices">打刻タブレット</PageLink>を登録</>,
                  <><PageLink to="/settings">各種設定</PageLink>（打刻猶予・食事料金・消費税・請求書）</>,
                ]}
              />
              <FlowCard
                icon={ListChecks}
                tone="emerald"
                title="毎日の業務"
                subtitle="スタッフ"
                items={[
                  <>朝、<PageLink to="/approvals">予定承認</PageLink>・<PageLink to="/meal-approvals">食事承認</PageLink>の申請を確認</>,
                  <>利用者がタブレットで<B>PIN打刻</B>（出勤・退勤）</>,
                  <><PageLink to="/">ダッシュボード</PageLink>の「今日の来所」で通所状況・未打刻・遅刻/早退を確認・補正</>,
                  <>食事の<B>喫食</B>を記録（ダッシュボードの「喫食者」）</>,
                  <><PageLink to="/meal-deliveries">食事納品</PageLink>の数量を記録</>,
                  <>必要に応じて<PageLink to="/health-records">健康記録</PageLink>（体重・BMI）</>,
                  <><PageLink to="/closing-operations">締め業務</PageLink>でその日の実績・加算を記録</>,
                ]}
              />
              <FlowCard
                icon={CalendarClock}
                tone="amber"
                title="毎月の業務"
                subtitle="管理者"
                items={[
                  <><PageLink to="/attendance-list">打刻データ一覧</PageLink>で当月の打刻を確認・補正</>,
                  <><PageLink to="/closing-operations">締め業務</PageLink>で当月の実績・加算を確定</>,
                  <><PageLink to="/meal-billing">食事請求</PageLink>で料金・キャンセル料・消費税を集計、入金/未払いを管理</>,
                  <><B>請求書</B>を発行・印刷（食事請求の画面から）</>,
                  <><PageLink to="/analytics">分析</PageLink>で当月を振り返り</>,
                ]}
              />
            </div>
            <Note type="tip" title="迷ったら">
              まず<PageLink to="/">ダッシュボード</PageLink>を見てください。「要対応」に、いま対応すべきこと（承認待ち・未払い・記録漏れ）が集約されています。
            </Note>
          </section>

          {/* 3. 初期設定の手順 */}
          <section id="setup" className="scroll-mt-6">
            <SectionHeader icon={Building2} title="3. 初期設定の手順（詳しく）" />
            <div className="space-y-5">
              <p className="text-[13px] leading-relaxed text-slate-600">
                すべて<B>マスタ管理</B>・<B>設定</B>メニューから行います。上から順に登録してください
                （下の階層は、上が登録済みでないと作れません）。
              </p>
              <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <Steps
                  items={[
                    <><B>法人</B>：<PageLink to="/corporations">法人管理</PageLink>で法人名を登録（郵便番号7桁で住所自動入力）。</>,
                    <><B>店舗</B>：<PageLink to="/facilities">店舗管理</PageLink>で事業所を登録。<B>サービス種別</B>（就労移行／継続A／継続B）が加算に影響します。食事を扱う店舗は<B>食事あり</B>にします。</>,
                    <><B>職員</B>：<PageLink to="/staff">職員管理</PageLink>で登録＝ログインアカウント発行。<B>権限</B>（システム/法人/店舗管理者・スタッフ）と<B>初期パスワード</B>を設定し、本人に伝えます。</>,
                    <><B>利用者</B>：<PageLink to="/users">利用者管理</PageLink>で登録。<B>PIN</B>（タブレット打刻用）と<B>自宅ログイン用パスワード</B>を設定します。</>,
                    <><B>端末</B>：<PageLink to="/devices">端末管理</PageLink>でタブレットを登録し、<B>端末トークン</B>を控えます（次項で使用）。</>,
                    <><B>設定</B>：<PageLink to="/settings">設定</PageLink>で「打刻の猶予時間」「食事料金・キャンセル料」「消費税」「請求書の発行者情報」を設定します。</>,
                  ]}
                />
              </div>
              <Note type="warning" title="削除の順番">
                法人は店舗を、店舗は利用者を、先に整理しないと削除できません（データを守るため）。
              </Note>
            </div>
          </section>

          {/* 4. キオスク */}
          <section id="kiosk" className="scroll-mt-6">
            <SectionHeader icon={ClipboardList} title="4. タブレットで打刻する" />
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                施設のタブレットで、利用者が<B>自分のPIN</B>を入力して打刻します。ログイン不要ですが、
                登録済みの<B>端末トークン</B>が必要です。
              </p>
              <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <p className="mb-2 text-[12px] font-black text-slate-700">■ 最初の準備（タブレット1台につき1回）</p>
                <Steps
                  items={[
                    <>タブレットのブラウザでシステムURLの末尾に <B>/kiosk</B> を付けて開きます。</>,
                    <>「端末セットアップ」で、控えた<B>端末トークン</B>を貼り付けて設定します（以後は記憶されます）。</>,
                  ]}
                />
                <p className="mb-2 mt-4 text-[12px] font-black text-slate-700">■ 利用者の打刻</p>
                <Steps
                  items={[
                    <>画面から<B>自分の名前</B>を選びます。</>,
                    <><B>PIN</B>を入力して<B>確定</B>。出勤・退勤・食事・欠席/遅刻/早退の理由申請ができます。</>,
                  ]}
                />
              </div>
              <Note type="warning" title="端末トークンは1回だけ表示">
                登録直後の1回のみ表示されます。なくしたら端末を削除して登録し直してください。
              </Note>
            </div>
          </section>

          {/* 5. 承認と打刻の補正 */}
          <section id="approve" className="scroll-mt-6">
            <SectionHeader icon={CheckCheck} title="5. 承認と打刻の補正" />
            <div className="space-y-5">
              <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <p className="mb-2 text-[12px] font-black text-slate-700">
                  ■ 予定をまとめて承認・却下する（<PageLink to="/approvals">予定承認</PageLink>）
                </p>
                <Steps
                  items={[
                    <>各行の<B>チェックボックス</B>で選びます（見出しのチェックで全件選択）。</>,
                    <>上に出るバーの<B>まとめて承認</B>／<B>まとめて却下</B>を押します。</>,
                    <><B>却下</B>のときは理由を入力できます（任意）。理由は<B>利用者の画面にそのまま表示</B>されます。</>,
                    <>1件だけ処理したいときは、その行の<B>承認</B>／<B>却下</B>ボタンを押します。</>,
                  ]}
                />
                <p className="mb-2 mt-4 text-[12px] font-black text-slate-700">
                  ■ 利用者が申請した内容を確認する
                </p>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  一覧の<B>行をクリック</B>すると、申請内容がすべて表示されます —
                  <B>種別（通所／実習）</B>・<B>実習先</B>・<B>時間</B>・
                  <B>中抜けの時刻と用件</B>（通院：精神科／ハローワーク：失業認定日 など）・<B>連絡事項</B>。
                  そのまま承認・却下もできます。実習先と中抜けは
                  <PageLink to="/">ダッシュボード</PageLink>の「今日の来所」にも表示されます。
                </p>
              </div>

              <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <p className="mb-2 text-[12px] font-black text-slate-700">
                  ■ 管理者が実習の予定を入れる（<PageLink to="/schedules">通所予定</PageLink>）
                </p>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  利用者を選んでカレンダーの日付をクリックし、<B>種別</B>で「実習」を選んで<B>実習先</B>を入力します。
                  実習の日は中抜けを持ちません（登録済みの中抜けは保存時に消えます）。
                  「通所」に戻すと実習の登録は解除されます。
                </p>
              </div>

              <div className="rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                <p className="mb-2 text-[12px] font-black text-slate-700">
                  ■ 打刻を補正する（<PageLink to="/attendance-list">打刻データ一覧</PageLink>・ダッシュボード）
                </p>
                <Steps
                  items={[
                    <>鉛筆アイコンから<B>打刻の補正</B>を開き、通所・退所の時刻や欠席、理由を直します。</>,
                    <>保存すると<B>手修正</B>のマークが付きます。マークにカーソルを合わせると<B>誰が・いつ</B>直したかが出ます。</>,
                    <>補正した時刻で<B>遅刻・早退は自動で判定し直されます</B>（未打刻を後から入れた場合も正しく反映されます）。</>,
                  ]}
                />
              </div>

              <Note type="warning" title="時刻の前後が逆のデータ">
                「終了が開始より前」（例 15:26〜15:00）は保存できません。
                すでに保存されている古いデータには<B>⚠️のマーク</B>が付きます
                （<PageLink to="/attendance-list">打刻データ一覧</PageLink>・
                <PageLink to="/schedules">通所予定</PageLink>・
                <PageLink to="/approvals">予定承認</PageLink>）。見つけたら開いて直してください。
              </Note>
            </div>
          </section>

          {/* 6. FAQ */}
          <section id="faq" className="scroll-mt-6">
            <SectionHeader icon={Compass} title="6. 困ったとき（Q&A）" />
            <div className="space-y-3">
              {[
                { q: 'メニューに「法人管理」などが出ない', a: 'あなたの権限では使えない機能です。見えるメニューが操作できる範囲です。' },
                { q: '「削除できません」と出る', a: 'ぶら下がるデータがあるためです。法人は店舗を、店舗は利用者を先に整理してください。' },
                { q: '職員／利用者がパスワード（PIN）を忘れた', a: '管理者が「職員管理」「利用者管理」の一覧の鍵・錠アイコンから再設定できます。' },
                { q: 'タブレットで「端末が登録されていません」と出る', a: '端末トークンが不正か端末が削除されています。「端末管理」で登録し直してください。' },
                { q: '当月のKPIがダッシュボードに出ない', a: 'ヘッダー右上で特定の店舗を選んでください。「全店舗」表示中は集計を出しません。' },
                { q: '利用者が申請した中抜けの用件や実習先はどこで見られる？', a: '「予定承認」で行をクリックすると申請内容がすべて出ます。当日分はダッシュボードの「今日の来所」にも表示されます。' },
                { q: '予定を却下した理由は利用者に伝わる？', a: '伝わります。却下時に入力した理由が、利用者のその日の申請画面・履歴・打刻タブレットの差戻メッセージに表示されます。' },
                { q: '食事の申請を却下したのに利用者の画面が「予約済」のまま', a: '表示の不具合でした。修正済みで、いまは「却下」と表示されます。請求や発注数には最初から含まれていません。' },
                { q: '時刻が「15:26〜15:00」のように逆になっている', a: '古いデータです。⚠️マークの付いた行を開いて正しい時刻に直してください。新しく逆の時刻を保存することはできません。' },
                { q: '「手修正」のマークは何？', a: '管理者が打刻を手で直した記録です。マークにカーソルを合わせると、直した職員の名前と日時が表示されます。' },
              ].map((f, i) => (
                <div key={i} className="rounded-lg border border-[#ECEDF1] bg-white px-4 py-3">
                  <p className="text-[13px] font-bold text-slate-800">Q. {f.q}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-600">A. {f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
