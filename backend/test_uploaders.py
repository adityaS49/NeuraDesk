import os
import json
import pandas as pd
from docx import Document as DocxDocument
from reportlab.pdfgen import canvas
from src.data_loader import load_single_document

def create_test_files():
    files = []
    
    # TXT
    txt_path = "test.txt"
    with open(txt_path, "w") as f:
        f.write("This is a test text file.")
    files.append(txt_path)
    
    # CSV
    csv_path = "test.csv"
    with open(csv_path, "w") as f:
        f.write("col1,col2\nval1,val2")
    files.append(csv_path)
    
    # JSON
    json_path = "test.json"
    with open(json_path, "w") as f:
        json.dump([{"key": "value"}], f)
    files.append(json_path)
    
    # XLSX
    xlsx_path = "test.xlsx"
    df = pd.DataFrame({'col1': ['val1'], 'col2': ['val2']})
    df.to_excel(xlsx_path, index=False)
    files.append(xlsx_path)
    
    # DOCX
    docx_path = "test.docx"
    doc = DocxDocument()
    doc.add_paragraph("This is a test docx file.")
    doc.save(docx_path)
    files.append(docx_path)
    
    # PDF
    pdf_path = "test.pdf"
    c = canvas.Canvas(pdf_path)
    c.drawString(100, 750, "This is a test PDF file.")
    c.save()
    files.append(pdf_path)
    
    return files

def test_loaders():
    print("Creating test files...")
    files = create_test_files()
    
    print("\nTesting loaders...")
    for file_path in files:
        print(f"\n--- Testing {file_path} ---")
        try:
            docs = load_single_document(file_path, file_path)
            print(f"Success! Loaded {len(docs)} document fragments.")
            for i, doc in enumerate(docs[:1]):
                print(f"Sample preview: {doc.page_content[:100]}")
        except Exception as e:
            print(f"Failed! Error: {e}")
            
    # Cleanup
    print("\nCleaning up...")
    for f in files:
        if os.path.exists(f):
            os.remove(f)

if __name__ == "__main__":
    test_loaders()
