# -*- coding: utf-8 -*-
"""Gera o deck de slides e o board CO-LAB do PortoFlow 4.0 (PyMuPDF, vetorial)."""
import fitz

# Paleta
AZUL   = (0.118, 0.227, 0.541)   # #1e3a8a
AZUL2  = (0.231, 0.510, 0.965)   # #3b82f6
VERDE  = (0.086, 0.639, 0.290)   # #16a34a
VERMELHO=(0.937, 0.267, 0.267)   # #ef4444
AMARELO=(0.918, 0.702, 0.031)
LARANJA=(0.976, 0.451, 0.086)
CINZA  = (0.30, 0.36, 0.45)
CINZAC = (0.94, 0.96, 0.98)
BRANCO = (1,1,1)
ROXO   = (0.55, 0.36, 0.96)

DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
DEJAVU_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "dvu"
FONT_BOLD = "dvb"

def reg_fonts(p):
    p.insert_font(fontname=FONT_REG, fontfile=DEJAVU)
    p.insert_font(fontname=FONT_BOLD, fontfile=DEJAVU_B)

W, H = 842, 595  # A4 paisagem
MARG = 46

def page(doc):
    p = doc.new_page(width=W, height=H)
    reg_fonts(p)
    return p

def rect(p, x0,y0,x1,y1, color, fill=None, width=1, radius=None):
    r = fitz.Rect(x0,y0,x1,y1)
    if radius:
        menor = max(1.0, min(abs(x1-x0), abs(y1-y0)))
        frac = min(0.5, float(radius)/menor)
        p.draw_rect(r, color=color, fill=fill, width=width, radius=frac)
    else:
        p.draw_rect(r, color=color, fill=fill, width=width)

def text(p, x, y, s, size=12, font=FONT_REG, color=(0,0,0), w=W-2*MARG, align=0, lh=1.25):
    p.insert_textbox(fitz.Rect(x, y, x+w, y+4000), s, fontsize=size, fontname=font,
                     color=color, align=align, lineheight=lh)

def header(p, num, tag, total=18):
    rect(p, 0,0, W,8, AZUL2, fill=AZUL2, width=0)
    rect(p, 0,0, 270,30, AZUL, fill=AZUL, width=0)
    text(p, 14, 9, f"{tag}", size=9, font=FONT_BOLD, color=BRANCO, w=248)
    text(p, W-90, 9, f"{num}/{total}", size=10, font=FONT_BOLD, color=CINZA, w=70, align=2)

def footer(p):
    text(p, MARG, H-26, "PortoFlow 4.0 - Sistema Inteligente de Atracação · Porto do Itaqui",
         size=8, color=CINZA, w=W-2*MARG)

def title(p, t, y=46, color=AZUL, size=23):
    text(p, MARG, y, t, size=size, font=FONT_BOLD, color=color)

def bullets(p, x, y, items, size=12.5, color=(0.12,0.16,0.22), gap=7, w=None, dot=AZUL2):
    w = w or (W-2*MARG)
    yy = y
    for it in items:
        p.draw_circle(fitz.Point(x+4, yy+7), 2.6, color=dot, fill=dot)
        text(p, x+16, yy, it, size=size, color=color, w=w-16)
        # estima altura
        lines = max(1, int(len(it)/ (w/ (size*0.52)) ) + 1)
        yy += lines*size*1.25 + gap
    return yy

# ---------- ícones temáticos ----------
def navio(p, cx, cy, s=1.0, casco=AZUL, cont=AZUL2):
    # casco (trapézio)
    pts = [fitz.Point(cx-32*s,cy), fitz.Point(cx+32*s,cy),
           fitz.Point(cx+24*s,cy+14*s), fitz.Point(cx-24*s,cy+14*s)]
    p.draw_polyline(pts+[pts[0]], color=casco, fill=casco, width=0)
    # contêineres
    cores=[cont, VERDE, AMARELO, VERMELHO]
    for i in range(4):
        x = cx-26*s + i*13*s
        rect(p, x, cy-12*s, x+11*s, cy-1*s, BRANCO, fill=cores[i%4], width=0.5)

def agua(p, y0, y1):
    rect(p, 0,y0, W,y1, (0.85,0.92,0.98), fill=(0.85,0.92,0.98), width=0)
    for k in range(0,W,60):
        p.draw_bezier(fitz.Point(k,y0+10),fitz.Point(k+15,y0+4),fitz.Point(k+30,y0+16),fitz.Point(k+45,y0+10),color=(0.6,0.78,0.92),width=1)

def berco(p, x, y, label, ocupado=True, w=70, h=44, cor=AZUL):
    rect(p, x,y, x+w,y+h, cor, fill=(0.96,0.97,1.0), width=1.4, radius=4)
    text(p, x, y+h/2-8, label, size=12, font=FONT_BOLD, color=cor, w=w, align=1)
    pill = VERDE if not ocupado else AZUL2
    txt = "Livre" if not ocupado else "Ocupado"
    rect(p, x+10,y+h-13, x+w-10,y+h-2, pill, fill=pill, width=0, radius=3)
    text(p, x+10, y+h-13.5, txt, size=7.5, font=FONT_BOLD, color=BRANCO, w=w-20, align=1)

# ====================================================================
#  SLIDES
# ====================================================================
doc = fitz.open()

# Slide 1 - Capa
p = page(doc)
rect(p, 0,0, W,H, AZUL, fill=AZUL, width=0)
rect(p, 0,0, W,8, AZUL2, fill=AZUL2, width=0)
agua(p, H-120, H)
navio(p, W-150, H-118, 1.8)
navio(p, W-300, H-95, 1.2, casco=(0.10,0.18,0.42))
text(p, MARG, 120, "PortoFlow 4.0", size=46, font=FONT_BOLD, color=BRANCO)
text(p, MARG, 185, "Sistema Inteligente de Sequenciamento de Atracação", size=18, color=(0.85,0.90,1.0))
text(p, MARG, 210, "Porto do Itaqui", size=18, color=(0.85,0.90,1.0))
rect(p, MARG, 250, MARG+250, 252, AZUL2, fill=AZUL2, width=0)
text(p, MARG, 275, "EQUIPE", size=11, font=FONT_BOLD, color=AZUL2)
text(p, MARG, 295, "Anna Carolyna  ·  Artho Eduardo  ·  Clarissa Camurça  ·  Gabriel Muller", size=13, color=BRANCO)
text(p, MARG, 330, "DISCIPLINA", size=11, font=FONT_BOLD, color=AZUL2)
text(p, MARG, 350, "Teoria das Filas e Processos Estocásticos   ·   Prof. João Muniz", size=13, color=BRANCO)
text(p, MARG, 392, "DESAFIO 4.0 - UNDB 2026.1", size=10, color=(0.7,0.78,0.95))

# Slide 2 - Contexto do Problema
p = page(doc); header(p,2,"CONTEXTO"); footer(p)
title(p, "O Problema: Porto do Itaqui")
bullets(p, MARG, 92, [
  "Crescimento do fluxo marítimo (grãos, contêineres, combustíveis, institucional).",
  "Aumento do tempo médio de espera e congestionamento marítimo.",
  "Conflitos de prioridade entre operadores e tipos de carga.",
  "Restrições de berço: alguns navios só operam em certos berços.",
  "Condições climáticas que interrompem operações.",
], w=440)
rect(p, MARG, 330, MARG+440, 392, AMARELO, fill=(1.0,0.98,0.85), width=1.2, radius=5)
text(p, MARG+12, 340, "Pergunta central", size=10, font=FONT_BOLD, color=(0.6,0.45,0.0), w=420)
text(p, MARG+12, 356, "Como reduzir congestionamentos e melhorar a eficiência da atracação considerando as incertezas operacionais?", size=11.5, color=(0.35,0.28,0.0), w=416)
# cena: fila de navios
agua(p, 150, 300)
for i,xx in enumerate([560, 640, 720, 560, 660]):
    yy = 175 + (i%2)*70
    navio(p, xx, yy, 0.9, casco=AZUL if i%2 else (0.10,0.18,0.42))
text(p, 540, 305, "Fila de navios aguardando atracação", size=9, color=CINZA, w=260, align=1)

# Slide 3 - Nossa Solução
p = page(doc); header(p,3,"SOLUÇÃO"); footer(p)
title(p, "Nossa Solução: PortoFlow 4.0")
text(p, MARG, 86, "Sistema de apoio à decisão que:", size=13, color=CINZA)
bullets(p, MARG, 112, [
  "Modela matematicamente a fila de atracação;",
  "Simula cenários operacionais (eventos discretos);",
  "Compara políticas de sequenciamento;",
  "Recomenda automaticamente a melhor ordem de atracação.",
], w=440)
rect(p, 540, 110, 540+250, 250, ROXO, fill=(0.96,0.94,1.0), width=1.5, radius=8)
text(p, 540, 130, "DIFERENCIAL", size=10, font=FONT_BOLD, color=ROXO, w=250, align=1)
text(p, 540, 156, "Índice Dinâmico\nde Atracação", size=20, font=FONT_BOLD, color=ROXO, w=250, align=1, lh=1.1)
text(p, 540, 212, "(IDA)", size=15, font=FONT_BOLD, color=AZUL, w=250, align=1)
rect(p, MARG, 300, W-MARG, 360, VERDE, fill=(0.90,0.98,0.93), width=1.2, radius=5)
text(p, MARG+12, 312, "A grande sacada", size=10, font=FONT_BOLD, color=VERDE, w=W-2*MARG-24)
text(p, MARG+12, 328, "Transformar um problema de Teoria das Filas com múltiplas restrições operacionais em um mecanismo de decisão baseado em priorização dinâmica.", size=12, color=(0.1,0.3,0.15), w=W-2*MARG-24)

# Slide 4 - Modelo de Fila (Req 1)
p = page(doc); header(p,4,"REQUISITO 1 · MODELO"); footer(p)
title(p, "Modelo de Fila Adotado")
rect(p, MARG, 84, MARG+360, 120, AZUL, fill=(0.93,0.96,1.0), width=1.5, radius=6)
text(p, MARG, 92, "M / G / 4  com Prioridade Não Preemptiva", size=17, font=FONT_BOLD, color=AZUL, w=360, align=1)
bullets(p, MARG, 140, [
  "M = chegadas aleatórias (processo de Poisson);",
  "G = tempos de atendimento variáveis por carga;",
  "4 = quatro berços operacionais (servidores);",
  "Servidores restritos: compatibilidade navio-berço.",
], w=360, size=12)
# fluxo
fx = 470
text(p, fx, 96, "Chegada de navios", size=10, font=FONT_BOLD, color=CINZA, w=300, align=1)
p.draw_line(fitz.Point(fx+150,112), fitz.Point(fx+150,128), color=CINZA, width=1.5)
rect(p, fx+95, 130, fx+205, 158, AZUL2, fill=(0.93,0.96,1.0), width=1.3, radius=4)
text(p, fx+95, 136, "FILA (espera)", size=10, font=FONT_BOLD, color=AZUL, w=110, align=1)
p.draw_line(fitz.Point(fx+150,158), fitz.Point(fx+150,176), color=CINZA, width=1.5)
for i,b in enumerate(["B1","B2","B3","B4"]):
    berco(p, fx+i*78, 180, b, ocupado=(i!=3), w=70, h=44)
text(p, fx, 280, "B4 = berço multiuso (flexível, absorve transbordo)", size=8.5, color=VERDE, w=304, align=1)
p.draw_line(fitz.Point(fx+150,236), fitz.Point(fx+150,252), color=CINZA, width=1.5)
text(p, fx, 256, "Saída (operação concluída)", size=10, font=FONT_BOLD, color=CINZA, w=300, align=1)
rect(p, MARG, 300, W-MARG, 348, CINZAC, fill=CINZAC, width=0, radius=5)
text(p, MARG+12, 312, "Por quê? O desafio informa que as chegadas são aleatórias e os tempos de operação variam conforme a carga - logo, M/G/4.", size=11.5, color=CINZA, w=W-2*MARG-24)

# Slide 5 - Elementos da Teoria das Filas (Req 2)
p = page(doc); header(p,5,"REQUISITO 2 · ELEMENTOS"); footer(p)
title(p, "Elementos da Teoria das Filas")
linhas = [("Clientes","Navios"),("Servidores","4 berços (B1-B4)"),("λ (lambda)","Taxa de chegada"),
          ("μ (mi)","Taxa de atendimento"),("Wq","Tempo médio de espera na fila"),
          ("W","Tempo total no sistema (espera+operação)"),("Lq","Nº médio de navios esperando"),
          ("L","Nº médio de navios no sistema")]
y=92; rowh=44
rect(p, MARG, y, W-MARG, y+26, AZUL, fill=AZUL, width=0)
text(p, MARG+12, y+6, "Conceito", size=11, font=FONT_BOLD, color=BRANCO, w=200)
text(p, MARG+250, y+6, "Significado no Porto", size=11, font=FONT_BOLD, color=BRANCO, w=400)
y+=26
for i,(a,b) in enumerate(linhas):
    bg = BRANCO if i%2 else (0.97,0.98,1.0)
    rect(p, MARG, y, W-MARG, y+rowh-4, (0.85,0.88,0.93), fill=bg, width=0.5)
    text(p, MARG+12, y+7, a, size=12.5, font=FONT_BOLD, color=AZUL, w=220)
    text(p, MARG+250, y+8, b, size=12, color=(0.15,0.2,0.28), w=460)
    y+=rowh-4

# Slide 6 - λ, μ, capacidade, prioridades (Req 2)
p = page(doc); header(p,6,"REQUISITO 2 · PARÂMETROS"); footer(p)
title(p, "λ, μ, Capacidade e Prioridades")
cards = [("λ - Chegadas","≈ 5 navios/dia\n(base; cresce no pico)", AZUL2),
         ("μ - Atendimento","calculado pelos tempos\nde operação por carga", VERDE),
         ("Servidores","4 berços", ROXO),
         ("Capacidade","fila ilimitada\n(fundeadouro)", LARANJA)]
cw=170
for i,(t,v,c) in enumerate(cards):
    x=MARG+i*(cw+10)
    rect(p, x,92, x+cw,170, c, fill=BRANCO, width=1.4, radius=6)
    text(p, x, 102, t, size=11, font=FONT_BOLD, color=c, w=cw, align=1)
    text(p, x+8, 126, v, size=11.5, color=(0.15,0.2,0.28), w=cw-16, align=1, lh=1.15)
text(p, MARG, 196, "Prioridades (board CO-LAB):", size=13, font=FONT_BOLD, color=AZUL)
pri = [("Legal / Estratégica", VERMELHO),("Contratual", LARANJA),("Urgência / Espera", AMARELO),("Operacional", AZUL2)]
for i,(t,c) in enumerate(pri):
    x=MARG+i*180
    rect(p, x,224, x+165,256, c, fill=BRANCO, width=1.3, radius=5)
    p.draw_circle(fitz.Point(x+16,240),5,color=c,fill=c)
    text(p, x+28, 231, t, size=11.5, font=FONT_BOLD, color=(0.2,0.25,0.32), w=135)
rect(p, MARG, 286, W-MARG, 348, CINZAC, fill=CINZAC, width=0, radius=5)
text(p, MARG+12, 296, "Disciplina da fila", size=10, font=FONT_BOLD, color=AZUL)
text(p, MARG+12, 312, "Prioridade NÃO preemptiva, ordem Crítica > Alta > Média > Baixa. A prioridade decide o PRÓXIMO a atracar; não interrompe operação em andamento.", size=11.5, color=CINZA, w=W-2*MARG-24)

# Slide 7 - Por que não FIFO (Req 3)
p = page(doc); header(p,7,"REQUISITO 3 · POLÍTICAS"); footer(p)
title(p, "Por que NÃO usar FIFO puro?")
y=92; rect(p, MARG,y, W-MARG,y+26, AZUL, fill=AZUL, width=0)
text(p, MARG+12,y+6,"Política", size=11, font=FONT_BOLD, color=BRANCO, w=240)
text(p, MARG+270,y+6,"Limitação", size=11, font=FONT_BOLD, color=BRANCO, w=400); y+=26
pol=[("FIFO","Ignora prioridades; navio incompatível bloqueia a fila inteira", VERMELHO),
     ("Prioridade fixa","Pouco flexível; não reage ao contexto", LARANJA),
     ("Fila por tipo","Pode gerar ociosidade de berços", AMARELO),
     ("Índice Dinâmico (IDA)","Considera múltiplos fatores -> escolhido", VERDE)]
for i,(a,b,c) in enumerate(pol):
    rect(p, MARG,y, W-MARG,y+40, (0.85,0.88,0.93), fill=(BRANCO if i%2 else (0.97,0.98,1.0)), width=0.5)
    p.draw_circle(fitz.Point(MARG+16,y+20),5,color=c,fill=c)
    text(p, MARG+30,y+12,a,size=12.5,font=FONT_BOLD,color=(0.15,0.2,0.28),w=240)
    text(p, MARG+270,y+12,b,size=12,color=(0.2,0.25,0.32),w=440); y+=40
rect(p, MARG, y+10, W-MARG, y+52, VERMELHO, fill=(1.0,0.93,0.93), width=1.2, radius=5)
text(p, MARG+12, y+20, "Conclusão: o FIFO não representa a realidade do Porto do Itaqui (prioridades legais/contratuais + restrições de berço).", size=12, font=FONT_BOLD, color=(0.6,0.1,0.1), w=W-2*MARG-24)

# Slide 8 - Justificativa prioridade não preemptiva (Req 3)
p = page(doc); header(p,8,"REQUISITO 3 · JUSTIFICATIVA"); footer(p)
title(p, "Por que Prioridade Não Preemptiva?")
bullets(p, MARG, 96, [
  "Não é possível interromper uma operação de atracação já iniciada;",
  "A prioridade influencia apenas a PRÓXIMA escolha de atracação;",
  "Reflete melhor a operação portuária real.",
], w=430, size=13)
# berço com cadeado
berco(p, 560, 110, "B2", ocupado=True, w=90, h=58, cor=AZUL)
p.draw_circle(fitz.Point(605,150),3,color=AZUL,fill=AZUL)
text(p, 540, 178, "Operação em curso\nnão é interrompida", size=10, color=CINZA, w=130, align=1, lh=1.1)
rect(p, MARG, 240, W-MARG, 300, VERDE, fill=(0.90,0.98,0.93), width=1.3, radius=6)
text(p, MARG+12, 252, "Decisão", size=10, font=FONT_BOLD, color=VERDE, w=W-2*MARG-24)
text(p, MARG+12, 270, "Fila com PRIORIDADE NÃO PREEMPTIVA e MÚLTIPLOS SERVIDORES (4 berços), com restrição de compatibilidade navio-berço.", size=13, font=FONT_BOLD, color=(0.1,0.3,0.15), w=W-2*MARG-24)

# Slide 9 - IDA fórmula (coração)
p = page(doc); header(p,9,"O CORAÇÃO · IDA"); footer(p)
title(p, "Índice Dinâmico de Atracação (IDA)")
text(p, MARG, 84, "Score multicritério (0-100). Quanto maior, maior a prioridade de atracação.", size=12.5, color=CINZA)
fatores=[("Prioridade legal/contratual","40", VERMELHO),("Tempo de espera acumulado","20", AZUL2),
         ("Tipo de carga","12", LARANJA),("Risco climático","12", AMARELO),
         ("Impacto logístico","10", ROXO),("Compatibilidade de berço","6", VERDE)]
y=116
for i,(t,v,c) in enumerate(fatores):
    x=MARG+(i%2)*350; yy=y+(i//2)*44
    rect(p, x,yy, x+330,yy+36, c, fill=BRANCO, width=1.2, radius=5)
    p.draw_circle(fitz.Point(x+16,yy+18),6,color=c,fill=c)
    text(p, x+30,yy+10,t,size=12,font=FONT_BOLD,color=(0.2,0.25,0.32),w=250)
    text(p, x+290,yy+9,"+"+v,size=13,font=FONT_BOLD,color=c,w=36,align=1)
rect(p, MARG, y+150, W-MARG, y+196, AZUL, fill=(0.93,0.96,1.0), width=1.5, radius=6)
text(p, MARG+12, y+162, "IDA = Prioridade + Espera + Tipo de Carga + Clima + Impacto Logístico + Compatibilidade   ->   pontuação 0-100", size=12.5, font=FONT_BOLD, color=AZUL, w=W-2*MARG-24)

# Slide 10 - Exemplo do IDA
p = page(doc); header(p,10,"O CORAÇÃO · EXEMPLO"); footer(p)
title(p, "Exemplo do IDA na prática")
def navio_card(p,x,t,fatores,total,cor):
    rect(p, x,96, x+330,300, cor, fill=BRANCO, width=1.6, radius=8)
    text(p, x,108, t, size=15, font=FONT_BOLD, color=cor, w=330, align=1)
    yy=140
    for k,v in fatores:
        text(p, x+24,yy,k,size=11.5,color=(0.2,0.25,0.32),w=210)
        text(p, x+250,yy,str(v),size=11.5,font=FONT_BOLD,color=cor,w=56,align=2); yy+=22
    rect(p, x+24,yy+6, x+306,yy+40, cor, fill=cor, width=0, radius=5)
    text(p, x+24,yy+13,f"IDA = {total}",size=15,font=FONT_BOLD,color=BRANCO,w=282,align=1)
navio_card(p, MARG, "Navio A  (Combustível, Crítico)",
    [("Prioridade",40),("Espera (12h)",20),("Tipo de carga",12),("Clima favorável",12),("Logístico",10)], 94, VERDE)
navio_card(p, 470, "Navio B  (Multiuso, Baixo)",
    [("Prioridade",8),("Espera (3h)",5),("Tipo de carga",5),("Clima atenção",6),("Logístico",4)], 28, CINZA)
rect(p, MARG, 318, W-MARG, 360, VERDE, fill=(0.90,0.98,0.93), width=1.3, radius=6)
text(p, MARG+12, 330, "Resultado: o Navio A (IDA 94) é recomendado para atracar primeiro - mesmo que o Navio B (IDA 28) tenha chegado antes.", size=12.5, font=FONT_BOLD, color=(0.1,0.3,0.15), w=W-2*MARG-24)

# Slide 11 - Simulação de cenários (Req 4)
p = page(doc); header(p,11,"REQUISITO 4 · SIMULAÇÃO"); footer(p)
title(p, "Simulação de Cenários")
text(p, MARG, 84, "O sistema executa Simulação de Eventos Discretos (Poisson + serviço por tipo) para prever o comportamento da fila.", size=12.5, color=CINZA, w=W-2*MARG)
cen=[("Normal","Demanda típica\nρ ≈ 56%", VERDE),("Pico de Demanda","λ maior\nfila e espera crescem", LARANJA),("Clima Adverso","interrompe operações\nnos berços", VERMELHO)]
for i,(t,d,c) in enumerate(cen):
    x=MARG+i*250
    rect(p, x,120, x+232,230, c, fill=BRANCO, width=1.6, radius=8)
    rect(p, x,120, x+232,150, c, fill=c, width=0, radius=8)
    text(p, x,128, t, size=14, font=FONT_BOLD, color=BRANCO, w=232, align=1)
    text(p, x+10,164, d, size=12, color=(0.2,0.25,0.32), w=212, align=1, lh=1.2)
rect(p, MARG, 256, W-MARG, 300, CINZAC, fill=CINZAC, width=0, radius=5)
text(p, MARG+12, 268, "Na aba Simulação dá para alternar Normal/Pico e Re-simular (nova amostra aleatória), prevendo Wq, Lq e ρ de cada política.", size=11.5, color=CINZA, w=W-2*MARG-24)

# Slide 12 - Comparação das políticas (Req 4) com dados reais
p = page(doc); header(p,12,"REQUISITO 4 · COMPARAÇÃO"); footer(p)
title(p, "Comparação das Políticas (cenário normal)")
dados=[("FIFO",68.3,VERMELHO),("Prioridade Fixa",22.1,LARANJA),("Fila por Tipo",10.2,AMARELO),("Índice Dinâmico",10.7,VERDE)]
crit=[75.9,32.7,15.4,7.1]
x0=MARG; base=300; maxv=70; scale=180/maxv
text(p, MARG, 84, "Espera média (Wq) e espera dos navios CRÍTICOS - resultados simulados (≈120 dias).", size=11.5, color=CINZA)
for i,(t,v,c) in enumerate(dados):
    x=x0+i*150
    hh=v*scale; rect(p, x,base-hh, x+44,base, c, fill=c, width=0, radius=2)
    ch=crit[i]*scale; rect(p, x+50,base-ch, x+94,base, c, fill=BRANCO, width=1.3, radius=2)
    text(p, x-6,base+6,t,size=10,font=FONT_BOLD,color=(0.2,0.25,0.3),w=130,align=1)
    text(p, x,base-hh-15,f"{v}h",size=9.5,font=FONT_BOLD,color=c,w=44,align=1)
    text(p, x+50,base-ch-15,f"{crit[i]}h",size=9.5,font=FONT_BOLD,color=c,w=44,align=1)
p.draw_line(fitz.Point(x0,base),fitz.Point(W-MARG,base),color=CINZA,width=1)
rect(p, W-220, 120, W-MARG, 150, AZUL2, fill=BRANCO, width=1)
rect(p, W-212,128, W-196,142, AZUL2, fill=AZUL2, width=0); text(p, W-190,129,"Espera média",size=8.5,color=CINZA,w=120)
rect(p, W-110,128, W-94,142, AZUL2, fill=BRANCO, width=1.3); text(p, W-88,129,"Críticos",size=8.5,color=CINZA,w=80)
rect(p, MARG, 330, W-MARG, 372, VERDE, fill=(0.90,0.98,0.93), width=1.3, radius=6)
text(p, MARG+12, 340, "Leitura: políticas conservativas empatam na espera MÉDIA (conservação de trabalho); o IDA vence onde importa - protege os CRÍTICOS (7,1h vs 75,9h do FIFO).", size=11.5, font=FONT_BOLD, color=(0.1,0.3,0.15), w=W-2*MARG-24)

# Slide 13 - Redução de congestionamento (Req 5)
p = page(doc); header(p,13,"REQUISITO 5 · CONGESTIONAMENTO"); footer(p)
title(p, "Estratégias de Redução de Congestionamento")
bullets(p, MARG, 96, [
  "Uso do berço multiuso (B4) para absorver transbordo;",
  "Redistribuição de navios entre berços compatíveis;",
  "Priorização dinâmica (IDA) elimina o bloqueio de cabeça de fila;",
  "Simulação prévia de cenários antes da decisão;",
  "Recomendação operacional automática.",
], w=W-2*MARG, size=13)

# Slide 14 - Redistribuição entre berços (Req 5)
p = page(doc); header(p,14,"REQUISITO 5 · REDISTRIBUIÇÃO"); footer(p)
title(p, "Redistribuição entre Berços")
berco(p, MARG, 130, "B1", ocupado=True, w=110, h=70, cor=VERMELHO)
text(p, MARG, 206, "Congestionado", size=10, font=FONT_BOLD, color=VERMELHO, w=110, align=1)
p.draw_line(fitz.Point(MARG+130,165),fitz.Point(MARG+250,165),color=AZUL2,width=2.5)
p.draw_polyline([fitz.Point(MARG+243,160),fitz.Point(MARG+252,165),fitz.Point(MARG+243,170)],color=AZUL2,fill=AZUL2)
text(p, MARG+130, 140, "navio compatível", size=9.5, color=CINZA, w=120, align=1)
berco(p, MARG+260, 130, "B4", ocupado=False, w=110, h=70, cor=VERDE)
text(p, MARG+260, 206, "Multiuso (livre)", size=10, font=FONT_BOLD, color=VERDE, w=110, align=1)
bullets(p, 540, 130, ["Menor espera","Maior utilização","Menor congestionamento"], w=240, size=13, dot=VERDE)
rect(p, MARG, 250, W-MARG, 292, CINZAC, fill=CINZAC, width=0, radius=5)
text(p, MARG+12, 262, "No modelo, cada navio tem bercoCompativel (ex.: Grãos -> [B1, B4]); a alocação leva a compatibilidade em conta automaticamente.", size=11.5, color=CINZA, w=W-2*MARG-24)

# Slide 15 - Plano períodos críticos (Req 5)
p = page(doc); header(p,15,"REQUISITO 5 · PERÍODOS CRÍTICOS"); footer(p)
title(p, "Plano para Períodos Críticos")
text(p, MARG, 88, "Gatilhos", size=13, font=FONT_BOLD, color=VERMELHO)
bullets(p, MARG, 110, ["Ocupação > 85%","Clima desfavorável","Aumento repentino de chegadas"], w=350, size=12.5, dot=VERMELHO)
text(p, 460, 88, "Ações", size=13, font=FONT_BOLD, color=VERDE)
bullets(p, 460, 110, ["Ativar priorização reforçada","Utilizar o berço multiuso","Redistribuir navios","Monitorar navios críticos"], w=330, size=12.5, dot=VERDE)

# Slide 16 - Recomendações gerenciais (Req 5)
p = page(doc); header(p,16,"REQUISITO 5 · RECOMENDAÇÕES"); footer(p)
title(p, "Recomendações Gerenciais")
text(p, MARG, 86, "A página Recomendação Operacional gera automaticamente:", size=12.5, color=CINZA)
bullets(p, MARG, 112, [
  "Próximo navio a atracar + berço recomendado;",
  "Justificativa multifator (IDA) da decisão;",
  "Timeline das próximas atracações;",
  "Antecipação de gargalos e redução de congestionamentos;",
  "Suporte à tomada de decisão preventiva (não reativa).",
], w=W-2*MARG, size=13)

# Slide 17 - Demonstração
p = page(doc); header(p,17,"DEMONSTRAÇÃO"); footer(p)
title(p, "Demonstração do Sistema")
text(p, MARG, 88, "Roteiro de navegação no PortoFlow:", size=12.5, color=CINZA)
passos=["Dashboard - KPIs e fila ao vivo","Modelo de Fila - λ, μ, ρ, Erlang-C","Simulação - comparação das políticas","Berços - ocupação e clima","Recomendação - próxima atracação"]
for i,s in enumerate(passos):
    y=116+i*42
    p.draw_circle(fitz.Point(MARG+16,y+12),13,color=AZUL,fill=AZUL)
    text(p, MARG+4,y+4,str(i+1),size=13,font=FONT_BOLD,color=BRANCO,w=24,align=1)
    rect(p, MARG+40,y, MARG+520,y+30, (0.85,0.88,0.93), fill=(0.97,0.98,1.0), width=0.6, radius=4)
    text(p, MARG+52,y+7,s,size=12.5,font=FONT_BOLD,color=(0.15,0.2,0.28),w=460)

# Slide 18 - Conclusão
p = page(doc); header(p,18,"CONCLUSÃO"); footer(p)
rect(p, 0,40, W,H, AZUL, fill=AZUL, width=0)
text(p, MARG, 80, "Conclusão", size=24, font=FONT_BOLD, color=BRANCO)
rect(p, MARG, 120, W-MARG, 180, (0.16,0.27,0.6), fill=(0.16,0.27,0.6), width=0, radius=6)
text(p, MARG+14, 132, "Pergunta do desafio", size=10, font=FONT_BOLD, color=(0.7,0.8,1.0), w=W-2*MARG-28)
text(p, MARG+14, 148, "Como modelar matematicamente as incertezas operacionais do Porto do Itaqui e definir uma política eficiente de priorização e sequenciamento?", size=12.5, color=BRANCO, w=W-2*MARG-28)
text(p, MARG, 210, "Nossa resposta", size=11, font=FONT_BOLD, color=AZUL2)
text(p, MARG, 230,
  "Modelamos o porto como uma fila M/G/4 com prioridade não preemptiva e restrições de compatibilidade, "
  "e desenvolvemos o Índice Dinâmico de Atracação (IDA) - uma função de priorização multicritério que "
  "considera prioridade, espera, tipo de carga, clima, impacto logístico e compatibilidade. "
  "Resultado: protege os navios críticos, melhora a utilização dos berços e reduz o congestionamento.",
  size=14, color=BRANCO, w=W-2*MARG, lh=1.4)
agua(p, H-70, H); navio(p, W-130, H-66, 1.3)

doc.save("/home/user/fitphoneclaude/docs/PortoFlow_Slides.pdf")
print("Slides:", doc.page_count, "páginas")
doc.close()
