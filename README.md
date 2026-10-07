# Catálogo de Produtos

Aplicação web responsiva desenvolvida como teste prático de Front-end para consulta e visualização de produtos utilizando a API pública do DummyJSON.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- API REST do DummyJSON

## Como executar

O projeto utiliza JavaScript com ES Modules e deve ser executado através de um servidor local.

Para executar pelo Visual Studio Code:

1. Abra a pasta do projeto no Visual Studio Code.
2. Abra o arquivo `index.html`.
3. Clique em **Go Live**, no canto inferior direito do Visual Studio Code.
4. A aplicação será aberta automaticamente no navegador.

## Funcionalidades

- Listagem de produtos em tabela
- Busca por nome ou marca
- Filtro por categoria
- Ordenação por preço e avaliação
- Paginação
- Controle da quantidade de produtos por página
- Visualização dos detalhes de cada produto
- Exibição de nome, imagem, descrição, categoria, preço, desconto, avaliação, estoque, marca e tags
- Tratamento de imagens indisponíveis
- Estados de carregamento, erro, lista vazia e sucesso
- Layout responsivo para desktop, tablet e smartphone

## Acessibilidade

A aplicação considera conceitos básicos de acessibilidade, incluindo:

- Textos alternativos nas imagens
- HTML semântico
- Estrutura acessível da tabela
- Navegação por teclado
- Foco visual nos elementos interativos
- Botões e links com ações claras
- Textos compreensíveis
- `aria-live` para informações relevantes

## Decisões técnicas

### JavaScript puro

Foi utilizado JavaScript sem frameworks para demonstrar os fundamentos de Front-end solicitados no teste.

### Consumo da API

Os produtos são carregados diretamente da API pública do DummyJSON.

São utilizados os endpoints de listagem e consulta de produtos.

A API fornece informações como nome, descrição, categoria, preço, desconto, avaliação, estoque, marca, tags e imagens. 

### Organização do código

A comunicação com a API foi separada da lógica principal da aplicação.

- `api.js`: responsável pelas chamadas à API
- `app.js`: responsável pela lógica da aplicação, listagem, filtros, estados e detalhes

### Responsividade

A interface foi desenvolvida para funcionar em diferentes tamanhos de tela.

Em telas menores, a tabela é adaptada para manter as informações acessíveis e utilizáveis.

