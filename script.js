const carrinho = new Map();

// Elementos da interface
const gridProdutos = document.getElementById("gridProdutos");
const listaCarrinho = document.getElementById("listaCarrinho");
const subtotalEl = document.getElementById("subtotal");
const descontoEl = document.getElementById("desconto");
const totalEl = document.getElementById("total");
const headerTotal = document.getElementById("valorCabecalho");
const busca = document.getElementById("buscarProduto");
const botoesCategoria = document.querySelectorAll(".categoria");
const btnFinalizar = document.getElementById("btnFinalizar");
const nomeLoja = document.getElementById("nomeLoja");
const cidadeLoja = document.getElementById("cidadeLoja");

let categoriaAtual = "Todos";
let listaProdutosGlobais = [];

// Formatação de moeda
function moeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 1. CARREGAR PRODUTOS DO JSON
async function carregarProdutos() {
    try {
        const resposta = await fetch("produtos.json"); 
        if (!resposta.ok) throw new Error("Erro ao carregar o arquivo JSON");
        
        listaProdutosGlobais = await resposta.json();
        renderizarProdutos(listaProdutosGlobais);
    } catch (erro) {
        console.error("Erro:", erro);
        if (gridProdutos) {
            gridProdutos.innerHTML = "<p style='padding: 20px; color: red;'>Erro ao carregar o catálogo de produtos.</p>";
        }
    }
}

// 2. RENDERIZAR OS CARDS NO HTML e ATRIBUIR OS EVENTOS DIRETAMENTE
function renderizarProdutos(produtosParaExibir) {
    if (!gridProdutos) return;
    gridProdutos.innerHTML = "";

    if (produtosParaExibir.length === 0) {
        gridProdutos.innerHTML = "<p style='padding: 20px; color: var(--muted);'>Nenhum produto encontrado.</p>";
        return;
    }

    produtosParaExibir.forEach(produto => {
        const idStr = String(produto.id);
        const qtdNoCarrinho = carrinho.has(idStr) ? carrinho.get(idStr).qtd : 0;

        // Criamos o elemento como article para manter o seu padrão CSS
        const card = document.createElement("article");
        card.className = "produto";

        card.innerHTML = `
            <div class="imagem-produto">
                <img src="${produto.imagem || 'assets/produtos/picolebacio.jpeg'}" alt="${produto.nome}">
            </div>
            <h3>${produto.nome}</h3>
            <p class="descricao">Caixa com ${produto.unidadesCaixa} unidades</p>
            <p class="preco-unitario">Unidade: ${moeda(produto.precoUnidade)}</p>
            <p class="preco-caixa">${moeda(produto.precoCaixa)} <span style="font-size: 14px; font-weight: normal; color: var(--muted);">/cx</span></p>
            <div class="quantidade">
                <button class="menos">-</button>
                <span class="contador" id="contador-${idStr}">${qtdNoCarrinho}</span>
                <button class="mais">+</button>
            </div>
        `;

        // Selecionamos os botões recém-criados dentro deste card específico
        const btnMais = card.querySelector(".mais");
        const btnMenos = card.querySelector(".menos");
        const contador = card.querySelector(`#contador-${idStr}`);

        // Evento direto de clique no botão de Mais
        btnMais.addEventListener("click", () => {
            let itemCarrinho = carrinho.get(idStr) || { 
                id: idStr, 
                nome: produto.nome, 
                categoria: produto.categoria, 
                preco: parseFloat(produto.precoCaixa), 
                qtd: 0 
            };
            itemCarrinho.qtd++;
            contador.textContent = itemCarrinho.qtd;
            carrinho.set(idStr, itemCarrinho);
            atualizarCarrinho();
        });

        // Evento direto de clique no botão de Menos
        btnMenos.addEventListener("click", () => {
            if (!carrinho.has(idStr)) return;
            let itemCarrinho = carrinho.get(idStr);
            
            if (itemCarrinho.qtd > 0) {
                itemCarrinho.qtd--;
                contador.textContent = itemCarrinho.qtd;
                
                if (itemCarrinho.qtd === 0) {
                    carrinho.delete(idStr);
                } else {
                    carrinho.set(idStr, itemCarrinho);
                }
                atualizarCarrinho();
            }
        });

        gridProdutos.appendChild(card);
    });
}

// 3. ATUALIZAR INTERFACE DO CARRINHO
function atualizarCarrinho() {
    if (!listaCarrinho) return;
    listaCarrinho.innerHTML = "";
    let subtotal = 0;

    if (carrinho.size === 0) {
        listaCarrinho.innerHTML = "<p style='color:#888; text-align:center; padding-top:20px;'>Nenhum produto adicionado.</p>";
    }

    carrinho.forEach(item => {
        subtotal += item.preco * item.qtd;

        const linha = document.createElement("div");
        linha.className = "linha";
        linha.innerHTML = `<span>${item.nome} x${item.qtd} cx</span><strong>${moeda(item.preco * item.qtd)}</strong>`;
        listaCarrinho.appendChild(linha);
    });

    if (subtotalEl) subtotalEl.textContent = moeda(subtotal);
    if (descontoEl) descontoEl.textContent = moeda(0);
    if (totalEl) totalEl.textContent = moeda(subtotal);
    if (headerTotal) headerTotal.textContent = moeda(subtotal);
}

// 4. FILTROS (PESQUISA E CATEGORIA CORRIGIDOS)
function filtrar() {
    const texto = busca ? busca.value.trim().toLowerCase() : "";

    const produtosFiltrados = listaProdutosGlobais.filter(produto => {
        const nomeOk = produto.nome.toLowerCase().includes(texto);
        
        // Normalização completa removendo espaços e tratando strings de forma idêntica
        const catProduto = String(produto.categoria).trim().toLowerCase();
        const catAtual = String(categoriaAtual).trim().toLowerCase();
        
        const categoriaOk = categoriaAtual === "Todos" || catProduto === catAtual;
        
        if (texto !== "") {
            return nomeOk;
        } else {
            return categoriaOk;
        }
    });

    renderizarProdutos(produtosFiltrados);
}

if (busca) {
    busca.addEventListener("input", filtrar);
}

// Configuração dos botões de filtro de categoria
if (botoesCategoria && botoesCategoria.length > 0) {
    botoesCategoria.forEach(botao => {
        botao.addEventListener("click", () => {
            botoesCategoria.forEach(b => b.classList.remove("ativa"));
            botao.classList.add("ativa");
            
            // Puxa exatamente o valor do atributo data-categoria do seu HTML
            categoriaAtual = botao.getAttribute("data-categoria") || "Todos";
            filtrar();
        });
    });
}

// 5. FINALIZAR PEDIDO VIA WHATSAPP
if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
        if (carrinho.size === 0) {
            alert("Adicione produtos ao pedido.");
            return;
        }

        const loja = (nomeLoja?.value || "").trim();
        const cidade = (cidadeLoja?.value || "").trim();

        let msg = "*NOVO PEDIDO*%0A%0A";

        if (loja) msg += `*Comércio:* ${loja}%0A`;
        if (cidade) msg += `*Cidade:* ${cidade}%0A`;

        msg += "%0A--------------------%0A";

        let total = 0;

        carrinho.forEach(item => {
            msg += `${item.qtd}x ${item.nome} (Caixa) - ${moeda(item.preco * item.qtd)}%0A`;
            total += item.preco * item.qtd;
        });

        msg += `--------------------%0A*TOTAL:* ${moeda(total)}`;

        window.open(`https://wa.me/5542988825736?text=${msg}`, "_blank");
    });
}

// INICIALIZAÇÃO DO SISTEMA
carregarProdutos();
atualizarCarrinho();