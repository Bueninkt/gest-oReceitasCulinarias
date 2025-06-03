'use strict'

const redefinirSection = document.querySelector('.redefinir-section');

// Cria o título
const title = document.createElement('h2');
title.textContent = 'Redefinir Senha';
redefinirSection.appendChild(title);

// Cria o parágrafo de descrição
const description = document.createElement('p');
description.textContent = 'Redefina a senha com a palavra-chave';
redefinirSection.appendChild(description);

// Cria o formulário
const form = document.createElement('form');

// Cria campos do formulário
const fields = [
    { type: 'text', id: 'chave', placeholder: 'Palavra-Chave' },
    { type: 'email', id: 'email', placeholder: 'E-mail' },
    { type: 'password', id: 'newSenha', placeholder: 'Nova Senha' },
    { type: 'password', id: 'confirmacao', placeholder: 'Confirme a senha' }
];

fields.forEach(field => {
    const input = document.createElement('input');
    input.type = field.type;
    input.id = field.id;
    input.placeholder = field.placeholder;
    form.appendChild(input);
});

// Cria botão de submit
const submitButton = document.createElement('button');
submitButton.type = 'submit';
submitButton.textContent = 'Redefinir';
form.appendChild(submitButton);

// Adiciona formulário à seção
redefinirSection.appendChild(form);

// Adiciona evento de submit com validação básica
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const novaSenha = document.getElementById('newSenha').value;
    const confirmacao = document.getElementById('confirmacao').value;

    if (novaSenha !== confirmacao) {
        alert('As senhas não coincidem!');
        return;
    }

    // Aqui você pode adicionar a lógica de redefinição de senha
    console.log('Senha redefinida com sucesso!');
    // Exemplo: window.location.href = 'login.html';
});