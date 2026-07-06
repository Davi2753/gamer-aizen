import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Star, ShoppingBag, Eye, Plus, Minus, Trash2, CheckCircle, Tag, Package, ShoppingCart, User, MapPin, ArrowLeft, Send, ShieldAlert, Ticket, Percent, CreditCard, Loader2 } from 'lucide-react';
import { Produto, FiltrosProduto, ItemCarrinho, Cliente, Categoria, Cupom, ConfiguracaoLoja } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CatalogViewProps {
  produtos: Produto[];
  adicionarAoCarrinho: (produto: Produto) => void;
  carrinho: ItemCarrinho[];
  atualizarQuantidadeCarrinho: (produtoId: string, quantidade: number) => void;
  removerDoCarrinho: (produtoId: string) => void;
  limparCarrinho: () => void;
  clientes: Cliente[];
  fazerPedido: (
    clienteId: string,
    itens: { produto: Produto; quantidade: number }[],
    endereco: string,
    novoClienteInfo?: Omit<Cliente, 'id' | 'totalPedidos' | 'totalGasto' | 'dataCadastro'>,
    cupomCodigo?: string,
    descontoValor?: number,
    taxaEntrega?: number
  ) => void;
  listaCategorias?: Categoria[];
  cupons: Cupom[];
  configuracao: ConfiguracaoLoja;
}

export default function CatalogView({
  produtos,
  adicionarAoCarrinho,
  carrinho,
  atualizarQuantidadeCarrinho,
  removerDoCarrinho,
  limparCarrinho,
  clientes,
  fazerPedido,
  listaCategorias = [],
  cupons,
  configuracao
}: CatalogViewProps) {
  // Estado de Filtros
  const [filtros, setFiltros] = useState<FiltrosProduto>({
    busca: '',
    categoria: '',
    precoMin: 0,
    precoMax: 2000,
    apenasDestaque: false,
    ordenarPor: 'nome'
  });

  // Estado da UI
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);
  const [compraFinalizada, setCompraFinalizada] = useState(false);

  // Categorias únicas presentes nos produtos atuais
  const categorias = useMemo(() => {
    const list = produtos.map(p => p.categoria);
    return ['Todas', ...Array.from(new Set(list))];
  }, [produtos]);

  // Filtragem e Ordenação
  const produtosFiltrados = useMemo(() => {
    return produtos
      .filter(p => {
        const bateBusca = p.nome.toLowerCase().includes(filtros.busca.toLowerCase()) || 
                          p.descricao.toLowerCase().includes(filtros.busca.toLowerCase());
        const bateCategoria = filtros.categoria === '' || filtros.categoria === 'Todas' || p.categoria === filtros.categoria;
        const batePreco = p.preco >= filtros.precoMin && p.preco <= filtros.precoMax;
        const bateDestaque = !filtros.apenasDestaque || p.destaque;

        return bateBusca && bateCategoria && batePreco && bateDestaque;
      })
      .sort((a, b) => {
        if (filtros.ordenarPor === 'nome') {
          return a.nome.localeCompare(b.nome);
        }
        if (filtros.ordenarPor === 'preco-crescente') {
          return a.preco - b.preco;
        }
        if (filtros.ordenarPor === 'preco-decrescente') {
          return b.preco - a.preco;
        }
        if (filtros.ordenarPor === 'avaliacao') {
          return b.avaliacao - a.avaliacao;
        }
        return 0;
      });
  }, [produtos, filtros]);

  // Preço máximo encontrado nos produtos para definir o limite do slider
  const limitePrecoMax = useMemo(() => {
    if (produtos.length === 0) return 1000;
    return Math.ceil(Math.max(...produtos.map(p => p.preco)));
  }, [produtos]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  }, [carrinho]);

  const valorTotalCarrinho = useMemo(() => {
    return carrinho.reduce((sum, item) => sum + (item.produto.preco * item.quantidade), 0);
  }, [carrinho]);

  // Estados do checkout avançado
  const [etapaCheckout, setEtapaCheckout] = useState<'itens' | 'identificacao' | 'pagamento'>('itens');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('');
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: ''
  });
  const [enderecoEntrega, setEnderecoEntrega] = useState('');

  // Estados de Pagamento Mercado Pago
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [pixCopiado, setPixCopiado] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [validadeCartao, setValidadeCartao] = useState('');
  const [cvvCartao, setCvvCartao] = useState('');

  // Estados de Integração Real com Mercado Pago API
  const [preferenceUrl, setPreferenceUrl] = useState<string>('');
  const [preferenceId, setPreferenceId] = useState<string>('');
  const [carregandoPreferencia, setCarregandoPreferencia] = useState(false);
  const [erroPreferencia, setErroPreferencia] = useState<string | null>(null);

  // Estados para o Sistema de Cupons
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);

  // Função para validar e aplicar o cupom
  const aplicarCupom = () => {
    if (!codigoCupom.trim()) {
      setErroCupom('Por favor, digite um código de cupom.');
      return;
    }

    const cupom = cupons.find(c => c.codigo.toUpperCase() === codigoCupom.trim().toUpperCase());

    if (!cupom) {
      setErroCupom('Cupom inválido ou não encontrado.');
      setCupomAplicado(null);
      return;
    }

    if (!cupom.ativo) {
      setErroCupom('Este cupom está desativado no momento.');
      setCupomAplicado(null);
      return;
    }

    if (cupom.limiteUso && cupom.vezesUsado >= cupom.limiteUso) {
      setErroCupom('Este cupom já atingiu o limite máximo de utilizações.');
      setCupomAplicado(null);
      return;
    }

    if (cupom.dataValidade) {
      const hoje = new Date().toISOString().split('T')[0];
      if (hoje > cupom.dataValidade) {
        setErroCupom('Este cupom já expirou.');
        setCupomAplicado(null);
        return;
      }
    }

    if (cupom.valorMinimoPedido && valorTotalCarrinho < cupom.valorMinimoPedido) {
      setErroCupom(`Este cupom só é válido para pedidos acima de R$ ${cupom.valorMinimoPedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      setCupomAplicado(null);
      return;
    }

    setCupomAplicado(cupom);
    setErroCupom(null);
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    setCodigoCupom('');
    setErroCupom(null);
  };

  // Função para chamar o backend e gerar o link real de pagamento no Mercado Pago
  const gerarPreferenciaMercadoPago = async () => {
    setCarregandoPreferencia(true);
    setErroPreferencia(null);

    // Identificar dados do cliente
    let clientInfo = null;
    if (clienteSelecionadoId === 'novo') {
      clientInfo = {
        nome: novoCliente.nome,
        email: novoCliente.email,
        telefone: novoCliente.telefone
      };
    } else {
      const c = clientes.find(item => item.id === clienteSelecionadoId);
      if (c) {
        clientInfo = {
          nome: c.nome,
          email: c.email,
          telefone: c.telefone
        };
      }
    }

    try {
      const response = await fetch('/api/mercado-pago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: carrinho,
          clientInfo,
          subtotal: valorTotalCarrinho,
          discount: valorDesconto,
          shipping: taxaEntrega,
          total: valorFinalTotal
        })
      });

      if (!response.ok) {
        throw new Error('Não foi possível gerar a preferência do Mercado Pago. Erro no servidor de pagamentos.');
      }

      const data = await response.json();
      setPreferenceId(data.id);
      setPreferenceUrl(data.init_point || data.sandbox_init_point);
    } catch (err: any) {
      console.error('Erro na integração do Mercado Pago:', err);
      setErroPreferencia(err.message || 'Erro de conexão com o servidor de pagamento. Tente novamente.');
    } finally {
      setCarregandoPreferencia(false);
    }
  };

  // Cálculo do frete dinâmico
  const taxaEntrega = useMemo(() => {
    if (carrinho.length === 0) return 0;
    if (configuracao.freteGratisMinimo !== undefined && valorTotalCarrinho >= configuracao.freteGratisMinimo) {
      return 0;
    }
    return configuracao.taxaEntregaPadrao;
  }, [carrinho, valorTotalCarrinho, configuracao]);

  // Cálculo do desconto do cupom
  const valorDesconto = useMemo(() => {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === 'porcentagem') {
      return (valorTotalCarrinho * cupomAplicado.valor) / 100;
    } else {
      return Math.min(valorTotalCarrinho, cupomAplicado.valor);
    }
  }, [cupomAplicado, valorTotalCarrinho]);

  // Valor final do pedido
  const valorFinalTotal = useMemo(() => {
    return Math.max(0, valorTotalCarrinho - valorDesconto + taxaEntrega);
  }, [valorTotalCarrinho, valorDesconto, taxaEntrega]);

  const handleCheckout = () => {
    // Avançar para a etapa de identificação / dados de entrega
    if (clientes.length > 0) {
      setClienteSelecionadoId(clientes[0].id);
    } else {
      setClienteSelecionadoId('novo');
    }
    setEtapaCheckout('identificacao');
  };

  const handleConfirmarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (clienteSelecionadoId === 'novo') {
      if (!novoCliente.nome || !novoCliente.email || !novoCliente.telefone || !novoCliente.cidade || !novoCliente.estado) {
        alert('Por favor, preencha todos os campos do novo cliente.');
        return;
      }
    } else {
      if (!clienteSelecionadoId) {
        alert('Selecione um cliente para prosseguir.');
        return;
      }
    }

    if (!enderecoEntrega.trim()) {
      alert('Por favor, preencha o endereço de entrega.');
      return;
    }

    // Avançar para a etapa de pagamento via Mercado Pago!
    setEtapaCheckout('pagamento');
    gerarPreferenciaMercadoPago();
  };

  const handleProcessarPagamentoMercadoPago = () => {
    if (metodoPagamento === 'cartao') {
      if (!numeroCartao || !nomeCartao || !validadeCartao || !cvvCartao) {
        alert('Por favor, preencha todos os campos do cartão de crédito.');
        return;
      }
    }

    setProcessandoPagamento(true);

    // Simular chamada de API do Mercado Pago
    setTimeout(() => {
      setProcessandoPagamento(false);
      setPagamentoAprovado(true);

      // Criar os itens para o pedido no formato esperado
      const itensPedido = carrinho.map(item => ({
        produto: item.produto,
        quantidade: item.quantidade
      }));

      // Executar a criação do pedido real no estado do App
      fazerPedido(
        clienteSelecionadoId,
        itensPedido,
        enderecoEntrega,
        clienteSelecionadoId === 'novo' ? novoCliente : undefined,
        cupomAplicado?.codigo,
        valorDesconto,
        taxaEntrega
      );

      // Finalizar com a tela de sucesso
      setTimeout(() => {
        setCompraFinalizada(true);
        setTimeout(() => {
          limparCarrinho();
          setCompraFinalizada(false);
          setCarrinhoAberto(false);
          // Resetar estados
          setEtapaCheckout('itens');
          setClienteSelecionadoId('');
          setNovoCliente({ nome: '', email: '', telefone: '', cidade: '', estado: '' });
          setEnderecoEntrega('');
          setCupomAplicado(null);
          setCodigoCupom('');
          setErroCupom(null);
          setPagamentoAprovado(false);
          setNumeroCartao('');
          setNomeCartao('');
          setValidadeCartao('');
          setCvvCartao('');
        }, 2000);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Banner da Loja */}
      {configuracao.bannerUrl && (
        <div className="relative h-48 md:h-64 w-full rounded-3xl overflow-hidden shadow-md">
          <img 
            src={configuracao.bannerUrl} 
            alt="Banner da Loja" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/35 to-transparent flex flex-col justify-end p-6 md:p-8">
            <h1 className="font-display font-black text-2xl md:text-4xl text-white tracking-tight">
              {configuracao.nomeLoja}
            </h1>
            <p className="text-slate-200 text-sm max-w-lg mt-1 font-medium">
              {configuracao.descricaoLoja}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Modo de Manutenção */}
      {configuracao.modoManutencao && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 animate-pulse">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <h4 className="font-semibold text-sm">Loja em Modo de Manutenção</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Estamos ajustando nossa plataforma para melhor lhe atender. No momento, o envio de novos pedidos está pausado. Sinta-se à vontade para explorar os produtos.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar de Filtros - Desktop */}
      <aside className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl p-6 self-start shadow-sm sticky top-24">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
          <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
          <h2 className="font-display font-semibold text-lg text-slate-800">Filtros</h2>
        </div>

        {/* Categoria */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Categoria
          </label>
          <div className="flex flex-col gap-1">
            {categorias.map(cat => {
              const catInfo = listaCategorias.find(c => c.nome.toLowerCase() === cat.toLowerCase());
              const emoji = cat === 'Todas' ? '🏷️' : (catInfo?.emoji || '📦');
              return (
                <button
                  key={cat}
                  onClick={() => setFiltros(prev => ({ ...prev, categoria: cat === 'Todas' ? '' : cat }))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                    (cat === 'Todas' && filtros.categoria === '') || filtros.categoria === cat
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span>{cat}</span>
                  </span>
                  {((cat === 'Todas' && filtros.categoria === '') || filtros.categoria === cat) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preço Slider */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Preço Máximo (R$ {filtros.precoMax.toFixed(2)})
          </label>
          <input
            type="range"
            min="0"
            max={limitePrecoMax}
            value={filtros.precoMax}
            onChange={(e) => setFiltros(prev => ({ ...prev, precoMax: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>R$ 0</span>
            <span>R$ {limitePrecoMax}</span>
          </div>
        </div>

        {/* Filtros Booleans */}
        <div className="mb-6 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filtros.apenasDestaque}
              onChange={(e) => setFiltros(prev => ({ ...prev, apenasDestaque: e.target.checked }))}
              className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
              Apenas Destaques ★
            </span>
          </label>
        </div>

        {/* Limpar Filtros */}
        <button
          onClick={() => setFiltros({
            busca: '',
            categoria: '',
            precoMin: 0,
            precoMax: limitePrecoMax,
            apenasDestaque: false,
            ordenarPor: 'nome'
          })}
          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200/60"
        >
          Limpar Filtros
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="lg:col-span-3 space-y-6">
        {/* Barra de Pesquisa e Ordenação */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          {/* Input Busca */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produtos por nome ou descrição..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-3">
            {/* Botão de Filtros Mobile */}
            <button
              onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Filtros
            </button>

            {/* Ordenação */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <select
                value={filtros.ordenarPor}
                onChange={(e) => setFiltros(prev => ({ ...prev, ordenarPor: e.target.value as any }))}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
              >
                <option value="nome">Nome: A-Z</option>
                <option value="preco-crescente">Preço: Menor ao Maior</option>
                <option value="preco-decrescente">Preço: Maior ao Menor</option>
                <option value="avaliacao">Avaliação: Estrelas</option>
              </select>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="relative flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer"
              title="Ver Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItensCarrinho > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {totalItensCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros Mobile Expandido */}
        <AnimatePresence>
          {mostrarFiltrosMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border border-slate-200/80 rounded-2xl p-5 overflow-hidden shadow-md space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Categoria</label>
                <div className="flex flex-wrap gap-1.5">
                  {categorias.map(cat => {
                    const catInfo = listaCategorias.find(c => c.nome.toLowerCase() === cat.toLowerCase());
                    const emoji = cat === 'Todas' ? '🏷️' : (catInfo?.emoji || '📦');
                    return (
                      <button
                        key={cat}
                        onClick={() => setFiltros(prev => ({ ...prev, categoria: cat === 'Todas' ? '' : cat }))}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                          (cat === 'Todas' && filtros.categoria === '') || filtros.categoria === cat
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Preço Máximo (R$ {filtros.precoMax.toFixed(2)})</label>
                <input
                  type="range"
                  min="0"
                  max={limitePrecoMax}
                  value={filtros.precoMax}
                  onChange={(e) => setFiltros(prev => ({ ...prev, precoMax: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filtros.apenasDestaque}
                    onChange={(e) => setFiltros(prev => ({ ...prev, apenasDestaque: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600">Apenas Destaques ★</span>
                </label>

                <button
                  onClick={() => {
                    setFiltros({
                      busca: '',
                      categoria: '',
                      precoMin: 0,
                      precoMax: limitePrecoMax,
                      apenasDestaque: false,
                      ordenarPor: 'nome'
                    });
                    setMostrarFiltrosMobile(false);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  Limpar tudo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de Produtos */}
        {produtosFiltrados.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-display font-semibold text-xl text-slate-800 mb-1">Nenhum produto encontrado</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Experimente ajustar os filtros ou digitar termos de busca menos específicos para encontrar o que procura.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {produtosFiltrados.map(produto => (
              <motion.article
                layout
                id={`produto-card-${produto.id}`}
                key={produto.id}
                className="group bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
              >
                {/* Imagem do Produto */}
                <div className="relative aspect-4/3 bg-slate-50 overflow-hidden group">
                  <img
                    src={produto.imagem || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600'}
                    alt={produto.nome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                      <span>{listaCategorias.find(c => c.nome.toLowerCase() === produto.categoria.toLowerCase())?.emoji || '📦'}</span>
                      <span>{produto.categoria}</span>
                    </span>
                    {produto.destaque && (
                      <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        ★ Destaque
                      </span>
                    )}
                  </div>

                  {/* Stock tag */}
                  <span className={`absolute bottom-3 right-3 px-2 py-0.5 text-[10px] font-medium rounded-md ${
                    produto.estoque > 5 
                      ? 'bg-slate-900/80 text-slate-100' 
                      : produto.estoque > 0 
                      ? 'bg-orange-500/95 text-white' 
                      : 'bg-rose-600/95 text-white'
                  } backdrop-blur-xs`}>
                    {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Esgotado'}
                  </span>
                </div>

                {/* Conteúdo do Produto */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Avaliação */}
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.floor(produto.avaliacao) ? 'fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        {produto.avaliacao.toFixed(1)}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-base text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {produto.nome}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 h-8">
                      {produto.descricao}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Preço</span>
                      <span className="text-lg font-bold text-slate-900">
                        R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setProdutoSelecionado(produto)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all border border-slate-200/60 cursor-pointer"
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        disabled={produto.estoque <= 0}
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Comprar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Produto */}
      <AnimatePresence>
        {produtoSelecionado && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/40 relative flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Imagem Modal */}
              <div className="relative md:w-1/2 bg-slate-50 min-h-[250px] md:min-h-full">
                <img
                  src={produtoSelecionado.imagem || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600'}
                  alt={produtoSelecionado.nome}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover absolute inset-0"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <span className="px-3 py-1 text-xs font-semibold bg-white/95 text-slate-800 rounded-full shadow-md backdrop-blur-sm">
                    {produtoSelecionado.categoria}
                  </span>
                  {produtoSelecionado.destaque && (
                    <span className="px-3 py-1 text-xs font-semibold bg-amber-500 text-white rounded-full shadow-md flex items-center gap-1">
                      ★ Destaque
                    </span>
                  )}
                </div>
              </div>

              {/* Detalhes Modal */}
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto">
                <button
                  onClick={() => setProdutoSelecionado(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center font-bold z-10 text-sm cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4.5 h-4.5 ${
                            i < Math.floor(produtoSelecionado.avaliacao) ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-600">
                      {produtoSelecionado.avaliacao.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-2xl text-slate-800">
                    {produtoSelecionado.nome}
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {produtoSelecionado.descricao}
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Disponibilidade:</span>
                      <span className={`font-semibold ${produtoSelecionado.estoque > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {produtoSelecionado.estoque > 0 ? `${produtoSelecionado.estoque} unidades em estoque` : 'Esgotado'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Código Identificador:</span>
                      <span className="font-mono text-slate-600 text-xs">SKU-{produtoSelecionado.id.padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400 text-sm font-medium">Preço à vista:</span>
                    <span className="text-2xl font-black text-slate-900">
                      R$ {produtoSelecionado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    disabled={produtoSelecionado.estoque <= 0}
                    onClick={() => {
                      adicionarAoCarrinho(produtoSelecionado);
                      setProdutoSelecionado(null);
                    }}
                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Painel do Carrinho Slide-out */}
      <AnimatePresence>
        {carrinhoAberto && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity" onClick={() => setCarrinhoAberto(false)} />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-display font-semibold text-lg text-slate-800">Seu Carrinho</h2>
                  </div>
                  <button
                    onClick={() => setCarrinhoAberto(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Conteúdo ou Checkout de Sucesso */}
                {compraFinalizada ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-slate-800">Pedido Simulado!</h3>
                    <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                      Seu pedido foi processado com sucesso. Como estamos em modo de testes, essa simulação zerou seu carrinho!
                    </p>
                  </div>
                ) : carrinho.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-semibold text-base text-slate-700">Seu carrinho está vazio</h3>
                    <p className="text-slate-400 text-xs max-w-xs">
                      Que tal voltar ao catálogo e escolher alguns produtos inovadores para adicionar à sua simulação?
                    </p>
                    <button
                      onClick={() => setCarrinhoAberto(false)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Continuar Navegando
                    </button>
                  </div>
                ) : (
                  <>
                    {etapaCheckout === 'itens' ? (
                      <>
                        {/* Lista de Itens */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-6">
                          {carrinho.map(item => (
                            <div key={item.produto.id} className="py-4 flex gap-4">
                              <img
                                src={item.produto.imagem}
                                alt={item.produto.nome}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 object-cover rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.produto.nome}</h4>
                                  <p className="text-slate-400 text-xs">{item.produto.categoria}</p>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  {/* Controles de Quantidade */}
                                  <div className="flex items-center gap-2 border border-slate-200/80 rounded-lg p-1 bg-slate-50">
                                    <button
                                      onClick={() => atualizarQuantidadeCarrinho(item.produto.id, item.quantidade - 1)}
                                      className="w-6 h-6 rounded hover:bg-white text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center text-xs cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-semibold text-slate-700 min-w-4 text-center">
                                      {item.quantidade}
                                    </span>
                                    <button
                                      onClick={() => atualizarQuantidadeCarrinho(item.produto.id, item.quantidade + 1)}
                                      disabled={item.quantidade >= item.produto.estoque}
                                      className="w-6 h-6 rounded hover:bg-white disabled:hover:bg-transparent disabled:text-slate-300 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center text-xs cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Preço e Remoção */}
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-800">
                                      R$ {(item.produto.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                      onClick={() => removerDoCarrinho(item.produto.id)}
                                      className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rodapé do Carrinho com Totais e Cupons */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                          
                          {/* Sistema de Cupom */}
                          <div className="border-b border-slate-200/50 pb-4 space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Cupom de Desconto
                            </label>
                            
                            {!cupomAplicado ? (
                              <div className="space-y-1.5">
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="Ex: PROMO10, NATAL50"
                                      value={codigoCupom}
                                      onChange={(e) => {
                                        setCodigoCupom(e.target.value);
                                        setErroCupom(null);
                                      }}
                                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs transition-all uppercase font-semibold"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={aplicarCupom}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                  >
                                    Aplicar
                                  </button>
                                </div>
                                {erroCupom && (
                                  <p className="text-[11px] text-rose-500 font-medium">{erroCupom}</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                    <Percent className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-emerald-800 block uppercase">
                                      {cupomAplicado.codigo}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 block -mt-0.5 font-medium">
                                      Desconto de {cupomAplicado.tipo === 'porcentagem' ? `${cupomAplicado.valor}%` : `R$ ${cupomAplicado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} aplicado!
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={removerCupom}
                                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Detalhe Financeiro */}
                          <div className="space-y-1.5 text-xs text-slate-500 font-medium border-b border-slate-200/50 pb-3">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>R$ {valorTotalCarrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {cupomAplicado && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3.5 h-3.5" /> Desconto ({cupomAplicado.codigo}):
                                </span>
                                <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Frete/Entrega:</span>
                              <span>{taxaEntrega === 0 ? <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider">Grátis</span> : `R$ ${taxaEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                            </div>
                            {configuracao.freteGratisMinimo !== undefined && taxaEntrega > 0 && (
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                Adicione mais R$ {(configuracao.freteGratisMinimo - valorTotalCarrinho).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ter Frete Grátis!
                              </div>
                            )}
                          </div>

                          {/* Valor Final */}
                          <div className="flex justify-between items-baseline py-1">
                            <span className="text-slate-600 font-semibold text-sm">Total a pagar:</span>
                            <span className="text-xl font-extrabold text-slate-900">
                              R$ {valorFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {configuracao.modoManutencao ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-[11px] font-semibold text-amber-800">
                              ⚠️ Pedidos desativados temporariamente (Manutenção)
                            </div>
                          ) : (
                            <button
                              onClick={handleCheckout}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              Finalizar Compra
                            </button>
                          )}
                        </div>
                      </>
                    ) : etapaCheckout === 'identificacao' ? (
                      <form onSubmit={handleConfirmarPedido} className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Formulário de Identificação */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                          <button
                            type="button"
                            onClick={() => setEtapaCheckout('itens')}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Carrinho
                          </button>

                          <div className="space-y-4">
                            <h3 className="font-display font-semibold text-base text-slate-800">1. Identificação do Cliente</h3>
                            
                            {/* Seleção do Cliente */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Selecionar Cliente</label>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                <select
                                  value={clienteSelecionadoId}
                                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all cursor-pointer"
                                >
                                  {clientes.map(cli => (
                                    <option key={cli.id} value={cli.id}>
                                      {cli.nome} ({cli.email})
                                    </option>
                                  ))}
                                  <option value="novo">➕ Cadastrar Novo Cliente...</option>
                                </select>
                              </div>
                            </div>

                            {/* Campos para Novo Cliente */}
                            {clienteSelecionadoId === 'novo' && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Cadastro de Novo Cliente</p>
                                
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Nome completo do cliente"
                                    value={novoCliente.nome}
                                    onChange={(e) => setNovoCliente(prev => ({ ...prev, nome: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required={clienteSelecionadoId === 'novo'}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <input
                                    type="email"
                                    placeholder="Endereço de E-mail"
                                    value={novoCliente.email}
                                    onChange={(e) => setNovoCliente(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required={clienteSelecionadoId === 'novo'}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Telefone de contato"
                                    value={novoCliente.telefone}
                                    onChange={(e) => setNovoCliente(prev => ({ ...prev, telefone: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required={clienteSelecionadoId === 'novo'}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Cidade"
                                    value={novoCliente.cidade}
                                    onChange={(e) => setNovoCliente(prev => ({ ...prev, cidade: e.target.value }))}
                                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required={clienteSelecionadoId === 'novo'}
                                  />
                                  <input
                                    type="text"
                                    placeholder="UF (Estado)"
                                    maxLength={2}
                                    value={novoCliente.estado}
                                    onChange={(e) => setNovoCliente(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required={clienteSelecionadoId === 'novo'}
                                  />
                                </div>
                              </div>
                            )}

                            <h3 className="font-display font-semibold text-base text-slate-800 pt-2">2. Entrega do Pedido</h3>

                            {/* Endereço de Entrega */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Endereço Completo</label>
                              <div className="relative">
                                <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                                <textarea
                                  placeholder="Rua, Número, Bairro, Cidade, Estado e CEP"
                                  value={enderecoEntrega}
                                  onChange={(e) => setEnderecoEntrega(e.target.value)}
                                  rows={3}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rodapé de Confirmação */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4 shrink-0">
                          
                          {/* Resumo Financeiro */}
                          <div className="space-y-1.5 text-xs text-slate-500 font-medium border-b border-slate-200/50 pb-3">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>R$ {valorTotalCarrinho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {cupomAplicado && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3.5 h-3.5" /> Desconto ({cupomAplicado.codigo}):
                                </span>
                                <span>- R$ {valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Frete/Entrega:</span>
                              <span>{taxaEntrega === 0 ? <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider">Grátis</span> : `R$ ${taxaEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-600 font-semibold text-sm">Total a pagar:</span>
                              <span className="text-xl font-extrabold text-slate-900">
                                R$ {valorFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {configuracao.modoManutencao ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-[11px] font-semibold text-amber-800">
                              ⚠️ Pedidos desativados temporariamente (Manutenção)
                            </div>
                          ) : (
                            <button
                              type="submit"
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                              Ir para o Pagamento (Mercado Pago)
                            </button>
                          )}
                        </div>
                      </form>
                    ) : (
                      /* Etapa de Pagamento (Mercado Pago Simulator / Real Integration) */
                      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                        {/* Voltar */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                          <button
                            type="button"
                            onClick={() => setEtapaCheckout('identificacao')}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para Identificação
                          </button>
                        </div>

                        {carregandoPreferencia ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                            <h3 className="font-display font-bold text-slate-800 text-base mb-1">Iniciando Checkout Seguro</h3>
                            <p className="text-slate-400 text-xs max-w-xs">Aguarde enquanto geramos o seu link de pagamento oficial no Mercado Pago...</p>
                          </div>
                        ) : erroPreferencia ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                              <ShieldAlert className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-slate-800 text-base mb-1">Não foi possível conectar ao Mercado Pago</h3>
                              <p className="text-slate-400 text-xs max-w-xs leading-relaxed">{erroPreferencia}</p>
                            </div>
                            <button
                              type="button"
                              onClick={gerarPreferenciaMercadoPago}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
                            >
                              Tentar Novamente
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Banner Mercado Pago */}
                            <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-6 text-white shrink-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-lg text-white">MP</div>
                                  <div>
                                    <h3 className="font-display font-bold text-base">Mercado Pago</h3>
                                    <p className="text-[11px] text-blue-100 font-medium">Pagamento 100% Seguro & Criptografado</p>
                                  </div>
                                </div>
                                <div className="px-2 py-0.5 bg-blue-500/30 text-white text-[10px] font-bold uppercase rounded-md tracking-wider border border-white/20">
                                  Checkout Integrado
                                </div>
                              </div>
                            </div>

                            {/* Corpo do Pagamento */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                              {/* BLOCO CHECKOUT PRO OFICIAL (SUPER RECOMENDADO) */}
                              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 shadow-xs text-center space-y-4">
                                <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  Checkout Pro Oficial (Recomendado)
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed">
                                  Clique no botão abaixo para pagar com total segurança usando <strong>Pix, Cartão de Crédito, Boleto ou Saldo do Mercado Pago</strong>.
                                </p>
                                {preferenceUrl && (
                                  <a
                                    href={preferenceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200/50 items-center justify-center gap-2 cursor-pointer border-b-2 border-blue-800 active:translate-y-[1px] active:border-b-0 text-center"
                                  >
                                    <CreditCard className="w-4.5 h-4.5" />
                                    PAGAR COM MERCADO PAGO OFICIAL 🚀
                                  </a>
                                )}
                                <div className="text-[10px] text-slate-400">
                                  ID da Preferência: <span className="font-mono">{preferenceId}</span>
                                </div>
                              </div>

                              <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Ou finalize localmente</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Escolha como simular</label>
                                <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setMetodoPagamento('pix')}
                                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col gap-1 cursor-pointer ${
                                  metodoPagamento === 'pix'
                                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-semibold text-slate-800 text-sm">Pix</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider">Instantâneo</span>
                                </div>
                                <p className="text-slate-400 text-[11px]">QR Code e código copia e cola</p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setMetodoPagamento('cartao')}
                                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col gap-1 cursor-pointer ${
                                  metodoPagamento === 'cartao'
                                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-semibold text-slate-800 text-sm">Cartão</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase tracking-wider">Até 12x</span>
                                </div>
                                <p className="text-slate-400 text-[11px]">Confirmação instantânea</p>
                              </button>
                            </div>
                          </div>

                          {/* Pix Area */}
                          {metodoPagamento === 'pix' && (
                            <div className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center animate-fade-in">
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">QR Code para Pagamento</p>
                              
                              <div className="relative w-36 h-36 mx-auto bg-slate-100 rounded-2xl border border-slate-200 p-3 flex items-center justify-center overflow-hidden">
                                <div className="grid grid-cols-4 gap-1.5 w-full h-full opacity-80">
                                  {[...Array(16)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`rounded-sm ${(i * 3 + 1) % 4 === 0 || i % 3 === 0 ? 'bg-slate-800' : 'bg-slate-300'}`}
                                    />
                                  ))}
                                </div>
                                <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-lg shadow-indigo-500/50 animate-bounce top-1/2" />
                              </div>

                              <div className="space-y-2 text-left">
                                <label className="block text-xs font-semibold text-slate-400">Código Pix Copia e Cola</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value="00020126580014br.gov.bcb.pix0136rayzergamerspc-mp-checkout-sandbox-0128"
                                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-500 font-mono text-[10px] px-3 py-2 rounded-xl focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136rayzergamerspc-mp-checkout-sandbox-0128");
                                      setPixCopiado(true);
                                      setTimeout(() => setPixCopiado(false), 2000);
                                    }}
                                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                                  >
                                    {pixCopiado ? 'Copiado!' : 'Copiar'}
                                  </button>
                                </div>
                              </div>

                              <div className="pt-2">
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                  Abra o app do seu banco, selecione pagar via Pix QR Code ou Copia e Cola e simule o pagamento abaixo para continuar.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Cartao Area */}
                          {metodoPagamento === 'cartao' && (
                            <div className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs animate-fade-in">
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Dados do Cartão</p>

                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Número do Cartão</label>
                                  <input
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={19}
                                    value={numeroCartao}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                      setNumeroCartao(val);
                                    }}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Nome Impresso no Cartão</label>
                                  <input
                                    type="text"
                                    placeholder="NOME DO TITULAR"
                                    value={nomeCartao}
                                    onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono uppercase"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Validade</label>
                                    <input
                                      type="text"
                                      placeholder="MM/AA"
                                      maxLength={5}
                                      value={validadeCartao}
                                      onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val.length > 2) {
                                          val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                        }
                                        setValidadeCartao(val);
                                      }}
                                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-center"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase">CVV</label>
                                    <input
                                      type="password"
                                      placeholder="123"
                                      maxLength={4}
                                      value={cvvCartao}
                                      onChange={(e) => setCvvCartao(e.target.value.replace(/\D/g, ''))}
                                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-center"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Opções de Parcelamento</label>
                                  <select className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500">
                                    <option value="1">1x de R$ {valorFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                                    <option value="2">2x de R$ {(valorFinalTotal / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                                    <option value="3">3x de R$ {(valorFinalTotal / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                                    <option value="6">6x de R$ {(valorFinalTotal / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                                    <option value="12">12x de R$ {(valorFinalTotal / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Rodapé Mercado Pago */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4 shrink-0 mt-auto">
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-600 font-semibold text-sm">Faturamento Total:</span>
                            <span className="text-xl font-extrabold text-slate-950">
                              R$ {valorFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {processandoPagamento ? (
                            <div className="w-full py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                              Processando pagamento pelo Mercado Pago...
                            </div>
                          ) : pagamentoAprovado ? (
                            <div className="w-full py-3.5 bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 animate-bounce">
                              <CheckCircle className="w-4.5 h-4.5" />
                              Pagamento Aprovado com Sucesso!
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleProcessarPagamentoMercadoPago}
                              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CreditCard className="w-4.5 h-4.5" />
                              {metodoPagamento === 'pix' ? 'Simular Confirmação do Pix' : `Pagar R$ ${valorFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via Mercado Pago`}
                            </button>
                          )}
                        </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
