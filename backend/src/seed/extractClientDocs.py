import json, re, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(r'C:\Users\le\Downloads')
NS = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def text(name):
    with zipfile.ZipFile(ROOT / name) as z:
        root = ET.fromstring(z.read('word/document.xml'))
    return '\n'.join(''.join(p.itertext()).strip() for p in root.findall('.//w:p', NS))

def questions(raw, count, option_count):
    marks = list(re.finditer(r'(?m)^(\d+)\.\s+(.+)$', raw))
    out = []
    for i, m in enumerate(marks):
        n = int(m.group(1))
        if n > count: continue
        end = marks[i + 1].start() if i + 1 < len(marks) else len(raw)
        block = raw[m.start():end]
        opts = re.findall(r'(?m)^([A-E])\.\s+(.+)$', block)
        if len(opts) < option_count: continue
        out.append({'n': n, 'text': m.group(2), 'options': [v for _, v in opts[:option_count]]})
    return sorted(out, key=lambda x: x['n'])

mbti = text('My_Inner_MBTI_60_Question_Assessment.docx')
mbti_q = questions(mbti, 60, 4)
keys = {int(n): pair.split(' / ') for n, pair in re.findall(r'^(\d+)\. A/B/C/D mapping: ([EISNTFJP] / [EISNTFJP])$', mbti, re.M)}
for q in mbti_q:
    q['tag'] = keys[q['n']][0]

animal = text('My_Inner_Hidden_Animal_Test.docx')
aq = questions(animal.split('Scoring Key')[0], 30, 4)
key = {}
for n, body in re.findall(r'(?ms)^(\d+)\.\n(.*?)(?=^\d+\.\n|^Result Calculation)', animal.split('Scoring Key — Keep Internal', 1)[1], re.M):
    key[int(n)] = {label: '+'.join(re.findall(r'[A-Z][a-z]+', animals)) for label, animals in re.findall(r'([A-D]) → ([^\n]+)', body)}
for q in aq:
    q['options'] = [key[q['n']][chr(65+i)] for i in range(4)]

inner_raw = text('My_Inner_Inner_Child_30_Question_Test.docx')
inner_q = questions(inner_raw, 30, 5)
for q in inner_q:
    block = inner_raw[inner_raw.find(str(q['n']) + '.'):]
    block = block[:block.find(str(q['n'] + 1) + '.')] if str(q['n'] + 1) + '.' in block else block
    q['options'] = []
    for label, value, category, score, meaning in re.findall(r'(?m)^([A-E])\.\s+(.+?)\s+\|\s+Score:\s+(.+?)\s+([+-]\d+)\s*\n?Result meaning:\s*(.+)$', block):
        q['options'].append({'label': label, 'text': value, 'category': category, 'score': int(score), 'meaning': meaning})

love_raw = text('My_Inner_Love_Language_Couple_Test_30Q.docx')
love_q = questions(love_raw, 30, 5)
for q in love_q:
    block = love_raw[love_raw.find(str(q['n']) + '.'):]
    block = block[:block.find(str(q['n'] + 1) + '.')] if str(q['n'] + 1) + '.' in block else block
    q['options'] = []
    for label, value, self_cat, self_score, partner_cat, partner_score in re.findall(r'(?m)^([A-E])\.\s+(.+?)\s+\|\s+SELF:\s+(\w+)\s+([+-]\d+)\s+\|\s+PARTNER:\s+(\w+)\s+([+-]\d+)', block):
        q['options'].append({'label': label, 'text': value, 'selfCategory': self_cat, 'selfScore': int(self_score), 'partnerCategory': partner_cat, 'partnerScore': int(partner_score)})

print(json.dumps({'mbti': mbti_q, 'animal': aq, 'inner': inner_q, 'love': love_q}, ensure_ascii=False))
