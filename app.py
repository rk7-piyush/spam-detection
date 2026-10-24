import html
from datetime import datetime

import joblib
import numpy as np
import streamlit as st

from sample_data import SAMPLES

st.set_page_config(page_title="SpamShield Mail", page_icon="✉️", layout="wide")

# ------------------------------------------------------------------ MODELS
@st.cache_resource
def load_models():
    return {
        "SMS": joblib.load("model/sms_model.pkl"),
        "Email": joblib.load("model/email_model.pkl"),
    }

try:
    MODELS = load_models()
except FileNotFoundError:
    st.error("Model files not found. Run `python train_model.py` first.")
    st.stop()

THRESHOLD = 0.5


def top_spam_words(model, text, n=6):
    """Return the words that pushed the score most towards spam."""
    tfidf = model.named_steps["tfidf"]
    clf = model.named_steps["clf"]
    x = tfidf.transform([text]).toarray()[0]
    contrib = x * clf.coef_[0]
    names = tfidf.get_feature_names_out()
    idx = np.argsort(contrib)[::-1][:n]
    return [names[i] for i in idx if contrib[i] > 0]


def classify(msg_type, subject, body):
    text = f"Subject: {subject}\n{body}" if msg_type == "Email" else body
    model = MODELS[msg_type]
    prob = float(model.predict_proba([text])[0][1])
    return prob, top_spam_words(model, text)


# ------------------------------------------------------------------ STATE
def add_message(msg_type, sender, address, subject, body, time_str, front=True):
    prob, words = classify(msg_type, subject, body)
    msg = {
        "id": st.session_state.next_id,
        "type": msg_type,
        "sender": sender,
        "address": address,
        "subject": subject,
        "body": body,
        "time": time_str,
        "prob": prob,
        "words": words,
        "folder": "spam" if prob >= THRESHOLD else "inbox",
        "read": False,
    }
    st.session_state.next_id += 1
    if front:
        st.session_state.emails.insert(0, msg)
    else:
        st.session_state.emails.append(msg)
    return msg


if "emails" not in st.session_state:
    st.session_state.emails = []
    st.session_state.next_id = 1
    st.session_state.page = "inbox"
    st.session_state.current = None
    for s in SAMPLES:
        add_message(s["type"], s["sender"], s["address"], s["subject"],
                    s["body"], s["time"], front=False)


def get_msg(msg_id):
    return next((m for m in st.session_state.emails if m["id"] == msg_id), None)


def go(page):
    st.session_state.page = page
    st.session_state.current = None


def open_msg(msg_id):
    st.session_state.current = msg_id
    st.session_state.page = "view"
    m = get_msg(msg_id)
    if m:
        m["read"] = True


def move(msg_id, folder):
    m = get_msg(msg_id)
    if m:
        m["folder"] = folder
    go(folder)


def delete(msg_id):
    m = get_msg(msg_id)
    folder = m["folder"] if m else "inbox"
    st.session_state.emails = [e for e in st.session_state.emails if e["id"] != msg_id]
    go(folder)


def esc(s):
    return html.escape(str(s))


# ------------------------------------------------------------------ CSS
BASE_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.stApp {background:#f6f8fc;}
[data-testid="stToolbar"], footer, #MainMenu {display:none !important;}
[data-testid="stHeader"] {background:transparent;}
.block-container, section[data-testid="stSidebar"] {font-family:'Roboto', Arial, sans-serif;}
.block-container {background:#ffffff; border-radius:16px; padding:1.5rem 2rem !important;
                  margin-top:.5rem; max-width:1200px;}

/* ---------- Sidebar ---------- */
section[data-testid="stSidebar"] {background:#f6f8fc; border-right:none;}
.brand {font-size:22px; color:#5f6368; padding:.4rem .5rem 1rem .5rem;}
.brand b {color:#d93025;}
section[data-testid="stSidebar"] .stButton > button {
    width:100%; justify-content:flex-start; text-align:left;
    background:transparent; border:none; border-radius:24px;
    color:#202124; padding:.55rem 1rem; font-weight:400;}
section[data-testid="stSidebar"] .stButton > button:hover {background:#e8eaed;}
.st-key-compose button {
    background:#c2e7ff !important; color:#001d35 !important; font-weight:500 !important;
    border-radius:16px !important; padding:1rem 1.4rem !important;
    box-shadow:0 1px 3px rgba(60,64,67,.3) !important; margin-bottom:.8rem;}
.st-key-compose button:hover {box-shadow:0 2px 6px rgba(60,64,67,.4) !important;}

/* ---------- Search bar ---------- */
.st-key-search input {background:#eaf1fb; border:none; border-radius:24px; padding:.8rem 1.2rem;}

/* ---------- Mail list ---------- */
.folder-title {font-size:20px; font-weight:500; color:#202124; margin:.6rem 0 .2rem 0;}
.folder-note {background:#fef7e0; color:#5f6368; border-radius:8px; padding:.5rem .9rem;
              font-size:13px; margin-bottom:.6rem;}
.mail-row {display:flex; align-items:center; gap:14px; padding:.55rem .8rem;
           border-bottom:1px solid #e8eaed; font-size:14px; color:#5f6368; background:#f2f6fc;
           border-radius:6px;}
.mail-row.unread {background:#ffffff; color:#202124; font-weight:700;}
.mail-row .sender {width:190px; min-width:190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.mail-row .msg {flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.mail-row .snip {font-weight:400; color:#5f6368;}
.mail-row .time {min-width:70px; text-align:right; font-size:12px;}
.chip {display:inline-block; background:#e8eaed; color:#444746; border-radius:6px;
       padding:0 7px; font-size:11px; font-weight:500; margin-right:6px;}
.chip.spam {background:#fce8e6; color:#a50e0e;}
.empty {text-align:center; color:#80868b; padding:3rem 0; font-size:15px;}

/* ---------- Message view ---------- */
.subj {font-size:22px; color:#202124; margin:.4rem 0 .8rem 0;}
.banner-spam {background:#fce8e6; color:#5f1410; border-radius:8px; padding:.7rem 1rem;
              font-size:14px; margin-bottom:1rem;}
.sender-row {display:flex; align-items:center; gap:12px; margin:.5rem 0 1rem 0;}
.avatar {width:40px; height:40px; border-radius:50%; color:#fff; display:flex;
         align-items:center; justify-content:center; font-weight:500; font-size:18px;}
.sname {font-weight:500; color:#202124; font-size:14px;}
.addr {color:#5f6368; font-weight:400; font-size:12px;}
.to {color:#5f6368; font-size:12px;}
.body {white-space:pre-wrap; font-size:14px; color:#202124; line-height:1.6;
       padding:.5rem 0 1.2rem 52px;}
.word {display:inline-block; background:#fce8e6; color:#a50e0e; border-radius:12px;
       padding:2px 10px; margin:2px 4px 2px 0; font-size:13px;}
.compose-title {font-size:18px; font-weight:500; background:#f2f6fc; padding:.7rem 1rem;
                border-radius:8px; margin-bottom:.8rem;}
</style>
"""
st.markdown(BASE_CSS, unsafe_allow_html=True)

# highlight the active sidebar item
active = st.session_state.page
if active == "view":
    cur = get_msg(st.session_state.current)
    active = cur["folder"] if cur else "inbox"
if active in ("inbox", "spam"):
    st.markdown(
        f"<style>.st-key-nav_{active} button {{background:#d3e3fd !important; font-weight:700 !important;}}</style>",
        unsafe_allow_html=True,
    )

# ------------------------------------------------------------------ SIDEBAR
unread = sum(1 for m in st.session_state.emails if m["folder"] == "inbox" and not m["read"])
spam_n = sum(1 for m in st.session_state.emails if m["folder"] == "spam")

with st.sidebar:
    st.markdown('<div class="brand">✉️ <b>SpamShield</b> Mail</div>', unsafe_allow_html=True)
    st.button("✏️  Compose", key="compose", on_click=go, args=("compose",))
    st.button(f"📥  Inbox  ({unread})", key="nav_inbox", on_click=go, args=("inbox",))
    st.button(f"🚫  Spam  ({spam_n})", key="nav_spam", on_click=go, args=("spam",))
    st.caption("Messages are scanned automatically by the ML model.")

# ------------------------------------------------------------------ PAGES
PALETTE = ["#1a73e8", "#d93025", "#188038", "#e37400", "#9334e6", "#007b83", "#c5221f"]


def render_list(folder):
    search = st.text_input("Search", placeholder="🔍  Search mail", key="search",
                           label_visibility="collapsed")
    st.markdown(f'<div class="folder-title">{"Inbox" if folder == "inbox" else "Spam"}</div>',
                unsafe_allow_html=True)
    if folder == "spam":
        st.markdown('<div class="folder-note">Messages detected as spam by the model are shown here. '
                    'Open one to see why it was flagged.</div>', unsafe_allow_html=True)

    items = [m for m in st.session_state.emails if m["folder"] == folder]
    q = search.strip().lower()
    if q:
        items = [m for m in items if q in (m["sender"] + m["subject"] + m["body"]).lower()]

    if not items:
        st.markdown('<div class="empty">No messages here.</div>', unsafe_allow_html=True)
        return

    for m in items:
        snippet = " ".join(m["body"].split())[:90]
        cls = "mail-row" if m["read"] else "mail-row unread"
        chip_cls = "chip spam" if folder == "spam" else "chip"
        c1, c2 = st.columns([11, 1.3], vertical_alignment="center")
        with c1:
            st.markdown(
                f'<div class="{cls}">'
                f'<div class="sender">{esc(m["sender"])}</div>'
                f'<div class="msg"><span class="{chip_cls}">{m["type"]}</span>'
                f'{esc(m["subject"])} <span class="snip">— {esc(snippet)}</span></div>'
                f'<div class="time">{esc(m["time"])}</div></div>',
                unsafe_allow_html=True,
            )
        with c2:
            st.button("Open", key=f"open_{m['id']}", on_click=open_msg, args=(m["id"],))


def render_view():
    msg = get_msg(st.session_state.current)
    if msg is None:
        go("inbox")
        st.rerun()

    st.button("←  Back", key="back", on_click=go, args=(msg["folder"],))

    is_spam = msg["folder"] == "spam"
    label = "Spam" if is_spam else "Inbox"
    chip_cls = "chip spam" if is_spam else "chip"
    st.markdown(f'<div class="subj">{esc(msg["subject"] if msg["type"] == "Email" else "SMS from " + msg["sender"])}'
                f' <span class="{chip_cls}">{label}</span></div>', unsafe_allow_html=True)

    if is_spam:
        st.markdown(
            f'<div class="banner-spam">⚠️ <b>Why is this message in Spam?</b> '
            f'The model is {msg["prob"]:.0%} confident that it is spam. '
            f'Be careful with links, phone numbers and attachments in this message.</div>',
            unsafe_allow_html=True,
        )

    name = msg["sender"]
    color = PALETTE[sum(map(ord, name)) % len(PALETTE)]
    addr = f' <span class="addr">&lt;{esc(msg["address"])}&gt;</span>' if msg["address"] and msg["address"] != name else ""
    st.markdown(
        f'<div class="sender-row"><div class="avatar" style="background:{color}">{esc(name[:1].upper())}</div>'
        f'<div><div class="sname">{esc(name)}{addr}</div>'
        f'<div class="to">to me · {esc(msg["time"])} · {msg["type"]}</div></div></div>'
        f'<div class="body">{esc(msg["body"])}</div>',
        unsafe_allow_html=True,
    )

    # Actions
    a1, a2, _ = st.columns([1.6, 1.2, 6])
    with a1:
        if is_spam:
            st.button("✅  Report not spam", key="act_move", on_click=move, args=(msg["id"], "inbox"))
        else:
            st.button("🚫  Report spam", key="act_move", on_click=move, args=(msg["id"], "spam"))
    with a2:
        st.button("🗑️  Delete", key="act_del", on_click=delete, args=(msg["id"],))

    # Analysis
    st.markdown("##### 🔍 Spam analysis")
    st.progress(min(max(msg["prob"], 0.0), 1.0), text=f"Spam probability: {msg['prob']:.1%}")
    if msg["words"]:
        chips = "".join(f'<span class="word">{esc(w)}</span>' for w in msg["words"])
        st.markdown(f"Words that pushed the score towards spam:<br>{chips}", unsafe_allow_html=True)
    else:
        st.caption("No strong spam indicators found in this message.")


def render_compose():
    st.markdown('<div class="compose-title">New Message (simulate an incoming message)</div>',
                unsafe_allow_html=True)
    msg_type = st.radio("Message type", ["Email", "SMS"], horizontal=True, key="c_type")
    sender = st.text_input("From", placeholder="Sender name, email or phone number", key="c_from")
    subject = ""
    if msg_type == "Email":
        subject = st.text_input("Subject", key="c_subject")
    body = st.text_area("Message", height=220, key="c_body",
                        placeholder="Type or paste the message you want to check...")

    if st.button("📨  Send & scan", type="primary"):
        if not body.strip():
            st.warning("Please enter a message first.")
        else:
            name = sender.strip() or "Unknown sender"
            address = name if "@" in name else ""
            subj = subject.strip() or ("(no subject)" if msg_type == "Email" else "SMS")
            new = add_message(msg_type, name, address, subj, body.strip(),
                              datetime.now().strftime("%I:%M %p").lstrip("0"))
            open_msg(new["id"])
            st.rerun()


page = st.session_state.page
if page in ("inbox", "spam"):
    render_list(page)
elif page == "view":
    render_view()
elif page == "compose":
    render_compose()