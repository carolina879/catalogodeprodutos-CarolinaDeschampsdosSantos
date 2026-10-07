const URL_BASE = 'https://dummyjson.com/products';

async function buscarJson(url) {
  let resposta;

  try {
    resposta = await fetch(url);
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique sua conexão com a internet.');
  }

  if (!resposta.ok) {
    const erro = new Error(`A API respondeu com o erro ${resposta.status}.`);
    erro.status = resposta.status;
    throw erro;
  }

  return resposta.json();
}

export async function buscarProdutos() {
  const dados = await buscarJson(`${URL_BASE}?limit=0`);
  return dados.products;
}

export function buscarProduto(id) {
  return buscarJson(`${URL_BASE}/${id}`);
}
