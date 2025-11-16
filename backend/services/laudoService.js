const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

const gerarLaudoPDF = async (laudo, vistoria, fotos = []) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('[PDF] Iniciando geração do PDF...');
      console.log('[PDF] Laudo ID:', laudo.id);
      
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const dirPath = garantirDiretorioLaudos();
      console.log('[PDF] Diretório:', dirPath);
      
      const fileName = `laudo-${laudo.id}.pdf`;
      const filePath = path.join(dirPath, fileName);
      console.log('[PDF] Caminho completo:', filePath);
      
      const stream = fs.createWriteStream(filePath);

      stream.on('error', (streamError) => {
        console.error('[PDF] Erro no stream:', streamError);
        reject(streamError);
      });

      doc.on('error', (docError) => {
        console.error('[PDF] Erro no documento:', docError);
        reject(docError);
      });

      doc.pipe(stream);

      const drawHeader = () => {
        doc.fontSize(10).text(`Versão: ${laudo.versao || 'BS 2021-01'}`, 50, 50);
        doc.fontSize(16).font('Helvetica-Bold').text('RELATÓRIO DE INSPEÇÃO DE RISCO', 50, 80, { align: 'center' });
        doc.fontSize(14).text('CASCOS', 50, 100, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Laudo: ${laudo.numero_laudo}`, 50, 120);
        
        if (laudo.nome_empresa) {
          doc.fontSize(12).font('Helvetica-Bold').text(laudo.nome_empresa, 50, 140, { align: 'center' });
        }
        
        doc.moveDown(2);
      };

      const drawSection = (titulo, y) => {
        doc.fontSize(12).font('Helvetica-Bold').text(titulo, 50, y);
        return y + 20;
      };

      const drawField = (label, value, y) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, 50, y);
        doc.font('Helvetica').text(value || '---', 250, y);
        return y + 18;
      };

      const drawCheckbox = (label, checked, y) => {
        const boxes = ['Sim', 'Não', 'Não possui'];
        doc.fontSize(10).font('Helvetica').text(label, 70, y, { width: 450 });
        
        let xPos = 70;
        boxes.forEach((box) => {
          const isChecked = checked === box || (checked === true && box === 'Sim');
          doc.rect(xPos, y + 15, 8, 8).stroke();
          if (isChecked) {
            doc.fontSize(12).text('X', xPos + 1, y + 13);
          }
          doc.fontSize(10).text(box, xPos + 12, y + 15);
          xPos += 80;
        });
        
        return y + 35;
      };

      const drawFooter = (pageNumber) => {
        const bottom = doc.page.height - 30;
        
        if (laudo.nota_rodape) {
          doc.fontSize(8).font('Helvetica-Oblique').text(
            laudo.nota_rodape,
            50,
            bottom - 20,
            { align: 'center', width: doc.page.width - 100 }
          );
        }
        
        doc.fontSize(8).font('Helvetica').text(
          `Página ${pageNumber}`,
          0,
          bottom,
          { align: 'center' }
        );
      };
      
      let pageNumber = 1;

      drawHeader();
      drawFooter(pageNumber);
      let currentY = 180;

      currentY = drawSection('DADOS GERAIS', currentY);
      currentY = drawField('Nome da moto aquática:', laudo.nome_moto_aquatica, currentY);
      currentY = drawField('Local de Guarda:', laudo.local_guarda, currentY);
      currentY = drawField('Proprietário:', laudo.proprietario, currentY);
      currentY = drawField('CPF / CNPJ:', laudo.cpf_cnpj, currentY);
      currentY = drawField('Endereço do Proprietário:', laudo.endereco_proprietario, currentY);
      currentY = drawField('Responsável:', laudo.responsavel, currentY);
      currentY = drawField('Data da Inspeção:', laudo.data_inspecao, currentY);
      currentY = drawField('Local da Vistoria:', laudo.local_vistoria, currentY);
      currentY = drawField('Empresa Prestadora:', laudo.empresa_prestadora, currentY);
      currentY = drawField('Responsável pela Inspeção:', laudo.responsavel_inspecao, currentY);
      currentY = drawField('Participantes na Inspeção:', laudo.participantes_inspecao, currentY);
      currentY += 20;

      if (currentY > 650) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('1. DADOS DA MOTO AQUÁTICA', currentY);
      currentY = drawField('1.1. Inscrição na Capitania dos Portos:', laudo.inscricao_capitania, currentY);
      currentY = drawField('1.2. Estaleiro Construtor:', laudo.estaleiro_construtor, currentY);
      currentY = drawField('1.3. Tipo de Embarcação:', laudo.tipo_embarcacao, currentY);
      currentY = drawField('1.4. Modelo:', laudo.modelo_embarcacao, currentY);
      currentY = drawField('1.5. Ano de Fabricação:', laudo.ano_fabricacao, currentY);
      currentY = drawField('1.6. Capacidade:', laudo.capacidade, currentY);
      currentY = drawField('1.7. Classificação da Embarcação:', laudo.classificacao_embarcacao, currentY);
      currentY = drawField('1.8. Área de Navegação:', laudo.area_navegacao, currentY);
      currentY = drawField('1.9. Situação perante a Capitania dos Portos:', laudo.situacao_capitania, currentY);
      currentY = drawField('1.10. Valor em Risco:', laudo.valor_risco ? `R$ ${parseFloat(laudo.valor_risco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---', currentY);
      currentY += 20;

      if (currentY > 650) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('2. CASCO', currentY);
      currentY = drawField('2.1. Material do Casco:', laudo.material_casco, currentY);
      currentY = drawField('2.2. Observações:', laudo.observacoes_casco, currentY);
      currentY += 20;

      if (currentY > 650) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('3. PROPULSÃO', currentY);
      currentY = drawField('3.1. Quantidade de Motores:', laudo.quantidade_motores, currentY);
      currentY = drawField('3.2. Tipo:', laudo.tipo_motor, currentY);
      currentY = drawField('3.3. Fabricante do(s) Motor(es):', laudo.fabricante_motor, currentY);
      currentY = drawField('3.4. Modelo do(s) Motor(es):', laudo.modelo_motor, currentY);
      currentY = drawField('3.5. Número(s) de Série:', laudo.numero_serie_motor, currentY);
      currentY = drawField('3.6. Potência do(s) Motor(es):', laudo.potencia_motor, currentY);
      currentY = drawField('3.7. Combustível Utilizado:', laudo.combustivel_utilizado, currentY);
      currentY = drawField('3.8. Capacidade do Tanque de Combustível:', laudo.capacidade_tanque, currentY);
      currentY = drawField('3.9. Ano de Fabricação:', laudo.ano_fabricacao_motor, currentY);
      currentY = drawField('3.10. Número de Hélices e Material:', laudo.numero_helices, currentY);
      currentY = drawField('3.11. Rabeta / Reversora:', laudo.rabeta_reversora, currentY);
      currentY = drawField('3.12. Blower:', laudo.blower, currentY);
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('4. SISTEMAS ELÉTRICOS E DE SUPORTE', currentY);
      currentY = drawField('4.1. Quantidade de Baterias:', laudo.quantidade_baterias, currentY);
      currentY = drawField('4.2. Marca das Baterias:', laudo.marca_baterias, currentY);
      currentY = drawField('4.3. Capacidade das Baterias (Ah):', laudo.capacidade_baterias, currentY);
      currentY = drawField('4.4. Carregador de Bateria:', laudo.carregador_bateria, currentY);
      currentY = drawField('4.5. Transformador:', laudo.transformador, currentY);
      currentY = drawField('4.6. Quantidade de Geradores:', laudo.quantidade_geradores, currentY);
      currentY = drawField('4.7. Fabricante do(s) Gerador(es):', laudo.fabricante_geradores, currentY);
      currentY = drawField('4.8. Tipo e Modelo do(s) Gerador(es):', laudo.tipo_modelo_geradores, currentY);
      currentY = drawField('4.9. Capacidade de Geração:', laudo.capacidade_geracao, currentY);
      currentY = drawField('4.10. Quantidade de Bombas de Porão:', laudo.quantidade_bombas_porao, currentY);
      currentY = drawField('4.11. Fabricante da(s) Bomba(s) de Porão:', laudo.fabricante_bombas_porao, currentY);
      currentY = drawField('4.12. Modelo da(s) Bomba(s) de Porão:', laudo.modelo_bombas_porao, currentY);
      currentY = drawField('4.13. Quantidade de Bombas de Água Doce:', laudo.quantidade_bombas_agua_doce, currentY);
      currentY = drawField('4.14. Fabricante da(s) Bomba(s) de Água Doce:', laudo.fabricante_bombas_agua_doce, currentY);
      currentY = drawField('4.15. Modelo da(s) Bomba(s) de Água Doce:', laudo.modelo_bombas_agua_doce, currentY);
      if (laudo.observacoes_eletricos) {
        currentY = drawField('4.16. Observações:', laudo.observacoes_eletricos, currentY);
      }
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('5. MATERIAIS DE FUNDEIO', currentY);
      currentY = drawField('5.1. Guincho Elétrico:', laudo.guincho_eletrico, currentY);
      currentY = drawField('5.2. Ancora:', laudo.ancora, currentY);
      currentY = drawField('5.3. Cabos:', laudo.cabos, currentY);
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('6. EQUIPAMENTOS DE NAVEGAÇÃO', currentY);
      currentY = drawField('6.1. Agulha Giroscópica:', laudo.agulha_giroscopica, currentY);
      currentY = drawField('6.2. Agulha Magnética:', laudo.agulha_magnetica, currentY);
      currentY = drawField('6.3. Antena:', laudo.antena, currentY);
      currentY = drawField('6.4. Bidata:', laudo.bidata, currentY);
      currentY = drawField('6.5. Barômetro:', laudo.barometro, currentY);
      currentY = drawField('6.6. Buzina:', laudo.buzina, currentY);
      currentY = drawField('6.7. Conta Giros:', laudo.conta_giros, currentY);
      currentY = drawField('6.8. Farol de Milha:', laudo.farol_milha, currentY);
      currentY = drawField('6.9. GPS:', laudo.gps, currentY);
      currentY = drawField('6.10. Higrômetro:', laudo.higrometro, currentY);
      currentY = drawField('6.11. Horímetro:', laudo.horimetro, currentY);
      currentY = drawField('6.12. Limpador de Para-brisas:', laudo.limpador_parabrisa, currentY);
      currentY = drawField('6.13. Manômetros:', laudo.manometros, currentY);
      currentY = drawField('6.14. Odômetro de Fundo:', laudo.odometro_fundo, currentY);
      currentY = drawField('6.15. Passarela de Embarque:', laudo.passarela_embarque, currentY);
      currentY = drawField('6.16. Piloto Automático:', laudo.piloto_automatico, currentY);
      currentY = drawField('6.17. PSI:', laudo.psi, currentY);
      currentY = drawField('6.18. Radar:', laudo.radar, currentY);
      currentY = drawField('6.19. Rádio SSB:', laudo.radio_ssb, currentY);
      currentY = drawField('6.20. Rádio VHF:', laudo.radio_vhf, currentY);
      currentY = drawField('6.21. Radiogoniometro:', laudo.radiogoniometro, currentY);
      currentY = drawField('6.22. Sonda:', laudo.sonda, currentY);
      currentY = drawField('6.23. Speed Log:', laudo.speed_log, currentY);
      currentY = drawField('6.24. Strobow:', laudo.strobow, currentY);
      currentY = drawField('6.25. Termômetro:', laudo.termometro, currentY);
      currentY = drawField('6.26. Voltímetro:', laudo.voltimetro, currentY);
      if (laudo.outros_equipamentos) {
        currentY = drawField('6.27. Outros:', laudo.outros_equipamentos, currentY);
      }
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('7. SISTEMAS DE COMBATE A INCÊNDIO', currentY);
      currentY = drawField('7.1. Extintores Automáticos:', laudo.extintores_automaticos, currentY);
      currentY = drawField('7.2. Extintores Portáteis:', laudo.extintores_portateis, currentY);
      if (laudo.outros_incendio) {
        currentY = drawField('7.3. Outros:', laudo.outros_incendio, currentY);
      }
      currentY = drawField('7.4. Atendimento às Normas de Segurança:', laudo.atendimento_normas, currentY);
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('8. VISTORIA', currentY);
      currentY = drawField('8.1. Acúmulo de água no fundo da embarcação:', laudo.acumulo_agua, currentY);
      currentY = drawField('8.2. Avarias no casco:', laudo.avarias_casco, currentY);
      currentY = drawField('8.3. Estado Geral de Limpeza e Conservação:', laudo.estado_geral_limpeza, currentY);
      currentY = drawField('8.4. Teste de Funcionamento do Motor Propulsor:', laudo.teste_funcionamento_motor, currentY);
      currentY = drawField('8.5. Funcionamento de Bombas de Porão:', laudo.funcionamento_bombas_porao, currentY);
      currentY = drawField('8.6. Manutenção:', laudo.manutencao, currentY);
      if (laudo.observacoes_vistoria) {
        currentY = drawField('8.7. Observações:', laudo.observacoes_vistoria, currentY);
      }
      currentY += 30;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      doc.fontSize(12).font('Helvetica-Bold').text('RELAÇÃO DE ITENS A SEREM VERIFICADOS', 50, currentY, { underline: true });
      currentY += 30;

      currentY = drawSection('9. INSTALAÇÕES ELÉTRICAS', currentY);
      
      if (laudo.checklist_eletrica) {
        const checklistEletrica = typeof laudo.checklist_eletrica === 'string' 
          ? JSON.parse(laudo.checklist_eletrica) 
          : laudo.checklist_eletrica;
        
        if (checklistEletrica.terminais_estanhados !== undefined) {
          currentY = drawCheckbox('9.1. Os terminais de cabos elétricos estão devidamente estanhados?', checklistEletrica.terminais_estanhados, currentY);
        }
        if (checklistEletrica.circuitos_protegidos !== undefined) {
          currentY = drawCheckbox('9.2. Circuitos elétricos estão protegidos por disjuntores ou fusíveis?', checklistEletrica.circuitos_protegidos, currentY);
        }
        if (checklistEletrica.chave_geral !== undefined) {
          currentY = drawCheckbox('9.3. A chave geral é de uso náutico, está em local de fácil acesso e protegido de respingos?', checklistEletrica.chave_geral, currentY);
        }
        if (checklistEletrica.terminais_baterias !== undefined) {
          currentY = drawCheckbox('9.4. Os terminais de cabos de baterias estão devidamente prensados?', checklistEletrica.terminais_baterias, currentY);
        }
        if (checklistEletrica.baterias_fixadas !== undefined) {
          currentY = drawCheckbox('9.5. As baterias estão devidamente fixadas, sem apresentar movimento?', checklistEletrica.baterias_fixadas, currentY);
        }
        if (checklistEletrica.passagem_chicotes !== undefined) {
          currentY = drawCheckbox('9.6. A passagem dos chicotes elétricos pelas anteparas estão protegidos com anéis de borracha para evitar danos às capas de fiação?', checklistEletrica.passagem_chicotes, currentY);
        }
        if (checklistEletrica.cabo_arranque !== undefined) {
          currentY = drawCheckbox('9.7. O cabo de alimentação do motor de arranque tem fusível próprio?', checklistEletrica.cabo_arranque, currentY);
        }
      }
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('10. INSTALAÇÃO HIDRÁULICA', currentY);
      
      if (laudo.checklist_hidraulica) {
        const checklistHidraulica = typeof laudo.checklist_hidraulica === 'string' 
          ? JSON.parse(laudo.checklist_hidraulica) 
          : laudo.checklist_hidraulica;
        
        if (checklistHidraulica.material_tanques !== undefined) {
          currentY = drawCheckbox('10.1. O material de fabricação dos tanques de combustível está de acordo com o combustível utilizado pela embarcação?', checklistHidraulica.material_tanques, currentY);
        }
        if (checklistHidraulica.abracadeiras_inox !== undefined) {
          currentY = drawCheckbox('10.2. As abraçadeiras usadas a bordo são de aço inox?', checklistHidraulica.abracadeiras_inox, currentY);
        }
      }
      currentY += 20;

      if (currentY > 600) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
      }

      currentY = drawSection('11. GERAL', currentY);
      
      if (laudo.checklist_geral) {
        const checklistGeral = typeof laudo.checklist_geral === 'string' 
          ? JSON.parse(laudo.checklist_geral) 
          : laudo.checklist_geral;
        
        if (checklistGeral.carreta_condicoes !== undefined) {
          currentY = drawCheckbox('11.1. A carreta da embarcação se encontra em boas condições e com manutenção em dia?', checklistGeral.carreta_condicoes, currentY);
        }
      }
      currentY += 30;

      if (fotos && fotos.length > 0) {
        doc.addPage();
        pageNumber++;
        drawFooter(pageNumber);
        currentY = 50;
        doc.fontSize(14).font('Helvetica-Bold').text('REGISTRO FOTOGRÁFICO', 50, currentY, { align: 'center' });
        currentY += 30;

        let fotosPorPagina = 0;
        const maxFotosPorPagina = 4;
        const fotoWidth = 200;
        const fotoHeight = 150;

        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          const fotoPath = path.join(__dirname, '..', foto.url_arquivo);

          if (fs.existsSync(fotoPath)) {
            try {
              if (fotosPorPagina >= maxFotosPorPagina) {
                doc.addPage();
                pageNumber++;
                drawFooter(pageNumber);
                currentY = 50;
                fotosPorPagina = 0;
              }

              const xPos = 50 + (fotosPorPagina % 2) * 250;
              const yPos = currentY + Math.floor(fotosPorPagina / 2) * 200;

              doc.image(fotoPath, xPos, yPos, { 
                width: fotoWidth,
                height: fotoHeight,
                fit: [fotoWidth, fotoHeight],
                align: 'center'
              });

              doc.fontSize(8).font('Helvetica').text(
                foto.TipoFotoChecklist?.nome_exibicao || `Foto ${i + 1}`,
                xPos,
                yPos + fotoHeight + 5,
                { width: fotoWidth, align: 'center' }
              );

              if (foto.observacao) {
                doc.fontSize(7).font('Helvetica-Oblique').text(
                  foto.observacao,
                  xPos,
                  yPos + fotoHeight + 20,
                  { width: fotoWidth, align: 'center' }
                );
              }

              fotosPorPagina++;

              if (fotosPorPagina % 2 === 0) {
                currentY += 200;
              }
            } catch (imgError) {
              console.error(`Erro ao adicionar foto ${i + 1}:`, imgError);
            }
          }
        }
      }

      doc.addPage();
      pageNumber++;
      drawFooter(pageNumber);
      currentY = 50;
      doc.fontSize(12).font('Helvetica-Bold').text('ASSINATURA', 50, currentY);
      currentY += 40;
      
      doc.fontSize(10).font('Helvetica').text('_'.repeat(60), 50, currentY);
      currentY += 20;
      doc.text('Responsável pela Inspeção', 50, currentY);
      currentY += 40;
      
      doc.fontSize(10).text('_'.repeat(60), 50, currentY);
      currentY += 20;
      doc.text('Data: ___/___/_____', 50, currentY);

      stream.on('finish', () => {
        console.log('[PDF] Stream finalizado com sucesso!');
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const urlRelativa = `/uploads/laudos/${ano}/${mes}/${fileName}`;
        
        console.log('[PDF] PDF criado:', urlRelativa);
        
        resolve({
          filePath,
          urlRelativa,
          fileName
        });
      });

      stream.on('error', (streamError) => {
        console.error('[PDF] Erro no stream finish:', streamError);
        reject(streamError);
      });

      console.log('[PDF] Finalizando documento...');
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
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
  deletarLaudoPDF
};

