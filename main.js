'use strict'

const loginSection = document.querySelector('.login-section')

// Título
const title = document.createElement('h2')
title.textContent = 'Login'
loginSection.appendChild(title)

// Descrição
const description = document.createElement('h3')
description.textContent = 'Venha conferir as melhores receitas! .'
loginSection.appendChild(description)

// Formulário
const form = document.createElement('form')

// Grupo Email
const emailGroup = document.createElement('div')
emailGroup.className = 'input-group'

const emailInput = document.createElement('input')
emailInput.type = 'email'
emailInput.id = 'email'
emailInput.placeholder = ' '
emailInput.required = true

const emailLabel = document.createElement('label')
emailLabel.setAttribute('for', 'email')
emailLabel.textContent = 'E-mail'

emailGroup.appendChild(emailInput)
emailGroup.appendChild(emailLabel)
form.appendChild(emailGroup)

// Grupo Senha
const passwordGroup = document.createElement('div')
passwordGroup.className = 'input-group'

const passwordInput = document.createElement('input')
passwordInput.type = 'password'
passwordInput.id = 'password'
passwordInput.placeholder = ' '
passwordInput.required = true

const passwordLabel = document.createElement('label')
passwordLabel.setAttribute('for', 'password')
passwordLabel.textContent = 'Senha'

const togglePassword = document.createElement('span')
togglePassword.className = 'toggle-password'
togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>'
togglePassword.onclick = () => {
    const isHidden = passwordInput.type === 'password'
    passwordInput.type = isHidden ? 'text' : 'password'
    togglePassword.innerHTML = isHidden
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>'
}

passwordGroup.appendChild(passwordInput)
passwordGroup.appendChild(passwordLabel)
passwordGroup.appendChild(togglePassword)
form.appendChild(passwordGroup)

// Esqueceu a senha
const rememberForgot = document.createElement('div')
rememberForgot.className = 'remember-forgot'

const forgotPasswordLink = document.createElement('a')
forgotPasswordLink.href = './pages/redefinirSenha.html'
forgotPasswordLink.textContent = 'Esqueceu sua senha?'
rememberForgot.appendChild(forgotPasswordLink)
form.appendChild(rememberForgot)

// Botão de login
const submitButton = document.createElement('button')
submitButton.type = 'submit'
submitButton.textContent = 'Login'
form.appendChild(submitButton)

// Adiciona o formulário
loginSection.appendChild(form)

// Parágrafo de cadastro
const registerText = document.createElement('p')
registerText.innerHTML = 'Não tem uma conta? <a class="cadastro" href="./pages/cadastro.html">Cadastre-se</a>'
loginSection.appendChild(registerText)

// Mensagem de erro
const errorMessage = document.createElement('p')
errorMessage.className = 'error-message'
errorMessage.style.display = 'none'
loginSection.appendChild(errorMessage)

// Validação e envio
form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const email = emailInput.value.trim()
    const senha = passwordInput.value.trim()

    if (!email || !senha) {
        errorMessage.textContent = 'Preencha todos os campos!'
        errorMessage.style.display = 'block'
        return
    }

    try {
        const response = await fetch('http://10.107.134.31:8080/v1/controle-receitas/usuario/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao fazer login')
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('userId', data.user.id)

        window.location.href = './pages/cadastroReceita.html'

    } catch (error) {
        errorMessage.textContent = error.message
        errorMessage.style.display = 'block'
    }
})