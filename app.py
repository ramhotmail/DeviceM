import os
import functools
import libsql_client
import qrcode
import base64
import io
from flask import Flask, render_template, request, redirect, url_for, g, flash, send_file, session
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

# --- إعدادات قاعدة بيانات Turso (SQLite سحابية دائمة) ---
# لازم تحط قيمتين Environment Variables دول (شرح الحصول عليهم في README):
#   TURSO_DATABASE_URL  -> رابط بيبدأ بـ libsql://...
#   TURSO_AUTH_TOKEN    -> التوكن الخاص بقاعدة البيانات
# لو مش موجودين (تشغيل محلي للتجربة)، هيشتغل التطبيق بملف SQLite محلي عادي كبديل.
TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")
LOCAL_DB_FALLBACK = f"file:{os.path.join(BASE_DIR, 'database.db')}"

# --- حساب الأدمن الافتراضي (بيتعمل مرة واحدة أول تشغيل لو مفيش مستخدمين خالص) ---
DEFAULT_ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24).hex())

_db_client = None


def get_db():
    """يرجع اتصال واحد يتشارك فيه التطبيق (libsql_client.ClientSync)."""
    global _db_client
    if _db_client is None:
        if TURSO_DATABASE_URL:
            _db_client = libsql_client.create_client_sync(
                TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN
            )
        else:
            # وضع تجريبي محلي لو مفيش بيانات Turso متظبطة
            _db_client = libsql_client.create_client_sync(LOCAL_DB_FALLBACK)
    return _db_client


@app.teardown_appcontext
def close_db(exception=None):
    # الاتصال بـ Turso بيفضل مفتوح ومشترك طول عمر التطبيق (مش بيتقفل بعد كل request)
    pass


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            org_name TEXT,
            system_name TEXT,
            device_name TEXT,
            device_code TEXT,
            location TEXT,
            brand TEXT,
            model TEXT,
            serial_number TEXT,
            agent_company TEXT,
            maintenance_company TEXT,
            maintenance_status TEXT,
            contract_start TEXT,
            contract_end TEXT,
            maintenance_officer TEXT,
            maintenance_phone TEXT,
            image_filename TEXT,
            created_at TEXT
        )
        """
    )
    try:
        db.execute("ALTER TABLE devices ADD COLUMN image_base64 TEXT")
    except Exception:
        pass  # Column already exists
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            created_at TEXT
        )
        """
    )
    # لو مفيش أي مستخدمين خالص، اعمل حساب أدمن افتراضي واحد عشان تقدر تدخل أول مرة
    existing = db.execute("SELECT COUNT(*) as c FROM users").rows
    if existing and existing[0]["c"] == 0:
        db.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            (
                DEFAULT_ADMIN_USERNAME,
                generate_password_hash(DEFAULT_ADMIN_PASSWORD),
                "admin",
                datetime.now().isoformat(),
            ),
        )


# ---------------- تسجيل الدخول والصلاحيات ----------------

def current_user():
    if "user_id" not in session:
        return None
    db = get_db()
    rows = db.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).rows
    return rows[0] if rows else None


def login_required(view):
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            return redirect(url_for("login", next=request.path))
        if user["role"] != "admin":
            flash("محتاج صلاحية أدمن عشان تعمل الحاجة دي", "danger")
            return redirect(url_for("index"))
        return view(*args, **kwargs)
    return wrapped


@app.context_processor
def inject_user():
    return {"logged_in_user": current_user()}


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        db = get_db()
        rows = db.execute("SELECT * FROM users WHERE username = ?", (username,)).rows
        user = rows[0] if rows else None
        if user is None or not check_password_hash(user["password_hash"], password):
            flash("اسم المستخدم أو كلمة المرور غلط", "danger")
            return render_template("login.html")
        session.clear()
        session["user_id"] = user["id"]
        flash(f"أهلاً بيك يا {user['username']}", "success")
        next_url = request.args.get("next") or url_for("index")
        return redirect(next_url)
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("تم تسجيل الخروج", "success")
    return redirect(url_for("login"))


@app.route("/users")
@admin_required
def users_list():
    db = get_db()
    rows = db.execute("SELECT id, username, role, created_at FROM users ORDER BY id").rows
    return render_template("users.html", users=rows)


@app.route("/users/add", methods=["POST"])
@admin_required
def users_add():
    db = get_db()
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    role = request.form.get("role", "viewer")
    if role not in ("admin", "viewer"):
        role = "viewer"
    if not username or not password:
        flash("لازم تدخل اسم مستخدم وكلمة مرور", "danger")
        return redirect(url_for("users_list"))
    existing = db.execute("SELECT id FROM users WHERE username = ?", (username,)).rows
    if existing:
        flash("اسم المستخدم ده موجود بالفعل", "danger")
        return redirect(url_for("users_list"))
    db.execute(
        "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
        (username, generate_password_hash(password), role, datetime.now().isoformat()),
    )
    flash("تم إضافة المستخدم بنجاح", "success")
    return redirect(url_for("users_list"))


@app.route("/users/delete/<int:user_id>", methods=["POST"])
@admin_required
def users_delete(user_id):
    current = current_user()
    if current and current["id"] == user_id:
        flash("مينفعش تحذف حسابك أنت وانت داخل بيه", "danger")
        return redirect(url_for("users_list"))
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    flash("تم حذف المستخدم", "success")
    return redirect(url_for("users_list"))


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


@app.route("/qr/<int:device_id>")
def serve_qr(device_id):
    """يولد QR Code ديناميكياً في الذاكرة"""
    base_url = request.url_root.rstrip("/")
    card_url = f"{base_url}/card/{device_id}"
    qr_img = qrcode.make(card_url)
    img_io = io.BytesIO()
    qr_img.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')


@app.route("/")
@login_required
def index():
    db = get_db()
    q = request.args.get("q", "").strip()
    if q:
        rows = db.execute(
            """SELECT * FROM devices WHERE
               device_name LIKE ? OR device_code LIKE ? OR serial_number LIKE ?
               ORDER BY id DESC""",
            (f"%{q}%", f"%{q}%", f"%{q}%"),
        ).rows
    else:
        rows = db.execute("SELECT * FROM devices ORDER BY id DESC").rows
    return render_template("index.html", devices=rows, q=q)


@app.route("/add", methods=["GET", "POST"])
@admin_required
def add_device():
    if request.method == "POST":
        db = get_db()
        image_base64 = None
        file = request.files.get("device_image")
        if file and file.filename and allowed_file(file.filename):
            image_bytes = file.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        rs = db.execute(
            """INSERT INTO devices
            (org_name, system_name, device_name, device_code, location, brand, model,
             serial_number, agent_company, maintenance_company, maintenance_status,
             contract_start, contract_end, maintenance_officer, maintenance_phone,
             image_base64, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                request.form.get("org_name", "مستشفيات جامعة قناة السويس"),
                request.form.get("system_name", "نظام تكويد الأجهزة الطبية"),
                request.form.get("device_name"),
                request.form.get("device_code"),
                request.form.get("location"),
                request.form.get("brand"),
                request.form.get("model"),
                request.form.get("serial_number"),
                request.form.get("agent_company"),
                request.form.get("maintenance_company"),
                request.form.get("maintenance_status"),
                request.form.get("contract_start"),
                request.form.get("contract_end"),
                request.form.get("maintenance_officer"),
                request.form.get("maintenance_phone"),
                image_base64,
                datetime.now().isoformat(),
            ),
        )
        device_id = rs.last_insert_rowid
        flash("تم إضافة الجهاز بنجاح", "success")
        return redirect(url_for("view_card", device_id=device_id))

    return render_template("add_edit.html", device=None)


@app.route("/edit/<int:device_id>", methods=["GET", "POST"])
@admin_required
def edit_device(device_id):
    db = get_db()
    result = db.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).rows
    device = result[0] if result else None
    if device is None:
        flash("الجهاز غير موجود", "danger")
        return redirect(url_for("index"))

    if request.method == "POST":
        image_base64 = device.get("image_base64")
        file = request.files.get("device_image")
        if file and file.filename and allowed_file(file.filename):
            image_bytes = file.read()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')

        db.execute(
            """UPDATE devices SET
                org_name=?, system_name=?, device_name=?, device_code=?, location=?,
                brand=?, model=?, serial_number=?, agent_company=?, maintenance_company=?,
                maintenance_status=?, contract_start=?, contract_end=?, maintenance_officer=?,
                maintenance_phone=?, image_base64=?
               WHERE id=?""",
            (
                request.form.get("org_name"),
                request.form.get("system_name"),
                request.form.get("device_name"),
                request.form.get("device_code"),
                request.form.get("location"),
                request.form.get("brand"),
                request.form.get("model"),
                request.form.get("serial_number"),
                request.form.get("agent_company"),
                request.form.get("maintenance_company"),
                request.form.get("maintenance_status"),
                request.form.get("contract_start"),
                request.form.get("contract_end"),
                request.form.get("maintenance_officer"),
                request.form.get("maintenance_phone"),
                image_base64,
                device_id,
            ),
        )
        flash("تم تعديل بيانات الجهاز بنجاح", "success")
        return redirect(url_for("view_card", device_id=device_id))

    return render_template("add_edit.html", device=device)


@app.route("/delete/<int:device_id>", methods=["POST"])
@admin_required
def delete_device(device_id):
    db = get_db()
    db.execute("DELETE FROM devices WHERE id = ?", (device_id,))
    flash("تم حذف الجهاز", "success")
    return redirect(url_for("index"))


@app.route("/card/<int:device_id>")
@login_required
def view_card(device_id):
    db = get_db()
    result = db.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).rows
    device = result[0] if result else None
    if device is None:
        flash("الجهاز غير موجود", "danger")
        return redirect(url_for("index"))
    return render_template("card.html", device=device)


@app.route("/report")
@login_required
def report():
    db = get_db()

    today = datetime.now().date()
    default_from = (today - timedelta(days=30)).isoformat()
    default_to = today.isoformat()

    from_date = request.args.get("from_date", default_from)
    to_date = request.args.get("to_date", default_to)

    # بحث بالفاصلة الزمنية على تاريخ الإضافة (created_at)
    rows = db.execute(
        """SELECT * FROM devices
           WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
           ORDER BY created_at DESC""",
        (from_date, to_date),
    ).rows

    # تجميع عدد الأجهزة المضافة لكل يوم داخل الفترة
    daily_counts = db.execute(
        """SELECT date(created_at) as day, COUNT(*) as total
           FROM devices
           WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
           GROUP BY date(created_at)
           ORDER BY day DESC""",
        (from_date, to_date),
    ).rows

    return render_template(
        "report.html",
        devices=rows,
        daily_counts=daily_counts,
        from_date=from_date,
        to_date=to_date,
        total_count=len(rows),
    )


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
else:
    init_db()
