from pathlib import Path
from typing import List, Any
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_community.document_loaders import Docx2txtLoader
import pandas as pd
from langchain_core.documents import Document
from langchain_community.document_loaders import JSONLoader
import json
import os

def load_single_document(temp_file_path: str, original_filename: str) -> List[Document]:
    """
    Load a single document from a temporary file path, using the original filename to determine the loader.
    """
    print(f"[DEBUG] Loading single document: {original_filename} from {temp_file_path}")
    ext = os.path.splitext(original_filename)[1].lower()
    documents = []
    
    try:
        if ext == '.pdf':
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load()
        elif ext == '.txt':
            loader = TextLoader(temp_file_path)
            documents = loader.load()
        elif ext == '.csv':
            loader = CSVLoader(temp_file_path)
            documents = loader.load()
        elif ext in ['.xls', '.xlsx']:
            excel_file = pd.ExcelFile(temp_file_path)
            for sheet_name in excel_file.sheet_names:
                df = excel_file.parse(sheet_name)
                for index, row in df.iterrows():
                    row_dict = row.to_dict()
                    row_str = ", ".join([f"{k}: {v}" for k, v in row_dict.items() if pd.notna(v)])
                    if row_str.strip():
                        documents.append(Document(
                            page_content=row_str,
                            metadata={"sheet_name": sheet_name, "row": index}
                        ))
        elif ext == '.docx':
            loader = Docx2txtLoader(temp_file_path)
            documents = loader.load()
        elif ext == '.json':
            with open(temp_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            documents.append(Document(page_content=json.dumps(item)))
                elif isinstance(data, dict):
                    documents.append(Document(page_content=json.dumps(data)))
        else:
            print(f"[WARNING] Unsupported file extension for {original_filename}")
            
        # Ensure all documents have the correct original filename as their source metadata
        for doc in documents:
            doc.metadata["source"] = original_filename
            
    except Exception as e:
        print(f"[ERROR] Failed to load {original_filename}: {e}")
        
    return documents


def load_all_documents(data_dir: str) -> List[Any]:
    """
    Load all supported files from the data directory and convert to LangChain document structure.
    Supported: PDF, TXT, CSV, Excel, Word, JSON
    """
    # Use project root data folder
    data_path = Path(data_dir).resolve()
    print(f"[DEBUG] Data path: {data_path}")
    documents = []

    # PDF files
    pdf_files = list(data_path.glob('**/*.pdf'))
    print(f"[DEBUG] Found {len(pdf_files)} PDF files: {[str(f) for f in pdf_files]}")
    for pdf_file in pdf_files:
        print(f"[DEBUG] Loading PDF: {pdf_file}")
        try:
            loader = PyPDFLoader(str(pdf_file))
            loaded = loader.load()
            print(f"[DEBUG] Loaded {len(loaded)} PDF docs from {pdf_file}")
            documents.extend(loaded)
        except Exception as e:
            print(f"[ERROR] Failed to load PDF {pdf_file}: {e}")

    # TXT files
    txt_files = list(data_path.glob('**/*.txt'))
    print(f"[DEBUG] Found {len(txt_files)} TXT files: {[str(f) for f in txt_files]}")
    for txt_file in txt_files:
        print(f"[DEBUG] Loading TXT: {txt_file}")
        try:
            loader = TextLoader(str(txt_file))
            loaded = loader.load()
            print(f"[DEBUG] Loaded {len(loaded)} TXT docs from {txt_file}")
            documents.extend(loaded)
        except Exception as e:
            print(f"[ERROR] Failed to load TXT {txt_file}: {e}")

    # CSV files
    csv_files = list(data_path.glob('**/*.csv'))
    print(f"[DEBUG] Found {len(csv_files)} CSV files: {[str(f) for f in csv_files]}")
    for csv_file in csv_files:
        print(f"[DEBUG] Loading CSV: {csv_file}")
        try:
            loader = CSVLoader(str(csv_file))
            loaded = loader.load()
            print(f"[DEBUG] Loaded {len(loaded)} CSV docs from {csv_file}")
            documents.extend(loaded)
        except Exception as e:
            print(f"[ERROR] Failed to load CSV {csv_file}: {e}")

    # Excel files
    xlsx_files = list(data_path.glob('**/*.xlsx'))
    print(f"[DEBUG] Found {len(xlsx_files)} Excel files: {[str(f) for f in xlsx_files]}")
    for xlsx_file in xlsx_files:
        print(f"[DEBUG] Loading Excel: {xlsx_file}")
        try:
            excel_file = pd.ExcelFile(str(xlsx_file))
            loaded = []
            for sheet_name in excel_file.sheet_names:
                df = excel_file.parse(sheet_name)
                for index, row in df.iterrows():
                    row_dict = row.to_dict()
                    # format key-values into a single readable string
                    row_str = ", ".join([f"{k}: {v}" for k, v in row_dict.items() if pd.notna(v)])
                    if row_str.strip():
                        doc = Document(
                            page_content=row_str,
                            metadata={"source": str(xlsx_file), "sheet_name": sheet_name, "row": index}
                        )
                        loaded.append(doc)
            print(f"[DEBUG] Loaded {len(loaded)} Excel rows from {xlsx_file}")
            documents.extend(loaded)
        except Exception as e:
            print(f"[ERROR] Failed to load Excel {xlsx_file}: {e}")

    # Word files
    docx_files = list(data_path.glob('**/*.docx'))
    print(f"[DEBUG] Found {len(docx_files)} Word files: {[str(f) for f in docx_files]}")
    for docx_file in docx_files:
        print(f"[DEBUG] Loading Word: {docx_file}")
        try:
            loader = Docx2txtLoader(str(docx_file))
            loaded = loader.load()
            print(f"[DEBUG] Loaded {len(loaded)} Word docs from {docx_file}")
            documents.extend(loaded)
        except Exception as e:
            print(f"[ERROR] Failed to load Word {docx_file}: {e}")

    # JSON files
    json_files = list(data_path.glob('**/*.json')) 
    print(f"[DEBUG] Found {len(json_files)} JSON files: {[str(f) for f in json_files]}")
    for json_file in json_files:
        print(f"[DEBUG] Loading JSON: {json_file}")
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            doc = Document(
                                page_content=json.dumps(item),
                                metadata={"source": str(json_file)}
                            )
                           
                            print(f"[DEBUG] Loaded {len(data)} JSON docs from {json_file}")
                            
                            documents.extend([doc])
                elif isinstance(data, dict):
                    doc = Document(
                        page_content=json.dumps(data),
                        metadata={"source": str(json_file)}
                    )
                    
                    print(f"[DEBUG] Loaded {len(data)} JSON docs from {json_file}")
                    documents.extend([doc])
        except Exception as e:
            print(f"[ERROR] Failed to load JSON {json_file}: {e}")
    print(f"[DEBUG]loaded documents: {documents}")       
    print(f"[DEBUG] Total loaded documents: {len(documents)}")
    return documents