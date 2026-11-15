/* TPTV · Especies (Pecedex), normativa y checklist.
   Normativa y tallas: Decreto 205/2023 (BOJA 169), RD 347/2011, tabla de tallas de la Junta (v6, agosto 2025),
   Reglamento (UE) 2019/1241, RD 560/1995, PORN del Estrecho (Decreto 130/2024), RD 214/2026 (PescaREC). Consulta: 15/11/2026.
   Nombres locales: catálogo de especies pesqueras de la Junta. Meses, cebos, consejos y rareza: saber práctico (orientativo). */
(function () {
  // Rareza (1-5 ★): lo difícil que es verla o sacarla desde costa en la zona
  const TIERS = ['', 'Común', 'Habitual', 'Poco común', 'Rara', 'Legendaria'];
  // [id, nombre, otros nombres, científico, tallaMed, tallaAtl, fuente talla, nota, meses, mejor momento, cebos, técnicas, hábitat, tamaño, truco, peligro, mesa, rareza]
  const R = [
    // Espáridos
    ['dorada', 'Dorada', ['dorá', 'zapatilla'], 'Sparus aurata', 20, 19, 'Junta 2025 (UE y RD 560/1995)', null, [3, 4, 5, 9, 10, 11], 'Llenante con mareas vivas y agua tomada', ['cangrejo', 'navaja', 'mejillón', 'gusana'], ['surfcasting', 'fondo', 'corcheo'], ['playa', 'roca', 'puerto', 'estuario'], '25-40 cm', 'Dale tiempo antes de clavar: primero tantea.', null, 5, 3],
    ['sargo', 'Sargo', ['sargo blanco', 'charrán', 'chapetón'], 'Diplodus sargus', 23, null, 'Junta 2025 (UE)', 'Sin talla legal en el Golfo de Cádiz: usa 23 cm igual.', [10, 11, 12, 1, 2, 3, 4], 'Espuma sobre la piedra, de noche y al alba', ['mejillón', 'cangrejo', 'gusana', 'masilla'], ['rockfishing', 'corcheo', 'fondo'], ['roca', 'puerto'], '20-35 cm', 'Sácalo rápido o te corta en la piedra.', null, 4, 2],
    ['sargo-picudo', 'Sargo picudo', ['picúo', 'sargo soldao'], 'Diplodus puntazzo', 18, null, 'Junta 2025 (UE)', null, [9, 10, 11, 12, 1, 2], 'Escolleras con mar movida, al atardecer', ['mejillón', 'gamba', 'cangrejo'], ['rockfishing', 'corcheo'], ['roca', 'puerto'], '20-35 cm', 'Desconfiado: hilo fino y poco plomo.', null, 4, 3],
    ['sargo-breado', 'Sargo breado', ['sargo capote', 'futbolista'], 'Diplodus cervinus', 15, null, 'Junta 2025 (RD 560/1995)', null, [5, 6, 7, 8, 9, 10], 'Piedra profunda con agua templada', ['cangrejo', 'gamba', 'mejillón'], ['rockfishing', 'fondo'], ['roca'], '30-45 cm', 'Tira muchísimo: equipo sobrado.', null, 3, 3],
    ['mojarra', 'Mojarra', ['pageces', 'vidriera'], 'Diplodus vulgaris', 18, null, 'Junta 2025 (UE)', null, [9, 10, 11, 12, 1, 2, 3, 4, 5], 'Piedra y puerto, mejor al atardecer', ['gusana', 'mejillón', 'gamba'], ['corcheo', 'LRF', 'rockfishing'], ['roca', 'puerto'], '15-25 cm', 'Anzuelo del 8 al 10. Van en grupo.', null, 4, 1],
    ['raspallon', 'Raspallón', ['alfajoa'], 'Diplodus annularis', 12, null, 'Junta 2025 (UE y RD 560/1995)', null, [5, 6, 7, 8, 9, 10], 'Puertos y praderas, de día', ['gusana', 'pan', 'gamba'], ['LRF', 'corcheo'], ['puerto'], '10-15 cm', 'Ladrón de cebos. Ideal para críos.', null, 2, 1],
    ['herrera', 'Herrera', ['mabra'], 'Lithognathus mormyrus', 20, null, 'Junta 2025 (UE)', null, [5, 6, 7, 8, 9, 10], 'Arena con poca resaca, alba y anochecer', ['gusana', 'coquina', 'navaja'], ['surfcasting'], ['playa'], '20-30 cm', 'Come en la primera rompiente.', null, 4, 2],
    ['chopa', 'Chopa', ['perezosa', 'garopa'], 'Spondyliosoma cantharus', null, 23, 'Junta 2025 (RD 560/1995)', null, [4, 5, 6, 7, 8, 9], 'Puertos y escolleras, de día', ['gusana', 'gamba', 'calamar'], ['corcheo', 'LRF'], ['puerto', 'roca'], '20-30 cm', 'Se vuelve loca con engodo.', null, 3, 2],
    ['salema', 'Salema', ['salpa'], 'Sarpa salpa', 15, 15, 'Junta 2025 (RD 560/1995)', null, [6, 7, 8, 9, 10], 'Piedra con algas, de día', ['masilla', 'algas'], ['corcheo'], ['roca', 'puerto'], '20-30 cm', 'Destrípala al momento o amarga.', null, 2, 1],
    ['oblada', 'Oblada', ['oblá', 'doblada'], 'Oblada melanura', null, null, 'Sin talla legal', null, [5, 6, 7, 8, 9, 10], 'Media agua en escolleras, al atardecer', ['masilla', 'gamba', 'cucharilla'], ['corcheo', 'LRF'], ['roca', 'puerto'], '15-25 cm', 'Corcho fino a media agua.', null, 3, 1],
    ['breca', 'Breca', ['pagel'], 'Pagellus erythrinus', 15, null, 'Junta 2025 (UE)', null, [3, 4, 5, 6, 9, 10, 11], 'Arena y piedra con mucho fondo', ['gusana', 'calamar', 'gamba'], ['fondo', 'jigging'], ['fondo'], '18-30 cm', 'Desde costa, solo en sitios hondos.', null, 4, 3],
    ['besugo', 'Besugo', ['aligote'], 'Pagellus acarne', null, null, 'Talla sin verificar', 'Talla sin verificar: mírala en la tabla de la Junta. No es el voraz.', [9, 10, 11, 12, 1, 2, 3, 4], 'Al anochecer y de noche', ['gusana', 'calamar', 'sardina'], ['fondo', 'surfcasting'], ['playa', 'puerto'], '15-25 cm', 'Aquí «besugo» es el aligote.', null, 4, 2],
    ['pargo', 'Pargo', ['bocinegro', 'pagre'], 'Pagrus pagrus', 18, 15, 'Junta 2025 (UE y RD 560/1995)', null, [4, 5, 6, 7, 8, 9, 10], 'Losas hondas en el repunte', ['calamar', 'choco', 'cangrejo'], ['fondo', 'jigging'], ['roca'], '30-50 cm', 'Busca fondo y espera el repunte.', null, 5, 4],
    ['urta', 'Urta', ['hurta', 'sama'], 'Pagrus auriga', null, null, 'Sin talla legal', null, [5, 6, 7, 8, 9, 10], 'Noches de verano con mar en calma', ['cangrejo', 'choco', 'calamar'], ['fondo', 'rockfishing'], ['roca'], '1-4 kg', 'La reina del verano gaditano.', null, 5, 4],
    ['denton', 'Dentón', ['sama', 'capitón'], 'Dentex dentex', null, null, 'Sin talla legal', null, [4, 5, 6, 7, 8, 9, 10], 'Piedra profunda, a primera hora', ['calamar vivo', 'pez vivo', 'jig'], ['curricán', 'jigging'], ['roca'], '2-6 kg', 'Vivo pegado al fondo.', 'Caninos afilados', 5, 4],
    ['voraz', 'Voraz', ['goraz', 'besugo de la pinta'], 'Pagellus bogaraveo', 33, 36, 'Junta 2025 (UE)', 'Veda del 31 de enero al 31 de marzo en el Estrecho.', [4, 5, 6, 7, 8, 9, 10, 11, 12], 'Fondos de 150-400 m', ['calamar', 'sardina'], ['fondo'], ['fondo'], '30-45 cm', 'Pesca de barca, con autorización.', null, 5, 4],
    ['boga', 'Boga', [], 'Boops boops', null, null, 'Talla sin verificar', 'Talla sin verificar: mírala en la tabla de la Junta.', [5, 6, 7, 8, 9, 10, 11], 'Puertos al anochecer', ['masilla', 'gusana', 'sardina'], ['corcheo', 'LRF'], ['puerto', 'roca'], '15-25 cm', 'El mejor vivo para los grandes.', null, 2, 1],
    // Lubinas, corvinas y compañía
    ['lubina', 'Lubina', ['róbalo', 'magallón'], 'Dicentrarchus labrax', 25, 36, 'Junta 2025 (UE y RD 560/1995)', null, [10, 11, 12, 1, 2, 3, 4], 'Temporal que remite, espuma, alba y noche', ['gusana', 'sardina', 'vivo', 'señuelo'], ['spinning', 'surfcasting'], ['playa', 'roca', 'estuario'], '35-60 cm', 'Busca corriente y espuma.', 'Aletas y opérculo cortantes', 5, 3],
    ['baila', 'Baila', ['bailaora'], 'Dicentrarchus punctatus', null, null, 'Sin talla legal', null, [10, 11, 12, 1, 2, 3, 4], 'Desembocaduras con agua tomada', ['gusana', 'quisquilla', 'vinilo'], ['spinning', 'surfcasting'], ['playa', 'estuario'], '25-40 cm', 'Manchas negras: no es una lubina.', 'Opérculo cortante', 4, 2],
    ['corvina', 'Corvina', ['corvinota'], 'Argyrosomus regius', null, null, 'Sin talla legal', null, [4, 5, 6, 7, 8, 9], 'Noche y mareas vivas en desembocaduras', ['calamar', 'choco', 'lisa viva'], ['surfcasting', 'fondo'], ['estuario', 'playa'], '3-20 kg', 'Equipo potente y paciencia.', null, 4, 4],
    ['verrugato', 'Verrugato', ['corvinato', 'corvao'], 'Umbrina cirrosa', null, null, 'Sin talla legal', null, [5, 6, 7, 8, 9, 10], 'De noche, con algo de resaca', ['gusana', 'cangrejo'], ['surfcasting'], ['playa'], '30-50 cm', 'Barbillón bajo la boca.', null, 4, 3],
    ['roncador', 'Roncador', ['roncaor'], 'Pomadasys incisus', null, null, 'Sin talla legal', null, [5, 6, 7, 8, 9, 10], 'De noche en puertos y playas', ['gusana', 'gamba'], ['fondo', 'surfcasting'], ['puerto', 'playa'], '15-25 cm', 'Ronca al sacarlo. En serio.', null, 3, 2],
    ['borriquete', 'Borriquete', ['burro'], 'Plectorhinchus mediterraneus', null, null, 'Sin talla legal', null, [6, 7, 8, 9, 10], 'De noche, arena con piedra', ['cangrejo', 'gusana', 'sardina'], ['surfcasting', 'fondo'], ['playa', 'roca'], '30-50 cm', 'Anzuelo fuerte: tira.', null, 4, 3],
    ['lisa', 'Lisa', ['albur', 'capitán', 'mujol'], 'Mugil spp.', 16, 20, 'Junta 2025 (RD 560/1995)', null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'Puertos y ríos, con engodo', ['masilla', 'pan'], ['corcheo'], ['puerto', 'estuario'], '30-50 cm', 'Hilo fino y corcho equilibrado.', null, 2, 1],
    // Pelágicos
    ['jurel', 'Jurel', ['chicharro'], 'Trachurus trachurus', 15, 15, 'Junta 2025 (UE)', null, [5, 6, 7, 8, 9, 10, 11], 'Puertos al anochecer', ['sardina', 'plumillas'], ['corcheo', 'LRF'], ['puerto', 'pelágico'], '15-30 cm', 'Con plumillas, máximo 6 anzuelos.', null, 3, 1],
    ['caballa', 'Caballa', ['tonino'], 'Scomber scombrus', 18, 20, 'Junta 2025 (UE)', null, [4, 5, 6, 7, 8, 9, 10], 'Bancos junto a escolleras, al alba', ['plumillas', 'cucharilla'], ['spinning', 'corcheo'], ['puerto', 'pelágico'], '20-30 cm', 'Sangrar y al hielo.', null, 3, 1],
    ['estornino', 'Estornino', ['caballa del sur'], 'Scomber colias', 18, 20, 'Junta 2025 (UE)', null, [6, 7, 8, 9, 10, 11], 'Al alba desde espigones', ['plumillas', 'cucharilla'], ['spinning'], ['puerto', 'pelágico'], '20-30 cm', 'Puntitos en la barriga.', null, 3, 1],
    ['aguja', 'Aguja', ['agujo', 'agujeta'], 'Belone belone', 25, 25, 'Junta 2025 (RD 560/1995)', null, [3, 4, 5, 6, 9, 10, 11], 'Superficie con agua clara', ['sardina', 'cucharilla'], ['spinning', 'corcheo'], ['puerto', 'pelágico'], '40-70 cm', 'Buldó con tira de sardina.', 'Pico con dientes', 3, 2],
    ['palometa', 'Palometa', ['pámpano'], 'Trachinotus ovatus', null, null, 'Sin talla legal', null, [6, 7, 8, 9, 10], 'Playas de agua clara, por la mañana', ['gusana', 'cucharilla'], ['spinning'], ['playa', 'pelágico'], '20-35 cm', 'Recoge rápido por la orilla.', null, 3, 2],
    ['anjova', 'Anjova', ['chova', 'ajoa'], 'Pomatomus saltatrix', null, null, 'Sin talla legal', null, [8, 9, 10, 11, 12], 'Cazas al alba y al anochecer', ['jig', 'paseante', 'sardina'], ['spinning'], ['playa', 'pelágico'], '1-4 kg', 'Bajo de acero y alicates.', 'Dientes muy cortantes', 3, 3],
    ['espeton', 'Espetón', ['peto', 'barracuda'], 'Sphyraena sphyraena', null, null, 'Sin talla legal', null, [6, 7, 8, 9, 10, 11], 'Alba y noche en puertos', ['minnow', 'vinilo'], ['spinning'], ['puerto', 'pelágico'], '30-50 cm', 'Recogida a tirones.', 'Dientes', 4, 3],
    ['melva', 'Melva', [], 'Auxis rochei', null, null, 'Sin talla legal', null, [8, 9, 10, 11], 'Cazas en superficie', ['jig', 'plumilla'], ['spinning'], ['pelágico'], '0,5-1,5 kg', 'Sángrala al momento.', null, 3, 3],
    ['bonito', 'Bonito', [], 'Sarda sarda', null, null, 'Sin talla legal', null, [3, 4, 8, 9, 10, 11], 'Al alba, cuando caza arriba', ['jig', 'minnow'], ['spinning', 'curricán'], ['pelágico'], '1-4 kg', 'Metal lejos, hacia las cazas.', null, 4, 3],
    ['bacoreta', 'Bacoreta', ['barcora'], 'Euthynnus alletteratus', null, null, 'Sin talla legal', null, [8, 9, 10, 11], 'Cazas al alba', ['jig'], ['spinning', 'curricán'], ['pelágico'], '2-6 kg', 'Pelea brutal: suéltala.', null, 2, 3],
    ['palometon', 'Palometón', ['palometa blanca'], 'Lichia amia', null, null, 'Sin talla legal', null, [6, 7, 8, 9, 10, 11], 'Persiguiendo lisas en ríos y playas', ['lisa viva', 'paseante'], ['spinning'], ['estuario', 'pelágico'], '3-15 kg', 'Freno suave: corre mucho.', null, 3, 4],
    ['pez-limon', 'Pez limón', ['serviola', 'medregal'], 'Seriola dumerili', null, null, 'Sin talla legal', null, [6, 7, 8, 9, 10], 'Puntas con corriente', ['vivo', 'jig'], ['jigging', 'spinning'], ['roca', 'pelágico'], '3-20 kg', 'Freno firme: va a la piedra.', null, 4, 4],
    ['lampuga', 'Lampuga', ['dorado'], 'Coryphaena hippurus', null, null, 'Talla sin verificar', 'Declárala en PescaREC. Talla sin verificar.', [8, 9, 10, 11], 'Bajo objetos flotantes, en barca', ['vinilo', 'jig', 'vivo'], ['curricán', 'spinning'], ['pelágico'], '2-8 kg', 'Busca maderas y boyas a la deriva.', null, 5, 4],
    ['atun-rojo', 'Atún rojo', ['atún de almadraba'], 'Thunnus thynnus', null, null, 'Solo captura y suelta', 'Solo captura y suelta (16 jun-14 oct). Desde barca, con autorización en PescaREC.', [6, 7, 8, 9, 10], 'Cazas en superficie en el Estrecho', ['jig', 'paseante', 'vivo'], ['spinning', 'curricán'], ['pelágico'], '20-300 kg', 'Equipo pesado y suéltalo en el agua.', null, 5, 5],
    // Fondo y arena
    ['salmonete', 'Salmonete', [], 'Mullus spp.', null, null, 'Talla sin verificar', 'Talla sin verificar: mírala en la tabla de la Junta.', [4, 5, 6, 7, 8, 9, 10], 'Arena junto a piedra, de día', ['gusana', 'quisquilla'], ['surfcasting', 'LRF'], ['playa', 'fondo'], '15-25 cm', 'Boca pequeña: anzuelo pequeño.', null, 5, 2],
    ['lenguado', 'Lenguado', ['lenguao'], 'Solea solea', 20, 24, 'Junta 2025 (UE y RD 560/1995)', null, [10, 11, 12, 1, 2, 3, 4], 'De noche en arena', ['gusana'], ['surfcasting'], ['playa'], '20-35 cm', 'Arrastra muy despacio.', null, 5, 3],
    ['rodaballo', 'Rodaballo', [], 'Scophthalmus maximus', null, 30, 'Junta 2025 (RD 560/1995)', null, [11, 12, 1, 2, 3, 4], 'Arena atlántica, de noche', ['pez vivo', 'sardina'], ['surfcasting'], ['playa'], '1-3 kg', 'Si sale, foto obligatoria.', null, 5, 4],
    ['raya-clavos', 'Raya de clavos', ['raya'], 'Raja clavata', null, null, 'Sin talla legal', 'Raya mosaico, pastinaca y águila marina están prohibidas: identifícala bien.', [10, 11, 12, 1, 2, 3, 4], 'De noche en arena', ['sardina', 'caballa'], ['surfcasting'], ['playa', 'fondo'], '50-80 cm', 'Si dudas, al agua.', 'Clavos en lomo y cola', 3, 2],
    ['faneca', 'Faneca', [], 'Trisopterus luscus', null, null, 'Sin talla legal', null, [10, 11, 12, 1, 2, 3], 'De noche en fondos mixtos', ['gusana', 'sardina'], ['fondo'], ['fondo', 'puerto'], '15-25 cm', 'Cómela pronto.', null, 3, 2],
    ['arana', 'Araña', ['pez araña'], 'Trachinus draco', null, null, 'Sin talla legal', 'No hace falta marcarla.', [5, 6, 7, 8, 9, 10], 'Arena, de día y de noche', ['gusana'], ['surfcasting'], ['playa'], '15-30 cm', 'Pinza o trapo, siempre.', 'Espinas venenosas: picadura muy dolorosa', 4, 1],
    // Roca
    ['rascacio', 'Rascacio', ['cabracho'], 'Scorpaena spp.', null, null, 'Sin talla legal', 'No hace falta marcarlo.', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'Piedra, de noche', ['gamba', 'sardina', 'vinilo'], ['rockfishing', 'LRF'], ['roca', 'puerto'], '15-30 cm', 'Cógelo con pinza.', 'Espinas venenosas: agua muy caliente y al médico', 5, 2],
    ['cabrilla', 'Cabrilla', ['cobrilla', 'vaquita'], 'Serranus cabrilla', null, null, 'Sin talla legal', null, [4, 5, 6, 7, 8, 9, 10], 'Piedra', ['gamba', 'vinilo'], ['LRF', 'rockfishing'], ['roca'], '15-25 cm', 'La reina del LRF.', null, 3, 1],
    ['serrano', 'Serrano', ['bodión', 'vaqueta'], 'Serranus scriba', null, null, 'Sin talla legal', null, [4, 5, 6, 7, 8, 9, 10], 'Piedra y praderas', ['gamba', 'vinilo'], ['LRF'], ['roca', 'puerto'], '15-25 cm', 'Los pequeños, al agua.', null, 3, 1],
    ['ballesta', 'Pez ballesta', ['cochino', 'pez puerco'], 'Balistes capriscus', null, null, 'Talla sin verificar', 'Talla sin verificar: mírala en la tabla de la Junta.', [6, 7, 8, 9, 10], 'Escolleras y puertos en verano', ['gamba', 'mejillón', 'calamar'], ['fondo', 'corcheo'], ['roca', 'puerto'], '25-40 cm', 'Roba cebos con su pico duro.', 'Muerde fuerte', 4, 2],
    ['congrio', 'Congrio', ['safío', 'zafio'], 'Conger conger', null, 58, 'Junta 2025 (RD 560/1995)', null, [10, 11, 12, 1, 2, 3], 'Noche cerrada en puertos', ['sardina', 'caballa', 'choco'], ['fondo'], ['puerto', 'roca'], '1-10 kg', 'Despégalo del fondo ya.', 'Dientes y mucha fuerza', 3, 3],
    ['morena', 'Morena', [], 'Muraena helena', null, null, 'Sin talla legal', null, [5, 6, 7, 8, 9, 10], 'De noche en escolleras', ['sardina', 'choco'], ['rockfishing'], ['roca', 'puerto'], '60-100 cm', 'Bajo de acero. Si dudas, corta.', 'Mordedura grave', 3, 3],
    ['mero', 'Mero', [], 'Epinephelus marginatus', 45, null, 'Junta 2025 (UE y RD 560/1995)', 'Cherna, mero dentón y falso abadejo: prohibidos.', [5, 6, 7, 8, 9, 10], 'Piedra profunda', ['vivo'], ['fondo', 'jigging'], ['roca'], 'Variable', 'Crece lento: mejor soltarlo.', null, 5, 5],
    // Cefalópodos
    ['calamar', 'Calamar', ['chipirón'], 'Loligo vulgaris', null, null, 'Sin talla legal', 'Solo cefalópodos: máximo 6. Márcalo cortando una aleta.', [10, 11, 12, 1, 2, 3], 'Atardecer y noche en puertos', ['egi'], ['eging'], ['puerto', 'roca'], '15-30 cm', 'Nada de luces para atraerlo.', 'Pico', 5, 2],
    ['choco', 'Choco', ['sepia', 'jibia'], 'Sepia officinalis', null, null, 'Sin talla legal', 'Solo cefalópodos: máximo 6. Márcalo cortando una aleta.', [1, 2, 3, 4, 5], 'Primavera en praderas someras', ['egi', 'potera'], ['eging'], ['puerto', 'playa'], '0,5-2 kg', 'Recoge lento pegado al fondo.', 'Pico', 5, 2],
    ['puntillita', 'Puntillita', ['chopito'], 'Alloteuthis spp.', null, null, 'No permitida', 'Solo se permiten calamar y sepia: la puntillita quedaría fuera (por confirmar). Suéltala.', [], null, [], [], ['puerto'], '6-10 cm', 'Si sale con la potera, al agua.', null, 0, 1],
    ['pota', 'Pota', ['volador'], 'Todarodes sagittatus', null, null, 'No permitida', 'Prohibida: solo se permiten calamar y sepia.', [], null, [], [], ['pelágico'], '20-40 cm', 'Se distingue por sus aletas en punta de flecha.', null, 0, 3],
    ['pulpo', 'Pulpo', ['pulpo roquero'], 'Octopus vulgaris', null, null, 'No permitido', 'Prohibido en pesca recreativa en Andalucía.', [], null, [], [], ['roca'], '1-3 kg', 'Si se agarra, devuélvelo vivo.', null, 0, 2],
  ];
  const PROHIBIDAS = { pulpo: 'Prohibido', pota: 'Prohibida', puntillita: 'No permitida', 'atun-rojo': 'Solo suelta' };
  const PESCAREC = ['lubina', 'lenguado', 'voraz', 'lampuga', 'atun-rojo'];
  const PEND = ['besugo', 'boga', 'salmonete', 'lampuga', 'ballesta'];
  const GRUPO = { dorada: 'esparidos', lubina: 'costeros', jurel: 'pelagicos', salmonete: 'fondo', rascacio: 'roca', calamar: 'cefalopodos' };
  const VIS = window.TPTV_VIS || {};
  const ALIAS = { 'raya-clavos': 'raya', voraz: 'besugo', 'sargo-breado': 'sargo-picudo', raspallon: 'mojarra', oblada: 'mojarra', roncador: 'corvina', bacoreta: 'bonito', espeton: 'aguja', palometon: 'palometa', arana: 'pez-arana', puntillita: 'chipiron', 'atun-rojo': 'bonito', lampuga: 'serviola', ballesta: 'chopa' };
  let grupo = 'esparidos';
  const species = R.map((r, i) => {
    const [id, nombre, otros, cientifico, tallaMed, tallaAtl, fuenteTalla, notaTalla, meses, momento, cebos, tecnicas, habitat, tam, consejo, peligro, mesa, rareza] = r;
    if (GRUPO[id]) grupo = GRUPO[id];
    const v = VIS[id] || VIS[ALIAS[id]] || {};
    return {
      id, num: i + 1, nombre, otros, cientifico, tallaMed, tallaAtl, fuenteTalla, notaTalla, meses, momento, cebos, tecnicas, habitat, tam, consejo, peligro, mesa,
      rareza, tier: TIERS[rareza], prohibida: !!PROHIBIDAS[id], veto: PROHIBIDAS[id] || null, pescarec: PESCAREC.includes(id), tallaPend: PEND.includes(id),
      grupo, forma: v.forma, color: v.color ? { ...v.color } : null, tamCm: v.tamCm,
    };
  });
  const byId = Object.fromEntries(species.map((s) => [s.id, s]));
  // Dibujos propios de algunas especies
  Object.assign(byId.voraz, { color: { body: '#d29c96', belly: '#f6e6e3', fin: '#c58680', pattern: 'mancha-axila' } });
  byId.oblada.color = { body: '#a7b0b8', belly: '#eef1f3', fin: '#7b858e', pattern: 'mancha-cola' };
  byId.raspallon.color = { body: '#c3bea4', belly: '#f2f0e6', fin: '#a39d80', pattern: 'mancha-cola' };
  byId['sargo-breado'].color = { body: '#b9a98a', belly: '#efe8da', fin: '#5a5144', pattern: 'bandas', pc: 'rgba(40,30,20,.7)' };
  Object.assign(byId.palometon, { forma: 'fusiforme', color: { body: '#7f909c', belly: '#f1f3f4', fin: '#4f5d68', pattern: 'franja', pc2: '#5c6b77' } });
  byId.palometa.color = { body: '#a9b8c0', belly: '#f3f5f6', fin: '#e3b94e', pattern: '' };
  byId.roncador.color = { body: '#9fa3a6', belly: '#eceeef', fin: '#7d8186', pattern: 'lineas', pc2: '#6c7177' };
  byId.bacoreta.color = { body: '#2f5f8a', belly: '#eef2f5', fin: '#40678a', pattern: 'ondas puntos', pc: 'rgba(10,25,45,.75)', pc2: '#1d2b38' };
  Object.assign(byId.espeton, { forma: 'aguja', color: { body: '#7c8f9c', belly: '#eef2f4', fin: '#8e9ea8', pattern: 'bandas', pc: 'rgba(30,40,50,.35)' } });
  Object.assign(byId['atun-rojo'], { forma: 'fusiforme', tamCm: 150, color: { body: '#1f3f66', belly: '#e9eef3', fin: '#e2c14a', pattern: 'puntos', pc2: '#a9bfd6' } });
  Object.assign(byId.lampuga, { forma: 'corvina', tamCm: 80, color: { body: '#2f9e8f', belly: '#f2e27a', fin: '#2a7fb8', pattern: 'puntos', pc2: '#1f5f7a' } });
  Object.assign(byId.ballesta, { forma: 'esparido', tamCm: 30, color: { body: '#8d8f86', belly: '#d9d6c8', fin: '#6d7066', pattern: 'lineas', pc2: '#7fa2c8' } });
  Object.assign(byId.puntillita, { forma: 'calamar', tamCm: 8, color: { body: '#f2cfc2', belly: '#fbeee8', fin: '#efd5ca', pc: 'rgba(170,80,70,.5)' } });
  Object.assign(byId.pota, { forma: 'calamar', tamCm: 30, color: { body: '#c9644f', belly: '#efc2b4', fin: '#c2705c', pc: 'rgba(110,30,20,.6)' } });

  const li = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  window.TPTV = {
    version: 'Datos de noviembre de 2026',
    defaultSpot: 'playa-getares',
    // Meridiano de Punta Marroquí (5°35′ O): al oeste, tallas del Golfo de Cádiz; al este, del Mediterráneo (art. 2 RD 347/2011)
    limiteMarroqui: -(5 + 35 / 60),
    tiers: TIERS,
    zonas: { atlantico: 'Costa atlántica', estrecho: 'El Estrecho', bahia: 'Bahía de Algeciras', mediterraneo: 'Costa mediterránea' },
    mareasZona: window.TPTV_MAREAS || {},
    spots: window.TPTV_SPOTS || [],
    species,
    normas: {
      cupoKg: 5,
      cupoTexto: 'Por licencia y día. Una pieza no cuenta. Solo cefalópodos: 6.',
      secciones: [
        { titulo: 'Licencia', html: li(['Desde tierra: <b>clase 1</b> de la Junta, <b>3 años</b>, desde 14 años.', 'Se pide en línea (app LIPE) y cuesta unos <b>6 €</b> (dato no oficial).', 'Llévala encima con el DNI (en el móvil vale).']) },
        { titulo: 'Cupo y aparejos', html: li(['<b>5 kg por licencia y día</b>; una pieza no cuenta.', 'Solo cefalópodos: <b>6 piezas</b>.', 'Desde tierra: <b>2 cañas y 6 anzuelos</b>. Se puede pescar de noche.', 'Prohibido: luces para atraer, drones o cometas, carrete eléctrico y <b>vender</b>.']) },
        { titulo: 'Marcar y declarar', html: li(['Corta parte del <b>lóbulo inferior de la cola</b> de lo que te quedes (en calamar y choco, una aleta).', 'Nunca sin cabeza: enteros o eviscerados.', '<b>PescaREC</b> en 24 h: lubina, lenguado, voraz, lampuga y atún rojo, <b>también si los sueltas</b>.']) },
        { titulo: 'Prohibido pescar', html: li(['<b>Pulpo</b>, crustáceos, bivalvos, erizos y todos los moluscos salvo calamar y sepia.', 'Raya mosaico, pastinaca, águila marina, tiburones, cherna, pez espada, caballitos y pez de San Pedro.', 'Cangrejo, navaja o mejillón para cebo: <b>comprados</b>.']) },
        { titulo: 'Vedas', html: li(['<b>Voraz</b>: 31 ene-31 mar en el Estrecho.', '<b>Atún rojo</b>: solo captura y suelta, 16 jun-14 oct.']) },
        { titulo: 'Dos caladeros', html: li(['Límite: <b>Punta Marroquí (5°35′ O)</b>. Al oeste, tallas del Golfo de Cádiz; al este, del Mediterráneo.', 'TPTV elige la talla según el pesquero.', 'Sin talla legal no significa llevarse los chicos.']) },
        { titulo: 'Parque Natural del Estrecho', html: li(['<b>Prohibido pescar</b> en la Isla de las Palomas de Punta Carnero, la Punta de San García, el sur de la Isla de Tarifa y las losas (plataformas de abrasión).', 'Tampoco en las praderas frente a Valdevaqueros y Bolonia.', 'En el resto, sí.']) },
        { titulo: 'Puertos, ríos y Gibraltar', html: li(['Puertos: mira los carteles; dentro, normalmente no.', 'Ríos: a <b>150 m o más</b> de la boca.', 'Playas en verano: horario municipal.', 'Junto al Peñón manda la normativa de Gibraltar: evítalo.']) },
      ],
      fuentes: [
        ['Decreto 205/2023 (BOJA 169)', 'https://www.juntadeandalucia.es/boja/2023/169/1'],
        ['RD 347/2011 (BOE)', 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-6099'],
        ['Tallas mínimas de la Junta (2025)', 'https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/08/Tallas%20minimas%202025_v6.pdf'],
        ['Licencias de pesca de recreo (Junta)', 'https://www.juntadeandalucia.es/organismos/agriculturapescaaguaydesarrollorural/areas/pesca-acuicultura/pesca-maritima-recreo/licencias-pesca-maritima-recreo.html'],
        ['PORN del Estrecho (Decreto 130/2024)', 'https://www.juntadeandalucia.es/boja/2024/146/3'],
        ['RD 214/2026 (PescaREC)', 'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-6401'],
        ['Atún rojo 2026', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-12503'],
        ['Veda del voraz', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-1715'],
      ],
    },
    kit: [
      { grupo: 'Papeles', items: ['Licencia', 'DNI', 'PescaREC instalada'] },
      { grupo: 'Equipo', items: ['Cañas', 'Carretes', 'Bajos y anzuelos', 'Plomos', 'Señuelos', 'Trípode', 'Salabre', 'Alicates', 'Tijeras'] },
      { grupo: 'Cebo', items: ['Gusana', 'Cangrejo o navaja', 'Sardina', 'Engodo'] },
      { grupo: 'Pescado', items: ['Regla', 'Nevera con hielo', 'Trapo o pinza', 'Bolsas'] },
      { grupo: 'Tú', items: ['Frontal', 'Abrigo y chubasquero', 'Botas', 'Gorra y crema', 'Agua y comida', 'Silla', 'Botiquín', 'Batería del móvil', 'Bolsa de basura'] },
    ],
  };
})();
