from tools import read_file, process_content, chunk_text
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance, PointStruct
from qdrant_client.http.models import FilterSelector, Filter, FieldCondition, Range
from sentence_transformers import SentenceTransformer
import os
import uuid
import time

# model = SentenceTransformer("nomic-ai/nomic-embed-text-v2-moe", trust_remote_code=True)
model = SentenceTransformer('model/halong_embedding')
qdrant_client = QdrantClient(host="localhost", port=6333)

COLLECTION_NAME = "embeddings_rag"
ANSWERED_COLLECTION = "answered_questions"


# max_length = model.tokenizer.model_max_length
VECTOR_SIZE = model.get_sentence_embedding_dimension()
# print(f"limited token: {max_length}")
# print(f"vector size: {VECTOR_SIZE}")

# try:
#     qdrant_client.get_collection(collection_name= COLLECTION_NAME)
#     print(f"Collection '{COLLECTION_NAME}' already exists")
# except Exception:
#     qdrant_client.create_collection(
#         collection_name=COLLECTION_NAME,
#         vectors_config=VectorParams(
#             size=VECTOR_SIZE,
#             distance=Distance.COSINE
#         )
#     )
#     print(f"Created collection '{COLLECTION_NAME}'")

# try:
#     qdrant_client.get_collection(collection_name=ANSWERED_COLLECTION)
#     print(f"Collection '{ANSWERED_COLLECTION}' already exists")
# except Exception:
#     qdrant_client.create_collection(
#         collection_name=ANSWERED_COLLECTION,
#         vectors_config=VectorParams(
#             size=VECTOR_SIZE,  # sử dụng VECTOR_SIZE từ mô hình đã khởi tạo
#             distance=Distance.COSINE
#         )
#     )
#     print(f"Created collection '{ANSWERED_COLLECTION}'")

# folder = "scrape/output" 
# def process_all_folders(root_folder):
#     for folder_name in os.listdir(root_folder):
#         folder_path = os.path.join(root_folder, folder_name)
#         try :
#             if os.path.isdir(folder_path):
#                 print(f"Đang xử lý folder: {folder_path}")
#                 process_folder(folder_path)
#         except Exception as e:
#             print(f"Lỗi xử lý folder {folder_path}: {e}")

# def process_folder(folder_path):
#     for file_name in os.listdir(folder_path):
#         if file_name.endswith(".txt"):
#             file_path = os.path.join(folder_path, file_name)
#             print(f"Đang xử lý file: {file_path}")
#             try:
#                 doc = read_file(file_path)
#                 text, source = process_content(doc)
#                 chunked_content = chunk_text(text, 2500, 6)
#                 for chunk in chunked_content:
#                     add_text_to_qdrant(chunk, source)    
            
#             except Exception as e:
#                 return f"Lỗi xử lý file {file_path}: {e}"           


#knowledge base
def add_text_to_qdrant(text, source, client=qdrant_client, collection_name=COLLECTION_NAME):
    try:
        embedding = model.encode(text)
        point_id = str(uuid.uuid4())
        client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload={
                        "text": text,
                        "source": source
                    }
                )
            ]
        )
        return point_id
    except Exception as e:
        print(f"Error in add_text_to_qdrant: {e}")
        return None


def search_similar_texts(query_text, limit, client=qdrant_client, collection_name=COLLECTION_NAME):
    try:
        query_embedding = model.encode(query_text)
        search_results = client.search(
            collection_name=collection_name,
            query_vector=query_embedding.tolist(),
            limit=limit
        )
        results = []
        for result in search_results:
            if result.score > 0.5:
                results.append({
                    "text": result.payload["text"],
                    "source": result.payload["source"],
                    "score": result.score,
                    "id": result.id
                })
        return results
    except Exception as e:
        print(f"Error in search_similar_texts: {e}")
        return []


#cache answered questions
def add_answered_question_to_qdrant(question, answer, client=qdrant_client, collection_name=ANSWERED_COLLECTION):
    try:
        embedding = model.encode(question)
        point_id = str(uuid.uuid4())
        client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload={
                        "question": question,
                        "answer": answer,
                        "created_at": time.time()
                    }
                )
            ]
        )
        return point_id
    except Exception as e:
        print(f"Error in add_answered_question_to_qdrant: {e}")
        return None

def search_answered_questions(query_text, limit=1, client=qdrant_client, collection_name=ANSWERED_COLLECTION):
    try:
        query_embedding = model.encode(query_text)
        search_results = client.search(
            collection_name=collection_name,
            query_vector=query_embedding.tolist(),
            limit=limit
        )
        results = []
        for result in search_results:
            if result.score > 0.9:
                results.append({
                    "question": result.payload.get("question"),
                    "answer": result.payload.get("answer"),
                    "score": result.score,
                    "id": result.id
                })
        return results
    except Exception as e:
        print(f"Error in search_answered_questions: {e}")
        return []

def cleanup_old_answers(age_seconds, client=qdrant_client, collection_name=ANSWERED_COLLECTION):
    threshold = time.time() - age_seconds
    try:
        client.delete(
            collection_name=collection_name,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(
                            key="created_at",
                            range=Range(lt=threshold)
                        )
                    ]
                )
            )
        )
        print(f"Đã xoá các bản ghi cũ trước timestamp {threshold}")
        return True
    except Exception as e:
        print(f"Lỗi không xác định khi xoá dữ liệu: {e}")
        return False



# if __name__ == "__main__":
#     process_all_folders(folder)