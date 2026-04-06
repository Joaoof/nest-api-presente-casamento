import * as dotenv from 'dotenv';
dotenv.config();

import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed...');

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error('Variáveis ADMIN_USERNAME e ADMIN_PASSWORD são obrigatórias');
  }

  let admin = await prisma.admin.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (!admin) {
    const saltBytes = randomBytes(16);
    const salt = saltBytes.toString('hex');
    const hashedPassword = await argon2.hash(ADMIN_PASSWORD, { salt: saltBytes });

    admin = await prisma.admin.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        salt,
      },
    });
    console.log('🎉 Admin criado com sucesso.');
  } else {
    console.log(`✅ Admin "${ADMIN_USERNAME}" já existe.`);
  }

  const existingGiftsCount = await prisma.gift.count();
  if (existingGiftsCount > 0) {
    console.log(`✅ ${existingGiftsCount} presentes já cadastrados. Pulando seed de presentes.`);
    return;
  }

  const gifts = [
    // ─── PARA A SALA ───────────────────────────────────────────────────────────
    {
      name: 'Televisão',
      description:
        'Smart TV 4K de 55" para a sala de estar. Proporciona imagem nítida e brilhante para filmes, séries e jogos em família com resolução Ultra HD.',
      price: 3200.0,
      imageUrl:
        'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Home Theater',
      description:
        'Sistema de som surround 5.1 com subwoofer para uma experiência cinematográfica em casa. Transforma qualquer filme em uma vivência inesquecível.',
      price: 1800.0,
      imageUrl:
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Sofá para Televisão',
      description:
        'Sofá retrátil e reclinável de 3 lugares, ideal para assistir televisão com conforto. Estofamento em tecido suede de alta durabilidade.',
      price: 2500.0,
      imageUrl:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Rack para Televisão',
      description:
        'Rack moderno em MDF com suporte para TV de até 65", gavetas e nichos para organizar aparelhos eletrônicos, controles e decoração.',
      price: 750.0,
      imageUrl:
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Puff',
      description:
        'Puff redondo em suede para sala ou quarto. Versátil, serve como apoio para os pés, assento extra ou pequena mesa de apoio.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Sofá para Sala de Visitas',
      description:
        'Sofá de 2 ou 3 lugares elegante para receber visitas com estilo. Design atemporal que combina com diferentes estilos de decoração.',
      price: 2800.0,
      imageUrl:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Poltronas',
      description:
        'Par de poltronas confortáveis com braços estofados, perfeitas para leitura ou conversas na sala de estar. Estrutura em madeira maciça.',
      price: 950.0,
      imageUrl:
        'https://images.unsplash.com/photo-1586158218-9660c7a31e4b?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Mesa de Centro',
      description:
        'Mesa de centro em vidro temperado e estrutura metálica. Peça central da sala que une funcionalidade e design contemporâneo.',
      price: 550.0,
      imageUrl:
        'https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Dock Station',
      description:
        'Dock station multifuncional com carregamento sem fio, múltiplas portas USB e HDMI para conectar notebooks, celulares e demais dispositivos.',
      price: 450.0,
      imageUrl:
        'https://images.unsplash.com/photo-1593640408182-31c228f6d3e9?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Ventilador',
      description:
        'Ventilador de torre silencioso com controle remoto, timer e 3 velocidades. Ideal para renovar o ar da sala com baixo consumo de energia.',
      price: 320.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Tapetes',
      description:
        'Tapete decorativo para sala de estar em fibra sintética antialérgica, lavável e resistente. Delimita o espaço e adiciona aconchego ao ambiente.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1567016432781-6ac1d6f72c52?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Mesa de Jantar 4 Lugares',
      description:
        'Mesa de jantar retangular para 4 pessoas em madeira maciça com tampo de vidro. O coração da casa para reunir família e amigos nas refeições.',
      price: 1600.0,
      imageUrl:
        'https://images.unsplash.com/photo-1549497538-d233618e5f48?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },

    // ─── PARA O QUARTO ─────────────────────────────────────────────────────────
    {
      name: 'Cama',
      description:
        'Cama de casal (queen size 1,58m x 1,98m) com cabeceira estofada em courino. Base box com regulagem de altura e ótima sustentação do colchão.',
      price: 1800.0,
      imageUrl:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Protetor de Colchão',
      description:
        'Protetor de colchão impermeável queen size em microfibra matelassê. Protege o colchão de líquidos, ácaros e alérgenos, prolongando sua vida útil.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1567538096-a4035b85deaa?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Lençol',
      description:
        'Jogo de lençol queen com elástico em algodão egípcio 400 fios. Toque macio e fresco, lavagem fácil e cor duradoura para um sono reparador.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1567538096-a4035b85deaa?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Edredom',
      description:
        'Edredom queen em plumas de micropoliéster hipoalergênico com forro de algodão. Leve e quentinho, ideal para noites frias do casal.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Colcha',
      description:
        'Colcha de casal em matelassê com acabamento em renda ou bordado. Dá um toque elegante e sofisticado ao quarto do casal.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Travesseiros',
      description:
        'Par de travesseiros 50x70cm em fibra siliconada antialérgica com capa 100% algodão. Suporte ideal para o pescoço e sono de qualidade.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1547555999-7c8b944e76f2?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Protetor de Travesseiro',
      description:
        'Kit com 2 protetores de travesseiro impermeáveis em bico de pato. Protegem os travesseiros de suor, ácaros e alérgenos com total higiene.',
      price: 80.0,
      imageUrl:
        'https://images.unsplash.com/photo-1547555999-7c8b944e76f2?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Almofadas',
      description:
        'Conjunto de almofadas decorativas para cama e sofá em tecidos variados. Dão charme e personalidade ao quarto ou sala de estar.',
      price: 120.0,
      imageUrl:
        'https://images.unsplash.com/photo-1538961310671-ae7df2e5c9e6?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Tapete (Quarto)',
      description:
        'Tapete felpudo e macio para o quarto do casal, proporcionando conforto ao pisar ao acordar. Material hipoalergênico e de fácil limpeza.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1567016432781-6ac1d6f72c52?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },

    // ─── PARA O BANHEIRO ───────────────────────────────────────────────────────
    {
      name: 'Toalhas de Banho',
      description:
        'Jogo de toalhas de banho em algodão 100% com 4 peças (2 de banho + 2 de rosto). Alta absorção, maciez e secagem rápida para o dia a dia.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Toalha de Rosto',
      description:
        'Kit com 4 toalhas de rosto em algodão penteado com bordado decorativo. Suaves, absorventes e resistentes a múltiplas lavagens.',
      price: 80.0,
      imageUrl:
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Tapete de Banheiro',
      description:
        'Tapete antiderrapante para banheiro em algodão felpudo com base emborrachada. Seguro, macio e elegante para o seu banheiro.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Kit de Acessórios para Banheiro',
      description:
        'Kit com 5 peças em aço inox: saboneteira, porta-escova, copo, suporte de papel higiênico e gancho. Design moderno e acabamento impecável.',
      price: 320.0,
      imageUrl:
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Cesto para Roupa Suja',
      description:
        'Cesto aramado com tampa e alça em bambu natural para roupa suja. Organizado e ventilado, evita odores e mau cheiro no banheiro.',
      price: 120.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Cesto de Lixo (Banheiro)',
      description:
        'Lixeira de 5L em inox com tampa basculante para banheiro. Design minimalista e de fácil limpeza, combina com qualquer decoração.',
      price: 75.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },

    // ─── PARA A COZINHA ────────────────────────────────────────────────────────
    {
      name: 'Geladeira',
      description:
        'Geladeira frost-free duplex 400L com painel digital, função freezer e dispenser de água. Tecnologia de eficiência energética A+ para economia na conta de luz.',
      price: 3200.0,
      imageUrl:
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Fogão',
      description:
        'Fogão 5 bocas com forno grande e acendimento automático. Grades de ferro fundido, mesa de vidro temperado e timer digital para cozinhar com praticidade.',
      price: 1800.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Batedeira',
      description:
        'Batedeira planetária 600W com tigela de 4,5L em aço inox e 10 velocidades. Ideal para bolos, pão, chantilly e massas em geral. Vem com 3 batedores.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1578898886595-17cf0bd5fbb5?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Cafeteira',
      description:
        'Cafeteira expresso automática com moedor integrado, vaporizador de leite e painel digital. Prepara cappuccino, latte e espresso com grãos frescos.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472359-6f500f6c5d0c?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Centrífuga de Alimentos',
      description:
        'Centrífuga de alimentos 300W com cesto em aço inox e bico extrator reversível. Extrai suco puro de frutas e legumes com mínimo desperdício.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Exaustor ou Coifa',
      description:
        'Coifa de parede 90cm em inox com 3 velocidades, iluminação LED e filtro de carvão ativo. Elimina fumaça, gordura e odores da cozinha de forma eficiente.',
      price: 750.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Micro-ondas',
      description:
        'Micro-ondas 30L com grill, 10 funções pré-programadas e trava de segurança. Aquece, descongela e gratina com precisão e praticidade no dia a dia.',
      price: 580.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Mini Forno Elétrico',
      description:
        'Mini forno elétrico 44L com convecção, grill e 12 funções. Assa pizzas, bolos, tortas e gratiná em menos tempo e com sabor profissional.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Liquidificador',
      description:
        'Liquidificador de alta potência 1000W com copo de vidro temperado 2L e 5 velocidades. Tritura gelo, prepara vitaminas, smoothies e molhos com facilidade.',
      price: 220.0,
      imageUrl:
        'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Multiprocessador',
      description:
        'Multiprocessador de alimentos 800W com 8 discos e acessórios para fatiar, ralar, picar e bater. Facilita o preparo de saladas, pães e massas.',
      price: 320.0,
      imageUrl:
        'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Sanduicheira',
      description:
        'Sanduicheira e grill elétrico com placas antiaderentes removíveis e controler de temperatura. Prepara sanduíches quentes, paninis e grelhados em minutos.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1484723091739-30f299f8e3e0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Torradeira',
      description:
        'Torradeira elétrica com 7 níveis de tostagem, cancelamento automático e bandeja coletora de migalhas removível. Para cafés da manhã perfeitos todo dia.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1484723091739-30f299f8e3e0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Chaleira Elétrica',
      description:
        'Chaleira elétrica 1,7L em aço inox com desligamento automático, filtro anti-calcário e base 360°. Ferve água em menos de 3 minutos para chá e café.',
      price: 120.0,
      imageUrl:
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Panela Elétrica de Arroz',
      description:
        'Panela elétrica para arroz 5 xícaras com função manter aquecido, cuba antiaderente e copo medidor. Cozinha arroz, mingau e legumes no vapor.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Faqueiro 36 Peças',
      description:
        'Faqueiro completo 36 peças em aço inox com cabo em polipropileno. Inclui facas, garfos, colheres e colheres de sobremesa para o serviço do dia a dia.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Pratos Rasos',
      description:
        'Jogo com 6 pratos rasos de porcelana 27cm com borda em relevo. Resistentes, elegantes e adequados para uso diário e recepções especiais.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Pratos Fundos',
      description:
        'Jogo com 6 pratos fundos de porcelana para sopas, caldos e massas. Com borda decorada e capacidade de 500ml, combinam elegância e praticidade.',
      price: 250.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Pratos de Sobremesa',
      description:
        'Jogo com 6 pratos de sobremesa em porcelana 20cm. Perfeitos para servir tortas, bolos e doces com charme nas confraternizações.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Copos',
      description:
        'Jogo com 6 copos de vidro cristal 350ml para água e sucos. Transparência brilhante, resistência ao calor e visual sofisticado para a mesa.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Taças',
      description:
        'Jogo com 6 taças de cristal para vinho tinto 450ml. Haste fina e design elegante que realçam as cores e os aromas do vinho em momentos especiais.',
      price: 220.0,
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Taças de Sobremesa',
      description:
        'Jogo com 6 taças de vidro para sobremesas, sorvetes e mousses. Formato clássico com haste curta, prático e elegante para servir doces.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Café',
      description:
        'Aparelho de café em porcelana com 12 peças: 6 xícaras e 6 pires com decoração floral. Perfeito para receber visitas com aquele cafezinho especial.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472359-6f500f6c5d0c?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Facas',
      description:
        'Jogo com 5 facas profissionais em aço inox com cabo ergonômico e suporte de madeira. Inclui faca do chef, de pão, de legumes, desossar e de peixe.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Assadeiras',
      description:
        'Kit com 3 assadeiras em aço carbono antiaderente nos tamanhos P, M e G. Ideais para bolos, pães, lasanhas e assados de carne no forno.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Frigideira',
      description:
        'Frigideira antiaderente 28cm em alumínio fundido com revestimento de cerâmica e cabo baquelite. Distribui calor uniformemente e é fácil de limpar.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Jogo de Panelas',
      description:
        'Conjunto com 7 panelas antiaderentes em alumínio com tampas de vidro. Inclui caçarola, fervedor, frigideira, leiteira e panela de pressão — tudo que precisa na cozinha.',
      price: 580.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Panela de Pressão',
      description:
        'Panela de pressão 4,5L em alumínio polido com válvula de segurança e travas de travamento duplo. Cozinha feijão, carnes e legumes com rapidez e segurança.',
      price: 230.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Garrafa Térmica',
      description:
        'Garrafa térmica 1L em inox com dupla parede a vácuo. Mantém líquidos quentes por 12h e frios por 24h. Ideal para água gelada, café e chá.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Travessas',
      description:
        'Jogo com 3 travessas ovais em porcelana nos tamanhos P, M e G com borda dourada. Ideais para servir carnes, massas e saladas em ocasiões especiais.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Saleiro',
      description:
        'Saleiro e pimenteiro em cerâmica com tampa de madeira e moedor embutido. Design rústico-moderno que decora a mesa e facilita o uso durante as refeições.',
      price: 70.0,
      imageUrl:
        'https://images.unsplash.com/photo-1578998248267-d93a9fc6a72f?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Jarra de Água',
      description:
        'Jarra de vidro borossilicato 1,5L com tampa e bico filtrante. Serve água gelada com frutas, sucos e chás com estilo e praticidade à mesa.',
      price: 120.0,
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Tábua para Cortar Carne',
      description:
        'Tábua de madeira maciça de bambu 40x28cm com sulco de suco e alças laterais. Resistente, antibacteriana e um item fundamental para preparar e servir carnes.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Fruteira',
      description:
        'Fruteira de bancada aramada em 3 níveis para frutas, pães e legumes. Design aberto que favorece a ventilação e conserva os alimentos por mais tempo.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1474719419851-7e9f7b0c1256?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Balde de Gelo',
      description:
        'Balde de gelo 1,5L em inox com alça, tenaz e tampa. Mantém o gelo por horas — perfeito para recepções, drinks e momentos de celebração em casal.',
      price: 70.0,
      imageUrl:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Petisqueira',
      description:
        'Petisqueira com 4 compartimentos em ardósia natural e tábua de bambu. Para servir frios, queijos, antepastos e petiscos com elegância nas reuniões.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Pegador de Macarrão',
      description:
        'Pegador de macarrão em aço inox 28cm com dentes espaçados que prendem e servem a massa sem soltá-la. Resistente ao calor e de fácil lavagem.',
      price: 45.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Pegador de Salada',
      description:
        'Par de pegadores de salada em bambu natural 30cm. Leves, resistentes e ecológicos — ideais para misturar e servir saladas sem amassar as folhas.',
      price: 55.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Concha Grande',
      description:
        'Concha de sopa grande em aço inox 32cm com cabo longo e gancho. Essencial para servir caldos, sopas e feijão com higiene e sem respingos.',
      price: 55.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Concha Pequena',
      description:
        'Concha de molho pequena em aço inox 22cm com cabo curto. Perfeita para servir molhos, caldas e coberturas com precisão sem sujar a mesa.',
      price: 45.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Açucareiro',
      description:
        'Açucareiro de cerâmica com tampa e colher inclusa. Mantém o açúcar sequinho e livre de umidade, com design que combina com a jarra e xícaras.',
      price: 70.0,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472359-6f500f6c5d0c?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Potes para Temperos',
      description:
        'Kit com 6 potes de vidro com tampa hermética para armazenar sal, orégano, páprica e outros temperos. Etiquetas incluídas para identificar cada um.',
      price: 110.0,
      imageUrl:
        'https://images.unsplash.com/photo-1578998248267-d93a9fc6a72f?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Escorredor de Louça',
      description:
        'Escorredor de louça de aço inox com bandeja coletora de água e compartimentos para pratos, copos e talheres. Organiza e seca as peças com praticidade.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Balança de Cozinha',
      description:
        'Balança digital de precisão 5kg com display LCD e plataforma de vidro temperado. Mede em gramas e onças para receitas precisas e controle de porções.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Kit Churrasco',
      description:
        'Kit churrasco 8 peças em aço inox com cabo de madeira: garfo, espátula, faca, pegador, pinça, escova, espeto e avental. Para o churrasqueiro de plantão.',
      price: 380.0,
      imageUrl:
        'https://images.unsplash.com/photo-1530595780386-4fd38d29b4ab?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Acessórios para Pizza',
      description:
        'Kit para pizza com pedra refratária, rolo de massa, cortador de aço inox e pá de madeira. Tudo para fazer pizzas artesanais deliciosas em casa.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Bowls',
      description:
        'Conjunto com 6 bowls de porcelana em tamanhos variados para sopas, cereais, açaí e saladas. Design moderno e versátil para o dia a dia na cozinha.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1565538024049-3769ca13c073?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },

    // ─── DECORAÇÃO ─────────────────────────────────────────────────────────────
    {
      name: 'Tapetes (Decoração)',
      description:
        'Tapete decorativo persa em lã e viscose com estampas geométricas. Peça de destaque que transforma qualquer cômodo em um espaço elegante e acolhedor.',
      price: 200.0,
      imageUrl:
        'https://images.unsplash.com/photo-1567016432781-6ac1d6f72c52?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Almofadas Decorativas',
      description:
        'Kit com 4 almofadas decorativas em veludo e linho com enchimento em fibra siliconada. Diferentes tamanhos e texturas para compor o sofá com personalidade.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1538961310671-ae7df2e5c9e6?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Abajur',
      description:
        'Abajur de piso em tecido com base em madeira torneada. Iluminação indireta e aconchegante para sala ou quarto, criando um ambiente intimista e elegante.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Vasos',
      description:
        'Conjunto de vasos em cerâmica artesanal em diferentes alturas para plantas e flores naturais ou artificiais. Adiciona vida e cor a qualquer ambiente da casa.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Porta-retratos',
      description:
        'Conjunto de porta-retratos de madeira e metal em diferentes formatos e tamanhos. Para eternizar as memórias mais especiais do casal nas paredes da casa.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Castiçal',
      description:
        'Par de castiçais em ferro fundido e madeira rústica para velas de 7 e 14 dias. Criam uma atmosfera romântica e elegante para jantares especiais a dois.',
      price: 70.0,
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },

    // ─── ESCRITÓRIO ────────────────────────────────────────────────────────────
    {
      name: 'Escrivaninha',
      description:
        'Escrivaninha em L de 1,50m x 1,20m em MDF com gavetas, suporte para monitor e passagem de cabos. Ergonômica e espaçosa para home office produtivo.',
      price: 750.0,
      imageUrl:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Cadeira para Escritório',
      description:
        'Cadeira ergonômica com assento e encosto regulável em altura, apoio lombar e braços ajustáveis. Revestimento em mesh respirável para longas jornadas de trabalho.',
      price: 580.0,
      imageUrl:
        'https://images.unsplash.com/photo-1592899677977-9371b0bbb970?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Kit de Escrivaninha',
      description:
        'Kit de acessórios para escrivaninha: porta-canetas, porta-clips, bloco de notas, suporte de celular e organizador de documentos. Tudo em estilo minimalista.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Lixeira (Escritório)',
      description:
        'Lixeira de 12L em inox com pedal e balde interno removível para o escritório. Design clean e funcional que combina com qualquer decoração.',
      price: 70.0,
      imageUrl:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Impressora',
      description:
        'Impressora multifuncional Wi-Fi com scanner, copiadora e fax. Impressão colorida e em preto e branco de alta qualidade, conectividade sem fio e duplex automático.',
      price: 580.0,
      imageUrl:
        'https://images.unsplash.com/photo-1612815148729-e7cbaaf22c3c?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Modem / Roteador Wi-Fi',
      description:
        'Roteador Wi-Fi 6 dual band com velocidade de até 3Gbps, 4 antenas externas e cobertura de até 200m². Conecta toda a casa com internet rápida e estável.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1593640408182-31c228f6d3e9?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },

    // ─── LAVANDERIA ────────────────────────────────────────────────────────────
    {
      name: 'Aspirador de Pó',
      description:
        'Aspirador de pó vertical sem fio 25V com filtro HEPA e bateria de lítio para 60 minutos de uso. Leve, potente e silencioso para limpeza de pisos e tapetes.',
      price: 550.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Tábua de Passar Roupa',
      description:
        'Tábua de passar roupa regulável em 4 alturas com revestimento metálico e cobertura resistente ao calor. Estrutura robusta e pés antiderrapantes para uso diário.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Ferro de Passar Roupa',
      description:
        'Ferro de passar a vapor 2600W com sola de cerâmica antiaderente, reservatório de 300ml e função auto-limpeza. Elimina amassados e rugas com agilidade.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Máquina de Lavar Roupas',
      description:
        'Máquina de lavar 12kg com 16 programas de lavagem, tecnologia inverter e tambor de aço inox. Silenciosa, econômica e essencial para o novo lar do casal.',
      price: 2500.0,
      imageUrl:
        'https://images.unsplash.com/photo-1626806851600-60c44dd8bff2?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Secadora de Roupas',
      description:
        'Secadora de roupas 11kg com sensor de umidade, 8 programas e sistema de ar aquecido. Seca roupas com delicadeza e eficiência, mesmo nos dias de chuva.',
      price: 1900.0,
      imageUrl:
        'https://images.unsplash.com/photo-1626806851600-60c44dd8bff2?w=400&h=400&fit=crop&q=80',
      priority: 'Alta',
      adminId: admin.id,
    },
    {
      name: 'Varal',
      description:
        'Varal de chão em alumínio extensível com 24 metros de corda e hastes laterais. Compacto ao dobrar, suporta até 15kg e é ideal para uso interno ou externo.',
      price: 90.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Armário Multiuso',
      description:
        'Armário multiuso de aço com 2 portas e 4 prateleiras reguláveis para lavanderia ou depósito. Organiza produtos de limpeza, ferramentas e itens de casa.',
      price: 480.0,
      imageUrl:
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
    {
      name: 'Cesto de Lixo Grande',
      description:
        'Lixeira de 50L com pedal, tampa basculante e balde interno em plástico reciclado para área de serviço ou cozinha. Higiênica, durável e de fácil esvaziamento.',
      price: 130.0,
      imageUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Escada de Alumínio',
      description:
        'Escada dobrável de alumínio 5 degraus com degraus largos antiderrapantes e suporte de até 120kg. Segura e leve para trocas de lâmpadas e organização em altura.',
      price: 180.0,
      imageUrl:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
      priority: 'Baixa',
      adminId: admin.id,
    },
    {
      name: 'Kit de Ferramentas',
      description:
        'Kit de ferramentas 100 peças com maleta organizadora: martelo, chaves de fenda, alicates, chaves allen, fita métrica, nível e brocas. Indispensável no novo lar.',
      price: 280.0,
      imageUrl:
        'https://images.unsplash.com/photo-1581783898914-4e4750e14cd4?w=400&h=400&fit=crop&q=80',
      priority: 'Média',
      adminId: admin.id,
    },
  ];

  await prisma.gift.createMany({ data: gifts });
  console.log(`🎁 ${gifts.length} presentes cadastrados com sucesso!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
