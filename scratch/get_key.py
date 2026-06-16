import sqlite3
conn=sqlite3.connect('backend/traceai.db')
print(conn.execute("SELECT trace_key FROM applications WHERE name='AiGENTThix Assistant'").fetchone()[0])
