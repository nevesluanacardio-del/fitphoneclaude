# -*- coding: utf-8 -*-
"""Gera o Board CO-LAB (Trilha) do Desafio 4.0 — Equipe, em PDF paisagem."""
import fitz

AZUL=(0.118,0.227,0.541); AZUL2=(0.231,0.510,0.965); VERDE=(0.086,0.639,0.290)
VERMELHO=(0.937,0.267,0.267); LARANJA=(0.976,0.451,0.086); ROXO=(0.55,0.36,0.96)
CINZA=(0.30,0.36,0.45); BRANCO=(1,1,1)
W,H=842,595; MARG=30
DEJ="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; DEJB="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
R="dvu"; B="dvb"

def text(p,x,y,s,size=10,font=R,color=(0,0,0),w=400,align=0,lh=1.2):
    p.insert_textbox(fitz.Rect(x,y,x+w,y+3000),s,fontsize=size,fontname=font,color=color,align=align,lineheight=lh)
def box(p,x,y,w,h,cor,titulo,itens,fill=(1,1,1),size=8.7):
    p.draw_rect(fitz.Rect(x,y,x+w,y+h),color=cor,fill=fill,width=1.3,radius=0.04)
    p.draw_rect(fitz.Rect(x,y,x+w,y+22),color=cor,fill=cor,width=0)
    text(p,x+10,y+5,titulo,size=10.5,font=B,color=BRANCO,w=w-20)
    yy=y+30
    if isinstance(itens,str):
        text(p,x+10,yy,itens,size=size,color=(0.15,0.2,0.28),w=w-20,lh=1.25)
    else:
        for it in itens:
            p.draw_circle(fitz.Point(x+13,yy+5),2,color=cor,fill=cor)
            text(p,x+22,yy,it,size=size,color=(0.15,0.2,0.28),w=w-32,lh=1.2)
            lines=max(1,int(len(it)/((w-32)/(size*0.52)))+1); yy+=lines*size*1.2+3

doc=fitz.open(); p=doc.new_page(width=W,height=H)
p.insert_font(fontname=R,fontfile=DEJ); p.insert_font(fontname=B,fontfile=DEJB)
# Cabeçalho
p.draw_rect(fitz.Rect(0,0,W,52),color=AZUL,fill=AZUL,width=0)
text(p,MARG,10,"Board CO-LAB — Desafio 4.0 · Teoria das Filas",size=16,font=B,color=BRANCO,w=600)
text(p,MARG,33,"Equipe: Anna Carolyna · Artho Eduardo · Clarissa Camurça · Gabriel Muller",size=9.5,color=(0.8,0.86,1.0),w=600)
text(p,W-260,14,"Porto do Itaqui · PortoFlow 4.0",size=11,font=B,color=(0.8,0.86,1.0),w=230,align=2)

# Problema (faixa larga)
box(p,MARG,62,W-2*MARG,70,AZUL,"PROBLEMA",
 "O Porto do Itaqui enfrenta aumento na demanda de atracação, com formação de filas marítimas, maior tempo médio de espera e conflitos de prioridade entre tipos de carga e operadores. Desafio: criar uma política de sequenciamento eficiente considerando chegadas aleatórias, restrições dos berços, prioridades legais/contratuais, tempo de operação e interferências climáticas.",
 fill=(0.95,0.97,1.0),size=9.5)

col=(W-2*MARG-20)/2
# Causas
box(p,MARG,142,col,150,LARANJA,"CAUSAS",[
 "Crescimento do fluxo (grãos, contêineres, combustíveis, institucional).",
 "Chegadas aleatórias, sem previsibilidade de horário.",
 "Tempos de operação diferentes por tipo de carga.",
 "Berços com restrições: alguns navios só operam em certos berços.",
 "Prioridades legais, estratégicas e contratuais competindo.",
 "Clima que pode interromper/atrasar operações.",
 "Ausência de ferramenta preditiva de cenários.",
],fill=(1.0,0.97,0.93))
# Consequências
box(p,MARG+col+20,142,col,150,VERMELHO,"CONSEQUÊNCIAS",[
 "Aumento do tempo médio de espera para atracação.",
 "Congestionamento marítimo em alta demanda.",
 "Ociosidade de berços (navio incompatível na frente da fila).",
 "Conflitos entre operadores por prioridade.",
 "Atrasos na cadeia logística do corredor Norte-Nordeste.",
 "Decisões operacionais reativas, não preventivas.",
 "Dificuldade de prever cenários críticos.",
],fill=(1.0,0.95,0.95))

# Alternativas
box(p,MARG,302,col,210,AZUL2,"ALTERNATIVAS LEVANTADAS",[
 "1. Manter FIFO, com exceções para prioridades máximas.",
 "2. Criar filas separadas por tipo de carga.",
 "3. Definir janelas fixas de atracação por operador/tipo.",
 "4. Usar o berço multiuso para reduzir gargalos.",
 "5. Criar simulação computacional da fila para testar cenários.",
 "6. Implantar política híbrida de priorização por pontuação dinâmica.",
 "7. Criar pré-fila virtual (clima, urgência, contrato, carga, compatibilidade).",
],fill=(0.95,0.97,1.0))
# Solução priorizada
x=MARG+col+20
p.draw_rect(fitz.Rect(x,302,x+col,512),color=VERDE,fill=(0.93,0.99,0.95),width=2,radius=0.03)
p.draw_rect(fitz.Rect(x,302,x+col,326),color=VERDE,fill=VERDE,width=0)
text(p,x+10,307,"SOLUÇÃO PRIORIZADA",size=10.5,font=B,color=BRANCO,w=col-20)
text(p,x+10,334,"Sistema de Sequenciamento por Índice Dinâmico de Atracação (IDA)",size=11,font=B,color=AZUL,w=col-20,lh=1.1)
text(p,x+10,366,"Não usa apenas a ordem de chegada: calcula uma pontuação para cada navio antes de definir a próxima atracação. O índice considera:",size=8.7,color=(0.12,0.3,0.18),w=col-20,lh=1.25)
fat=["prioridade legal ou estratégica","prioridade contratual","compatibilidade com o berço disponível","tempo de espera acumulado","tipo de carga","tempo estimado de operação","risco climático","impacto logístico do atraso"]
yy=410
for i,fl in enumerate(fat):
    cx=x+14+(i%2)*(col/2); 
    p.draw_circle(fitz.Point(cx,yy+5+(i//2)*15),2,color=VERDE,fill=VERDE)
    text(p,cx+8,yy+(i//2)*15,fl,size=8.5,color=(0.12,0.3,0.18),w=col/2-20)
text(p,x+10,495,"O navio com maior pontuação viável é recomendado para atracação.",size=8.8,font=B,color=VERDE,w=col-20)

# Rodapé
text(p,MARG,H-18,"Trilha CO-LAB · Modelagem conceitual do problema (P1)",size=8,color=CINZA,w=600)
doc.save("/home/user/fitphoneclaude/docs/PortoFlow_Board.pdf"); print("Board:",doc.page_count,"página(s)"); doc.close()
