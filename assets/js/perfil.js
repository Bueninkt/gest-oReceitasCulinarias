'use strict'

const mainSection = document.querySelector('.receita-main')


const title = document.createElement('h2')
title.textContent = 'Suas receitas: '
mainSection.appendChild(title)


const submitButton = document.createElement('div')
submitButton.class = 'submit'
const textSubmit = document.createElement('p')
textSubmit.textContent = 'submit'
submitButton.appendChild (textSubmit)
submitButton.textContent = 'Ver mais'
mainSection.appendChild(submitButton)