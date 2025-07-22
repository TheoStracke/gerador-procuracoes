document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Sistema de Procurações iniciado.");

    /**
 * Desenha um bloco de texto justificado em uma página do PDF.
 * @param {object} options - Opções de desenho.
 * @returns {number} A posição Y final após desenhar o texto.
 */
function drawJustifiedText({ page, text, font, size, lineHeight, x, y, maxWidth, color }) {
    let currentY = y;
    const words = text.split(' ').map(word => word.trim()).filter(word => word.length > 0); // Remove espaços em branco
    let line = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth > maxWidth && i > 0) {
            const wordsInLine = line.trim().split(' ').filter(word => word.length > 0); // Remove espaços em branco
            if (wordsInLine.length > 1) {
                const lineWithoutSpaces = wordsInLine.join('');
                const widthWithoutSpaces = font.widthOfTextAtSize(lineWithoutSpaces, size);
                const totalSpacing = maxWidth - widthWithoutSpaces;
                const spaceWidth = totalSpacing / (wordsInLine.length - 1);

                let currentX = x;
                for (const word of wordsInLine) {
                    page.drawText(word, { x: currentX, y: currentY, font, size, color });
                    currentX += font.widthOfTextAtSize(word, size) + spaceWidth;
                }
            } else {
                page.drawText(wordsInLine[0], { x, y: currentY, font, size, color });
            }

            line = words[i] + ' ';
            currentY -= lineHeight;
        } else {
            line = testLine;
        }
    }
    // Desenha a última linha (sempre alinhada à esquerda)
    page.drawText(line.trim(), { x, y: currentY, font, size, color });
    return currentY - lineHeight * 2; // Retorna a posição Y para o próximo elemento
}


    function setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        body.setAttribute('data-theme', savedTheme);
        themeBtn.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    function updateProgress() {
        const inputs = document.querySelectorAll('.form-input[required], .form-select[required]');
        if (inputs.length === 0) return;
        const filled = Array.from(inputs).filter(input => input.value.trim() !== '').length;
        const progress = (filled / inputs.length) * 100;
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${progress}%`;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    function initializeFloatingLabels() {
        document.querySelectorAll('.floating-label input, .floating-label select').forEach(input => {
            if (input.value) input.parentElement.classList.add('focused');
            input.addEventListener('focus', function () { this.parentElement.classList.add('focused'); });
            input.addEventListener('blur', function () { if (!this.value) { this.parentElement.classList.remove('focused'); } });
        });
    }

    const getApiData = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API request failed: ${res.status}`);
        return res.json();
    };
    const getBrands = () => getApiData('https://parallelum.com.br/fipe/api/v1/carros/marcas');
    const getModels = (brandId) => getApiData(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandId}/modelos`);
    const getYears = (brandId, modelId) => getApiData(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandId}/modelos/${modelId}/anos`);
    const getVehicleDetails = (brandId, modelId, yearId) => getApiData(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);

    function formatarCPF(campo) {
        let valor = campo.value.replace(/\D/g, '').slice(0, 11);
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        campo.value = valor;
    }

    function formatarCEP(campo) {
        let valor = campo.value.replace(/\D/g, '').slice(0, 8);
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        campo.value = valor;
    }

    async function buscarCEP(event) {
        event.preventDefault();
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return showNotification('Por favor, digite um CEP válido com 8 dígitos.', 'error');
        const originalText = cepButton.querySelector('.btn-text')?.textContent || 'Buscar';
        if (cepButton.querySelector('.btn-text')) cepButton.querySelector('.btn-text').textContent = 'Buscando...';
        cepButton.disabled = true;
        try {
            const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
            if (!res.ok) throw new Error(`CEP não encontrado (${res.status})`);
            const dados = await res.json();
            exibirDadosEndereco(dados);
            showNotification('Endereço encontrado!', 'success');
        } catch (err) {
            showNotification(`Erro: ${err.message}`, 'error');
        } finally {
            if (cepButton.querySelector('.btn-text')) cepButton.querySelector('.btn-text').textContent = originalText;
            cepButton.disabled = false;
        }
    }

    function exibirDadosEndereco(dados) {
        document.getElementById('streetInput').value = dados.street || '';
        document.getElementById('neighborhoodInput').value = dados.neighborhood || '';
        document.getElementById('cityInput').value = dados.city || '';
        document.getElementById('stateInput').value = dados.state || '';
        initializeFloatingLabels();
        updateProgress();
    }

        function exibirDadosVeiculo(details) {
    let combustivelFinal = details.Combustivel || 'Não informado';
    const modeloLowerCase = details.Modelo.toLowerCase(); // Converte o nome do modelo para minúsculas para facilitar a busca

    // Lista de palavras-chave para identificar tipos específicos de veículos
    const isHibrido = modeloLowerCase.includes('híbrido') || modeloLowerCase.includes('hybrid') || modeloLowerCase.includes('phev') || modeloLowerCase.includes('hev');
    const isEletrico = modeloLowerCase.includes('elétrico') || modeloLowerCase.includes('eletrico') || modeloLowerCase.includes(' ev'); // " ev" com espaço para evitar falso positivo em palavras como "deve"

    if (isHibrido) {
        combustivelFinal = 'Híbrido';
    } else if (isEletrico) {
        combustivelFinal = 'Elétrico';
    }

    // Se o combustível da API for 'Álcool', pode ser interessante padronizar para 'Etanol'
    if (combustivelFinal.toLowerCase() === 'álcool') {
        combustivelFinal = 'Etanol';
    }

    detailsContainer.innerHTML = `
        <div class="vehicle-info">
            <h3>Detalhes do Veículo</h3>
            <div class="vehicle-grid">
                <div class="floating-label focused"><input type="text" id="marca" readonly value="${details.Marca}"><label></label></div>
                <div class="floating-label focused"><input type="text" id="modeloVeiculo" readonly value="${details.Modelo}"><label></label></div>
                <div class="floating-label focused"><input type="text" id="anoVeiculo" readonly value="${details.AnoModelo}"><label>Ano </label></div>
                <div class="floating-label focused"><input type="text" id="combustivelVeiculo" readonly value="${combustivelFinal}"><label></label></div>
                <div class="floating-label"><input type="text" id="placa" placeholder=" " class="form-input" required><label for="placa">Placa</label></div>
                <div class="floating-label"><input type="text" id="cor" placeholder=" " class="form-input" required><label for="cor">Cor</label></div>
                <div class="floating-label"><input type="text" id="chassi" placeholder=" " class="form-input" required><label for="chassi">Chassi</label></div>
                <div class="floating-label"><input type="text" id="renavam" placeholder=" " class="form-input" required><label for="renavam">RENAVAM</label></div>
            </div>
        </div>`;
    initializeFloatingLabels();
    document.querySelectorAll('#vehicle-details input[required]').forEach(input => input.addEventListener('input', updateProgress));
    updateProgress();
}

        async function gerarPDF(tipoProcuracao) {
    // Validação de campos (permanece igual)
    const camposInvalidos = [];
    const todosOsCampos = document.querySelectorAll('input[required], select[required]');
    todosOsCampos.forEach(campo => campo.classList.remove('invalid-field'));
    todosOsCampos.forEach(campo => { if (!campo.value.trim()) camposInvalidos.push(campo); });

    if (camposInvalidos.length > 0) {
        showNotification(`Por favor, preencha os campos destacados.`, 'error');
        camposInvalidos.forEach((campo, index) => {
            campo.classList.add('invalid-field');
            if (index === 0) {
                campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                campo.focus();
            }
        });
        return;
    }

    if (typeof PDFLib === 'undefined') {
        showNotification('Erro: A biblioteca de PDF não carregou.', 'error');
        return;
    }

    try {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const formData = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            rg: document.getElementById('rg').value,
            modelo: document.getElementById('modeloVeiculo').value,
            ano: document.getElementById('anoVeiculo').value,
            combustivel: document.getElementById('combustivelVeiculo').value,
            marca: document.getElementById('marca').value,
            chassi: document.getElementById('chassi').value,
            renavam: document.getElementById('renavam').value,
            placa: document.getElementById('placa').value,
            cor: document.getElementById('cor').value,
            local: document.getElementById('local').value,
            endereco: `${document.getElementById('streetInput').value}, ${document.getElementById('numberInput').value} - ${document.getElementById('neighborhoodInput').value}, ${document.getElementById('cityInput').value}/${document.getElementById('stateInput').value}`,
        };

        const procuradores = `o DANIEL DIMAS DA SILVA, RG Nº 2227572, CPF Nº 714.806.339-68, nacionalidade brasileiro, estado civil CASADO, profissão EMPRESÁRIO, residente na Av. Jornalista Rubens de Arruda Ramos, 2368 ap 402, Centro, município de Florianópolis/SC e/ou SORAYA FURTADO DA ROSA, RG N° 29063280, CPF N° 021.976.659-28, nacionalidade BRASILEIRA, estado civil CASADA, profissão DIRETORA DE SERVIÇOS FINANCEIROS E MOBILIDADE, residente na Rua Dom Pedro II, 374, ap 105, Campinas, município de São José / SC, e/ou RICARDO DIMAS DA SILVA, RG N° 3087747, CPF N° 004.126.779-62, nacionalidade BRASILEIRA, estado civil CASADO, profissão EMPRESÁRIO residente na rua Comandante Constantino Nicolau Spyrides, 3600, Bl B, Apto 602, Agronômica, município de Florianópolis/SC, e/ou PATRICIA WENTZ, nacionalidade BRASILEIRA, estado civil SOLTEIRA, profissão COORDENADORA FINANCEIRA, inscrita no CPF n° 008.533.820-69; essa em conjunto com NATHANY LEMOS, nacionalidade BRASILEIRA, estado civil SOLTEIRA, profissão COORDENADORA FINANCEIRA, inscrita no CPF n° 091.898.659-10, ambas com endereço profissional na Avenida Marinheiro Max Schramm nº 2700, Jardim Atlântico, Florianópolis/SC`;
        let corpoTexto = '';
        const titulo = `PROCURAÇÃO ELETRÔNICA`;

        if (tipoProcuracao === 'compra') {
            corpoTexto = `Pelo presente instrumento de procuração eletrônica, eu, ${formData.nome}, CPF nº ${formData.cpf}, RG nº ${formData.rg}, residente na ${formData.endereco}, abaixo assinado, nomeio e constituo meu bastante procurador ${procuradores}, para adotar todo e qualquer procedimento junto ao DEPARTAMENTO ESTADUAL DE TRÂNSITO – DETRAN, para registrar/transferir, PARA O NOME DO OUTORGANTE, o veículo ${formData.marca}; ${formData.modelo}; ${formData.combustivel}; ${formData.ano}; Cor ${formData.cor}; Placa ${formData.placa}; Chassi ${formData.chassi}; Renavam ${formData.renavam}, em nome do OUTORGANTE. Podendo para tanto dito procurador legalizar toda a documentação necessária junto ao DEPARTAMENTO DE TRÂNSITO – DETRAN, e onde como esta se apresentar, tudo requerer e assinar em nome do outorgante, preencher e assinar o Documento Único de Transferência – DUT e/ou o Certificado de Registro de Veículo – CRV, em nome do outorgante, assinar em nome do outorgante os documentos relativos à transferência do veículo, constituir advogado, juntar e retirar documentos, preencher guias e formulários, apresentar defesa/recursos junto aos órgãos de trânsito nas esferas municipais, estaduais e federais, requerer negativos de multas e furtos, segunda via do certificado de registro do veículo, Administradoras de Consórcios “receber o preço da venda“ e Financiadoras, assinar termos de responsabilidade, enfim praticar todos os demais. atos necessários ao bom e fiel cumprimento do presente mandato, inclusive substabelecer, sendo a presente procuração outorgada de forma irrevogável e irretratável.`;
        } else { // Venda
            corpoTexto = `Pelo presente instrumento de procuração eletrônica, eu, ${formData.nome}, CPF nº ${formData.cpf}, RG nº ${formData.rg}, residente na ${formData.endereco}, abaixo assinado, nomeio e constituo meu bastante procurador ${procuradores}, para o transferir para quem estes indicarem, pelo melhor preço e condições que ajustar, inclusive assinar em nome do outorgante o Documento Único de Transferência – DUT e/ou o Certificado de Registro de Veículo – CRV e/ou Autorização para Transferência de Propriedade de Veículo digital – ATPV, o veículo ${formData.marca}; ${formData.modelo}; Placa ${formData.placa}; ${formData.combustivel}; ${formData.ano}; Cor ${formData.cor}; Chassi ${formData.chassi}; Renavam ${formData.renavam}, emplacado em ${formData.local} em nome do outorgante. Podendo para tanto dito procurar legalizar toda a documentação necessária junto ao DEPARTAMENTO DE TRÂNSITO – DETRAN, e onde como esta se apresentar, tudo requerer e assinar em nome do outorgante, preencher e assinar o Documento Único de Transferência – DUT e/ou o Certificado de Registro de Veículo – CRV, em nome do outorgante, assinar em nome do outorgante os documentos relativos à transferência do veículo, constituir advogado, juntar e retirar documentos, preencher guias e formulários, apresentar defesa/recursos junto aos órgãos de trânsito nas esferas municipais, estaduais e federais ou constituir advogado para tal, assinar requerimento de troca de pontuação de multas, indicar condutor infrator, requerer negativos de multas e furtos, segunda via do certificado de registro do veículo, Administradoras de Consórcios “receber o preço da venda“ e Financiadoras, assinar termos de responsabilidade, enfim praticar todos os demais atos necessários ao bom e fiel cumprimento do presente mandato, inclusive substabelecer, sendo a presente procuração outorgada de forma irrevogável e irretratável.`;
        }
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const localData = `${formData.local}, ${dataAtual}.`;

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const margin = 50;
        let currentY = height - margin;
        
        const titleSize = 14;
        const titleWidth = boldFont.widthOfTextAtSize(titulo, titleSize);
        page.drawText(titulo, { x: (width - titleWidth) / 2, y: currentY, font: boldFont, size: titleSize });
        currentY -= 40;

        currentY = drawJustifiedText({
    page,
    text: corpoTexto,
    font,
    size: 12,
    lineHeight: 15,
    x: margin,
    y: currentY,
    maxWidth: width - (2 * margin),
    color: rgb(0, 0, 0)
});

        
        // O restante do posicionamento permanece igual
        const localDataWidth = font.widthOfTextAtSize(localData, 12);
        page.drawText(localData, { x: (width - localDataWidth) / 2, y: currentY, font: font, size: 12 });
        currentY -= 60;

        const signatureLine = '________________________________________';
        const signatureName = formData.nome.toUpperCase();
        const signatureLineWidth = font.widthOfTextAtSize(signatureLine, 12);
        const signatureNameWidth = font.widthOfTextAtSize(signatureName, 12);
        page.drawText(signatureLine, { x: (width - signatureLineWidth) / 2, y: currentY, font: font, size: 12 });
        currentY -= 15;
        page.drawText(signatureName, { x: (width - signatureNameWidth) / 2, y: currentY, font: font, size: 12 });

        const nomeArquivo = `Procuracao_${tipoProcuracao}_${formData.nome.split(' ')[0] || 'documento'}.pdf`;
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Download iniciado com sucesso!', 'success');

    } catch (error) {
        console.error("❌ ERRO DURANTE A GERAÇÃO DO PDF:", error);
        showNotification('Ocorreu um erro ao gerar o PDF.', 'error');
    }
}

    // --- 3. SELEÇÃO DOS ELEMENTOS DO DOM ---
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const selBrand = document.getElementById('brand');
    const selModel = document.getElementById('model');
    const selYear = document.getElementById('year');
    const detailsContainer = document.getElementById('vehicle-details');
    const cpfInput = document.getElementById('cpf');
    const cepInput = document.getElementById('cep');
    const cepButton = document.getElementById('buscar-cep-btn');
    const pdfCompraButton = document.getElementById('gerar-pdf-compra-btn');
    const pdfVendaButton = document.getElementById('gerar-pdf-venda-btn');

    // --- 4. EVENT LISTENERS ---
    document.addEventListener('input', updateProgress);
    document.addEventListener('change', updateProgress);
    cpfInput.addEventListener('input', () => formatarCPF(cpfInput));
    cepInput.addEventListener('input', () => formatarCEP(cepInput));
    cepButton.addEventListener('click', buscarCEP);
    cepInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); cepButton.click(); }
    });

    selBrand.addEventListener('change', async () => {
        const brandId = selBrand.value;
        selModel.innerHTML = '<option value=""></option>'; selModel.disabled = true;
        selYear.innerHTML = '<option value=""></option>'; selYear.disabled = true;
        detailsContainer.innerHTML = '';
        if (!brandId) return updateProgress();
        selModel.innerHTML = '<option>Carregando...</option>';
        try {
            const data = await getModels(brandId);
            selModel.innerHTML = '<option value=""></option>';
            data.modelos.forEach(m => selModel.add(new Option(m.nome, m.codigo)));
            selModel.disabled = false;
        } catch (e) {
            selModel.innerHTML = '<option value="">Erro</option>';
            showNotification('Erro ao carregar modelos.', 'error');
        }
    });

    selModel.addEventListener('change', async () => {
        const brandId = selBrand.value;
        const modelId = selModel.value;
        selYear.innerHTML = '<option value=""></option>'; selYear.disabled = true;
        detailsContainer.innerHTML = '';
        if (!modelId) return updateProgress();
        selYear.innerHTML = '<option>Carregando...</option>';
        try {
            const years = await getYears(brandId, modelId);
            if (!years || !Array.isArray(years) || years.length === 0) throw new Error("A API não retornou anos.");
            selYear.innerHTML = '<option value=""></option>';
            years.forEach(y => selYear.add(new Option(y.nome, y.codigo)));
            selYear.disabled = false;
        } catch (e) {
            selYear.innerHTML = '<option value="">Erro</option>';
            showNotification('Erro ao carregar anos.', 'error');
            console.error("Falha ao carregar anos:", e);
        }
    });

    selYear.addEventListener('change', async () => {
        const brandId = selBrand.value;
        const modelId = selModel.value;
        const yearId = selYear.value;
        if (!yearId) { detailsContainer.innerHTML = ''; return updateProgress(); }
        detailsContainer.innerHTML = '<div class="loading-details">Carregando detalhes...</div>';
        try {
            const details = await getVehicleDetails(brandId, modelId, yearId);
            exibirDadosVeiculo(details);
        } catch (e) {
            detailsContainer.innerHTML = '<div class="error-message">Não foi possível carregar os detalhes.</div>';
            showNotification('Erro ao carregar detalhes do veículo.', 'error');
            console.error("Falha na chamada final da API:", e);
        }
    });

    if (pdfCompraButton) {
        pdfCompraButton.addEventListener('click', () => gerarPDF('compra'));
    }
    if (pdfVendaButton) {
        pdfVendaButton.addEventListener('click', () => gerarPDF('venda'));
    }

    // --- 5. INICIALIZAÇÃO ---
    async function carregarMarcas() {
        selBrand.disabled = true;
        try {
            const brands = await getBrands();
            selBrand.innerHTML = '<option value=""></option>';
            brands.forEach(b => selBrand.add(new Option(b.nome, b.codigo)));
        } catch (e) {
            selBrand.innerHTML = '<option value="">Erro ao carregar</option>';
            showNotification('Erro crítico: Falha ao carregar marcas.', 'error');
        } finally {
            selBrand.disabled = false;
        }
    }

    setupTheme();
    initializeFloatingLabels();
    carregarMarcas();
    updateProgress();
    // A função setupAnimations foi removida pois não foi fornecida, descomente se a tiver
    // setupAnimations(); 
});