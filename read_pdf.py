from pathlib import Path
import PyPDF2

pdf = Path(r'd:\repos\project_Travel_Destination\Opgavebeskrivelse\Project 1 - Travel Destinations.pdf')
out = Path(r'd:\repos\project_Travel_Destination\Opgavebeskrivelse\project_1_text.txt')
reader = PyPDF2.PdfReader(str(pdf))
content = []
for i, page in enumerate(reader.pages, 1):
    content.append(f'--- PAGE {i} ---\n')
    text = page.extract_text() or ''
    content.append(text)
    content.append('\n')
out.write_text(''.join(content), encoding='utf-8')
print(str(out))
