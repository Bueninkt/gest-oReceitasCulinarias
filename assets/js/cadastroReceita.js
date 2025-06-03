'use strict'

// Elementos do DOM para upload de imagem
const imageInput = document.getElementById('image-input');
const previewDiv = document.getElementById('image-preview');
const placeholderDiv = previewDiv.querySelector('.upload-placeholder');

// Elementos do formulário
const titleInput = document.getElementById('recipe-title');
const descricaoInput = document.getElementById('descricao');
const ingredientsInput = document.getElementById('ingredients');
const preparationInput = document.getElementById('preparation');

const categoryInputs = document.getElementsByName('category');
const difficultyInputs = document.getElementsByName('difficulty');
const porcoesInput = document.getElementById('porcoes-input');

const concluirBtn = document.getElementById('concluir-btn');

// Variável para armazenar o arquivo de imagem selecionado
let selectedImageFile = null;

// == PARTE NOVA: CONFIGURAÇÃO DO AZURE BLOB UPLOAD ==
const azureAccountName   = '<SEU_ACCOUNT_NAME>';    // ex: 'minhaContaStorage'
const azureContainerName = '<SEU_CONTAINER_NAME>';  // ex: 'receitas'
const azureSasToken      = 'sp=racwl&st=2025-06-03T18:39:57Z&se=2025-07-03T02:39:57Z&sv=2024-11-04&sr=c&sig=eiTLG0XfiGvXKR0Kn3zpFI8ATkPQ33cjV%2Bywkqrt%2Fm0%3D';

// Função que recebe um File e faz PUT no Azure, retornando Promise<string> com a URL pública do blob
function uploadImageToAzure(file) {
  return new Promise((resolve, reject) => {
    // Gera um nome único para o blob, por exemplo usando timestamp + nome original
    const timestamp   = Date.now();
    const sanitized   = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const blobName    = `${timestamp}-${sanitized}`;
    // Monta a URL de upload: https://<account>.blob.core.windows.net/<container>/<blobName>?<sasToken>
    const uploadUrl = `https://${azureAccountName}.blob.core.windows.net/${azureContainerName}/${blobName}?${azureSasToken}`;

    fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        // Content-Type com base no tipo MIME do arquivo:
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    })
    .then((resp) => {
      if (!resp.ok) {
        return resp.text().then(text => {
          throw new Error(`Azure upload falhou, status ${resp.status}: ${text}`);
        });
      }
      // Se deu certo, a URL pública do blob será:
      const blobUrl = `https://${azureAccountName}.blob.core.windows.net/${azureContainerName}/${blobName}`;
      resolve(blobUrl);
    })
    .catch((err) => {
      reject(err);
    });
  });
}
// == FIM DA PARTE NOVA ==

// ======= Função: Exibir prévia da imagem selecionada =======
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) {
    // Se o usuário removeu a seleção, restaura placeholder
    selectedImageFile = null;
    previewDiv.style.backgroundImage = '';
    placeholderDiv.style.display = 'flex';
    return;
  }
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    // Define a imagem como background da div de preview
    previewDiv.style.backgroundImage = `url(${reader.result})`;
    // Esconde o placeholder de ícone/texto
    placeholderDiv.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

// ======= Função: Retorna o valor do rádio selecionado (ou null) =======
function getSelectedRadioValue(radioNodeList) {
  for (let i = 0; i < radioNodeList.length; i++) {
    if (radioNodeList[i].checked) {
      return radioNodeList[i].value;
    }
  }
  return null;
}

// ======= Ao clicar em "Concluir", coleta dados e envia JSON ao backend =======
concluirBtn.addEventListener('click', () => {
  // Coleta valores dos campos de texto
  const titulo      = titleInput.value.trim();
  const descricao   = descricaoInput.value.trim();
  const ingredientes = ingredientsInput.value.trim();
  const modoPreparo = preparationInput.value.trim();

  // Coleta valores dos filtros
  const categoria   = getSelectedRadioValue(categoryInputs);
  const dificuldade = getSelectedRadioValue(difficultyInputs);
  const porcoes     = porcoesInput.value ? parseInt(porcoesInput.value, 10) : null;

  // Validação básica
  if (!titulo) {
    alert('Por favor, informe o nome da receita.');
    titleInput.focus();
    return;
  }
  if (!descricao) {
    alert('Por favor, informe a descrição da receita.');
    descricaoInput.focus();
    return;
  }
  if (!ingredientes) {
    alert('Por favor, informe os ingredientes.');
    ingredientsInput.focus();
    return;
  }
  if (!modoPreparo) {
    alert('Por favor, informe o modo de preparo.');
    preparationInput.focus();
    return;
  }
  if (!categoria) {
    alert('Por favor, selecione uma categoria.');
    return;
  }
  if (!dificuldade) {
    alert('Por favor, selecione o nível de dificuldade.');
    return;
  }
  if (!porcoes || isNaN(porcoes) || porcoes < 1) {
    alert('Por favor, informe um número válido de porções.');
    porcoesInput.focus();
    return;
  }

  // Se houver imagem selecionada, faz upload AZURE, obtém URL e envia junto no JSON
  if (selectedImageFile) {
    uploadImageToAzure(selectedImageFile)
      .then((blobUrl) => {
        // Após o upload bem-sucedido, chama o envio do JSON passando a URL do blob
        enviarRequisicaoJSON(blobUrl);
      })
      .catch((uploadError) => {
        console.error('Erro ao enviar imagem para o Azure:', uploadError);
        alert('Falha ao enviar imagem para o Azure. Verifique o console para mais detalhes.');
      });
  } else {
    // Caso não haja imagem, envia sem o campo de imagem
    enviarRequisicaoJSON(null);
  }

  // ======= Função interna: monta payload e faz fetch ao seu backend =======
  function enviarRequisicaoJSON(imagemUrl) {
    const payload = {
      titulo: titulo,
      descricao: descricao,
      ingredientes: ingredientes,
      modoPreparo: modoPreparo,
      categoria: categoria,
      dificuldade: dificuldade,
      porcoes: porcoes,
      // usa a URL do blob no Azure, ou string vazia se for null
      imagem: imagemUrl || ''
    };

    // Ajuste a URL conforme o endpoint que seu backend espera
    const apiUrl = 'http://10.107.134.31:8080/v1/controle-receitas/usuario/';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Erro ${response.status}: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        // Sucesso: exibe mensagem ou redireciona
        alert('Receita cadastrada com sucesso!');
        limparFormulario();
      })
      .catch((error) => {
        console.error('Erro ao cadastrar receita:', error);
        alert('Ocorreu um erro ao cadastrar a receita. Verifique o console para mais detalhes.');
      });
  }
});

// ======= Função: Limpar campos do formulário após envio bem-sucedido =======
function limparFormulario() {
  titleInput.value        = '';
  descricaoInput.value    = '';
  ingredientsInput.value  = '';
  preparationInput.value  = '';
  porcoesInput.value      = '';

  // Desmarca rádios
  categoryInputs.forEach((radio) => (radio.checked = false));
  difficultyInputs.forEach((radio) => (radio.checked = false));

  // Limpa preview de imagem
  selectedImageFile = null;
  previewDiv.style.backgroundImage = '';
  placeholderDiv.style.display = 'flex';
  imageInput.value = '';
}
