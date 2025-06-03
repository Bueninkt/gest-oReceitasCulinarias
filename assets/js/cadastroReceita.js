'use strict'

// Aguarda o carregamento completo do DOM

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
    const titulo = titleInput.value.trim();
    const descricao = descricaoInput.value.trim();
    const ingredientes = ingredientsInput.value.trim();
    const modoPreparo = preparationInput.value.trim();

    // Coleta valores dos filtros
    const categoria = getSelectedRadioValue(categoryInputs);
    const dificuldade = getSelectedRadioValue(difficultyInputs);
    const porcoes = porcoesInput.value ? parseInt(porcoesInput.value, 10) : null;

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

    // Se houver imagem selecionada, converte para Base64 e envia junto no JSON
    if (selectedImageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const imagemBase64 = reader.result; // string DataURL: "data:image/png;base64,..."
        enviarRequisicaoJSON(imagemBase64);
      };
      reader.readAsDataURL(selectedImageFile);
    } else {
      // Caso não haja imagem, envia sem o campo de imagem
      enviarRequisicaoJSON(null);
    }

    // ======= Função interna: monta payload e faz fetch =======
    function enviarRequisicaoJSON(imagemBase64) {
      const payload = {
        titulo: titulo,
        descricao: descricao,
        ingredientes: ingredientes,
        modoPreparo: modoPreparo,
        categoria: categoria,
        dificuldade: dificuldade,
        porcoes: porcoes,
        imagem: imagemBase64 || '' // envia string vazia se não houver imagem
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
    titleInput.value = '';
    descricaoInput.value = '';
    ingredientsInput.value = '';
    preparationInput.value = '';
    porcoesInput.value = '';

    // Desmarca rádios
    categoryInputs.forEach((radio) => (radio.checked = false));
    difficultyInputs.forEach((radio) => (radio.checked = false));

    // Limpa preview de imagem
    selectedImageFile = null;
    previewDiv.style.backgroundImage = '';
    placeholderDiv.style.display = 'flex';
    imageInput.value = '';
  }

