'use strict';

// URLs da API
const BASE_URL           = 'http://10.107.144.3:8080/v1/controle-receitas';
const RECEITA_URL        = `${BASE_URL}/receita`;
const CATEGORIAS_URL     = `${BASE_URL}/categoria`;
const DIFICULDADES_URL   = `${BASE_URL}/nivelDificuldade`;

// Configuração do Azure Blob Storage
const AZURE_ACCOUNT  = 'receitaimage';
const AZURE_CONTAINER = 'receita'; // ajuste para o nome exato do seu container
const SAS_TOKEN      = 'sp=racwl&st=2025-06-05T11:50:33Z&se=2025-06-19T19:50:33Z&sv=2024-11-04&sr=c&sig=YD7pztXy2gRqOi2vBbqC%2BFcfw5DXkUOHTD5yV8tX1hw%3D';


  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '../index.html';
    return;
  }

  carregarCategorias();
  carregarDificuldades();
  configurarUploadImagem(userId);
  configurarEnvioReceita(userId);


/**
 * 1) Carrega categorias do back-end e preenche o primeiro <details>
 */
async function carregarCategorias() {
  try {
    const resp = await fetch(CATEGORIAS_URL);
    if (!resp.ok) throw new Error('Erro ao carregar categorias');
    const categorias = await resp.json();

    const container = document.querySelector(
      '.filter-detail:nth-of-type(1) .filter-options'
    );
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
 * 2) Carrega níveis de dificuldade e preenche o segundo <details>
 */
async function carregarDificuldades() {
  try {
    const resp = await fetch(DIFICULDADES_URL);
    if (!resp.ok) throw new Error('Erro ao carregar dificuldades');
    const niveis = await resp.json();

    const container = document.querySelector(
      '.filter-detail:nth-of-type(2) .filter-options'
    );
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
 * 3) Configura o fluxo de upload da imagem para o Azure e, logo em seguida,
 *    dispara automaticamente o envio da URL ao back-end assim que o blob está OK.
 */
function configurarUploadImagem(userId) {
  const imageInput      = document.getElementById('image-input');
  const previewContainer = document.getElementById('image-preview');
  const placeholder      = previewContainer.querySelector('.upload-placeholder');

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    try {
      // 3.1) Envia o arquivo ao Azure e recebe a URL pública de acesso
      const blobUrl = await uploadParaAzure(file, userId);

      // 3.2) Remove o placeholder e insere preview
      previewContainer.style.backgroundImage = `url('${blobUrl}')`;
      placeholder.style.display = 'none';

      // 3.3) Assim que tiver a URL, dispara o envio parcial ao back-end:
      await enviarImagemAoBackend(blobUrl, userId);

      // Opcional: exiba alguma mensagem de sucesso visual
      console.log('Imagem enviada e URL registrada no back-end:', blobUrl);
    } catch (e) {
      console.error('Falha no upload ou no envio da URL ao back-end:', e);
      placeholder.textContent = 'Erro ao enviar imagem';
    }
  });
}

/**
 * 3.1) Função que faz PUT direto no Azure Blob Storage e retorna a URL pública.
 */
async function uploadParaAzure(file, userId) {
  // Gera um nome único: <userId>_<timestamp>_<nomeOriginal>
  const timestamp = Date.now();
  const blobName  = `${userId}_${timestamp}_${file.name}`;
  const uploadUrl = `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}?${SAS_TOKEN}`;

  const resposta = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type':     file.type
    },
    body: file
  });

  if (!resposta.ok) {
    throw new Error(`Azure retornou status ${resposta.status}`);
  }

  // Retorna a URL pública (sem SAS Token)
  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}`;
}

/**
 * 3.3) Assim que a imagem chegar no Azure, enviamos a URL ao back-end.
 *      Aqui assumimos que existe um endpoint no back-end capaz de 
 *      receber apenas { usuarioId, imagemUrl }.
 * 
 *      Se o seu back-end não tiver um endpoint específico para “imagem só”,
 *      você pode criar algo como POST /receita/imagem que registre a URL
 *      em algum lugar (ou em uma tabela temporária), e depois o usuário 
 *      preenche o restante (título, ingredientes, etc).
 */
async function enviarImagemAoBackend(imagemUrl, userId) {
  // Exemplo de um endpoint dedicado somente para receber imagemUrl:
  const URL_UPLOAD_IMAGEM = `${RECEITA_URL}/imagem`; 
  // (Ajuste para o caminho real que o seu back-end estiver esperando.)

  const resp = await fetch(URL_UPLOAD_IMAGEM, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Se o back-end exigir token:
      // Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      usuarioId: Number(userId),
      imagemUrl: imagemUrl
    })
  });

  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || 'Falha ao registrar URL da imagem');
  }

  return await resp.json();
}

/**
 * 4) Configura o botão “Concluir” para, ao ser clicado, coletar todos os dados
 *    (inclusive a imagem que já foi enviada antes), e então criar a receita completa.
 */
function configurarEnvioReceita(userId) {
  const btnConcluir = document.getElementById('concluir-btn');

  btnConcluir.addEventListener('click', async () => {
    const titulo      = document.getElementById('recipe-title').value.trim();
    const descricao   = document.getElementById('descricao').value.trim();
    const ingredientes= document.getElementById('ingredients').value.trim();
    const modoPreparo  = document.getElementById('preparation').value.trim();
    const porcoes      = Number(document.getElementById('porcoes-input').value);

    const categoriaRadio   = document.querySelector('input[name="category"]:checked');
    const dificuldadeRadio = document.querySelector('input[name="difficulty"]:checked');

    // Supondo que, quando chamamos enviarImagemAoBackend(), o back-end tenha salvo
    // a imagem em uma tabela temporária e retornado algo como { imagemUrl: '...' } 
    // ou que, ao menos, a URL já esteja em alguma variável global/localStorage.
    // Se você preferir, também pode guardar em localStorage logo após o envio de imagem:
    //
    //   localStorage.setItem('ultimaImagemUrl', imagemUrl);
    //
    // e então aqui fazer:
    //   const imagemUrl = localStorage.getItem('ultimaImagemUrl');
    //
    // Para simplificar, vamos supor que o endpoint /receita/imagem retornou:
    //   { imagemUrl: 'https://...blob.core.windows.net/...jpg' } 
    // e que esse JSON foi salvo em localStorage ou variável.

    const imagemUrl = localStorage.getItem('ultimaImagemUrl') || '';

    // Validações mínimas
    if (
      !titulo   ||
      !descricao||
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
      imagemUrl // Já disponível porque gravamos após o upload ao Azure
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
      // Opcional: redirecionar ou limpar campos
    } catch (e) {
      console.error(e);
      alert(`Falha ao cadastrar receita: ${e.message}`);
    }
  });
}
