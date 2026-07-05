import React, { useState, useEffect } from 'react';
import { ShoppingBag, LayoutDashboard, Store, Package2, ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { Produto, ItemCarrinho, Cliente, Pedido, Categoria, Cupom, ConfiguracaoLoja } from './types';
import CatalogView from './components/CatalogView';
import AdminView from './components/AdminView';
import { motion, AnimatePresence } from 'motion/react';
import {
  isSupabaseConfigured,
  dbObterProdutos,
  dbSalvarProduto,
  dbRemoverProduto,
  dbObterCategorias,
  dbSalvarCategoria,
  dbRemoverCategoria,
  dbObterCupons,
  dbSalvarCupom,
  dbRemoverCupom,
  dbObterClientes,
  dbSalvarCliente,
  dbRemoverCliente,
  dbObterPedidos,
  dbSalvarPedido,
  dbRemoverPedido,
  dbObterConfiguracao,
  dbSalvarConfiguracao
} from './lib/supabase';


const CUPONS_PADRAO: Cupom[] = [];

const CONFIG_PADRAO: ConfiguracaoLoja = {
  nomeLoja: 'Rayzer Gamers PC',
  descricaoLoja: 'Sua loja especializada em PCs de alto desempenho, hardware e periféricos gamer premium.',
  telefoneContato: '(11) 99999-9999',
  emailContato: 'contato@rayzergamerspc.com.br',
  enderecoLoja: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  moeda: 'R$',
  taxaEntregaPadrao: 25.00,
  freteGratisMinimo: 500.00,
  permitirEstoqueNegativo: false,
  modoManutencao: false,
  bannerUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=1200'
};

// Lista de categorias padrão de fábrica
const CATEGORIAS_PADRAO: Categoria[] = [
  { id: '1', nome: 'PCs Completos', emoji: '🖥️', descricao: 'Computadores gamer montados e testados por especialistas.' },
  { id: '2', nome: 'Hardware & Peças', emoji: '⚙️', descricao: 'Placas de vídeo, processadores, fontes, gabinetes e coolers.' },
  { id: '3', nome: 'Periféricos', emoji: '⌨️', descricao: 'Teclados mecânicos, mouses de alta precisão e headsets gamer.' },
  { id: '4', nome: 'Cadeiras & Conforto', emoji: '🪑', descricao: 'Cadeiras gamer ergonômicas e mesas para o seu setup.' },
  { id: '5', nome: 'Monitores', emoji: '🖥️', descricao: 'Telas com alta taxa de atualização (Hz) e baixíssimo tempo de resposta.' }
];

// Lista de produtos padrão de fábrica
const PRODUTOS_PADRAO: Produto[] = [];

const CLIENTES_PADRAO: Cliente[] = [];

const PEDIDOS_PADRAO: Pedido[] = [];

export default function App() {
  // Estado de Navegação por Abas/Rotas
  const [abaAtiva, setAbaAtiva] = useState<'catalogo' | 'admin'>('catalogo');

  // Estados de Autenticação do Administrador
  const [adminAutenticado, setAdminAutenticado] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_autenticado') === 'true';
  });
  const [senhaInput, setSenhaInput] = useState('');
  const [erroSenha, setErroSenha] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Efeito para sincronizar a URL com a aba ativa (/admin ou #/admin)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setAbaAtiva('admin');
      } else {
        setAbaAtiva('catalogo');
      }
    };

    // Executa uma vez no carregamento inicial
    handleLocationChange();

    // Adiciona escutas para mudanças na barra de endereço
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const irParaLoja = () => {
    setAbaAtiva('catalogo');
    if (window.location.hash) {
      window.location.hash = '';
    }
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const fazerLogoutAdmin = () => {
    setAdminAutenticado(false);
    sessionStorage.removeItem('admin_autenticado');
    irParaLoja();
  };

  const verificarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(false);
    setCarregandoLogin(true);
    try {
      const msgUint8 = new TextEncoder().encode(senhaInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex === 'b1593260ecc043243d1278df90b6361a5f70dafae0f5918bf891b273fbafc0b4') {
        setAdminAutenticado(true);
        sessionStorage.setItem('admin_autenticado', 'true');
        setSenhaInput('');
      } else {
        setErroSenha(true);
      }
    } catch (err) {
      console.error('Falha ao usar crypto nativo:', err);
      if (senhaInput === 'r@yzer') {
        setAdminAutenticado(true);
        sessionStorage.setItem('admin_autenticado', 'true');
        setSenhaInput('');
      } else {
        setErroSenha(true);
      }
    } finally {
      setCarregandoLogin(false);
    }
  };

  // Estado Central de Produtos (carrega do localStorage se houver)
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Estado Central de Clientes (carrega do localStorage se houver)
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Estado Central de Pedidos (carrega do localStorage se houver)
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Estado Central do Carrinho de Compras (carrega do localStorage)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // Estado Central de Categorias (carrega do localStorage e sincroniza com os produtos)
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estado Central de Cupons
  const [cupons, setCupons] = useState<Cupom[]>([]);

  // Estado Central de Configuração da Loja
  const [configuracao, setConfiguracao] = useState<ConfiguracaoLoja>(CONFIG_PADRAO);

  // Sincronizar categorias com os produtos cadastrados
  useEffect(() => {
    const categoriasLocais = localStorage.getItem('catalogo_categorias');
    let cats: Categoria[] = [];
    if (categoriasLocais) {
      try {
        cats = JSON.parse(categoriasLocais);
      } catch (e) {
        cats = [...CATEGORIAS_PADRAO];
      }
    } else {
      cats = [...CATEGORIAS_PADRAO];
    }

    if (produtos.length > 0) {
      let mudou = false;
      const nomesExistentes = new Set(cats.map(c => c.nome.toLowerCase()));
      
      const sugestoesEmoji: Record<string, string> = {
        'headsets': '🎧',
        'processadores': '🔥',
        'placas de vídeo': '🎮',
        'teclados': '⌨️',
        'mouses': '🖱️',
        'monitores': '🖥️',
        'eletrônicos': '💻',
        'acessórios': '🎒',
        'moda': '👕',
        'casa & decoração': '🏠',
        'esportes': '⚽',
        'games': '🎮',
        'hardware': '⚙️',
        'áudio': '🎧',
        'periféricos': '🖱️'
      };

      produtos.forEach(p => {
        if (p.categoria) {
          const catNome = p.categoria.trim();
          const catLower = catNome.toLowerCase();
          if (!nomesExistentes.has(catLower)) {
            const emojiSugerido = sugestoesEmoji[catLower] || '📦';
            const novaCat: Categoria = {
              id: (cats.length > 0 ? Math.max(...cats.map(c => parseInt(c.id, 10) || 0)) + 1 : 1).toString(),
              nome: catNome,
              emoji: emojiSugerido,
              descricao: `Categoria ${catNome} carregada dinamicamente dos produtos.`
            };
            cats.push(novaCat);
            nomesExistentes.add(catLower);
            mudou = true;
          }
        }
      });

      if (mudou) {
        localStorage.setItem('catalogo_categorias', JSON.stringify(cats));
      }
    }

    setCategorias(cats);
  }, [produtos]);

  const salvarCategorias = (novasCategorias: Categoria[]) => {
    setCategorias(novasCategorias);
    localStorage.setItem('catalogo_categorias', JSON.stringify(novasCategorias));
  };

  const adicionarCategoria = (nova: Omit<Categoria, 'id'>) => {
    const novoID = (categorias.length > 0 ? Math.max(...categorias.map(c => parseInt(c.id, 10) || 0)) + 1 : 1).toString();
    const completo: Categoria = {
      ...nova,
      id: novoID
    };
    salvarCategorias([...categorias, completo]);
  };

  const removerCategoria = (id: string) => {
    const filtradas = categorias.filter(c => c.id !== id);
    salvarCategorias(filtradas);
  };

  const atualizarCategoria = (id: string, categoriaAtualizada: Categoria) => {
    const atualizadas = categorias.map(c => c.id === id ? categoriaAtualizada : c);
    salvarCategorias(atualizadas);
  };


  // Inicializar dados de produtos, carrinho, clientes e pedidos com verificação de reset
  useEffect(() => {
    let resetAll = false;
    const configuracaoLocal = localStorage.getItem('catalogo_configuracao');
    if (configuracaoLocal) {
      try {
        JSON.parse(configuracaoLocal);
      } catch (e) {
        resetAll = true;
      }
    } else {
      resetAll = true;
    }

    if (resetAll) {
      setConfiguracao(CONFIG_PADRAO);
      localStorage.setItem('catalogo_configuracao', JSON.stringify(CONFIG_PADRAO));
      
      setProdutos(PRODUTOS_PADRAO);
      localStorage.setItem('catalogo_produtos', JSON.stringify(PRODUTOS_PADRAO));
      
      setClientes(CLIENTES_PADRAO);
      localStorage.setItem('catalogo_clientes', JSON.stringify(CLIENTES_PADRAO));
      
      setPedidos(PEDIDOS_PADRAO);
      localStorage.setItem('catalogo_pedidos', JSON.stringify(PEDIDOS_PADRAO));
      
      setCupons(CUPONS_PADRAO);
      localStorage.setItem('catalogo_cupons', JSON.stringify(CUPONS_PADRAO));

      setCategorias(CATEGORIAS_PADRAO);
      localStorage.setItem('catalogo_categorias', JSON.stringify(CATEGORIAS_PADRAO));
      
      setCarrinho([]);
      localStorage.setItem('catalogo_carrinho', JSON.stringify([]));
    } else {
      // Carregar normalmente do cache local primeiro
      const produtosLocais = localStorage.getItem('catalogo_produtos');
      if (produtosLocais) {
        try {
          setProdutos(JSON.parse(produtosLocais));
        } catch (e) {
          setProdutos(PRODUTOS_PADRAO);
        }
      } else {
        setProdutos(PRODUTOS_PADRAO);
      }

      const clientesLocais = localStorage.getItem('catalogo_clientes');
      if (clientesLocais) {
        try {
          setClientes(JSON.parse(clientesLocais));
        } catch (e) {
          setClientes(CLIENTES_PADRAO);
        }
      } else {
        setClientes(CLIENTES_PADRAO);
      }

      const pedidosLocais = localStorage.getItem('catalogo_pedidos');
      if (pedidosLocais) {
        try {
          setPedidos(JSON.parse(pedidosLocais));
        } catch (e) {
          setPedidos(PEDIDOS_PADRAO);
        }
      } else {
        setPedidos(PEDIDOS_PADRAO);
      }

      const carrinhoLocal = localStorage.getItem('catalogo_carrinho');
      if (carrinhoLocal) {
        try {
          setCarrinho(JSON.parse(carrinhoLocal));
        } catch (e) {
          setCarrinho([]);
        }
      }

      const cuponsLocais = localStorage.getItem('catalogo_cupons');
      if (cuponsLocais) {
        try {
          setCupons(JSON.parse(cuponsLocais));
        } catch (e) {
          setCupons(CUPONS_PADRAO);
        }
      } else {
        setCupons(CUPONS_PADRAO);
      }

      try {
        setConfiguracao(JSON.parse(configuracaoLocal!));
      } catch (e) {
        setConfiguracao(CONFIG_PADRAO);
      }
    }

    // Carregar dados reais do Supabase se estiver configurado
    if (isSupabaseConfigured()) {
      const carregarDadosSupabase = async () => {
        try {
          const [dbProds, dbCats, dbClis, dbPeds, dbCups, dbConf] = await Promise.all([
            dbObterProdutos(),
            dbObterCategorias(),
            dbObterClientes(),
            dbObterPedidos(),
            dbObterCupons(),
            dbObterConfiguracao()
          ]);

          if (dbProds && dbProds.length > 0) {
            const formatados = dbProds.map((p: any) => ({
              id: p.id,
              nome: p.nome,
              preco: p.preco,
              categoria: p.categoria,
              descricao: p.descricao,
              imagem: p.imagem,
              estoque: p.estoque,
              destaque: p.destaque,
              especificacoes: p.especificacoes || {},
              ativo: p.ativo
            }));
            setProdutos(formatados);
            localStorage.setItem('catalogo_produtos', JSON.stringify(formatados));
          }
          if (dbCats && dbCats.length > 0) {
            setCategorias(dbCats);
            localStorage.setItem('catalogo_categorias', JSON.stringify(dbCats));
          }
          if (dbClis && dbClis.length > 0) {
            setClientes(dbClis);
            localStorage.setItem('catalogo_clientes', JSON.stringify(dbClis));
          }
          if (dbPeds && dbPeds.length > 0) {
            const formatados = dbPeds.map((p: any) => ({
              id: p.id,
              clienteId: p.cliente_id,
              clienteNome: p.cliente_nome,
              itens: p.itens,
              subtotal: p.subtotal,
              desconto: p.desconto,
              shipping: p.shipping,
              total: p.total,
              metodoPagamento: p.metodo_pagamento,
              status: p.status,
              data: p.data
            }));
            setPedidos(formatados);
            localStorage.setItem('catalogo_pedidos', JSON.stringify(formatados));
          }
          if (dbCups && dbCups.length > 0) {
            const formatados = dbCups.map((c: any) => ({
              id: c.id,
              codigo: c.codigo,
              tipoDesconto: c.tipoDesconto,
              valor: c.valor,
              valorMinimoPedido: c.valorMinimoPedido,
              limiteUso: c.limiteUso,
              vezesUsado: c.usosAtuais,
              dataExpiracao: c.dataExpiracao,
              ativo: c.ativo
            }));
            setCupons(formatados);
            localStorage.setItem('catalogo_cupons', JSON.stringify(formatados));
          }
          if (dbConf) {
            const formatado = {
              nomeLoja: dbConf.nome_loja,
              descricaoLoja: dbConf.descricao_loja,
              telefoneContato: dbConf.telefone_contato,
              emailContato: dbConf.email_contato,
              enderecoLoja: dbConf.endereco_loja,
              moeda: dbConf.moeda,
              taxaEntregaPadrao: dbConf.taxa_entrega_padrao,
              freteGratisMinimo: dbConf.frete_gratis_minimo,
              permitirEstoqueNegativo: dbConf.permitir_estoque_negativo,
              modoManutencao: dbConf.modo_manutencao,
              bannerUrl: dbConf.banner_url
            };
            setConfiguracao(formatado);
            localStorage.setItem('catalogo_configuracao', JSON.stringify(formatado));
          }
        } catch (err) {
          console.warn("Falha ao sincronizar com o Supabase. Usando cache local:", err);
        }
      };
      carregarDadosSupabase();
    }
  }, []);

  // Salvar alterações de produtos no localStorage
  const salvarProdutos = (novosProdutos: Produto[]) => {
    setProdutos(novosProdutos);
    localStorage.setItem('catalogo_produtos', JSON.stringify(novosProdutos));
    if (isSupabaseConfigured()) {
      novosProdutos.forEach(p => dbSalvarProduto(p).catch(console.error));
    }
  };

  // Salvar alterações de carrinho no localStorage
  const salvarCarrinho = (novoCarrinho: ItemCarrinho[]) => {
    setCarrinho(novoCarrinho);
    localStorage.setItem('catalogo_carrinho', JSON.stringify(novoCarrinho));
  };

  // Funções de Gerenciamento do Carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.estoque) {
        const novoCarrinho = carrinho.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
        salvarCarrinho(novoCarrinho);
      } else {
        alert('Desculpe, limite máximo de estoque para este produto atingido.');
      }
    } else {
      salvarCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }
  };

  const atualizarQuantidadeCarrinho = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerDoCarrinho(produtoId);
      return;
    }
    
    const novoCarrinho = carrinho.map(item => {
      if (item.produto.id === produtoId) {
        // Garantir que não ultrapassa estoque
        const qteSegura = Math.min(quantidade, item.produto.estoque);
        return { ...item, quantidade: qteSegura };
      }
      return item;
    });
    
    salvarCarrinho(novoCarrinho);
  };

  const removerDoCarrinho = (produtoId: string) => {
    const novoCarrinho = carrinho.filter(item => item.produto.id !== produtoId);
    salvarCarrinho(novoCarrinho);
  };

  const limparCarrinho = () => {
    salvarCarrinho([]);
  };

  // Funções Administrativas
  const adicionarProduto = (novo: Omit<Produto, 'id' | 'avaliacao'>) => {
    const novoID = (produtos.length > 0 ? Math.max(...produtos.map(p => parseInt(p.id, 10))) + 1 : 1).toString();
    const completo: Produto = {
      ...novo,
      id: novoID,
      avaliacao: 5.0 // Novos produtos iniciam com nota máxima padrão
    };
    salvarProdutos([...produtos, completo]);
  };

  const removerProduto = (id: string) => {
    const filtrados = produtos.filter(p => p.id !== id);
    salvarProdutos(filtrados);
    
    // Remover também do carrinho caso esteja lá
    removerDoCarrinho(id);

    if (isSupabaseConfigured()) {
      dbRemoverProduto(id).catch(console.error);
    }
  };

  const atualizarProduto = (id: string, produtoAtualizado: Produto) => {
    const atualizados = produtos.map(p => p.id === id ? produtoAtualizado : p);
    salvarProdutos(atualizados);

    // Atualizar produto no carrinho se já estiver inserido
    const carrinhoAtualizado = carrinho.map(item => 
      item.produto.id === id ? { ...item, produto: produtoAtualizado } : item
    );
    salvarCarrinho(carrinhoAtualizado);
  };

  const salvarClientes = (novosClientes: Cliente[]) => {
    setClientes(novosClientes);
    localStorage.setItem('catalogo_clientes', JSON.stringify(novosClientes));
    if (isSupabaseConfigured()) {
      novosClientes.forEach(c => dbSalvarCliente(c).catch(console.error));
    }
  };

  const salvarPedidos = (novosPedidos: Pedido[]) => {
    setPedidos(novosPedidos);
    localStorage.setItem('catalogo_pedidos', JSON.stringify(novosPedidos));
    if (isSupabaseConfigured()) {
      novosPedidos.forEach(p => dbSalvarPedido({
        id: p.id,
        clienteId: p.clienteId,
        clienteNome: p.clienteNome,
        itens: p.itens,
        subtotal: p.subtotal,
        desconto: p.descontoValor,
        shipping: p.taxaEntrega,
        total: p.valorTotal,
        metodoPagamento: p.metodoPagamento || 'Não especificado',
        status: p.status,
        data: p.dataPedido
      }).catch(console.error));
    }
  };

  // Métodos para Cupons
  const salvarCupons = (novosCupons: Cupom[]) => {
    setCupons(novosCupons);
    localStorage.setItem('catalogo_cupons', JSON.stringify(novosCupons));
    if (isSupabaseConfigured()) {
      novosCupons.forEach(c => dbSalvarCupom({
        id: c.id,
        codigo: c.codigo,
        tipoDesconto: c.tipo,
        valor: c.valor,
        valorMinimoPedido: c.valorMinimoPedido,
        limiteUso: c.limiteUso,
        usosAtuais: c.vezesUsado,
        dataExpiracao: c.dataValidade,
        ativo: c.ativo
      }).catch(console.error));
    }
  };

  const adicionarCupom = (novo: Omit<Cupom, 'id' | 'vezesUsado'>) => {
    const novoID = (cupons.length > 0 ? Math.max(...cupons.map(c => parseInt(c.id, 10) || 0)) + 1 : 1).toString();
    const completo: Cupom = {
      ...novo,
      id: novoID,
      vezesUsado: 0
    };
    salvarCupons([...cupons, completo]);
  };

  const atualizarCupom = (id: string, cupomAtualizado: Cupom) => {
    const atualizados = cupons.map(c => c.id === id ? cupomAtualizado : c);
    salvarCupons(atualizados);
  };

  const removerCupom = (id: string) => {
    const filtrados = cupons.filter(c => c.id !== id);
    salvarCupons(filtrados);
    if (isSupabaseConfigured()) {
      dbRemoverCupom(id).catch(console.error);
    }
  };

  // Método para Configuração da Loja
  const atualizarConfiguracao = (novaConfig: ConfiguracaoLoja) => {
    setConfiguracao(novaConfig);
    localStorage.setItem('catalogo_configuracao', JSON.stringify(novaConfig));
    if (isSupabaseConfigured()) {
      dbSalvarConfiguracao(novaConfig).catch(console.error);
    }
  };

  // Métodos para Clientes
  const adicionarCliente = (novo: Omit<Cliente, 'id' | 'totalPedidos' | 'totalGasto' | 'dataCadastro'>) => {
    const novoID = (clientes.length > 0 ? Math.max(...clientes.map(c => parseInt(c.id, 10))) + 1 : 1).toString();
    const completo: Cliente = {
      ...novo,
      id: novoID,
      totalPedidos: 0,
      totalGasto: 0,
      dataCadastro: new Date().toISOString().split('T')[0]
    };
    salvarClientes([...clientes, completo]);
  };

  const atualizarCliente = (id: string, clienteAtualizado: Cliente) => {
    const atualizados = clientes.map(c => c.id === id ? clienteAtualizado : c);
    salvarClientes(atualizados);
  };

  const removerCliente = (id: string) => {
    const filtrados = clientes.filter(c => c.id !== id);
    salvarClientes(filtrados);
    if (isSupabaseConfigured()) {
      dbRemoverCliente(id).catch(console.error);
    }
  };

  // Métodos para Pedidos
  const fazerPedido = (
    clienteId: string,
    itens: { produto: Produto; quantidade: number }[],
    endereco: string,
    novoClienteInfo?: Omit<Cliente, 'id' | 'totalPedidos' | 'totalGasto' | 'dataCadastro'>,
    cupomCodigo?: string,
    descontoValor: number = 0,
    taxaEntrega: number = 0
  ) => {
    let finalClienteId = clienteId;
    let finalClienteNome = "";
    let finalClienteEmail = "";
    const subtotal = itens.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
    const totalPedido = Math.max(0, subtotal - descontoValor + taxaEntrega);

    // Se for um novo cliente
    if (clienteId === 'novo' && novoClienteInfo) {
      const novoID = (clientes.length > 0 ? Math.max(...clientes.map(c => parseInt(c.id, 10))) + 1 : 1).toString();
      const novoCliente: Cliente = {
        ...novoClienteInfo,
        id: novoID,
        totalPedidos: 1,
        totalGasto: totalPedido,
        dataCadastro: new Date().toISOString().split('T')[0]
      };
      
      const atualizados = [...clientes, novoCliente];
      setClientes(atualizados);
      localStorage.setItem('catalogo_clientes', JSON.stringify(atualizados));
      
      finalClienteId = novoID;
      finalClienteNome = novoCliente.nome;
      finalClienteEmail = novoCliente.email;
    } else {
      // Cliente existente
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        finalClienteNome = cliente.nome;
        finalClienteEmail = cliente.email;

        // Atualizar estatísticas do cliente
        const clienteAtualizado: Cliente = {
          ...cliente,
          totalPedidos: cliente.totalPedidos + 1,
          totalGasto: cliente.totalGasto + totalPedido
        };
        atualizarCliente(clienteId, clienteAtualizado);
      }
    }

    // Incrementar o uso do cupom se aplicável
    if (cupomCodigo) {
      const cupomEncontrado = cupons.find(c => c.codigo.toUpperCase() === cupomCodigo.toUpperCase());
      if (cupomEncontrado) {
        const cuponsAtualizados = cupons.map(c => c.id === cupomEncontrado.id ? { ...c, vezesUsado: c.vezesUsado + 1 } : c);
        setCupons(cuponsAtualizados);
        localStorage.setItem('catalogo_cupons', JSON.stringify(cuponsAtualizados));
      }
    }

    // Criar o pedido
    const novoPedidoID = "PED-" + (1000 + pedidos.length + 1);
    const novoPedido: Pedido = {
      id: novoPedidoID,
      clienteId: finalClienteId,
      clienteNome: finalClienteNome || "Cliente Desconhecido",
      clienteEmail: finalClienteEmail || "",
      itens: itens.map(item => ({
        produtoId: item.produto.id,
        nome: item.produto.nome,
        preco: item.produto.preco,
        quantidade: item.quantidade
      })),
      valorTotal: totalPedido,
      status: 'Pendente',
      dataPedido: new Date().toISOString(),
      enderecoEntrega: endereco,
      cupomAplicado: cupomCodigo,
      descontoValor: descontoValor,
      taxaEntrega: taxaEntrega,
      subtotal: subtotal
    };

    salvarPedidos([novoPedido, ...pedidos]);

    // Reduzir estoque dos produtos
    const produtosAtualizados = produtos.map(prod => {
      const itemCarrinho = itens.find(it => it.produto.id === prod.id);
      if (itemCarrinho) {
        return {
          ...prod,
          estoque: Math.max(0, prod.estoque - itemCarrinho.quantidade)
        };
      }
      return prod;
    });
    salvarProdutos(produtosAtualizados);
  };

  const atualizarStatusPedido = (id: string, status: Pedido['status']) => {
    const atualizados = pedidos.map(p => p.id === id ? { ...p, status } : p);
    salvarPedidos(atualizados);
  };

  const removerPedido = (id: string) => {
    const filtrados = pedidos.filter(p => p.id !== id);
    salvarPedidos(filtrados);
  };

  const resetarParaPadrao = () => {
    salvarProdutos(PRODUTOS_PADRAO);
    salvarClientes(CLIENTES_PADRAO);
    salvarPedidos(PEDIDOS_PADRAO);
    salvarCarrinho([]);
    salvarCupons(CUPONS_PADRAO);
    atualizarConfiguracao(CONFIG_PADRAO);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra Superior / Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo e Nome da Loja */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg text-slate-900 tracking-tight block">{configuracao.nomeLoja}</span>
                {isSupabaseConfigured() && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Nuvem
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block -mt-1">{configuracao.descricaoLoja}</span>
            </div>
          </div>

          {/* Botões do Painel Admin na barra superior */}
          {abaAtiva === 'admin' && (
            <div className="flex items-center gap-3">
              <button
                onClick={irParaLoja}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ver Loja</span>
              </button>
              {adminAutenticado && (
                <button
                  onClick={fazerLogoutAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={abaAtiva + (adminAutenticado ? '-auth' : '-noauth')}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {abaAtiva === 'catalogo' && (
              <CatalogView
                produtos={produtos}
                adicionarAoCarrinho={adicionarAoCarrinho}
                carrinho={carrinho}
                atualizarQuantidadeCarrinho={atualizarQuantidadeCarrinho}
                removerDoCarrinho={removerDoCarrinho}
                limparCarrinho={limparCarrinho}
                clientes={clientes}
                fazerPedido={fazerPedido}
                listaCategorias={categorias}
                cupons={cupons}
                configuracao={configuracao}
              />
            )}

            {abaAtiva === 'admin' && !adminAutenticado && (
              <div className="max-w-md mx-auto my-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden"
                >
                  {/* Detalhes do background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10"></div>

                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                      <ShieldAlert className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="font-display font-black text-xl tracking-tight">Área Restrita</h2>
                      <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Acesso Administrativo - Rayzer Gamers</p>
                    </div>

                    <form onSubmit={verificarSenha} className="w-full space-y-4 pt-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Senha do Administrador</label>
                        <input
                          type="password"
                          value={senhaInput}
                          onChange={(e) => {
                            setSenhaInput(e.target.value);
                            setErroSenha(false);
                          }}
                          placeholder="Digite a chave mestre..."
                          required
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono placeholder-slate-600 transition-colors"
                        />
                      </div>

                      {erroSenha && (
                        <motion.p
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg"
                        >
                          ⚠️ Senha incorreta. Tente novamente.
                        </motion.p>
                      )}

                      <button
                        type="submit"
                        disabled={carregandoLogin}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-indigo-950/50 cursor-pointer"
                      >
                        {carregandoLogin ? 'Autenticando...' : 'Entrar no Painel'}
                      </button>
                    </form>

                    <button
                      onClick={irParaLoja}
                      className="text-xs text-slate-400 hover:text-white font-semibold transition-colors pt-2 cursor-pointer flex items-center gap-1"
                    >
                      Voltar para a Loja
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {abaAtiva === 'admin' && adminAutenticado && (
              <AdminView
                produtos={produtos}
                adicionarProduto={adicionarProduto}
                removerProduto={removerProduto}
                atualizarProduto={atualizarProduto}
                resetarParaPadrao={resetarParaPadrao}
                clientes={clientes}
                adicionarCliente={adicionarCliente}
                atualizarCliente={atualizarCliente}
                removerCliente={removerCliente}
                pedidos={pedidos}
                atualizarStatusPedido={atualizarStatusPedido}
                removerPedido={removerPedido}
                categorias={categorias}
                adicionarCategoria={adicionarCategoria}
                removerCategoria={removerCategoria}
                atualizarCategoria={atualizarCategoria}
                cupons={cupons}
                adicionarCupom={adicionarCupom}
                atualizarCupom={atualizarCupom}
                removerCupom={removerCupom}
                configuracao={configuracao}
                atualizarConfiguracao={atualizarConfiguracao}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Rodapé / Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Package2 className="w-4 h-4 text-slate-300" />
            <span>&copy; {new Date().getFullYear()} {configuracao.nomeLoja}. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 transition-colors">Política de Privacidade</span>
            <span>&bull;</span>
            <span className="hover:text-slate-600 transition-colors">Termos de Uso</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
