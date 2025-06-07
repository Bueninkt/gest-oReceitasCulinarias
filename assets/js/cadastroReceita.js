'use strict';

// URLs da API
const BASE_URL         = 'http://10.107.134.31:8080/v1/controle-receitas';
const CATEGORIAS_URL   = `${BASE_URL}/categoria`;
const DIFICULDADES_URL = `${BASE_URL}/nivelDificuldade`;
const RECEITA_URL      = `${BASE_URL}/receita`;

// Configuração do Azure Blob Storage
const AZURE_ACCOUNT   = 'uploadreceita';
const AZURE_CONTAINER = 'fotos';
const SAS_TOKEN       = 'sp=racwl&st=2025-06-03T18:39:57Z&se=2025-07-03T02:39:57Z&sv=2024-11-04&sr=c&sig=…';

// Chave usada em localStorage para armazenar a URL da última imagem enviada
const STORAGE_KEY_IMAGEM_URL = 'ultimaImagemUrl';

document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/index.html';
    return;
  }

  carregarCategorias();
  carregarDificuldades();
  configurarUploadImagem(userId);
  configurarEnvioReceita(userId);
});

/**
 * Busca categorias no back-end e preenche o primeiro <details>
 */
async function carregarCategorias() {
  try {
    const resp = await fetch(CATEGORIAS_URL);
    if (!resp.ok) throw new Error('Erro ao carregar categorias');
    const categorias = await resp.json();

    const container = document.querySelectorAll('.filter-options')[0];
    container.innerHTML = '';

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
 * Busca níveis de dificuldade no back-end e preenche o segundo <details>
 */
async function carregarDificuldades() {
  try {
    const resp = await fetch(DIFICULDADES_URL);
    if (!resp.ok) throw new Error('Erro ao carregar níveis de dificuldade');
    const niveis = await resp.json();

    const container = document.querySelectorAll('.filter-options')[1];
    container.innerHTML = '';

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
 * Configura upload de imagem para Azure e preview imediato
 */
function configurarUploadImagem(userId) {
  const imageInput       = document.getElementById('image-input');
  const previewContainer = document.getElementById('image-preview');
  const placeholder      = previewContainer.querySelector('.upload-placeholder');

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    // Preview imediato no front-end
    const reader = new FileReader();
    reader.onload = () => {
      previewContainer.style.backgroundImage = `url('${reader.result}')`;
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Upload ao Azure
    try {
      const blobUrl = await uploadParaAzure(file, userId);
      localStorage.setItem(STORAGE_KEY_IMAGEM_URL, blobUrl);
      // Se preferir, você pode atualizar o preview para a URL definitiva:
      // previewContainer.style.backgroundImage = `url('${blobUrl}')`;
    } catch (e) {
      console.error('Falha no upload:', e);
      placeholder.textContent = 'Erro ao enviar imagem';
    }
  });
}

/**
 * Envia o binário ao Azure Blob e retorna a URL pública
 */
async function uploadParaAzure(file, userId) {
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

  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}`;
}

/**
 * Configura botão Concluir: coleta dados, valida e envia ao back-end
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
    const imagemUrl        = localStorage.getItem(STORAGE_KEY_IMAGEM_URL) || '';

    if (
      !titulo ||
      !descricao ||
      !ingredientes ||
      !modoPreparo ||
      !categoriaRadio ||
      !dificuldadeRadio ||
      !porcoes
    ) {
      alert('Preencha todos os campos e selecione categoria e dificuldade.');
      return;
    }

    const receitaPayload = {
      titulo,
      descricao,
      ingredientes,
      modoPreparo,
      porcoes,
      categoriaId: Number(categoriaRadio.value),
      nivelDificuldadeId: Number(dificuldadeRadio.value),
      usuarioId: Number(userId),
      imagemUrl
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
      if (!resp.ok) throw new Error(data.message || 'Erro ao cadastrar receita');

      alert('Receita cadastrada com sucesso!');
      localStorage.removeItem(STORAGE_KEY_IMAGEM_URL);
      // daqui você pode redirecionar ou limpar campos, se quiser
    } catch (e) {
      console.error(e);
      alert(`Falha ao cadastrar receita: ${e.message}`);
    }
  });
}
