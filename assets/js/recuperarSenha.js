'use strict'

const recuperarSection = document.querySelector('.recuperar-section');
recuperarSection.innerHTML = '';

// Cria o título
const title = document.createElement('h2');
title.textContent = 'Recuperar Senha';
recuperarSection.appendChild(title);

// Cria o parágrafo de descrição
const description = document.createElement('p');
description.textContent = 'Siga os passos para redefinir sua senha.';
recuperarSection.appendChild(description);

// Cria o container dos passos
const stepsContainer = document.createElement('div');
stepsContainer.className = 'steps-container';
recuperarSection.appendChild(stepsContainer);

// Passo 1: Email
const step1 = document.createElement('div');
step1.className = 'form-step active';
step1.id = 'step1';

const emailLabel = document.createElement('label');
emailLabel.textContent = 'Digite o e-mail cadastrado:';
emailLabel.style.textAlign = 'left';
emailLabel.style.display = 'block';
emailLabel.style.marginBottom = '5px';

const emailInput = document.createElement('input');
emailInput.type = 'email';
emailInput.id = 'email';
emailInput.required = true;

const emailError = document.createElement('div');
emailError.className = 'error-message';

const nextButton1 = document.createElement('button');
nextButton1.textContent = 'Verificar';
nextButton1.id = 'next1';

step1.append(emailLabel, emailInput, emailError, nextButton1);
stepsContainer.appendChild(step1);

// Passo 2: Palavra-chave
const step2 = document.createElement('div');
step2.className = 'form-step';
step2.id = 'step2';

const wordKeyLabel = document.createElement('label');
wordKeyLabel.textContent = 'Digite a palavra-chave de recuperação:';
wordKeyLabel.style.textAlign = 'left';
wordKeyLabel.style.display = 'block';
wordKeyLabel.style.marginBottom = '5px';

const wordKeyInput = document.createElement('input');
wordKeyInput.type = 'text';
wordKeyInput.id = 'wordKey';
wordKeyInput.required = true;

const wordKeyError = document.createElement('div');
wordKeyError.className = 'error-message';

const nextButton2 = document.createElement('button');
nextButton2.textContent = 'Verificar';
nextButton2.id = 'next2';

step2.append(wordKeyLabel, wordKeyInput, wordKeyError, nextButton2);
stepsContainer.appendChild(step2);

// Passo 3: Nova senha
const step3 = document.createElement('div');
step3.className = 'form-step';
step3.id = 'step3';

const newPassLabel = document.createElement('label');
newPassLabel.textContent = 'Digite a nova senha:';
newPassLabel.style.textAlign = 'left';
newPassLabel.style.display = 'block';
newPassLabel.style.marginBottom = '5px';

const newPassInput = document.createElement('input');
newPassInput.type = 'password';
newPassInput.id = 'newPassword';
newPassInput.required = true;

const confirmPassLabel = document.createElement('label');
confirmPassLabel.textContent = 'Confirme a nova senha:';
confirmPassLabel.style.textAlign = 'left';
confirmPassLabel.style.display = 'block';
confirmPassLabel.style.marginBottom = '5px';

const confirmPassInput = document.createElement('input');
confirmPassInput.type = 'password';
confirmPassInput.id = 'confirmPassword';
confirmPassInput.required = true;

const passError = document.createElement('div');
passError.className = 'error-message';

const successMessage = document.createElement('div');
successMessage.className = 'success-message';

const submitButton = document.createElement('button');
submitButton.textContent = 'Redefinir Senha';
submitButton.id = 'submitRecovery';

step3.append(newPassLabel, newPassInput, confirmPassLabel, confirmPassInput, passError, successMessage, submitButton);
stepsContainer.appendChild(step3);

// Lógica de navegação entre passos
let currentStep = 1;
let userEmail = '';
let userId = null; // <-- aqui guardaremos o ID retornado pela API

const totalSteps = 3;

// Validação do email
nextButton1.addEventListener('click', async () => {
    const email = emailInput.value.trim();

    if (!email) {
        emailError.textContent = 'Por favor, digite seu e-mail';
        return;
    }

    if (!validateEmail(email)) {
        emailError.textContent = 'Por favor, digite um e-mail válido';
        return;
    }

    emailError.textContent = '';
    userEmail = email;
    currentStep++;
    changeStep();
});

// Validação da palavra-chave
nextButton2.addEventListener('click', async () => {
    const wordKey = wordKeyInput.value.trim();

    if (!wordKey) {
        wordKeyError.textContent = 'Por favor, digite a palavra-chave';
        return;
    }

    try {
        nextButton2.disabled = true;
        nextButton2.textContent = 'Verificando...';

        const response = await fetch('https://back-spider.vercel.app/user/RememberPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                wordKey: wordKey
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Palavra-chave incorreta');
        }

        // Pega o ID do usuário retornado
        userId = data.id; // <-- muito importante

        currentStep++;
        changeStep();

    } catch (error) {
        wordKeyError.textContent = error.message;
    } finally {
        nextButton2.disabled = false;
        nextButton2.textContent = 'Verificar';
    }
});

// Redefinição de senha
submitButton.addEventListener('click', async () => {
    const newPass = newPassInput.value.trim();
    const confirmPass = confirmPassInput.value.trim();

    if (!newPass || !confirmPass) {
        passError.textContent = 'Por favor, preencha ambos os campos';
        return;
    }

    if (newPass.length < 4) {
        passError.textContent = 'A senha deve ter pelo menos 4 caracteres';
        return;
    }

    if (newPass !== confirmPass) {
        passError.textContent = 'As senhas não coincidem';
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';

        const response = await fetch(`https://back-spider.vercel.app/user/newPassword/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                senha: newPass
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao redefinir senha');
        }

        passError.textContent = '';
        successMessage.textContent = 'Senha redefinida com sucesso! Redirecionando...';

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);

    } catch (error) {
        passError.textContent = error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Redefinir Senha';
    }
});

function changeStep() {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}