'use strict'

const cadastroSection = document.querySelector('.cadastro-section');


const title = document.createElement('h2');
title.textContent = 'Cadastre-se!';
cadastroSection.appendChild(title);

const description = document.createElement('p');
description.textContent = 'VENHA CONFERIR AS MELHORES RECEITAS!.';
cadastroSection.appendChild(description);


const form = document.createElement('form');



const emailGroup = document.createElement('div');
emailGroup.classList.add('input-group');
const emailInput = document.createElement('input');
emailInput.type = 'email';
emailInput.id = 'email';
emailInput.placeholder = 'E-mail';
const emailLabel = document.createElement('label');
emailLabel.setAttribute('for', 'email');
emailLabel.textContent = 'E-mail';
emailGroup.appendChild(emailInput);
emailGroup.appendChild(emailLabel);
form.appendChild(emailGroup);

// Campo Nome
const nomeGroup = document.createElement('div');
nomeGroup.classList.add('input-group');
const nomeInput = document.createElement('input');
nomeInput.type = 'text';
nomeInput.id = 'nome';
nomeInput.placeholder = 'Nome Completo';
const nomeLabel = document.createElement('label');
nomeLabel.setAttribute('for', 'nome');
nomeLabel.textContent = 'Nome Completo';
nomeGroup.appendChild(nomeInput);
nomeGroup.appendChild(nomeLabel);
form.appendChild(nomeGroup);

// Campo Senha
const senhaGroup = document.createElement('div');
senhaGroup.classList.add('input-group');
const senhaInput = document.createElement('input');
senhaInput.type = 'password';
senhaInput.id = 'senha';
senhaInput.placeholder = 'Senha';
const senhaLabel = document.createElement('label');
senhaLabel.setAttribute('for', 'senha');
senhaLabel.textContent = 'Senha';
senhaGroup.appendChild(senhaInput);
senhaGroup.appendChild(senhaLabel);
form.appendChild(senhaGroup);

// Campo Senha de Recuperação
const palavrachaveGroup = document.createElement('div');
palavrachaveGroup.classList.add('input-group');
const palavrachaveInput = document.createElement('input');
palavrachaveInput.type = 'password';
palavrachaveInput.id = 'senhaRecuperacao';
palavrachaveInput.placeholder = 'Senha de Recuperação';
const palavrachaveLabel = document.createElement('label');
palavrachaveLabel.setAttribute('for', 'senhaRecuperacao');
palavrachaveLabel.textContent = 'Senha de Recuperação';
palavrachaveGroup.appendChild(palavrachaveInput);
palavrachaveGroup.appendChild(palavrachaveLabel);
form.appendChild(palavrachaveGroup);


const submitButton = document.createElement('button');
submitButton.type = 'submit';
submitButton.textContent = 'Cadastre-se';
form.appendChild(submitButton);

// Adiciona o formulário à seção
cadastroSection.appendChild(form);

// Cria elemento para exibir mensagens de erro
const errorMessage = document.createElement('p');
errorMessage.style.color = 'red';
errorMessage.style.display = 'none';
cadastroSection.appendChild(errorMessage);

// Cria o link "Já tem um login? Faça login"
const loginLink = document.createElement('p');
loginLink.innerHTML = 'Já tem um? <a href="../index.html">login</a>';
cadastroSection.appendChild(loginLink);


// Evento de submit do formulário
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const senha = senhaInput.value.trim();
    const nome = nomeInput.value.trim();    
    const palavra_chave = palavrachaveInput.value.trim();
    const foto_perfil = ''
        
    if (!nome || !email || !senha || !palavra_chave) {
       
        errorMessage.textContent = 'Preencha todos os campos!';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('http://10.107.134.31:8080/v1/controle-receitas/usuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha, palavra_chave, foto_perfil })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao realizar cadastro');
        }

        // Armazena o token e os dados do usuário no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Aqui você salva os dados do usuário

        // Redireciona para a tela de login
        window.location.href = '../index.html';
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});