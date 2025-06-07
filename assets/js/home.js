// ============================= CONFIGURAÇÕES ============================= //
// Substitua pela base do seu ambiente
const API_BASE = "http://10.107.134.31:8080/v1/controle-receitas";

// ============================= UTILIDADES ============================= //
async function fetchJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Erro ao buscar " + url + ": " + resp.status);
  return resp.json();
}

// ============================= INICIALIZAÇÃO ============================= //
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    await Promise.all([loadCategorias(), loadDificuldades(), loadRecipes()]);
  } catch (e) {
    console.error(e);
  }

  addFilterHandlers();
  document.getElementById("search").addEventListener("input", filterRecipes);
}

// ============================= CATEGORIAS ============================= //
async function loadCategorias() {
  const data = await fetchJSON(`${API_BASE}/categoria`);
  const list = document.getElementById("categorias");

  data.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = cat.nome || cat.name;
    li.dataset.id = cat.id;
    li.addEventListener("click", () => toggleSelection(li, "categoria"));
    list.appendChild(li);
  });
}

// ============================= NÍVEL DE DIFICULDADE ============================= //
async function loadDificuldades() {
  const data = await fetchJSON(`${API_BASE}/nivelDificuldade`);
  const list = document.getElementById("dificuldade");

  data.forEach((diff) => {
    const li = document.createElement("li");
    li.textContent = diff.nome || diff.name;
    li.dataset.id = diff.id;
    li.addEventListener("click", () => toggleSelection(li, "dificuldade"));
    list.appendChild(li);
  });
}

// ============================= RECEITAS ============================= //
let recipesCache = [];

async function loadRecipes() {
  const data = await fetchJSON(`${API_BASE}/receitas`);
  recipesCache = data;
  renderRecipes(data);
}

function renderRecipes(recipes) {
  const container = document.getElementById("recipes-container");
  container.innerHTML = "";

  recipes.forEach((recipe) => {
    container.appendChild(buildRecipeCard(recipe));
  });
}

function buildRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";

  const img = document.createElement("img");
  img.className = "recipe-image";
  img.src = recipe.imageUrl || "assets/img/placeholder.jpg";
  img.alt = recipe.nome;

  const body = document.createElement("div");
  body.className = "recipe-body";

  const title = document.createElement("h2");
  title.className = "recipe-title";
  title.textContent = (recipe.nome || "").toUpperCase() + ":";

  const desc = document.createElement("p");
  desc.className = "recipe-description";
  desc.textContent = recipe.descricao || "Descrição não disponível.";

  // ---------------- META (avaliações & comentários) ---------------- //
  const meta = document.createElement("div");
  meta.className = "recipe-meta";

  const aval = document.createElement("span");
  aval.innerHTML =
    "avaliações: <span class=\"stars\">★★★★★</span>"; // placeholder fixo
  meta.appendChild(aval);

  const comments = document.createElement("span");
  comments.innerHTML = "comentários: <span class=\"comment-count\">(0)</span>"; // placeholder
  meta.appendChild(comments);

  body.append(title, desc, meta);
  card.append(img, body);
  return card;
}

// ============================= FILTROS ============================= //
const selectedFilters = { categoria: new Set(), dificuldade: new Set() };

function toggleSelection(li, type) {
  li.classList.toggle("selected");
  const id = li.dataset.id;
  if (li.classList.contains("selected")) {
    selectedFilters[type].add(id);
  } else {
    selectedFilters[type].delete(id);
  }
  filterRecipes();
}

function filterRecipes() {
  const search = document.getElementById("search").value.toLowerCase();

  const filtered = recipesCache.filter((recipe) => {
    const matchSearch = (recipe.nome || "").toLowerCase().includes(search);

    // ----------- Categoria -------------
    const catFilter = selectedFilters.categoria;
    const matchCat =
      catFilter.size === 0 || catFilter.has(String(recipe.categoria?.id));

    // ----------- Dificuldade -----------
    const diffFilter = selectedFilters.dificuldade;
    const matchDiff =
      diffFilter.size === 0 || diffFilter.has(String(recipe.dificuldade?.id));

    return matchSearch && matchCat && matchDiff;
  });

  renderRecipes(filtered);
}

// ============================= UI: ABRIR/COLAPSAR FILTROS ============================= //
function addFilterHandlers() {
  document.querySelectorAll(".filter-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("open");
      const list = btn.nextElementSibling;
      if (list) {
        list.style.display = list.style.display === "block" ? "none" : "block";
      }
    });
  });
}

// ============================================================================= //
//  NOTA: a lógica de upload da imagem (local -> Azure Blob -> URL) acontece na
//  tela de cadastro e não é necessária aqui. Este arquivo foca apenas
//  em consumir as URLs retornadas pelo back‑end e exibi‑las."}
