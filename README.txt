 - Index.js

Configurar Middlewares
Configurado uso da porta 8000
Passado rota e testado a saida (CONTEM ERRO)


 - Mongo DB

Criado Banco de dados no MongoDB
Criado Cluster no MongoDB
Criado Collections "Salao"
Criado Usuario "userSalao"
Conectado no "Database.js" atraves do connect
Feito conexão no MongoDB Compass com a String de conexão	


 - Estrutura de conexão JS e MongoDB

Database.js criado. (Problemas com IP)



 - Estrutura dos dados com JS

Criado Models conforme estrutura feito no draw.io
Criado Model de arquivos para salvar os arquivos feitos upload nas demais models

Criado relações do banco de dados entre as models 
	- Salão + Colaborador
	- Salão + Cliente
	- Colaborador + Serviço


 - Rotas/Routes

\\Requisição e Resposta - Receber e processar as requisições feitas no APP/Sistema e retornar alguma ação que foi requisitada

Criado rota de salão - "Melhoria a ser feita: Pegar localização do aparelho do usuario"
Criado rota de serviços
Criado rota do colaborador - "Falha: Não esta criando o colaborador no insominia"
Criado rota de cliente
Criado rota de horario
Criado Agendamento(em andamento) - "Melhoria a ser feita: Lin23. Fazer Verificação se ainda existe aquele horario disponivel"


--SERVICES

 - AWS SDK

OBSERVAÇÃO: estamos formalizando nossos planos de inserir o AWS SDK for JavaScript (v2) no modo de manutenção em 2023.

Migre seu código para usar o AWS SDK for JavaScript (v3).
Para mais informações, consulte o guia de migração em https://a.co/7PzMCcy
(Use `node --trace-warnings ...` para mostrar onde o aviso foi criado)


\\Utilizar AWS para salvar os arquivos atraves de API

Criado arquivo aws.js
Criado usuario na AWS e grupo de usuarios na IAM com serv S3 full acess
Adicionado novo usuario com acesso programatico

 - PAGARME

Criado usuario e empresa em Pagarme test

//Chaves API e Recebedor Criado para transações tester

 - WS/SRC

Util.js

Criado para realizar conversões em funções

--INSOMNIA

Utilizado para realizar teste das rotas do Back-end



