import { buscarProdutos, buscarProduto } from './api.js';

const ORDENACOES = {
  'preco-asc': { rotulo: 'Menor preço', comparar: (a, b) => a.price - b.price },
  'preco-desc': { rotulo: 'Maior preço', comparar: (a, b) => b.price - a.price },
  'nota-desc': { rotulo: 'Melhor avaliação', comparar: (a, b) => b.rating - a.rating },
};

const OPCOES_POR_PAGINA = [5, 10, 20, 50];
const PADRAO = { busca: '', categoria: '', ordem: '', pagina: 1, porPagina: 10 };

const IMAGEM_INDISPONIVEL = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
  '<rect width="200" height="200" fill="#e4e7eb"/>' +
  '<text x="100" y="105" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#52606d">Imagem indisponível</text>' +
  '</svg>'
);

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
const formatoNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatoPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const main = document.querySelector('#conteudo');

let produtos = null;          
let estado = { ...PADRAO };   
let idRenderizacao = 0;      
let telaAtual = null;        
let rolagemDaLista = null;   

function escapar(texto) {
  const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto).replace(/[&<>"']/g, (caractere) => mapa[caractere]);
}

function formatarCategoria(slug) {
  const texto = slug.replace(/-/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function pluralizar(quantidade, singular, plural) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function criarQuery() {
  const params = new URLSearchParams();
  if (estado.busca) params.set('busca', estado.busca);
  if (estado.categoria) params.set('categoria', estado.categoria);
  if (estado.ordem) params.set('ordem', estado.ordem);
  if (estado.pagina > 1) params.set('pagina', estado.pagina);
  if (estado.porPagina !== PADRAO.porPagina) params.set('itens', estado.porPagina);
  return params.toString();
}

function linkDaLista() {
  const query = criarQuery();
  return query ? `#/?${query}` : '#/';
}

function salvarEstadoNaUrl() {
  history.replaceState(null, '', linkDaLista());
}

function lerEstadoDaUrl(params) {
  const ordem = params.get('ordem');
  const itens = Number(params.get('itens'));

  estado = {
    busca: params.get('busca') ?? '',
    categoria: params.get('categoria') ?? '',
    ordem: ordem in ORDENACOES ? ordem : '',
    pagina: Number(params.get('pagina')) || 1,
    porPagina: OPCOES_POR_PAGINA.includes(itens) ? itens : PADRAO.porPagina,
  };
}


function mostrarCarregando(mensagem) {
  main.innerHTML = `
    <p class="estado" role="status">
      <span class="spinner" aria-hidden="true"></span>${mensagem}
    </p>`;
}

function mostrarErro(titulo, mensagem, aoTentarNovamente) {
  main.innerHTML = `
    <section class="estado estado-erro" role="alert">
      <h1>${titulo}</h1>
      <p>${escapar(mensagem)}</p>
      <div class="acoes">
        <button type="button" class="botao" id="tentar-novamente">Tentar novamente</button>
        <a class="botao botao-secundario" href="#/">Voltar para a lista</a>
      </div>
    </section>`;
  document.querySelector('#tentar-novamente').addEventListener('click', aoTentarNovamente);
}



async function mostrarLista(params, restaurarRolagem = false) {
  const id = ++idRenderizacao;
  lerEstadoDaUrl(params);
  document.title = 'Catálogo de Produtos';

  if (!produtos) {
    mostrarCarregando('Carregando produtos...');
    try {
      const resultado = await buscarProdutos();
      if (id !== idRenderizacao) return;
      produtos = resultado;
    } catch (erro) {
      if (id !== idRenderizacao) return;
      mostrarErro('Não foi possível carregar os produtos', erro.message, () => mostrarLista(params));
      return;
    }
  }

  desenharFiltros();
  atualizarLista();

  if (restaurarRolagem && rolagemDaLista?.query === criarQuery()) {
    window.scrollTo(0, rolagemDaLista.y);
  }
}

function desenharFiltros() {
  const categorias = [...new Set(produtos.map((produto) => produto.category))].sort();

  const opcoesCategoria = categorias.map((categoria) =>
    `<option value="${escapar(categoria)}" ${categoria === estado.categoria ? 'selected' : ''}>${escapar(formatarCategoria(categoria))}</option>`
  ).join('');

  const opcoesOrdem = Object.entries(ORDENACOES).map(([valor, { rotulo }]) =>
    `<option value="${valor}" ${valor === estado.ordem ? 'selected' : ''}>${rotulo}</option>`
  ).join('');

  const opcoesPorPagina = OPCOES_POR_PAGINA.map((quantidade) =>
    `<option value="${quantidade}" ${quantidade === estado.porPagina ? 'selected' : ''}>${quantidade}</option>`
  ).join('');

  main.innerHTML = `
    <h1>Produtos</h1>

    <form class="filtros" role="search" aria-label="Filtros de produtos">
      <div class="campo">
        <label for="busca">Buscar produto</label>
        <input type="search" id="busca" name="busca" value="${escapar(estado.busca)}" placeholder="Nome ou marca">
      </div>
      <div class="campo">
        <label for="categoria">Categoria</label>
        <select id="categoria" name="categoria">
          <option value="">Todas</option>
          ${opcoesCategoria}
        </select>
      </div>
      <div class="campo">
        <label for="ordem">Ordenar por</label>
        <select id="ordem" name="ordem">
          <option value="">Padrão</option>
          ${opcoesOrdem}
        </select>
      </div>
      <div class="campo">
        <label for="itens">Itens por página</label>
        <select id="itens" name="itens">${opcoesPorPagina}</select>
      </div>
    </form>

    <p class="resumo" id="resumo" aria-live="polite"></p>
    <div id="resultado"></div>`;

  configurarEventosDaLista();
}

function configurarEventosDaLista() {
  const formulario = main.querySelector('.filtros');
  const resultado = main.querySelector('#resultado');
  let temporizador;

  formulario.addEventListener('submit', (evento) => evento.preventDefault());

 
  formulario.addEventListener('input', (evento) => {
    clearTimeout(temporizador);
    const atraso = evento.target.name === 'busca' ? 250 : 0;

    temporizador = setTimeout(() => {
      const campos = formulario.elements;
      estado.busca = campos.busca.value;
      estado.categoria = campos.categoria.value;
      estado.ordem = campos.ordem.value;
      estado.porPagina = Number(campos.itens.value);
      estado.pagina = 1;
      atualizarLista();
    }, atraso);
  });

  resultado.addEventListener('click', (evento) => {
    const botaoPagina = evento.target.closest('[data-pagina]');

    if (botaoPagina && !botaoPagina.disabled) {
      estado.pagina = Number(botaoPagina.dataset.pagina);
      atualizarLista();
      main.querySelector('h1').scrollIntoView();
    }

    if (evento.target.closest('#limpar-filtros')) {
      estado = { ...PADRAO };
      desenharFiltros();
      atualizarLista();
    }
  });
}

function filtrarEOrdenar() {
  const termo = estado.busca.trim().toLowerCase();

  const lista = produtos.filter((produto) => {
    const nomeOuMarca = `${produto.title} ${produto.brand ?? ''}`.toLowerCase();
    const bateBusca = !termo || nomeOuMarca.includes(termo);
    const bateCategoria = !estado.categoria || produto.category === estado.categoria;
    return bateBusca && bateCategoria;
  });

  if (estado.ordem) lista.sort(ORDENACOES[estado.ordem].comparar);
  return lista;
}

function atualizarLista() {
  const lista = filtrarEOrdenar();
  const resumo = main.querySelector('#resumo');
  const resultado = main.querySelector('#resultado');

  if (lista.length === 0) {
    resumo.textContent = '';
    resultado.innerHTML = `
      <section class="estado">
        <h2>Nenhum produto encontrado</h2>
        <p>Tente buscar por outro termo ou remover algum filtro.</p>
        <button type="button" class="botao" id="limpar-filtros">Limpar filtros</button>
      </section>`;
    salvarEstadoNaUrl();
    return;
  }

  const totalPaginas = Math.ceil(lista.length / estado.porPagina);
  estado.pagina = Math.min(Math.max(estado.pagina, 1), totalPaginas);

  const inicio = (estado.pagina - 1) * estado.porPagina;
  const produtosDaPagina = lista.slice(inicio, inicio + estado.porPagina);

  resumo.textContent = `Exibindo ${inicio + 1} a ${inicio + produtosDaPagina.length} de ${pluralizar(lista.length, 'produto', 'produtos')}`;
  resultado.innerHTML = criarTabela(produtosDaPagina) + criarPaginacao(totalPaginas);
  salvarEstadoNaUrl();
}

function criarLinhaDaTabela(produto) {
  const titulo = escapar(produto.title);

  return `
    <tr>
      <td data-label="Imagem">
        <img class="miniatura" src="${escapar(produto.thumbnail)}" alt="Foto de ${titulo}" width="64" height="64" loading="lazy">
      </td>
      <th scope="row" data-label="Produto">${titulo}</th>
      <td data-label="Categoria">${escapar(formatarCategoria(produto.category))}</td>
      <td data-label="Preço">${formatoMoeda.format(produto.price)}</td>
      <td data-label="Estoque">${produto.stock}</td>
      <td data-label="Avaliação">
        <span aria-hidden="true">★</span> ${formatoNota.format(produto.rating)}<span class="so-leitor-de-tela"> de 5</span>
      </td>
      <td data-label="Ações">
        <a class="botao botao-pequeno" href="#/produtos/${produto.id}">Ver detalhes<span class="so-leitor-de-tela"> de ${titulo}</span></a>
      </td>
    </tr>`;
}

function criarTabela(listaDeProdutos) {
  return `
    <div class="tabela-rolavel">
      <table>
        <caption class="so-leitor-de-tela">Lista de produtos</caption>
        <thead>
          <tr>
            <th scope="col">Imagem</th>
            <th scope="col">Produto</th>
            <th scope="col">Categoria</th>
            <th scope="col">Preço</th>
            <th scope="col">Estoque</th>
            <th scope="col">Avaliação</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>${listaDeProdutos.map(criarLinhaDaTabela).join('')}</tbody>
      </table>
    </div>`;
}

function criarPaginacao(totalPaginas) {
  if (totalPaginas <= 1) return '';

  return `
    <nav class="paginacao" aria-label="Paginação">
      <button type="button" class="botao botao-secundario" data-pagina="${estado.pagina - 1}" ${estado.pagina === 1 ? 'disabled' : ''}>Anterior</button>
      <span>Página ${estado.pagina} de ${totalPaginas}</span>
      <button type="button" class="botao botao-secundario" data-pagina="${estado.pagina + 1}" ${estado.pagina === totalPaginas ? 'disabled' : ''}>Próxima</button>
    </nav>`;
}



async function mostrarDetalhe(idProduto) {
  const id = ++idRenderizacao;
  window.scrollTo(0, 0);
  mostrarCarregando('Carregando produto...');

  try {
    const produto = await buscarProduto(idProduto);
    if (id !== idRenderizacao) return;
    desenharDetalhe(produto);
  } catch (erro) {
    if (id !== idRenderizacao) return;
    const naoEncontrado = erro.status === 404;
    mostrarErro(
      naoEncontrado ? 'Produto não encontrado' : 'Não foi possível carregar o produto',
      naoEncontrado ? 'Esse produto não existe ou foi removido.' : erro.message,
      () => mostrarDetalhe(idProduto)
    );
  }
}

function desenharDetalhe(produto) {
  const precoComDesconto = produto.price * (1 - produto.discountPercentage / 100);
  const titulo = escapar(produto.title);
  document.title = `${produto.title} | Catálogo de Produtos`;

  const marca = produto.brand
    ? `<div><dt>Marca</dt><dd>${escapar(produto.brand)}</dd></div>`
    : '';

  const tags = produto.tags?.length
    ? `<h2>Tags</h2>
       <ul class="tags">${produto.tags.map((tag) => `<li>${escapar(tag)}</li>`).join('')}</ul>`
    : '';

  main.innerHTML = `
    <a class="voltar" href="${linkDaLista()}">Voltar para a lista</a>

    <article class="detalhe">
      <img class="detalhe-imagem" src="${escapar(produto.images?.[0] ?? produto.thumbnail)}" alt="Foto de ${titulo}">

      <div class="detalhe-info">
        <h1>${titulo}</h1>
        <p class="detalhe-preco">${formatoMoeda.format(precoComDesconto)}</p>

        <dl class="dados">
          <div><dt>Preço</dt><dd>${formatoMoeda.format(produto.price)}</dd></div>
          <div><dt>Desconto</dt><dd>${formatoPercentual.format(produto.discountPercentage)}%</dd></div>
          <div><dt>Categoria</dt><dd>${escapar(formatarCategoria(produto.category))}</dd></div>
          <div><dt>Avaliação</dt><dd><span aria-hidden="true">★</span> ${formatoNota.format(produto.rating)} de 5</dd></div>
          <div><dt>Estoque</dt><dd>${pluralizar(produto.stock, 'unidade', 'unidades')}</dd></div>
          ${marca}
        </dl>

        <h2>Descrição</h2>
        <p>${escapar(produto.description)}</p>
        ${tags}
      </div>
    </article>`;
}



function rotear() {
  const [caminho, query = ''] = location.hash.slice(1).split('?');
  const detalhe = caminho.match(/^\/produtos\/(\d+)$/);
  const veioDoDetalhe = telaAtual === 'detalhe';

  if (telaAtual === 'lista') {
    rolagemDaLista = { query: criarQuery(), y: window.scrollY };
  }

  if (detalhe) {
    telaAtual = 'detalhe';
    mostrarDetalhe(detalhe[1]);
  } else {
    telaAtual = 'lista';
    mostrarLista(new URLSearchParams(query), veioDoDetalhe);
  }
}


document.addEventListener('error', (evento) => {
  const imagem = evento.target;
  if (imagem.tagName === 'IMG' && !imagem.dataset.fallback) {
    imagem.dataset.fallback = 'true';
    imagem.src = IMAGEM_INDISPONIVEL;
  }
}, true);


history.scrollRestoration = 'manual';

window.addEventListener('hashchange', rotear);
rotear();