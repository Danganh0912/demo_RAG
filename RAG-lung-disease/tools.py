import re
from prompt import system_prompt
from google import genai
from google.genai import types
from langchain_ollama import ChatOllama
from langchain.prompts import ChatPromptTemplate
# import traceback


def read_file(file_path):
    with open(file_path, encoding = "utf8") as f:
        return f.read()

def process_content(content: str):
    lines = content.split('\n')
    text_lines = []
    source_line = None
    for line in lines:
        if line.startswith("Source:"):
            source_line = line.strip()
            break
        text_lines.append(line.strip())
    text_content = "\n".join(text_lines).strip()
    return text_content, source_line

def chunk_text(text : str, max_chunk_size: int , overlap_sentences : int):
    if not text:
        return []
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if text and not re.search(r'[.!?]\s*$', text):
        sentences = sentences[:-1] + [sentences[-1] + '.']
    chunks = []
    current_chunk = ""
    current_sentences = []
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > max_chunk_size and current_chunk:
            chunks.append(current_chunk)
            overlap_sentences_count = min(overlap_sentences, len(current_sentences))
            overlap_sentences_list = current_sentences[-overlap_sentences_count:]
            overlap_text = "".join(overlap_sentences_list) if not any(s.endswith(" ") for s in overlap_sentences_list) else " ".join(overlap_sentences_list)
            current_chunk = overlap_text
            current_sentences = current_sentences[-overlap_sentences_count:]
        current_chunk += (" " if current_chunk and not current_chunk.endswith(" ") and not sentence.startswith(" ") else "") + sentence
        current_sentences.append(sentence)
    if current_chunk:
        chunks.append(current_chunk)

    return chunks

def combine_content(results: list):
    if results:
        aggregated_content = ""
        for idx, content in enumerate(results, start=1):
            aggregated_content += f"Information {idx}:\n"
            aggregated_content += content["text"].strip() + "\n\n"
        return aggregated_content.strip()
    else:
        return "No information is retrieved"


# local model
def get_ollama_response(user_question: str, result: str):
    try:
        chat_ollama = ChatOllama(model="qwen2.5:7b-instruct-q8_0", temperature=0.3)
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("system", f"Information: {result}"),
            ("human", "{user_question}")
        ])
        prompt_values = {
            "user_question": user_question, "information": result
        }
        chain = prompt | chat_ollama
        response = chain.invoke(prompt_values)
        return response.content
    except Exception as e:
        return "Error"


# gemini model
def get_gemini_response(user_question: str, result: str) -> str:
    try:
        client = genai.Client(api_key="AIzaSyA-SYSmQKQ3_EMDramzqVpBg05nUfAlJlU")
        prompt_gemini = f"Data: {result}\n\nQuestion: {user_question}\n\n"
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3
            ),
            contents=prompt_gemini
        )
        return response.text
    except Exception as e:
        return "Error"
