import pygame
import random

pygame.init()

LARGURA = 500
ALTURA = 600
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Space Shooter - Projeto Didatico")
relogio = pygame.time.Clock()

PRETO = (10, 10, 30)
BRANCO = (255, 255, 255)
AZUL = (100, 100, 255)
VERMELHO = (255, 70, 70)
AMARELO = (255, 255, 0)

nave_x = 225
nave_y = 520
velocidade_nave = 5

inimigo_x = random.randint(0, LARGURA - 40)
inimigo_y = 0
velocidade_inimigo = 3

tiro_x = 0
tiro_y = 0
tiro_ativo = False

pontos = 0
fonte = pygame.font.SysFont("Arial", 25)

rodando = True
while rodando:
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            rodando = False

        if evento.type == pygame.KEYDOWN:
            if evento.key == pygame.K_SPACE and not tiro_ativo:
                tiro_x = nave_x + 22
                tiro_y = nave_y
                tiro_ativo = True

    teclas = pygame.key.get_pressed()

    if teclas[pygame.K_LEFT]:
        nave_x -= velocidade_nave
    if teclas[pygame.K_RIGHT]:
        nave_x += velocidade_nave

    nave_x = max(0, min(nave_x, LARGURA - 50))

    inimigo_y += velocidade_inimigo
    if inimigo_y > ALTURA:
        inimigo_y = 0
        inimigo_x = random.randint(0, LARGURA - 40)

    if tiro_ativo:
        tiro_y -= 8
        if tiro_y < 0:
            tiro_ativo = False

    if tiro_ativo:
        tiro_rect = pygame.Rect(tiro_x, tiro_y, 5, 15)
        inimigo_rect = pygame.Rect(inimigo_x, inimigo_y, 40, 40)

        if tiro_rect.colliderect(inimigo_rect):
            pontos += 1
            tiro_ativo = False
            inimigo_y = 0
            inimigo_x = random.randint(0, LARGURA - 40)

    tela.fill(PRETO)

    pygame.draw.polygon(
        tela,
        AZUL,
        [
            (nave_x + 25, nave_y),
            (nave_x, nave_y + 40),
            (nave_x + 50, nave_y + 40),
        ],
    )

    pygame.draw.rect(tela, VERMELHO, (inimigo_x, inimigo_y, 40, 40))

    if tiro_ativo:
        pygame.draw.rect(tela, AMARELO, (tiro_x, tiro_y, 5, 15))

    texto = fonte.render(f"Pontos: {pontos}", True, BRANCO)
    tela.blit(texto, (10, 10))

    pygame.display.update()
    relogio.tick(60)

pygame.quit()
