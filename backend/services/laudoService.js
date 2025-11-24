const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { getFileUrl, getFullPath, UPLOAD_STRATEGY } = require('./uploadService');

const gerarNumeroLaudo = () => {
  const agora = new Date();
  const ano = String(agora.getFullYear()).slice(2);
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const sequencial = String(Math.floor(Math.random() * 26)).padStart(1, '0');
  const letra = String.fromCharCode(65 + parseInt(sequencial));
  
  return `${ano}${mes}${dia}${letra}`;
};

const garantirDiretorioLaudos = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  
  const basePath = path.join(__dirname, '..', 'uploads', 'laudos');
  const yearPath = path.join(basePath, String(ano));
  const monthPath = path.join(yearPath, mes);
  
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  if (!fs.existsSync(yearPath)) {
    fs.mkdirSync(yearPath, { recursive: true });
  }
  if (!fs.existsSync(monthPath)) {
    fs.mkdirSync(monthPath, { recursive: true });
  }
  
  return monthPath;
};

/**
 * Determina qual template PDF usar baseado no tipo de embarcação
 */
const obterTemplatePDF = (tipoEmbarcacao) => {
  const tipo = tipoEmbarcacao?.toUpperCase();
  
  // Caminho relativo à raiz do projeto (não backend/)
  const basePath = path.join(__dirname, '..', '..', 'PDF');
  
  if (tipo === 'JET_SKI' || tipo === 'JETSKI') {
    return path.join(basePath, 'jetski.pdf');
  }
  
  // Para LANCHA, EMBARCACAO_COMERCIAL e outros tipos, usar template de lancha
  if (tipo === 'LANCHA' || tipo === 'EMBARCACAO_COMERCIAL' || tipo === 'BARCO' || tipo === 'IATE' || tipo === 'VELEIRO') {
    return path.join(basePath, 'lancha_embarcação.pdf');
  }
  
  // Default: usar template de lancha
  return path.join(basePath, 'lancha_embarcação.pdf');
};

/**
 * Mapeamento de coordenadas para campos do PDF
 * Estas coordenadas precisam ser ajustadas baseadas no layout real dos PDFs
 * Formato: { campo: { x, y, fontSize, page } }
 */
const obterCoordenadasCampos = (tipoEmbarcacao) => {
  const tipo = tipoEmbarcacao?.toUpperCase();
  
  // Coordenadas base (A4: 595 x 842 points)
  // Estas são coordenadas genéricas que precisam ser ajustadas
  const coordenadasBase = {
    numero_laudo: { x: 450, y: 800, fontSize: 10, page: 0 },
    nome_embarcacao: { x: 150, y: 750, fontSize: 10, page: 0 },
    proprietario: { x: 150, y: 730, fontSize: 10, page: 0 },
    cpf_cnpj: { x: 150, y: 710, fontSize: 10, page: 0 },
    data_inspecao: { x: 450, y: 750, fontSize: 10, page: 0 },
    inscricao_capitania: { x: 150, y: 690, fontSize: 10, page: 0 },
    tipo_embarcacao: { x: 150, y: 670, fontSize: 10, page: 0 },
    ano_fabricacao: { x: 150, y: 650, fontSize: 10, page: 0 },
    valor_risco: { x: 450, y: 730, fontSize: 10, page: 0 },
  };
  
  // Coordenadas específicas por tipo (se necessário)
  if (tipo === 'JET_SKI' || tipo === 'JETSKI') {
    // Coordenadas específicas para jetski.pdf
    return coordenadasBase;
  } else {
    // Coordenadas específicas para lancha_embarcação.pdf
    return coordenadasBase;
  }
};

/**
 * Formata CPF/CNPJ para exibição
 */
const formatarCPFCNPJ = (cpfCnpj) => {
  if (!cpfCnpj) return '';
  const limpo = cpfCnpj.replace(/\D/g, '');
  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (limpo.length === 14) {
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cpfCnpj;
};

/**
 * Formata data para exibição
 */
const formatarData = (data) => {
  if (!data) return '';
  try {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
};

/**
 * Formata valor monetário
 */
const formatarValor = (valor) => {
  if (!valor) return '';
  return parseFloat(valor).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

/**
 * Preenche campos do PDF usando pdf-lib
 * Nota: pdf-lib não suporta preenchimento de formulários PDF diretamente.
 * Para isso, precisaríamos usar pdf-fill-form ou similar.
 * Por enquanto, vamos criar uma versão que carrega o template e adiciona texto sobre ele.
 */
const gerarLaudoPDF = async (laudo, vistoria, fotos = []) => {
  try {
    console.log('[PDF] Iniciando geração do PDF com template...');
    console.log('[PDF] Laudo ID:', laudo.id);
    console.log('[PDF] Tipo de embarcação:', vistoria?.Embarcacao?.tipo_embarcacao);
    console.log('[PDF] Número de fotos:', fotos?.length || 0);
    
    // Determinar qual template usar baseado no tipo de embarcação da vistoria
    const tipoEmbarcacao = vistoria?.Embarcacao?.tipo_embarcacao;
    
    if (!tipoEmbarcacao) {
      console.log('[PDF] AVISO: Tipo de embarcação não encontrado, usando template padrão (lancha)');
    }
    
    const templatePath = obterTemplatePDF(tipoEmbarcacao);
    
    console.log('[PDF] Template selecionado:', templatePath);
    console.log('[PDF] Tipo de embarcação usado para seleção:', tipoEmbarcacao || 'NÃO DEFINIDO (usando padrão)');
    
    // Verificar se o template existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template PDF não encontrado: ${templatePath}`);
    }
    
    // Carregar template PDF
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Habilitar fontkit para melhor suporte a fontes (opcional)
    try {
      const fontkit = require('@pdf-lib/fontkit');
      pdfDoc.registerFontkit(fontkit);
    } catch (e) {
      console.log('[PDF] Fontkit não disponível, usando fontes padrão');
    }
    
    // Obter dados da embarcação e vistoria
    const embarcacao = vistoria?.Embarcacao || {};
    const local = vistoria?.Local || {};
    
    // Preparar dados para preenchimento
    const dados = {
      // Dados gerais
      numero_laudo: laudo.numero_laudo || '',
      versao: laudo.versao || 'BS 2021-01',
      nome_embarcacao: laudo.nome_moto_aquatica || embarcacao.nome || '',
      proprietario: laudo.proprietario || embarcacao.proprietario_nome || embarcacao.Cliente?.nome || '',
      cpf_cnpj: formatarCPFCNPJ(laudo.cpf_cnpj || embarcacao.proprietario_cpf || embarcacao.Cliente?.cpf || embarcacao.Cliente?.cnpj || ''),
      endereco_proprietario: laudo.endereco_proprietario || '',
      data_inspecao: formatarData(laudo.data_inspecao || vistoria.data_conclusao || vistoria.data_inicio),
      local_vistoria: laudo.local_vistoria || local.logradouro || '',
      empresa_prestadora: laudo.empresa_prestadora || '',
      responsavel_inspecao: laudo.responsavel_inspecao || '',
      
      // Dados da embarcação
      inscricao_capitania: laudo.inscricao_capitania || embarcacao.nr_inscricao_barco || '',
      estaleiro_construtor: laudo.estaleiro_construtor || '',
      tipo_embarcacao: laudo.tipo_embarcacao || embarcacao.tipo_embarcacao || '',
      modelo_embarcacao: laudo.modelo_embarcacao || '',
      ano_fabricacao: laudo.ano_fabricacao || embarcacao.ano_fabricacao || '',
      capacidade: laudo.capacidade || '',
      classificacao_embarcacao: laudo.classificacao_embarcacao || '',
      area_navegacao: laudo.area_navegacao || '',
      situacao_capitania: laudo.situacao_capitania || '',
      valor_risco: formatarValor(laudo.valor_risco || vistoria.valor_embarcacao || embarcacao.valor_embarcacao),
      
      // Casco
      material_casco: laudo.material_casco || '',
      observacoes_casco: laudo.observacoes_casco || '',
      
      // Propulsão
      quantidade_motores: laudo.quantidade_motores || '',
      tipo_motor: laudo.tipo_motor || '',
      fabricante_motor: laudo.fabricante_motor || '',
      modelo_motor: laudo.modelo_motor || '',
      numero_serie_motor: laudo.numero_serie_motor || '',
      potencia_motor: laudo.potencia_motor || '',
      combustivel_utilizado: laudo.combustivel_utilizado || '',
      capacidade_tanque: laudo.capacidade_tanque || '',
      ano_fabricacao_motor: laudo.ano_fabricacao_motor || '',
      numero_helices: laudo.numero_helices || '',
      rabeta_reversora: laudo.rabeta_reversora || '',
      blower: laudo.blower || '',
      
      // Sistemas elétricos
      quantidade_baterias: laudo.quantidade_baterias || '',
      marca_baterias: laudo.marca_baterias || '',
      capacidade_baterias: laudo.capacidade_baterias || '',
      carregador_bateria: laudo.carregador_bateria || '',
      transformador: laudo.transformador || '',
      quantidade_geradores: laudo.quantidade_geradores || '',
      fabricante_geradores: laudo.fabricante_geradores || '',
      tipo_modelo_geradores: laudo.tipo_modelo_geradores || '',
      capacidade_geracao: laudo.capacidade_geracao || '',
      quantidade_bombas_porao: laudo.quantidade_bombas_porao || '',
      fabricante_bombas_porao: laudo.fabricante_bombas_porao || '',
      modelo_bombas_porao: laudo.modelo_bombas_porao || '',
      quantidade_bombas_agua_doce: laudo.quantidade_bombas_agua_doce || '',
      fabricante_bombas_agua_doce: laudo.fabricante_bombas_agua_doce || '',
      modelo_bombas_agua_doce: laudo.modelo_bombas_agua_doce || '',
      observacoes_eletricos: laudo.observacoes_eletricos || '',
      
      // Materiais de fundeio
      guincho_eletrico: laudo.guincho_eletrico || '',
      ancora: laudo.ancora || '',
      cabos: laudo.cabos || '',
      
      // Equipamentos de navegação
      agulha_giroscopica: laudo.agulha_giroscopica || '',
      agulha_magnetica: laudo.agulha_magnetica || '',
      antena: laudo.antena || '',
      bidata: laudo.bidata || '',
      barometro: laudo.barometro || '',
      buzina: laudo.buzina || '',
      conta_giros: laudo.conta_giros || '',
      farol_milha: laudo.farol_milha || '',
      gps: laudo.gps || '',
      higrometro: laudo.higrometro || '',
      horimetro: laudo.horimetro || '',
      limpador_parabrisa: laudo.limpador_parabrisa || '',
      manometros: laudo.manometros || '',
      odometro_fundo: laudo.odometro_fundo || '',
      passarela_embarque: laudo.passarela_embarque || '',
      piloto_automatico: laudo.piloto_automatico || '',
      psi: laudo.psi || '',
      radar: laudo.radar || '',
      radio_ssb: laudo.radio_ssb || '',
      radio_vhf: laudo.radio_vhf || '',
      radiogoniometro: laudo.radiogoniometro || '',
      sonda: laudo.sonda || '',
      speed_log: laudo.speed_log || '',
      strobow: laudo.strobow || '',
      termometro: laudo.termometro || '',
      voltimetro: laudo.voltimetro || '',
      outros_equipamentos: laudo.outros_equipamentos || '',
      
      // Sistemas de combate a incêndio
      extintores_automaticos: laudo.extintores_automaticos || '',
      extintores_portateis: laudo.extintores_portateis || '',
      outros_incendio: laudo.outros_incendio || '',
      atendimento_normas: laudo.atendimento_normas || '',
      
      // Vistoria
      acumulo_agua: laudo.acumulo_agua || '',
      avarias_casco: laudo.avarias_casco || '',
      estado_geral_limpeza: laudo.estado_geral_limpeza || '',
      teste_funcionamento_motor: laudo.teste_funcionamento_motor || '',
      funcionamento_bombas_porao: laudo.funcionamento_bombas_porao || '',
      manutencao: laudo.manutencao || '',
      observacoes_vistoria: laudo.observacoes_vistoria || '',
    };
    
    console.log('[PDF] Dados preparados para preenchimento');
    console.log('[PDF] Dados principais:', {
      numero_laudo: dados.numero_laudo,
      nome_embarcacao: dados.nome_embarcacao,
      proprietario: dados.proprietario,
      cpf_cnpj: dados.cpf_cnpj,
      data_inspecao: dados.data_inspecao
    });
    
    // Tentar preencher campos de formulário do PDF (se existirem)
    let camposPreenchidos = 0;
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      console.log('[PDF] Campos de formulário encontrados:', fields.length);
      
      if (fields.length > 0) {
        // Listar todos os campos para debug
        fields.forEach((field, index) => {
          try {
            const fieldName = field.getName();
            console.log(`[PDF] Campo ${index + 1}: ${fieldName} (${field.constructor.name})`);
          } catch (e) {
            console.log(`[PDF] Campo ${index + 1}: (nome não disponível)`);
          }
        });
        
        // Mapear campos comuns (ajustar conforme os nomes reais dos campos no PDF)
        // Estes são exemplos - os nomes reais precisam ser verificados nos PDFs
        const fieldMapping = {
          'numero_laudo': dados.numero_laudo,
          'laudo': dados.numero_laudo,
          'nome_embarcacao': dados.nome_embarcacao,
          'embarcacao': dados.nome_embarcacao,
          'proprietario': dados.proprietario,
          'cpf_cnpj': dados.cpf_cnpj,
          'cpf': dados.cpf_cnpj,
          'data_inspecao': dados.data_inspecao,
          'data': dados.data_inspecao,
          'inscricao_capitania': dados.inscricao_capitania,
          'inscricao': dados.inscricao_capitania,
          'tipo_embarcacao': dados.tipo_embarcacao,
          'ano_fabricacao': dados.ano_fabricacao,
          'valor_risco': dados.valor_risco,
        };
        
        // Tentar preencher campos conhecidos
        for (const [fieldName, value] of Object.entries(fieldMapping)) {
          if (!value) continue;
          
          try {
            // Tentar como campo de texto
            const field = form.getTextField(fieldName);
            if (field) {
              field.setText(String(value));
              camposPreenchidos++;
              console.log(`[PDF] Campo ${fieldName} preenchido: ${value}`);
            }
          } catch (e) {
            // Campo não existe ou não é texto, tentar outros tipos
            try {
              const field = form.getDropdown(fieldName);
              if (field) {
                field.select(String(value));
                camposPreenchidos++;
                console.log(`[PDF] Campo dropdown ${fieldName} preenchido: ${value}`);
              }
            } catch (e2) {
              // Campo não encontrado, continuar
            }
          }
        }
        
        console.log(`[PDF] Total de campos preenchidos: ${camposPreenchidos}`);
      } else {
        console.log('[PDF] Nenhum campo de formulário encontrado no PDF');
      }
    } catch (formError) {
      console.log('[PDF] Erro ao acessar formulário do PDF:', formError.message);
      console.log('[PDF] Adicionando texto sobre o PDF como fallback');
    }
    
    // Adicionar texto sobre o PDF usando coordenadas mapeadas
    // Isso garante que os dados apareçam mesmo se os campos de formulário não existirem
    try {
      const pages = pdfDoc.getPages();
      const coordenadas = obterCoordenadasCampos(tipoEmbarcacao);
      
      // Mapear dados para coordenadas
      const camposParaPreencher = [
        { campo: 'numero_laudo', valor: dados.numero_laudo },
        { campo: 'nome_embarcacao', valor: dados.nome_embarcacao },
        { campo: 'proprietario', valor: dados.proprietario },
        { campo: 'cpf_cnpj', valor: dados.cpf_cnpj },
        { campo: 'data_inspecao', valor: dados.data_inspecao },
        { campo: 'inscricao_capitania', valor: dados.inscricao_capitania },
        { campo: 'tipo_embarcacao', valor: dados.tipo_embarcacao },
        { campo: 'ano_fabricacao', valor: dados.ano_fabricacao ? String(dados.ano_fabricacao) : '' },
        { campo: 'valor_risco', valor: dados.valor_risco ? `R$ ${dados.valor_risco}` : '' },
      ];
      
      let camposAdicionados = 0;
      camposParaPreencher.forEach(({ campo, valor }) => {
        if (!valor) return;
        
        const coord = coordenadas[campo];
        if (!coord) {
          console.log(`[PDF] Coordenadas não definidas para campo: ${campo}`);
          return;
        }
        
        try {
          const pageIndex = coord.page || 0;
          const page = pages[pageIndex];
          if (!page) {
            console.log(`[PDF] Página ${pageIndex} não encontrada para campo: ${campo}`);
            return;
          }
          
          page.drawText(String(valor), {
            x: coord.x,
            y: coord.y,
            size: coord.fontSize || 10,
            color: rgb(0, 0, 0),
          });
          
          camposAdicionados++;
          console.log(`[PDF] Campo ${campo} adicionado em (${coord.x}, ${coord.y}): ${valor}`);
        } catch (drawError) {
          console.log(`[PDF] Erro ao adicionar campo ${campo}:`, drawError.message);
        }
      });
      
      console.log(`[PDF] Total de ${camposAdicionados} campos adicionados sobre o PDF`);
    } catch (textError) {
      console.log('[PDF] Erro ao adicionar texto sobre o PDF:', textError.message);
      // Continuar mesmo se não conseguir adicionar texto
    }
    
    // Adicionar fotos ao PDF
    if (fotos && fotos.length > 0) {
      console.log(`[PDF] Adicionando ${fotos.length} fotos ao PDF...`);
      
      try {
        const pages = pdfDoc.getPages();
        let currentPage = pages[pages.length - 1]; // Última página existente
        const { width, height } = currentPage.getSize();
        
        // Verificar se há espaço na última página para título
        let yPos = 50; // Posição inicial para fotos
        
        // Adicionar título "REGISTRO FOTOGRÁFICO" se houver espaço
        if (yPos + 30 < height - 200) {
          currentPage.drawText('REGISTRO FOTOGRÁFICO', {
            x: 50,
            y: yPos,
            size: 14,
            color: rgb(0, 0, 0),
          });
          yPos += 30;
        } else {
          // Criar nova página para fotos
          currentPage = pdfDoc.addPage([width, height]);
          yPos = height - 50;
          currentPage.drawText('REGISTRO FOTOGRÁFICO', {
            x: 50,
            y: yPos,
            size: 14,
            color: rgb(0, 0, 0),
          });
          yPos -= 30;
        }
        
        const fotoWidth = 200;
        const fotoHeight = 150;
        const maxFotosPorPagina = 4;
        let fotosPorPagina = 0;
        
        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          
          try {
            // Verificar se precisa de nova página
            if (fotosPorPagina >= maxFotosPorPagina) {
              currentPage = pdfDoc.addPage([width, height]);
              yPos = height - 50;
              fotosPorPagina = 0;
            }
            
            // Obter bytes da imagem (suporta S3 e local)
            let imageBytes;
            
            if (!foto.url_arquivo) {
              console.log(`[PDF] Foto ${i + 1} sem url_arquivo, pulando...`);
              continue;
            }
            
            try {
              if (UPLOAD_STRATEGY === 'S3' || UPLOAD_STRATEGY === 's3') {
                // Se for S3, buscar URL e fazer download
                const imageUrl = getFullPath(foto.url_arquivo, vistoria?.id);
                console.log(`[PDF] Baixando imagem do S3: ${imageUrl}`);
                
                // Usar https nativo do Node.js para fazer download
                const https = require('https');
                const http = require('http');
                const urlModule = require('url');
                
                imageBytes = await new Promise((resolve, reject) => {
                  const parsedUrl = urlModule.parse(imageUrl);
                  const client = parsedUrl.protocol === 'https:' ? https : http;
                  
                  client.get(imageUrl, (res) => {
                    if (res.statusCode !== 200) {
                      return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                    
                    const chunks = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                  }).on('error', reject);
                });
              } else {
                // Se for local, usar caminho do arquivo
                const relativePath = getFullPath(foto.url_arquivo, vistoria?.id);
                // getFullPath retorna caminho relativo, precisamos converter para absoluto
                const imagePath = relativePath.startsWith('/') 
                  ? path.join(__dirname, '..', relativePath)
                  : path.join(__dirname, '..', 'uploads', 'fotos', `vistoria-${vistoria?.id}`, foto.url_arquivo);
                
                console.log(`[PDF] Carregando imagem local: ${imagePath}`);
                
                if (!fs.existsSync(imagePath)) {
                  console.log(`[PDF] Arquivo de foto não encontrado: ${imagePath}`);
                  // Tentar caminho alternativo
                  const altPath = path.join(__dirname, '..', 'uploads', foto.url_arquivo);
                  if (fs.existsSync(altPath)) {
                    imageBytes = fs.readFileSync(altPath);
                  } else {
                    continue;
                  }
                } else {
                  imageBytes = fs.readFileSync(imagePath);
                }
              }
            } catch (imageLoadError) {
              console.log(`[PDF] Erro ao carregar imagem ${i + 1}:`, imageLoadError.message);
              continue;
            }
            
            let image;
            
            // Detectar tipo de imagem baseado na URL ou tentar ambos
            const urlLower = foto.url_arquivo.toLowerCase();
            try {
              if (urlLower.endsWith('.png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
                image = await pdfDoc.embedJpg(imageBytes);
              } else {
                // Tentar como JPEG primeiro (mais comum)
                try {
                  image = await pdfDoc.embedJpg(imageBytes);
                } catch (jpegError) {
                  // Se falhar, tentar PNG
                  try {
                    image = await pdfDoc.embedPng(imageBytes);
                  } catch (pngError) {
                    console.log(`[PDF] Erro ao carregar imagem ${i + 1} (tentou JPEG e PNG):`, pngError.message);
                    continue;
                  }
                }
              }
            } catch (embedError) {
              console.log(`[PDF] Erro ao incorporar imagem ${i + 1}:`, embedError.message);
              continue;
            }
            
            // Calcular posição
            const xPos = 50 + (fotosPorPagina % 2) * 250;
            const yPosFoto = yPos - Math.floor(fotosPorPagina / 2) * 200;
            
            // Adicionar imagem
            currentPage.drawImage(image, {
              x: xPos,
              y: yPosFoto - fotoHeight,
              width: fotoWidth,
              height: fotoHeight,
            });
            
            // Adicionar legenda (nome do tipo de foto)
            const legenda = foto.TipoFotoChecklist?.nome_exibicao || `Foto ${i + 1}`;
            currentPage.drawText(legenda, {
              x: xPos,
              y: yPosFoto - fotoHeight - 15,
              size: 9,
              color: rgb(0, 0, 0),
            });
            
            let yOffset = 30; // Espaçamento inicial para observação/descrição
            
            // Adicionar descrição do tipo de foto se houver
            if (foto.TipoFotoChecklist?.descricao) {
              const descricao = foto.TipoFotoChecklist.descricao;
              // Quebrar texto em linhas se necessário (máximo 40 caracteres por linha)
              const maxChars = 40;
              const linhas = [];
              for (let i = 0; i < descricao.length; i += maxChars) {
                linhas.push(descricao.substring(i, i + maxChars));
              }
              
              linhas.forEach((linha, idx) => {
                if (yPosFoto - fotoHeight - yOffset - (idx * 12) > 50) {
                  currentPage.drawText(linha, {
                    x: xPos,
                    y: yPosFoto - fotoHeight - yOffset - (idx * 12),
                    size: 7,
                    color: rgb(0.3, 0.3, 0.3),
                  });
                }
              });
              
              yOffset += linhas.length * 12 + 5;
            }
            
            // Adicionar observação da foto se houver (do banco de dados)
            if (foto.observacao) {
              const observacao = foto.observacao.trim();
              // Quebrar texto em linhas se necessário (máximo 40 caracteres por linha)
              const maxChars = 40;
              const linhas = [];
              for (let i = 0; i < observacao.length; i += maxChars) {
                linhas.push(observacao.substring(i, i + maxChars));
              }
              
              linhas.forEach((linha, idx) => {
                if (yPosFoto - fotoHeight - yOffset - (idx * 12) > 50) {
                  currentPage.drawText(linha, {
                    x: xPos,
                    y: yPosFoto - fotoHeight - yOffset - (idx * 12),
                    size: 7,
                    color: rgb(0.5, 0.5, 0.5),
                  });
                }
              });
            }
            
            fotosPorPagina++;
            
            console.log(`[PDF] Foto ${i + 1} adicionada: ${legenda}`);
            
          } catch (fotoError) {
            console.log(`[PDF] Erro ao adicionar foto ${i + 1}:`, fotoError.message);
            // Continuar com próxima foto
          }
        }
        
        console.log(`[PDF] Total de ${fotos.length} fotos processadas`);
      } catch (fotosError) {
        console.log('[PDF] Erro ao processar fotos:', fotosError.message);
        // Continuar mesmo se não conseguir adicionar fotos
      }
    } else {
      console.log('[PDF] Nenhuma foto para adicionar ao PDF');
    }
    
    // Salvar PDF
    const dirPath = garantirDiretorioLaudos();
    const fileName = `laudo-${laudo.id}.pdf`;
    const filePath = path.join(dirPath, fileName);
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    
    console.log('[PDF] PDF salvo:', filePath);
    
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const urlRelativa = `/uploads/laudos/${ano}/${mes}/${fileName}`;
    
    return {
      filePath,
      urlRelativa,
      fileName
    };
    
  } catch (error) {
    console.error('[PDF] Erro ao gerar PDF:', error);
    throw error;
  }
};

const deletarLaudoPDF = (urlPdf) => {
  try {
    if (!urlPdf) return;
    
    const filePath = path.join(__dirname, '..', urlPdf);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('PDF do laudo deletado:', filePath);
    }
  } catch (error) {
    console.error('Erro ao deletar PDF do laudo:', error);
  }
};

module.exports = {
  gerarNumeroLaudo,
  gerarLaudoPDF,
  deletarLaudoPDF,
  obterTemplatePDF // Exportar para testes
};
