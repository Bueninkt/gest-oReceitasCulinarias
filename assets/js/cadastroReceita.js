'use strict';

// URLs da API
const BASE_URL         = 'http://10.107.134.31:8080/v1/controle-receitas';
const CATEGORIAS_URL   = `${BASE_URL}/categoria`;
const DIFICULDADES_URL = `${BASE_URL}/nivelDificuldade`;
const RECEITA_URL      = `${BASE_URL}/receita`;

// Configuração do Azure Blob Storage
const AZURE_ACCOUNT   = 'uploadreceita';
const AZURE_CONTAINER = 'fotos'; // Ajuste para o nome exato do seu container no Azure
const SAS_TOKEN       = 'sp=racwl&st=2025-06-03T18:39:57Z&se=2025-07-03T02:39:57Z&sv=2024-11-04&sr=c&sig=eiTLG0XfiGvXKR0Kn3zpFI8ATkPQ33cjV%2Bywkqrt%2Fm0%3D';

// Chave usada em localStorage para armazenar a URL da última imagem enviada
const STORAGE_KEY_IMAGEM_URL = 'ultimaImagemUrl';


const userId = localStorage.getItem('userId');
  if (!userId) {
    // Se não houver usuário logado, redireciona para a página de login
    window.location.href = '../index.html';
    return;
  }

  carregarCategorias();
  carregarDificuldades();
  configurarUploadImagem(userId);
  configurarEnvioReceita(userId);


/**
 * Busca categorias no back-end e popula o primeiro <details>
 */
async function carregarCategorias() {
  try {
    const resp = await fetch(CATEGORIAS_URL);
    if (!resp.ok) throw new Error('Erro ao carregar categorias');
    const categorias = await resp.json();

    const container = document.querySelector(
      '.filter-detail:nth-of-type(1) .filter-options'
    );
    container.innerHTML = ''; // limpa opções estáticas

    categorias.forEach(cat => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input
          type="radio"
          name="category"
          value="${cat.id}"
        /> ${cat.nome}
      `;
      container.appendChild(label);
    });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Busca níveis de dificuldade no back-end e popula o segundo <details>
 */
async function carregarDificuldades() {
  try {
    const resp = await fetch(DIFICULDADES_URL);
    if (!resp.ok) throw new Error('Erro ao carregar níveis de dificuldade');
    const niveis = await resp.json();

    const container = document.querySelector(
      '.filter-detail:nth-of-type(2) .filter-options'
    );
    container.innerHTML = ''; // limpa opções estáticas

    niveis.forEach(niv => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input
          type="radio"
          name="difficulty"
          value="${niv.id}"
        /> ${niv.nivel}
      `;
      container.appendChild(label);
    });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Configura o fluxo de upload da imagem para o Azure e armazena a URL em localStorage.
 * userId é usado para gerar um nome de blob único.
 */
function configurarUploadImagem(userId) {
  const imageInput       = document.getElementById('image-input');
  const previewContainer = document.getElementById('image-preview');
  const placeholder      = previewContainer.querySelector('.upload-placeholder');

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    try {
      // Faz o upload ao Azure e obtém a URL pública
      const blobUrl = await uploadParaAzure(file, userId);

      // Armazena a URL no localStorage para uso posterior
      localStorage.setItem(STORAGE_KEY_IMAGEM_URL, blobUrl);

      // Exibe preview da imagem no container
      previewContainer.style.backgroundImage = `url('${blobUrl}')`;
      placeholder.style.display = 'none';
    } catch (e) {
      console.error('Falha no upload:', e);
      placeholder.textContent = 'Erro ao enviar imagem';
    }
  });
}

/**
 * Envia o arquivo binário ao Azure Blob e retorna a URL pública do blob.
 */
async function uploadParaAzure(file, userId) {
  // Gera um nome único para o blob: userId_timestamp_nomeOriginal
  const timestamp = Date.now();
  const blobName  = `${userId}_${timestamp}_${file.name}`;

  const uploadUrl = `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}?${SAS_TOKEN}`;

  const resposta = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type
    },
    body: file
  });

  if (!resposta.ok) {
    throw new Error(`Azure retornou status ${resposta.status}`);
  }

  // Retorna a URL pública sem SAS token
  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}`;
}

/**
 * Configura o botão “Concluir”: reúne todos os campos, a URL da imagem do localStorage
 * e envia o payload completo para o endpoint de criar receita.
 */
function configurarEnvioReceita(userId) {
  const btnConcluir = document.getElementById('concluir-btn');

  btnConcluir.addEventListener('click', async () => {
    const titulo       = document.getElementById('recipe-title').value.trim();
    const descricao    = document.getElementById('descricao').value.trim();
    const ingredientes = document.getElementById('ingredients').value.trim();
    const modoPreparo  = document.getElementById('preparation').value.trim();
    const porcoes      = Number(document.getElementById('porcoes-input').value);

    const categoriaRadio   = document.querySelector('input[name="category"]:checked');
    const dificuldadeRadio = document.querySelector('input[name="difficulty"]:checked');

    // Recupera a URL da última imagem enviada ao Azure (se existir)
    const imagemUrl = localStorage.getItem(STORAGE_KEY_IMAGEM_URL) || '';

    // Validações mínimas
    if (
      !titulo        ||
      !descricao     ||
      !ingredientes  ||
      !modoPreparo   ||
      !categoriaRadio ||
      !dificuldadeRadio ||
      !porcoes
    ) {
      alert('Preencha todos os campos e selecione categoria e dificuldade.');
      return;
    }

    // Monta o objeto a ser enviado
    const receitaPayload = {
      titulo,
      descricao,
      ingredientes,
      modoPreparo,
      porcoes,
      categoriaId: Number(categoriaRadio.value),
      nivelDificuldadeId: Number(dificuldadeRadio.value),
      usuarioId: Number(userId),
      imagemUrl // já está disponível no localStorage
    };

    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(RECEITA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(receitaPayload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Erro ao cadastrar receita');
      }
      alert('Receita cadastrada com sucesso!');
      // Opcional: limpar localStorage ou campos após sucesso
      localStorage.removeItem(STORAGE_KEY_IMAGEM_URL);
      // Aqui você pode limpar campos ou redirecionar, se quiser
    } catch (e) {
      console.error(e);
      alert(`Falha ao cadastrar receita: ${e.message}`);
    }
  });
}
