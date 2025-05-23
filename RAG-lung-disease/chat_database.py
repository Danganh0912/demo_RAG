import sqlite3
from datetime import datetime

class SQLiteDB:
    def __init__(self, db_file="chat_database/chat.db"):
        self.db_file = db_file
        self.conn = None
        try:
            self.connect()
        except Exception as e:
            print("Lỗi khởi tạo DB:", e)

    def connect(self):
        try:
            self.conn = sqlite3.connect(self.db_file)
            self.conn.row_factory = sqlite3.Row
        except sqlite3.Error as e:
            raise Exception(f"Lỗi khi kết nối đến DB: {e}")

    def execute_query(self, query, params=(), commit=False):
        cursor = self.conn.cursor()
        try:
            cursor.execute(query, params)
            if commit:
                self.conn.commit()
            return cursor
        except sqlite3.Error as e:
            print(f"Lỗi khi thực hiện truy vấn: {query}\nLỗi: {e}")
            return None

    def initialize_tables(self):
        create_conversations = """
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id TEXT PRIMARY KEY,
                datetime TEXT,
                title TEXT
            );
        """
        create_messages = """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                message TEXT,
                answer TEXT,
                datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
            );
        """
        create_users = """
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                email TEXT UNIQUE,
                password TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """
        create_user_conversations = """
            CREATE TABLE IF NOT EXISTS user_conversations (
                user_id INTEGER,
                conversation_id TEXT,
                PRIMARY KEY (user_id, conversation_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
            );
        """

        if self.execute_query(create_conversations, commit=True) is None:
            raise Exception("Không thể tạo bảng conversations")
        if self.execute_query(create_messages, commit=True) is None:
            raise Exception("Không thể tạo bảng messages")
        if self.execute_query(create_users, commit=True) is None:
            raise Exception("Không thể tạo bảng users")
        if self.execute_query(create_user_conversations, commit=True) is None:
            raise Exception("Không thể tạo bảng user_conversations")

    def add_conversation(self, conversation_id, title):
        now = datetime.now().isoformat(" ", "seconds")
        query = "INSERT INTO conversations (conversation_id, datetime, title) VALUES (?, ?, ?)"
        cursor = self.execute_query(query, (conversation_id, now, title), commit=True)
        if cursor is None:
            return f"Lỗi khi thêm conversation: {conversation_id}"
        return True

    def add_user_conversation(self, user_id, conversation_id):
        query = "INSERT INTO user_conversations (user_id, conversation_id) VALUES (?, ?)"
        cursor = self.execute_query(query, (user_id, conversation_id), commit=True)
        if cursor is None:
            return f"Lỗi khi thêm user_conversation cho user_id: {user_id} và conversation_id: {conversation_id}"
        return True

    def add_user(self, username, email, password):
        now = datetime.now().isoformat(" ", "seconds")
        query = """
            INSERT INTO users (username, email, password, created_at)
            VALUES (?, ?, ?, ?)
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute(query, (username, email, password, now))
            self.conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError as ie:
            if "UNIQUE constraint failed: users.email" in str(ie):
                return "DUPLICATE_EMAIL"
            else:
                return f"DB_ERROR: {ie}"
        except sqlite3.Error as e:
            return f"DB_ERROR: {e}"

    # Lấy thông tin của một người dùng dựa trên user_id
    def get_user(self, user_id):
        query = "SELECT user_id, username, email, created_at FROM users WHERE user_id = ?"
        cursor = self.execute_query(query, (user_id,))
        if cursor is None:
            return f"Lỗi khi truy vấn thông tin người dùng: {user_id}"
        result = cursor.fetchone()
        return dict(result) if result else None

    def check_login(self, email, password):
        query = """
            SELECT user_id, username, email, created_at
            FROM users
            WHERE email = ? AND password = ?
        """
        cursor = self.execute_query(query, (email, password))
        if cursor is None:
            print(f"Lỗi truy vấn đăng nhập cho email: {email}")
            return None
        user = cursor.fetchone()
        return dict(user) if user else None

    def get_user_conversations(self, user_id):
        query = """
            SELECT c.conversation_id, c.title, c.datetime 
            FROM conversations AS c
            JOIN user_conversations AS uc ON c.conversation_id = uc.conversation_id
            WHERE uc.user_id = ?
            ORDER BY c.datetime DESC
        """
        cursor = self.execute_query(query, (user_id,))
        if cursor is None:
            return f"Lỗi khi truy vấn cuộc hội thoại cho người dùng: {user_id}"
        return [dict(row) for row in cursor.fetchall()]

    def delete_conversation(self, conversation_id):
        try:
            if self.execute_query("DELETE FROM user_conversations WHERE conversation_id = ?", (conversation_id,), commit=True) is None:
                return f"Lỗi khi xóa mối liên hệ của conversation: {conversation_id}"
            if self.execute_query("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,), commit=True) is None:
                return f"Lỗi khi xóa các message của conversation: {conversation_id}"
            if self.execute_query("DELETE FROM conversations WHERE conversation_id = ?", (conversation_id,), commit=True) is None:
                return f"Lỗi khi xóa conversation: {conversation_id}"
            return True
        except Exception as e:
            return f"Lỗi khi xóa conversation {conversation_id}: {e}"

    def add_message(self, conversation_id, message, answer):
        now = datetime.now().isoformat(" ", "seconds")
        query = "INSERT INTO messages (conversation_id, message, answer, datetime) VALUES (?, ?, ?, ?)"
        cursor = self.execute_query(query, (conversation_id, message, answer, now), commit=True)
        if cursor is None:
            return f"Lỗi khi thêm tin nhắn vào conversation: {conversation_id}"
        return True

    def get_chat_history(self, conversation_id, limit=50):
        query = """
            SELECT id, conversation_id, message, answer, datetime 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY datetime ASC 
            LIMIT ?
        """
        cursor = self.execute_query(query, (conversation_id, limit))
        if cursor is None:
            return f"Lỗi khi truy vấn lịch sử chat cho conversation: {conversation_id}"
        return [dict(row) for row in cursor.fetchall()]

    def close(self):
        try:
            if self.conn:
                self.conn.close()
        except sqlite3.Error as e:
            print("Lỗi khi đóng kết nối:", e)



if __name__ == "__main__":
    db = SQLiteDB()
    db.initialize_tables()

    # user_id = db.add_user("testuser", "test@example.com", "password123")
    # if isinstance(user_id, str):
    #     print(user_id)
    # else:
    #     print(f"Thêm người dùng thành công với user_id: {user_id}")

    # user_info = db.check_login("testuser", "password123")
    # if user_info:
    #     print("Đăng nhập thành công:", user_info)
    # else:
    #     print("Đăng nhập thất bại.")

    
    # conv_id = "conv_001"
    # initial_title = "Xin chào!"  # Tin nhắn đầu tiên sử dụng làm tiêu đề
    # result = db.add_conversation(conv_id, initial_title)
    # if result is not True:
    #     print(result)
    # else:
    #     print(f"Conversation {conv_id} được tạo với title: {initial_title}")

    
    # result = db.add_user_conversation(user_id, conv_id)
    # if result is not True:
    #     print(result)
    # else:
    #     print(f"Đã liên kết conversation {conv_id} với user_id {user_id}")


    # result = db.add_message(conv_id, "Xin chào!", "Chào bạn, tôi có thể giúp gì cho bạn?")
    # if result is not True:
    #     print(result)
    # else:
    #     print("Tin nhắn đã được thêm vào conversation.")

    # history = db.get_chat_history(conv_id, limit=10)
    # if isinstance(history, str):
    #     print(history)
    # else:
    #     print("Lịch sử chat:")
    #     for record in history:
    #         print(record)

    # result = db.delete_conversation(conv_id)
    # if result is not True:
    #     print(result)
    # else:
    #     print(f"Conversation {conv_id} đã được xóa.")

    db.close()
