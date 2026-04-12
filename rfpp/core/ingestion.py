import os
import re
from typing import Dict
import pdfplumber
import docx

class DocumentIngestion:
    def __init__(self):
        pass

    def load_pdf(self, file_path: str)->str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text
    
    def load_docx(self, file_path: str) -> str:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    
    def load_document(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError("File Doesnot exist")
        
        if file_path.endswith(".pdf"):
            return self.load_pdf(file_path)
        elif file_path.endswith(".docx"):
            return self.load_docx(file_path)
        else:
            raise ValueError("Unsupported file format")
        
    def extract_metadata(self, text: str) -> Dict:
        metadata = {}

        tender_id = re.search(r"Tender\s*ID\s*[:\-]?\s*(\S+)", text, re.IGNORECASE)
        if tender_id:
            metadata["tender_id"] = tender_id.group(1)

        deadline = re.search(r"Deadline\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
        if deadline:
            metadata["deadline"] = deadline.group(1).strip()

        value = re.search(r"(Estimated\s*Value|Budget)\s*[:\-]?\s*(.+)", text, re.IGNORECASE)
        if value:
            metadata["estimated_value"] = value.group(2).strip()

        return metadata

# Testing 
if __name__ == "__main__":
    ingestion = DocumentIngestion()

    test_path =  r"./pdf/Tendernotice_1.pdf" 

    try:
        text = ingestion.load_document(test_path)
        print("Document Loaded Successfully")
        print("First 500 Characters:\n", text[:500])

        metadata = ingestion.extract_metadata(text)
        print("\nExtracted Metadata:", metadata)

    except Exception as e:
        print("Error:", str(e))
