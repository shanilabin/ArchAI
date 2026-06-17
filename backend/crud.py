from database import get_connection


def _dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


# ----- Projects -----
def get_projects_by_user(user_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, status, created_at
        FROM projects WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def create_project(user_id, name):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO projects (user_id, name) VALUES (?, ?)", (user_id, name))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "name": name, "status": "draft"}


def get_project(project_id, user_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    row = cur.fetchone()
    conn.close()
    return row


def set_project_drawing(project_id, url):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE projects SET original_drawing_url = ? WHERE id = ?", (url, project_id))
    conn.commit()
    conn.close()


# ----- Items -----
def get_items(project_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT id, item_code, description, unit, quantity, unit_price
        FROM project_items WHERE project_id = ? ORDER BY id
    """, (project_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def add_item(project_id, item):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO project_items (project_id, item_code, description, unit, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (project_id, item.item_code, item.description, item.unit, item.quantity, item.unit_price))
    conn.commit()
    conn.close()


def get_items_for_excel(project_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT item_code AS [Item Code], description AS [Description],
               unit AS [Unit], quantity AS [Quantity], unit_price AS [Unit Price]
        FROM project_items WHERE project_id = ?
    """, (project_id,))
    rows = cur.fetchall()
    conn.close()
    return rows
# ----- Render History -----
def add_render(project_id, materials_json, prompt, image_url):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO render_history (project_id, materials_json, prompt, image_url)
        VALUES (?, ?, ?, ?)
    """, (project_id, materials_json, prompt, image_url))
    conn.commit()
    conn.close()


def get_renders(project_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT id, materials_json, prompt, image_url, created_at
        FROM render_history WHERE project_id = ? ORDER BY id DESC
    """, (project_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def delete_project(project_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM project_items WHERE project_id = ?", (project_id,))
    cur.execute("DELETE FROM render_history WHERE project_id = ?", (project_id,))
    cur.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()

def set_project_status(project_id, status):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE projects SET status = ? WHERE id = ?", (status, project_id))
    conn.commit()
    conn.close()

# ----- Validation Issues -----
def save_issues(project_id, issues):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM validation_issues WHERE project_id = ?", (project_id,))
    for it in issues:
        cur.execute("""
            INSERT INTO validation_issues (project_id, x, y, severity, description)
            VALUES (?, ?, ?, ?, ?)
        """, (project_id, it["x"], it["y"], it.get("severity", "review"), it.get("description", "")))
    conn.commit()
    conn.close()


def get_issues(project_id):
    conn = get_connection()
    conn.row_factory = _dict_factory
    cur = conn.cursor()
    cur.execute("""
        SELECT id, x, y, severity, description
        FROM validation_issues WHERE project_id = ? ORDER BY id
    """, (project_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def add_item_dict(project_id, it):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO project_items (project_id, item_code, description, unit, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (project_id, it["item_code"], it["description"], it["unit"], it["quantity"], it["unit_price"]))
    conn.commit()
    conn.close()