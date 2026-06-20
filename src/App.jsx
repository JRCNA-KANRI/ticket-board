import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// ========================================
// ★ ここにFirebaseの設定を貼り付けてください
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyDb29C8nU3ybHaYOvw6czA1aW1s8XJoS6Y",
  authDomain: "ticket-board-f3c3a.firebaseapp.com",
  projectId: "ticket-board-f3c3a",
  storageBucket: "ticket-board-f3c3a.firebasestorage.app",
  messagingSenderId: "1092812216455",
  appId: "1:1092812216455:web:a9fedb56157633cf1f0022"
};
// ========================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PASSWORD = "jrcna18";

export default function App() {
  const [auth, setAuth] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "sell", name: "", seats: 1, price: "", note: "", contact: "" });
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Firestoreからリアルタイムでデータ取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    if (pwInput === PASSWORD) {
      setAuth(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handlePost = async () => {
    if (!form.name || !form.price || !form.contact) {
      setFormError("名前・価格・連絡先は必須です");
      return;
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
    setShowForm(false);
    setFormError("");
    setSuccessMsg("投稿しました！");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleClose = async (id) => {
    await updateDoc(doc(db, "posts", id), { status: "closed" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("この投稿を削除しますか？")) {
      await deleteDoc(doc(db, "posts", id));
    }
  };

  const filtered = posts.filter((p) => filter === "all" || p.type === filter);

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #162040 60%, #1a2a50 100%)",
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      color: "#e8e4d8",
    },
    header: {
      borderBottom: "1px solid rgba(196,160,80,0.3)",
      padding: "24px 0 20px",
      textAlign: "center",
      background: "rgba(0,0,0,0.2)",
    },
    logo: {
      fontSize: 11,
      letterSpacing: "0.25em",
      color: "#c4a050",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.05em",
      margin: 0,
    },
    subtitle: {
      fontSize: 12,
      color: "#a0a8b8",
      marginTop: 6,
    },
    container: { maxWidth: 680, margin: "0 auto", padding: "0 16px" },
    controls: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "24px 0 16px",
      gap: 12,
      flexWrap: "wrap",
    },
    filterGroup: { display: "flex", gap: 6 },
    filterBtn: (active) => ({
      padding: "7px 14px",
      borderRadius: 20,
      border: `1px solid ${active ? "#c4a050" : "rgba(255,255,255,0.15)"}`,
      background: active ? "rgba(196,160,80,0.15)" : "transparent",
      color: active ? "#c4a050" : "#a0a8b8",
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    postBtn: {
      padding: "8px 18px",
      borderRadius: 20,
      border: "none",
      background: "linear-gradient(135deg, #c4a050, #e8c878)",
      color: "#0a1628",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      letterSpacing: "0.03em",
    },
    ticket: (status) => ({
      background: status === "closed" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${status === "closed" ? "rgba(255,255,255,0.08)" : "rgba(196,160,80,0.25)"}`,
      borderRadius: 12,
      padding: "18px 20px",
      marginBottom: 14,
      position: "relative",
      opacity: status === "closed" ? 0.55 : 1,
    }),
    ticketHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    typeBadge: (type) => ({
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.1em",
      padding: "3px 10px",
      borderRadius: 10,
      background: type === "sell" ? "rgba(239,102,80,0.2)" : "rgba(80,180,120,0.2)",
      color: type === "sell" ? "#f87c6a" : "#60c890",
      border: `1px solid ${type === "sell" ? "rgba(239,102,80,0.4)" : "rgba(80,180,120,0.4)"}`,
    }),
    name: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
    date: { fontSize: 11, color: "#6a7490" },
    priceRow: { display: "flex", gap: 20, margin: "10px 0", alignItems: "center" },
    priceLabel: { fontSize: 11, color: "#a0a8b8" },
    price: { fontSize: 20, fontWeight: 700, color: "#c4a050" },
    seats: { fontSize: 13, color: "#c8d0e0" },
    note: { fontSize: 13, color: "#b0b8c8", margin: "8px 0", lineHeight: 1.6 },
    contact: { fontSize: 12, color: "#7888a8", marginTop: 8 },
    closeBtn: {
      fontSize: 11,
      padding: "4px 12px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.2)",
      background: "transparent",
      color: "#8090a8",
      cursor: "pointer",
      marginTop: 10,
    },
    deleteBtn: {
      fontSize: 11,
      padding: "4px 12px",
      borderRadius: 10,
      border: "1px solid rgba(239,102,80,0.35)",
      background: "transparent",
      color: "#f87c6a",
      cursor: "pointer",
      marginTop: 10,
      marginLeft: 8,
    },
    statusBadge: {
      position: "absolute",
      top: 14,
      right: 14,
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.1)",
      color: "#7888a8",
      letterSpacing: "0.05em",
    },
    loginWrap: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a1628 0%, #162040 100%)",
    },
    loginBox: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(196,160,80,0.3)",
      borderRadius: 16,
      padding: "40px 32px",
      textAlign: "center",
      maxWidth: 340,
      width: "90%",
    },
    loginTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#BFBFBF" },
    loginSub: { fontSize: 12, color: "#7888a8", marginBottom: 24 },
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.06)",
      color: "#e8e4d8",
      fontSize: 15,
      textAlign: "center",
      letterSpacing: "0.1em",
      boxSizing: "border-box",
      marginBottom: 12,
      outline: "none",
    },
    loginBtn: {
      width: "100%",
      padding: "12px",
      borderRadius: 8,
      border: "none",
      background: "linear-gradient(135deg, #c4a050, #e8c878)",
      color: "#0a1628",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
    },
    error: { fontSize: 12, color: "#f87c6a", marginTop: 8 },
    formOverlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100,
      padding: 16,
    },
    formBox: {
      background: "#1a2a50",
      border: "1px solid rgba(196,160,80,0.3)",
      borderRadius: 16,
      padding: "28px 24px",
      width: "100%",
      maxWidth: 440,
      maxHeight: "90vh",
      overflowY: "auto",
    },
    formTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20 },
    fieldLabel: { fontSize: 12, color: "#a0a8b8", marginBottom: 6, display: "block" },
    fieldInput: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.06)",
      color: "#e8e4d8",
      fontSize: 14,
      marginBottom: 14,
      boxSizing: "border-box",
      outline: "none",
    },
    radioGroup: { display: "flex", gap: 12, marginBottom: 14 },
    radio: (active) => ({
      flex: 1,
      padding: "10px",
      borderRadius: 8,
      border: `1px solid ${active ? "#c4a050" : "rgba(255,255,255,0.12)"}`,
      background: active ? "rgba(196,160,80,0.1)" : "transparent",
      color: active ? "#c4a050" : "#8090a8",
      fontWeight: active ? 700 : 400,
      fontSize: 14,
      cursor: "pointer",
      textAlign: "center",
    }),
    formActions: { display: "flex", gap: 10, marginTop: 8 },
    cancelBtn: {
      flex: 1, padding: "11px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "transparent",
      color: "#8090a8",
      fontSize: 14,
      cursor: "pointer",
    },
    submitBtn: {
      flex: 2, padding: "11px",
      borderRadius: 8,
      border: "none",
      background: "linear-gradient(135deg, #c4a050, #e8c878)",
      color: "#0a1628",
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
    },
    success: {
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "#3a6040",
      color: "#a0e0b0",
      padding: "10px 24px",
      borderRadius: 20,
      fontSize: 14,
      zIndex: 200,
    },
    empty: { textAlign: "center", color: "#6a7490", padding: "40px 0", fontSize: 14 },
    loadingWrap: {
      textAlign: "center", color: "#6a7490", padding: "60px 0", fontSize: 14,
    },
  };

  if (!auth) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#c4a050", marginBottom: 16 }}>18TH JRCNA KYOTO</div>
          <div style={styles.loginTitle}>チケット譲渡掲示板</div>
          <div style={styles.loginSub}>参加者限定のページです<br />パスワードを入力してください</div>
          <input
            style={styles.input}
            type="password"
            placeholder="パスワード"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {pwError && <div style={styles.error}>パスワードが違います</div>}
          <button style={styles.loginBtn} onClick={handleLogin}>入室する</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo}>18TH JRCNA KYOTO</div>
        <h1 style={styles.title}>チケット譲渡掲示板</h1>
        <div style={styles.subtitle}>参加者間でチケットの譲渡ができます</div>
      </div>

      <div style={styles.container}>
        <div style={styles.controls}>
          <div style={styles.filterGroup}>
            {[["all","すべて"],["sell","譲渡したい"],["buy","欲しい"]].map(([val, label]) => (
              <button key={val} style={styles.filterBtn(filter === val)} onClick={() => setFilter(val)}>{label}</button>
            ))}
          </div>
          <button style={styles.postBtn} onClick={() => setShowForm(true)}>＋ 投稿する</button>
        </div>

        {loading && <div style={styles.loadingWrap}>読み込み中...</div>}
        {!loading && filtered.length === 0 && <div style={styles.empty}>該当する投稿がありません</div>}

        {filtered.map((p) => (
          <div key={p.id} style={styles.ticket(p.status)}>
            {p.status === "closed" && <div style={styles.statusBadge}>成立済み</div>}
            <div style={styles.ticketHeader}>
              <div>
                <div style={styles.name}>{p.name}</div>
                <div style={styles.date}>{p.date}</div>
              </div>
              <div style={styles.typeBadge(p.type)}>
                {p.type === "sell" ? "譲渡したい" : "譲ってほしい"}
              </div>
            </div>
            <div style={styles.priceRow}>
              <div>
                <div style={styles.priceLabel}>希望価格</div>
                <div style={styles.price}>¥{p.price.toLocaleString()}</div>
              </div>
              <div>
                <div style={styles.priceLabel}>枚数</div>
                <div style={styles.seats}>{p.seats}枚</div>
              </div>
            </div>
            {p.note && <div style={styles.note}>{p.note}</div>}
            <div style={styles.contact}>連絡先：{p.contact}</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {p.status === "open" && (
                <button style={styles.closeBtn} onClick={() => handleClose(p.id)}>成立済みにする</button>
              )}
              <button style={styles.deleteBtn} onClick={() => handleDelete(p.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={styles.formOverlay}>
          <div style={styles.formBox}>
            <div style={styles.formTitle}>チケットを投稿する</div>
            <label style={styles.fieldLabel}>種別</label>
            <div style={styles.radioGroup}>
              <div style={styles.radio(form.type === "sell")} onClick={() => setForm({...form, type: "sell"})}>譲渡したい</div>
              <div style={styles.radio(form.type === "buy")} onClick={() => setForm({...form, type: "buy"})}>欲しい</div>
            </div>
            <label style={styles.fieldLabel}>お名前 *</label>
            <input style={styles.fieldInput} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="例：田中 健一" />
            <label style={styles.fieldLabel}>枚数</label>
            <input style={styles.fieldInput} type="number" min={1} value={form.seats} onChange={(e) => setForm({...form, seats: e.target.value})} />
            <label style={styles.fieldLabel}>希望価格（円） *</label>
            <input style={styles.fieldInput} type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="例：5000" />
            <label style={styles.fieldLabel}>メッセージ</label>
            <textarea style={{...styles.fieldInput, height: 72, resize: "vertical"}} value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} placeholder="一言メッセージがあればどうぞ" />
            <label style={styles.fieldLabel}>連絡先（メール・LINEなど） *</label>
            <input style={styles.fieldInput} value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} placeholder="例：xxx@email.com" />
            {formError && <div style={styles.error}>{formError}</div>}
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setFormError(""); }}>キャンセル</button>
              <button style={styles.submitBtn} onClick={handlePost}>投稿する</button>
            </div>
          </div>
        </div>
      )}

      {successMsg && <div style={styles.success}>{successMsg}</div>}
    </div>
  );
}
