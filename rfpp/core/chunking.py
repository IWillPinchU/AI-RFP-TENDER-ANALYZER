import re
from typing import List, Dict


class ClauseChunker:
    def __init__(self):
        pass

    def clean_text(self, text: str) -> str:
        text = re.sub(r"\n+", "\n", text)
        return text.strip()

    def remove_noise(self, text: str) -> str:
        text = re.sub(r"\d+\s*\|\s*P\s*a\s*g\s*e", "", text)
        text = re.sub(r"Page\s*\d+", "", text, flags=re.IGNORECASE)
        return text

    def clean_heading(self, heading: str) -> str:
        heading = re.sub(r"\.+\s*\d+$", "", heading)
        heading = re.sub(r"\s+", " ", heading)
        return heading.strip()

    def split_by_headings(self, text: str) -> List[Dict]:
        text = self.clean_text(text)
        text = self.remove_noise(text)

        lines = text.split("\n")

        chunks = []
        current_heading = None
        current_content = []

        heading_pattern = re.compile(r"^\d+(\.\d+)*\s+.+")

        for line in lines:
            line = line.strip()

            if not line:
                continue

            if heading_pattern.match(line):
                if current_heading and current_content:
                    content = self.split_paragraphs("\n".join(current_content))

                    if len(content.strip()) > 30 and not re.match(r"^[A-Z]\s", content.strip()):
                        chunks.append({
                            "heading": current_heading,
                            "content": content
                        })

                cleaned_heading = self.clean_heading(line)

                if len(cleaned_heading) < 5:
                    continue

                current_heading = cleaned_heading
                current_content = []

            else:
                if current_heading:
                    current_content.append(line)

        if current_heading and current_content:
            content = self.split_paragraphs("\n".join(current_content))

            if len(content.strip()) > 30 and not re.match(r"^[A-Z]\s", content.strip()):
                chunks.append({
                    "heading": current_heading,
                    "content": content
                })

        return chunks

    def split_paragraphs(self, content: str) -> str:
        parts = re.split(r"\n\n|•||-", content)
        cleaned = []

        for part in parts:
            part = part.strip()
            if len(part) > 30:
                cleaned.append(part)

        return "\n".join(cleaned)

    def classify_section(self, heading: str, content: str) -> str:
        text = (heading + " " + content).lower()

        if any(k in text for k in ["payment", "cost", "financial", "budget"]):
            return "Financial"

        if any(k in text for k in ["eligibility", "qualification", "pre-qualification"]):
            return "Eligibility"

        if any(k in text for k in ["security", "encryption", "compliance"]):
            return "Security"

        if any(k in text for k in ["penalty", "liability", "termination"]):
            return "Legal"

        if any(k in text for k in ["technical", "architecture", "ai", "ml"]):
            return "Technical"

        return "General"

    def process(self, text: str) -> List[Dict]:
        sections = self.split_by_headings(text)

        structured = []

        for sec in sections:
            category = self.classify_section(sec["heading"], sec["content"])

            structured.append({
                "heading": sec["heading"],
                "content": sec["content"],
                "category": category
            })

        return structured


if __name__ == "__main__":
    from core.ingestion import DocumentIngestion

    ingestion = DocumentIngestion()
    chunker = ClauseChunker()

    path =  r"./pdf/Tendernotice_1.pdf"

    text = ingestion.load_document(path)
    chunks = chunker.process(text)

    print("Total chunks:", len(chunks))
    print()

    for c in chunks[:5]:
        print("----")
        print("Heading:", c["heading"])
        print("Category:", c["category"])
        print("Preview:", c["content"][:200])
        print()