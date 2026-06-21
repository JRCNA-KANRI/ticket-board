import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// ========================================
// ★ EmailJS設定（EmailJSのダッシュボードから取得）
// ========================================
const EMAILJS_SERVICE_ID  = "service_fbtos4u";   // ← 後で差し替え
const EMAILJS_TEMPLATE_ID = "template_aoozmec";  // ← 後で差し替え
const EMAILJS_PUBLIC_KEY  = "UrZehnmauMhCt9T98";    // ← 後で差し替え
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyDb29C8nU3ybHaYOvw6czA1aW1s8XJoS6Y",
  authDomain: "ticket-board-f3c3a.firebaseapp.com",
  projectId: "ticket-board-f3c3a",
  storageBucket: "ticket-board-f3c3a.firebasestorage.app",
  messagingSenderId: "1092812216455",
  appId: "1:1092812216455:web:a9fedb56157633cf1f0022"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PASSWORD = "jrcna18";

const AGREEMENT_TEXTS = [
  "譲渡は、当事者間の責任において行ってください。",
  "受け渡し方法については、当事者間でご相談のうえ決定してください。",
  "譲渡が成立しましたら、「成立済みにする」ボタンを押して成立済みにしてください。",
];

export default function App() {
  const [auth, setAuth]           = useState(false);
  const [pwInput, setPwInput]     = useState("");
  const [pwError, setPwError]     = useState(false);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");

  // 投稿フォーム
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ type: "sell", name: "", seats: 1, price: "", note: "", contact: "" });
  const [formError, setFormError] = useState("");
  const [agreements, setAgreements] = useState([false, false, false]);
  const allAgreed = agreements.every(Boolean);
  const toggleAgreement = (i) => {
    const next = [...agreements]; next[i] = !next[i]; setAgreements(next);
  };

  // 成立報告フォーム
  const [reportPost, setReportPost]     = useState(null); // 対象投稿
  const [reportTo, setReportTo]         = useState("");   // 誰に
  const [reportWhat, setReportWhat]     = useState("");   // 何を
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError]   = useState("");

  // 成功メッセージ
  const [successMsg, setSuccessMsg]     = useState("");

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (pwInput === PASSWORD) { setAuth(true); setPwError(false); }
    else setPwError(true);
  };

  const handlePost = async () => {
    if (!form.name || !form.price || !form.contact) {
      setFormError("名前・価格・連絡先は必須です"); return;
    }
    await addDoc(collection(db, "posts"), {
      ...form,
      seats: Number(form.seats),
      price: Number(form.price),
      date: new Date().toISOString().split("T")[0],
      status: "open",
      createdAt: new Date(),
    });
    setForm({ type: "sell", name: "", seats: 1, price: "", note: "", contact: "" });
    setAgreements([false, false, false]);
    setShowForm(false);
    setFormError("");
    showSuccess("投稿しました！");
  };

  const handleDelete = async (id) => {
    if (window.confirm("この投稿を削除しますか？")) {
      await deleteDoc(doc(db, "posts", id));
    }
  };

  // 「成立済みにする」ボタン → 報告フォームを開く
  const handleOpenReport = (post) => {
    setReportPost(post);
    setReportTo("");
    setReportWhat("");
    setReportError("");
  };

  // 報告フォームの送信
  const handleSendReport = async () => {
    if (!reportTo.trim() || !reportWhat.trim()) {
      setReportError("「誰に」と「何を」の両方を入力してください"); return;
    }
    setReportSending(true);
    try {
      // EmailJS SDNをCDN経由で呼び出し
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name:    reportPost.name,
            from_contact: reportPost.contact,
            to_person:    reportTo,
            what_item:    reportWhat,
            post_type:    reportPost.type === "sell" ? "譲渡したい" : "譲ってほしい",
            price:        `¥${reportPost.price.toLocaleString()}`,
            seats:        `${reportPost.seats}枚`,
          },
        }),
      });
      if (res.status === 200) {
        // Firestoreも成立済みに更新
        await updateDoc(doc(db, "posts", reportPost.id), { status: "closed" });
        setReportPost(null);
        showSuccess("報告メールを送信し、成立済みにしました！");
      } else {
        setReportError("メール送信に失敗しました。EmailJSの設定を確認してください。");
      }
    } catch (e) {
      setReportError("通信エラーが発生しました。");
    }
    setReportSending(false);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const filtered = posts
    .filter((p) => filter === "all" || p.type === filter)
    .sort((a, b) => {
      if (a.status === "closed" && b.status !== "closed") return 1;
      if (a.status !== "closed" && b.status === "closed") return -1;
      return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    });

  // ===================== STYLES =====================
  const S = {
    page: { minHeight: "100vh", background: "linear-gradient(135deg,#0a1628 0%,#162040 60%,#1a2a50 100%)", fontFamily: "'Noto Sans JP','Hiragino Sans',sans-serif", color: "#e8e4d8" },
    header: { borderBottom: "1px solid rgba(196,160,80,0.3)", padding: "24px 0 20px", textAlign: "center", background: "rgba(0,0,0,0.2)" },
    logo: { fontSize: 11, letterSpacing: "0.25em", color: "#c4a050", textTransform: "uppercase", marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 700, letterSpacing: "0.05em", margin: 0 },
    subtitle: { fontSize: 12, color: "#a0a8b8", marginTop: 6 },
    container: { maxWidth: 680, margin: "0 auto", padding: "0 16px" },
    controls: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 16px", gap: 12, flexWrap: "wrap" },
    filterGroup: { display: "flex", gap: 6 },
    filterBtn: (a) => ({ padding: "7px 14px", borderRadius: 20, border: `1px solid ${a?"#c4a050":"rgba(255,255,255,0.15)"}`, background: a?"rgba(196,160,80,0.15)":"transparent", color: a?"#c4a050":"#a0a8b8", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }),
    postBtn: { padding: "8px 18px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#c4a050,#e8c878)", color: "#0a1628", fontWeight: 700, fontSize: 13, cursor: "pointer" },
    ticket: (s) => ({ background: s==="closed"?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.06)", border: `1px solid ${s==="closed"?"rgba(255,255,255,0.08)":"rgba(196,160,80,0.25)"}`, borderRadius: 12, padding: "18px 20px", marginBottom: 14, opacity: s==="closed"?0.55:1 }),
    ticketHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    typeBadge: (t) => ({ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 10, background: t==="sell"?"rgba(239,102,80,0.2)":"rgba(80,180,120,0.2)", color: t==="sell"?"#f87c6a":"#60c890", border: `1px solid ${t==="sell"?"rgba(239,102,80,0.4)":"rgba(80,180,120,0.4)"}` }),
    statusBadge: { fontSize: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#7888a8", letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.15)", fontWeight: 700 },
    name: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
    date: { fontSize: 11, color: "#6a7490" },
    priceRow: { display: "flex", gap: 20, margin: "10px 0", alignItems: "center" },
    priceLabel: { fontSize: 11, color: "#a0a8b8" },
    price: { fontSize: 20, fontWeight: 700, color: "#c4a050" },
    seats: { fontSize: 13, color: "#c8d0e0" },
    note: { fontSize: 13, color: "#b0b8c8", margin: "8px 0", lineHeight: 1.6 },
    contact: { fontSize: 12, color: "#7888a8", marginTop: 8 },
    closeBtn: { fontSize: 11, padding: "4px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#8090a8", cursor: "pointer", marginTop: 10 },
    deleteBtn: { fontSize: 11, padding: "4px 12px", borderRadius: 10, border: "1px solid rgba(239,102,80,0.35)", background: "transparent", color: "#f87c6a", cursor: "pointer", marginTop: 10, marginLeft: 8 },
    loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0a1628 0%,#162040 100%)" },
    loginBox: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(196,160,80,0.3)", borderRadius: 16, padding: "40px 32px", textAlign: "center", maxWidth: 340, width: "90%" },
    loginTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#BFBFBF" },
    loginSub: { fontSize: 12, color: "#7888a8", marginBottom: 24 },
    textInput: { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#e8e4d8", fontSize: 15, textAlign: "center", letterSpacing: "0.1em", boxSizing: "border-box", marginBottom: 12, outline: "none" },
    loginBtn: { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#c4a050,#e8c878)", color: "#0a1628", fontWeight: 700, fontSize: 15, cursor: "pointer" },
    error: { fontSize: 12, color: "#f87c6a", marginTop: 8 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
    modalBox: { background: "#1a2a50", border: "1px solid rgba(196,160,80,0.3)", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" },
    modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
    fieldLabel: { fontSize: 12, color: "#a0a8b8", marginBottom: 6, display: "block" },
    fieldInput: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8e4d8", fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" },
    radioGroup: { display: "flex", gap: 12, marginBottom: 14 },
    radio: (a) => ({ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${a?"#c4a050":"rgba(255,255,255,0.12)"}`, background: a?"rgba(196,160,80,0.1)":"transparent", color: a?"#c4a050":"#8090a8", fontWeight: a?700:400, fontSize: 14, cursor: "pointer", textAlign: "center" }),
    formActions: { display: "flex", gap: 10, marginTop: 8 },
    cancelBtn: { flex: 1, padding: "11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#8090a8", fontSize: 14, cursor: "pointer" },
    submitBtn: (en) => ({ flex: 2, padding: "11px", borderRadius: 8, border: "none", background: en?"linear-gradient(135deg,#c4a050,#e8c878)":"rgba(255,255,255,0.1)", color: en?"#0a1628":"#5a6480", fontWeight: 700, fontSize: 14, cursor: en?"pointer":"not-allowed", transition: "all 0.2s" }),
    agreementBox: { borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 16, paddingTop: 14, marginBottom: 4 },
    agreementTitle: { fontSize: 11, color: "#a0a8b8", marginBottom: 10, letterSpacing: "0.05em" },
    agreementItem: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer" },
    checkbox: (c) => ({ width: 16, height: 16, minWidth: 16, borderRadius: 4, border: `2px solid ${c?"#c4a050":"rgba(255,255,255,0.25)"}`, background: c?"rgba(196,160,80,0.2)":"transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all 0.15s" }),
    agreementText: { fontSize: 12, color: "#b0b8c8", lineHeight: 1.6 },
    reportInfoBox: { background: "rgba(196,160,80,0.08)", border: "1px solid rgba(196,160,80,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#c8d0e0", lineHeight: 1.7 },
    success: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#3a6040", color: "#a0e0b0", padding: "10px 24px", borderRadius: 20, fontSize: 14, zIndex: 200, whiteSpace: "nowrap" },
    empty: { textAlign: "center", color: "#6a7490", padding: "40px 0", fontSize: 14 },
    loadingWrap: { textAlign: "center", color: "#6a7490", padding: "60px 0", fontSize: 14 },
  };

  // ===================== RENDER =====================
  if (!auth) {
    return (
      <div style={S.loginWrap}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#c4a050", marginBottom: 16 }}>18TH JRCNA KYOTO</div>
          <div style={S.loginTitle}>チケット譲渡掲示板</div>
          <div style={S.loginSub}>参加者限定のページです<br />パスワードを入力してください</div>
          <input style={S.textInput} type="password" placeholder="パスワード" value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {pwError && <div style={S.error}>パスワードが違います</div>}
          <button style={S.loginBtn} onClick={handleLogin}>入室する</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>18TH JRCNA KYOTO</div>
        <h1 style={S.title}>チケット譲渡掲示板</h1>
        <div style={S.subtitle}>参加者間でチケットの譲渡ができます</div>
      </div>

      <div style={S.container}>
        <div style={S.controls}>
          <div style={S.filterGroup}>
            {[["all","すべて"],["sell","譲渡したい"],["buy","欲しい"]].map(([val, label]) => (
              <button key={val} style={S.filterBtn(filter===val)} onClick={() => setFilter(val)}>{label}</button>
            ))}
          </div>
          <button style={S.postBtn} onClick={() => setShowForm(true)}>＋ 投稿する</button>
        </div>

        {loading && <div style={S.loadingWrap}>読み込み中...</div>}
        {!loading && filtered.length === 0 && <div style={S.empty}>該当する投稿がありません</div>}

        {filtered.map((p) => (
          <div key={p.id} style={S.ticket(p.status)}>
            <div style={S.ticketHeader}>
              <div>
                <div style={S.name}>{p.name}</div>
                <div style={S.date}>{p.date}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={S.typeBadge(p.type)}>{p.type==="sell"?"譲渡したい":"譲ってほしい"}</div>
                {p.status === "closed" && <div style={S.statusBadge}>成立済み</div>}
              </div>
            </div>
            <div style={S.priceRow}>
              <div><div style={S.priceLabel}>希望価格</div><div style={S.price}>¥{p.price.toLocaleString()}</div></div>
              <div><div style={S.priceLabel}>枚数</div><div style={S.seats}>{p.seats}枚</div></div>
            </div>
            {p.note && <div style={S.note}>{p.note}</div>}
            <div style={S.contact}>連絡先：{p.contact}</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {p.status === "open" && (
                <button style={S.closeBtn} onClick={() => handleOpenReport(p)}>成立済みにする</button>
              )}
              <button style={S.deleteBtn} onClick={() => handleDelete(p.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 投稿フォーム ===== */}
      {showForm && (
        <div style={S.overlay}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>チケットを投稿する</div>
            <label style={S.fieldLabel}>種別</label>
            <div style={S.radioGroup}>
              <div style={S.radio(form.type==="sell")} onClick={() => setForm({...form,type:"sell"})}>譲渡したい</div>
              <div style={S.radio(form.type==="buy")} onClick={() => setForm({...form,type:"buy"})}>欲しい</div>
            </div>
            <label style={S.fieldLabel}>お名前 *</label>
            <input style={S.fieldInput} value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="例：田中 健一" />
            <label style={S.fieldLabel}>枚数</label>
            <input style={S.fieldInput} type="number" min={1} value={form.seats} onChange={(e) => setForm({...form,seats:e.target.value})} />
            <label style={S.fieldLabel}>希望価格（円） *</label>
            <input style={S.fieldInput} type="number" value={form.price} onChange={(e) => setForm({...form,price:e.target.value})} placeholder="例：5000" />
            <label style={S.fieldLabel}>メッセージ</label>
            <textarea style={{...S.fieldInput,height:72,resize:"vertical"}} value={form.note} onChange={(e) => setForm({...form,note:e.target.value})} placeholder="一言メッセージがあればどうぞ" />
            <label style={S.fieldLabel}>連絡先（メール・LINEなど） *</label>
            <input style={S.fieldInput} value={form.contact} onChange={(e) => setForm({...form,contact:e.target.value})} placeholder="例：xxx@email.com" />
            {formError && <div style={S.error}>{formError}</div>}

            <div style={S.agreementBox}>
              <div style={S.agreementTitle}>投稿前に以下をご確認ください（すべてチェック必須）</div>
              {AGREEMENT_TEXTS.map((text, i) => (
                <div key={i} style={S.agreementItem} onClick={() => toggleAgreement(i)}>
                  <div style={S.checkbox(agreements[i])}>
                    {agreements[i] && <span style={{ color:"#c4a050", fontSize:11, fontWeight:700 }}>✓</span>}
                  </div>
                  <div style={S.agreementText}>{text}</div>
                </div>
              ))}
            </div>

            <div style={S.formActions}>
              <button style={S.cancelBtn} onClick={() => { setShowForm(false); setFormError(""); setAgreements([false,false,false]); }}>キャンセル</button>
              <button style={S.submitBtn(allAgreed)} onClick={allAgreed ? handlePost : undefined}>投稿する</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 成立報告フォーム ===== */}
      {reportPost && (
        <div style={S.overlay}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>譲渡成立の報告</div>
            <div style={S.reportInfoBox}>
              JRCNA会計（jrcna.kaikei@gmail.com）へ<br />
              譲渡内容を自動でメール送信します。
            </div>

            <label style={S.fieldLabel}>あなたの名前</label>
            <input style={{...S.fieldInput, background:"rgba(255,255,255,0.03)", color:"#7888a8"}}
              value={reportPost.name} readOnly />

            <label style={S.fieldLabel}>あなたの連絡先</label>
            <input style={{...S.fieldInput, background:"rgba(255,255,255,0.03)", color:"#7888a8"}}
              value={reportPost.contact} readOnly />

            <label style={S.fieldLabel}>誰に譲渡しましたか？ *</label>
            <input style={S.fieldInput} value={reportTo}
              onChange={(e) => setReportTo(e.target.value)}
              placeholder="例：山田 太郎" />

            <label style={S.fieldLabel}>何を譲渡しましたか？ *</label>
            <textarea style={{...S.fieldInput, height:80, resize:"vertical"}} value={reportWhat}
              onChange={(e) => setReportWhat(e.target.value)}
              placeholder={`例：3日間参加チケット1枚\n¥${reportPost.price?.toLocaleString() ?? ""}`} />

            {reportError && <div style={S.error}>{reportError}</div>}

            <div style={S.formActions}>
              <button style={S.cancelBtn} onClick={() => setReportPost(null)}>キャンセル</button>
              <button style={S.submitBtn(!reportSending)} onClick={!reportSending ? handleSendReport : undefined}>
                {reportSending ? "送信中..." : "送信して成立済みにする"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && <div style={S.success}>{successMsg}</div>}
    </div>
  );
}
