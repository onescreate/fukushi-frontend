import type { ReactNode } from 'react';
import { PageHeader } from '../components/layout/PageHeader';

const TOC: { id: string; label: string }[] = [
  { id: 'login', label: '1. ログインとログアウト' },
  { id: 'overview', label: '2. 画面の見方' },
  { id: 'corporations', label: '3. 法人の登録' },
  { id: 'facilities', label: '4. 店舗の登録' },
  { id: 'staff', label: '5. 職員の登録' },
  { id: 'users', label: '6. 利用者の登録' },
  { id: 'devices', label: '7. タブレット端末の登録' },
  { id: 'kiosk', label: '8. タブレットで打刻する' },
  { id: 'faq', label: '9. 困ったとき（Q&A）' },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 border-b pb-2 text-lg font-bold text-foreground">
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-primary">
      {items.map((it, i) => (
        <li key={i} className="pl-1">
          {it}
        </li>
      ))}
    </ol>
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
    <div className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {title && (
        <p className="mb-1 font-semibold">
          {icon} {title}
        </p>
      )}
      {!title && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

const B = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
);

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="ヘルプ・使い方"
        description="各画面の使い方を、はじめての方向けに説明します。"
      />

      <div className="flex gap-8">
        {/* 目次 */}
        <nav className="sticky top-20 hidden h-fit w-56 shrink-0 lg:block">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            目次
          </p>
          <ul className="space-y-1">
            {TOC.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 本文 */}
        <div className="min-w-0 flex-1 space-y-10">
          <Note type="info" title="この画面について">
            ここは<B>管理・運営スタッフ用</B>の操作マニュアルです。上から順に読むと、
            システムのセットアップから日々の登録作業までひととおり分かります。
            左の「目次」から見たい項目にジャンプできます。
          </Note>

          <Section id="login" title="1. ログインとログアウト">
            <p>
              このシステムには、決められた<B>メールアドレス</B>と<B>パスワード</B>でログインします。
              アカウントは管理者から発行してもらいます。
            </p>
            <Steps
              items={[
                <>ブラウザ（Chrome など）でシステムのURLを開きます。</>,
                <>
                  <B>メールアドレス</B>と<B>パスワード</B>を入力し、
                  <B>「ログイン」</B>ボタンを押します。
                </>,
                <>ログインすると、左側にメニュー（サイドバー）のある画面が表示されます。</>,
                <>
                  終わるときは、左下（または画面の隅）の
                  <B>ログアウト</B>ボタンを押します。共用パソコンでは必ずログアウトしてください。
                </>,
              ]}
            />
            <Note type="warning" title="パスワードを忘れたら">
              自分では再設定できません。<B>他の管理者</B>に「職員管理」から
              パスワードを再設定してもらってください（後述の「5. 職員の登録」参照）。
            </Note>
          </Section>

          <Section id="overview" title="2. 画面の見方">
            <p>
              左側の<B>サイドバー</B>から各画面に移動します。上部の
              <B>パネルのアイコン</B>を押すとサイドバーを細く折りたためます。
            </p>
            <p>
              メニューは<B>あなたの権限によって変わります</B>。たとえば「法人管理」は
              システム管理者だけに表示され、店舗スタッフには表示されません。
              見えないメニューは「その操作をする権限がない」という意味です。
            </p>
            <p>一覧画面での共通操作は次のとおりです。</p>
            <Steps
              items={[
                <>
                  行（データ）を<B>クリック</B>すると、
                  <B>詳細画面</B>が開き、すべての情報を確認できます。
                </>,
                <>
                  右上の<B>「＋新規登録」</B>で新しいデータを追加します。
                </>,
                <>
                  各行の右端にある<B>アイコン</B>で、編集（鉛筆）・削除（ゴミ箱）などを行います。
                </>,
              ]}
            />
            <Note type="tip">
              入力の保存は各画面の<B>「保存」</B>ボタンで確定します。
              操作の結果は画面上部に短いメッセージ（トースト）で知らせます。
            </Note>
          </Section>

          <Section id="corporations" title="3. 法人の登録">
            <p>
              いちばん大きな単位が<B>法人</B>です。法人の下に「店舗（施設）」がぶら下がります。
              （システム管理者のみ操作できます。）
            </p>
            <Steps
              items={[
                <>サイドバーの<B>「法人管理」</B>を開きます。</>,
                <><B>「＋新規登録」</B>を押します。</>,
                <>
                  <B>法人名</B>を入力します（必須）。
                </>,
                <>
                  <B>郵便番号</B>を7桁入力すると、<B>都道府県・市区町村が自動で入ります</B>。
                  残りの番地・建物名を入力します。
                </>,
                <>
                  必要に応じて<B>設立年月日</B>・<B>電話番号</B>も入力します。
                </>,
                <><B>「保存」</B>を押すと一覧に追加されます。</>,
              ]}
            />
            <Note type="warning" title="削除できないとき">
              <B>店舗が登録されている法人は削除できません</B>。先にその法人の店舗をすべて削除してください。
            </Note>
          </Section>

          <Section id="facilities" title="4. 店舗の登録">
            <p>
              <B>店舗（施設）</B>は、実際に利用者が通う事業所です。法人の下に登録します。
            </p>
            <Steps
              items={[
                <>サイドバーの<B>「店舗管理」</B>を開き、<B>「＋新規登録」</B>を押します。</>,
                <>
                  （システム管理者の場合）どの<B>法人</B>の店舗かを選びます。
                </>,
                <>
                  <B>店舗名</B>を入力し、<B>サービス種別</B>（就労移行／継続A／継続B など）を選びます。
                </>,
                <>
                  郵便番号・住所・電話番号・連絡先メールなどを入力します（郵便番号は自動入力対応）。
                </>,
                <><B>「保存」</B>で登録します。</>,
              ]}
            />
            <Note type="warning" title="削除できないとき">
              <B>利用者が登録されている店舗は削除できません</B>。先に利用者を移動・削除してください。
            </Note>
          </Section>

          <Section id="staff" title="5. 職員の登録（ログインアカウントの発行）">
            <p>
              管理画面を使う<B>職員</B>を登録すると、同時に<B>ログインアカウント</B>が発行されます。
            </p>
            <Steps
              items={[
                <>サイドバーの<B>「職員管理」</B>を開き、<B>「＋新規登録」</B>を押します。</>,
                <>
                  （システム管理者の場合）所属<B>法人</B>を選び、<B>姓・名</B>を入力します。
                </>,
                <>
                  <B>メールアドレス</B>（これがログインIDになります）と、
                  <B>初期パスワード</B>（8文字以上）を入力します。
                </>,
                <>
                  <B>権限</B>を選びます。
                  <span className="mt-1 block">
                    ・<B>システム管理者</B>＝全体を管理<br />
                    ・<B>法人管理者</B>＝自分の法人だけを管理<br />
                    ・<B>店舗管理者</B>＝担当店舗を管理<br />
                    ・<B>スタッフ</B>＝日常業務のみ
                  </span>
                </>,
                <>
                  「店舗管理者」「スタッフ」を選んだ場合は、<B>所属店舗</B>も選びます。
                </>,
                <>
                  <B>「保存」</B>を押すと登録完了。
                  <B>初期パスワードは本人に伝えてください</B>（本人はログイン後に変更できます）。
                </>,
              ]}
            />
            <Note type="tip" title="パスワードを再設定するには">
              一覧の<B>鍵アイコン</B>から、いつでも新しいパスワードを設定できます。
              職員がパスワードを忘れたときはここで対応します。
            </Note>
            <Note type="info" title="権限で見える範囲が変わります">
              法人管理者は<B>自分の法人のデータしか見えません</B>。他の法人の店舗・職員・利用者は
              表示も操作もできない仕組みです（安全のため）。
            </Note>
          </Section>

          <Section id="users" title="6. 利用者の登録">
            <p>
              施設に通う<B>利用者</B>を登録します。利用者は
              <B>「タブレットでの打刻（PIN）」</B>と
              <B>「自宅からのログイン」</B>の2通りで利用します。登録時に両方の準備をします。
            </p>
            <Steps
              items={[
                <>サイドバーの<B>「利用者管理」</B>を開き、<B>「＋新規登録」</B>を押します。</>,
                <>
                  <B>所属店舗</B>を選び、<B>姓・名</B>（必要ならフリガナ）を入力します。
                </>,
                <>
                  <B>ログインID</B>を決めます（例: user001。半角英数字。自宅ログインで使います。あとから変更できません）。
                </>,
                <>
                  <B>PIN</B>（4〜6桁の数字）を決めます。これは<B>タブレットで打刻するときの暗証番号</B>です。
                </>,
                <>
                  <B>自宅ログイン用パスワード</B>（8文字以上）を決めます。
                </>,
                <>
                  必要に応じて<B>受給者証番号・身長・特別食費</B>を入力します（任意）。
                </>,
                <><B>「保存」</B>で登録します。</>,
              ]}
            />
            <Note type="tip" title="PIN・パスワードの再設定">
              一覧の<B>鍵アイコン</B>でPINを、<B>錠アイコン</B>で自宅ログイン用パスワードを、
              それぞれ再設定できます。
            </Note>
            <Note type="info">
              退所した利用者は、削除せずに編集画面で<B>ステータスを「退所」</B>に変更すると、
              記録を残したまま一覧を整理できます。
            </Note>
          </Section>

          <Section id="devices" title="7. タブレット端末の登録">
            <p>
              施設に置く<B>打刻用タブレット</B>を、あらかじめシステムに登録します。
              （システム管理者・法人管理者が操作します。）
            </p>
            <Steps
              items={[
                <>サイドバーの<B>「端末管理」</B>を開き、<B>「端末を登録」</B>を押します。</>,
                <>
                  タブレットを置く<B>店舗</B>と、分かりやすい<B>端末名</B>（例:「玄関タブレット」）を入力します。
                </>,
                <>
                  <B>「登録してトークン発行」</B>を押すと、<B>端末トークン</B>という文字列が表示されます。
                </>,
                <>
                  この<B>トークンをコピー</B>して控えます。次の「8. タブレットで打刻する」で使います。
                </>,
              ]}
            />
            <Note type="warning" title="トークンは一度しか表示されません">
              端末トークンは<B>登録直後の1回だけ</B>表示されます。必ずコピー・メモしてください。
              なくした場合は、その端末を削除して<B>登録し直します</B>。
            </Note>
          </Section>

          <Section id="kiosk" title="8. タブレットで打刻する（利用者向け画面）">
            <p>
              施設のタブレットでは、利用者が<B>自分のPIN</B>を入力して打刻します。
              この画面は<B>ログイン不要</B>ですが、登録済みの<B>端末トークン</B>がないと使えません。
            </p>
            <p className="font-semibold text-foreground">■ 最初の準備（タブレット1台につき1回）</p>
            <Steps
              items={[
                <>タブレットのブラウザで、システムのURLの末尾に <B>/kiosk</B> を付けて開きます。</>,
                <>
                  <B>「端末セットアップ」</B>画面が出たら、「7.」で控えた
                  <B>端末トークン</B>を貼り付けて<B>「この端末を設定」</B>を押します。
                </>,
                <>設定はタブレットに記憶されるので、次回からは不要です。</>,
              ]}
            />
            <p className="font-semibold text-foreground">■ 利用者の打刻</p>
            <Steps
              items={[
                <>画面に<B>利用者の名前</B>が並ぶので、自分の名前を選びます。</>,
                <><B>PIN（暗証番号）</B>を入力し、<B>「確定」</B>を押します。</>,
                <>「〇〇さん 認証しました」と表示されれば成功です。</>,
              ]}
            />
            <Note type="tip">
              端末の設定をやり直したいときは、名前選択画面の<B>右上の歯車アイコン</B>から変更できます。
            </Note>
            <Note type="info">
              ※ 現在は<B>PIN認証まで</B>の実装です。実際の「通所・退所の打刻」機能は次のフェーズで追加します。
            </Note>
          </Section>

          <Section id="faq" title="9. 困ったとき（Q&A）">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground">
                  Q. メニューに「法人管理」などが表示されません。
                </p>
                <p>
                  A. あなたの権限では使えない機能です。表示されるメニューが、あなたのできる操作の範囲です。
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Q. 「削除できません」と表示されます。
                </p>
                <p>
                  A. そのデータに<B>ぶら下がっているデータ</B>があるためです。法人は店舗を、店舗は利用者を、
                  先に整理してから削除してください。
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Q. 職員／利用者がパスワード（PIN）を忘れました。
                </p>
                <p>
                  A. 管理者が「職員管理」または「利用者管理」の一覧から、
                  <B>鍵・錠アイコン</B>で再設定してください。
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Q. タブレットで「端末が登録されていません」と出ます。
                </p>
                <p>
                  A. 端末トークンが正しくないか、端末が削除されています。「端末管理」で登録し直し、
                  正しいトークンを設定してください。
                </p>
              </div>
            </div>
          </Section>

          <Note type="tip" title="この先の予定">
            この後のフェーズで、<B>通所予定の登録・承認</B>、<B>打刻の実運用</B>、<B>食事管理</B>、
            <B>請求管理</B> などを追加していきます。追加のたびに、このヘルプも更新します。
          </Note>
        </div>
      </div>
    </div>
  );
}
