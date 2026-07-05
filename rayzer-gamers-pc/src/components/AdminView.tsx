import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Plus, 
  Package, 
  PackageX,
  DollarSign, 
  BarChart3, 
  Star, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  FolderTree,
  Check,
  Upload,
  Loader2,
  FileImage,
  Image as ImageIcon,
  Users,
  ShoppingBag,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  AlertTriangle,
  MapPin,
  Calendar,
  UserPlus,
  Search,
  Tag,
  ShieldAlert,
  FileText,
  Printer,
  Download,
  Building,
  Receipt
} from 'lucide-react';
import { Produto, Cliente, Pedido, Categoria, Cupom, ConfiguracaoLoja } from '../types';

interface AdminViewProps {
  produtos: Produto[];
  adicionarProduto: (produto: Omit<Produto, 'id' | 'avaliacao'>) => void;
  removerProduto: (id: string) => void;
  atualizarProduto: (id: string, produtoAtualizado: Produto) => void;
  resetarParaPadrao: () => void;
  clientes: Cliente[];
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'totalPedidos' | 'totalGasto' | 'dataCadastro'>) => void;
  atualizarCliente: (id: string, clienteAtualizado: Cliente) => void;
  removerCliente: (id: string) => void;
  pedidos: Pedido[];
  atualizarStatusPedido: (id: string, status: Pedido['status']) => void;
  removerPedido: (id: string) => void;
  categorias: Categoria[];
  adicionarCategoria: (categoria: Omit<Categoria, 'id'>) => void;
  removerCategoria: (id: string) => void;
  atualizarCategoria: (id: string, categoriaAtualizada: Categoria) => void;
  cupons: Cupom[];
  adicionarCupom: (cupom: Omit<Cupom, 'id' | 'vezesUsado'>) => void;
  atualizarCupom: (id: string, cupomAtualizado: Cupom) => void;
  removerCupom: (id: string) => void;
  configuracao: ConfiguracaoLoja;
  atualizarConfiguracao: (configuracao: ConfiguracaoLoja) => void;
}

export default function AdminView({
  produtos,
  adicionarProduto,
  removerProduto,
  atualizarProduto,
  resetarParaPadrao,
  clientes,
  adicionarCliente,
  atualizarCliente,
  removerCliente,
  pedidos,
  atualizarStatusPedido,
  removerPedido,
  categorias,
  adicionarCategoria,
  removerCategoria,
  atualizarCategoria,
  cupons,
  adicionarCupom,
  atualizarCupom,
  removerCupom,
  configuracao,
  atualizarConfiguracao
}: AdminViewProps) {
  // Estado do Formulário de Adicionar Produto
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    preco: '',
    categoria: 'Eletrônicos',
    descricao: '',
    imagem: '',
    estoque: '10',
    destaque: false
  });

  // Configuração de Imagem e Upload
  const [metodoImagem, setMetodoImagem] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImagem, setPreviewImagem] = useState<string>('');

  const processarArquivo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas arquivos de imagem.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setPreviewImagem(base64String);
            setNovoProduto(prevProd => ({ ...prevProd, imagem: base64String }));
            setUploading(false);
            showNotification('success', 'Imagem processada para upload simulado!');
          };
          reader.readAsDataURL(file);
          return 100;
        }
        return prev + 30;
      });
    }, 120);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processarArquivo(e.target.files[0]);
    }
  };

  // Estado para Edição de Produto
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Mensagens de feedback temporárias
  const [notificacao, setNotificacao] = useState<{ tipo: 'success' | 'info'; mensagem: string } | null>(null);

  const showNotification = (tipo: 'success' | 'info', msg: string) => {
    setNotificacao({ tipo, mensagem: msg });
    setTimeout(() => setNotificacao(null), 3000);
  };


  // Métricas de Negócio / Dashboard Bento
  const totalProdutos = produtos.length;

  const totalEstoque = useMemo(() => {
    return produtos.reduce((acc, p) => acc + p.estoque, 0);
  }, [produtos]);

  const valorTotalPortfolo = useMemo(() => {
    return produtos.reduce((acc, p) => acc + (p.preco * p.estoque), 0);
  }, [produtos]);

  const mediaPrecos = useMemo(() => {
    if (produtos.length === 0) return 0;
    const soma = produtos.reduce((acc, p) => acc + p.preco, 0);
    return soma / produtos.length;
  }, [produtos]);

  // Agrupamento por Categoria para Gráfico Visual de Barras
  const distribuicaoCategorias = useMemo(() => {
    const contagem: Record<string, number> = {};
    produtos.forEach(p => {
      contagem[p.categoria] = (contagem[p.categoria] || 0) + 1;
    });

    return Object.entries(contagem).map(([nome, total]) => ({
      nome,
      total,
      percentual: totalProdutos > 0 ? (total / totalProdutos) * 100 : 0
    }));
  }, [produtos, totalProdutos]);

  const handleSubmeterAdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProduto.nome || !novoProduto.preco) {
      alert('Nome e Preço são obrigatórios!');
      return;
    }

    adicionarProduto({
      nome: novoProduto.nome,
      preco: parseFloat(novoProduto.preco) || 0,
      categoria: novoProduto.categoria,
      descricao: novoProduto.descricao || 'Nenhuma descrição fornecida.',
      imagem: novoProduto.imagem || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600',
      estoque: parseInt(novoProduto.estoque, 10) || 0,
      destaque: novoProduto.destaque
    });

    // Limpar formulário
    setNovoProduto({
      nome: '',
      preco: '',
      categoria: 'Eletrônicos',
      descricao: '',
      imagem: '',
      estoque: '10',
      destaque: false
    });
    setPreviewImagem('');

    showNotification('success', 'Produto adicionado com sucesso ao catálogo!');
  };

  const handleSubmeterEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;

    atualizarProduto(produtoEditando.id, produtoEditando);
    setProdutoEditando(null);
    showNotification('success', 'Produto atualizado com sucesso!');
  };

  // Estado de Sub-Abas do Admin
  const [secaoAtiva, setSecaoAtiva] = useState<'produtos' | 'pedidos' | 'clientes' | 'categorias' | 'cupons' | 'configuracoes'>('produtos');

  // Estados para Pedidos
  const [filtroStatusPedido, setFiltroStatusPedido] = useState<Pedido['status'] | 'Todos'>('Todos');
  const [buscaPedido, setBuscaPedido] = useState('');

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      const matchStatus = filtroStatusPedido === 'Todos' || p.status === filtroStatusPedido;
      const matchBusca = p.id.toLowerCase().includes(buscaPedido.toLowerCase()) || 
                         p.clienteNome.toLowerCase().includes(buscaPedido.toLowerCase()) ||
                         p.clienteEmail.toLowerCase().includes(buscaPedido.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [pedidos, filtroStatusPedido, buscaPedido]);

  // Relatório de Vendas (O que foi vendido)
  const vendasPorProduto = useMemo(() => {
    const contagem: Record<string, { id: string; nome: string; quantidade: number; receita: number; imagem?: string; categoria?: string }> = {};
    pedidos.forEach(p => {
      if (p.status !== 'Cancelado') {
        p.itens.forEach(item => {
          const prod = produtos.find(pr => pr.id === item.produtoId);
          if (!contagem[item.produtoId]) {
            contagem[item.produtoId] = {
              id: item.produtoId,
              nome: item.nome,
              quantidade: 0,
              receita: 0,
              imagem: prod?.imagem,
              categoria: prod?.categoria
            };
          }
          contagem[item.produtoId].quantidade += item.quantidade;
          contagem[item.produtoId].receita += item.preco * item.quantidade;
        });
      }
    });
    return Object.values(contagem).sort((a, b) => b.quantidade - a.quantidade);
  }, [pedidos, produtos]);

  // Estados para Clientes
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: ''
  });
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);

  // Estados para Categorias
  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    emoji: '🏷️',
    descricao: ''
  });
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);

  const handleAdicionarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.nome) {
      alert('O nome da categoria é obrigatório!');
      return;
    }
    if (categorias.some(c => c.nome.toLowerCase() === novaCategoria.nome.trim().toLowerCase())) {
      alert('Já existe uma categoria cadastrada com este nome!');
      return;
    }

    adicionarCategoria({
      nome: novaCategoria.nome.trim(),
      emoji: novaCategoria.emoji,
      descricao: novaCategoria.descricao.trim() || 'Sem descrição fornecida.'
    });

    setNovaCategoria({ nome: '', emoji: '🏷️', descricao: '' });
    setMostrarFormCategoria(false);
    showNotification('success', 'Categoria adicionada com sucesso!');
  };

  const handleSalvarEdicaoCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaEditando) return;
    if (!categoriaEditando.nome) {
      alert('O nome da categoria é obrigatório!');
      return;
    }

    if (categorias.some(c => c.id !== categoriaEditando.id && c.nome.toLowerCase() === categoriaEditando.nome.trim().toLowerCase())) {
      alert('Já existe outra categoria cadastrada com este nome!');
      return;
    }

    atualizarCategoria(categoriaEditando.id, {
      ...categoriaEditando,
      nome: categoriaEditando.nome.trim(),
      descricao: categoriaEditando.descricao?.trim()
    });
    setCategoriaEditando(null);
    showNotification('success', 'Categoria atualizada com sucesso!');
  };

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(c => {
      return c.nome.toLowerCase().includes(buscaCategoria.toLowerCase()) ||
             (c.descricao || '').toLowerCase().includes(buscaCategoria.toLowerCase());
    });
  }, [categorias, buscaCategoria]);


  const handleAdicionarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliente.nome || !novoCliente.email) {
      alert('Nome e E-mail são obrigatórios!');
      return;
    }
    adicionarCliente({
      nome: novoCliente.nome,
      email: novoCliente.email,
      telefone: novoCliente.telefone || 'Não informado',
      cidade: novoCliente.cidade || 'Não informado',
      estado: novoCliente.estado || 'UF'
    });
    setNovoCliente({ nome: '', email: '', telefone: '', cidade: '', estado: '' });
    setMostrarFormCliente(false);
    showNotification('success', 'Cliente cadastrado com sucesso!');
  };

  const handleSalvarEdicaoCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteEditando) return;
    atualizarCliente(clienteEditando.id, clienteEditando);
    setClienteEditando(null);
    showNotification('success', 'Cadastro do cliente atualizado!');
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      return c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
             c.email.toLowerCase().includes(buscaCliente.toLowerCase()) ||
             c.telefone.toLowerCase().includes(buscaCliente.toLowerCase()) ||
             c.cidade.toLowerCase().includes(buscaCliente.toLowerCase());
    });
  }, [clientes, buscaCliente]);

  // Estados para Cupons
  const [novoCupom, setNovoCupom] = useState({
    codigo: '',
    tipo: 'porcentagem' as 'porcentagem' | 'fixo',
    valor: '',
    valorMinimoPedido: '',
    limiteUso: '',
    dataValidade: '',
    ativo: true
  });
  const [cupomEditando, setCupomEditando] = useState<Cupom | null>(null);
  const [buscaCupom, setBuscaCupom] = useState('');
  const [mostrarFormCupom, setMostrarFormCupom] = useState(false);

  const handleAdicionarCupom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCupom.codigo || !novoCupom.valor) {
      alert('Código e Valor são obrigatórios!');
      return;
    }

    if (cupons.some(c => c.codigo.toUpperCase() === novoCupom.codigo.trim().toUpperCase())) {
      alert('Já existe um cupom com este código!');
      return;
    }

    adicionarCupom({
      codigo: novoCupom.codigo.trim().toUpperCase(),
      tipo: novoCupom.tipo,
      valor: parseFloat(novoCupom.valor) || 0,
      valorMinimoPedido: novoCupom.valorMinimoPedido ? parseFloat(novoCupom.valorMinimoPedido) : undefined,
      limiteUso: novoCupom.limiteUso ? parseInt(novoCupom.limiteUso, 10) : undefined,
      dataValidade: novoCupom.dataValidade || undefined,
      ativo: novoCupom.ativo
    });

    setNovoCupom({
      codigo: '',
      tipo: 'porcentagem',
      valor: '',
      valorMinimoPedido: '',
      limiteUso: '',
      dataValidade: '',
      ativo: true
    });
    setMostrarFormCupom(false);
    showNotification('success', 'Cupom promocional adicionado!');
  };

  const handleSalvarEdicaoCupom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupomEditando) return;
    if (!cupomEditando.codigo || !cupomEditando.valor) {
      alert('Código e Valor são obrigatórios!');
      return;
    }

    if (cupons.some(c => c.id !== cupomEditando.id && c.codigo.toUpperCase() === cupomEditando.codigo.trim().toUpperCase())) {
      alert('Já existe outro cupom com este código!');
      return;
    }

    atualizarCupom(cupomEditando.id, {
      ...cupomEditando,
      codigo: cupomEditando.codigo.trim().toUpperCase(),
      valor: parseFloat(String(cupomEditando.valor)) || 0,
      valorMinimoPedido: cupomEditando.valorMinimoPedido ? parseFloat(String(cupomEditando.valorMinimoPedido)) : undefined,
      limiteUso: cupomEditando.limiteUso ? parseInt(String(cupomEditando.limiteUso), 10) : undefined
    });
    setCupomEditando(null);
    showNotification('success', 'Cupom promocional atualizado!');
  };

  const cuponsFiltrados = useMemo(() => {
    return cupons.filter(c => {
      return c.codigo.toLowerCase().includes(buscaCupom.toLowerCase());
    });
  }, [cupons, buscaCupom]);

  // Estados para Configurações da Loja
  const [formConfig, setFormConfig] = useState<ConfiguracaoLoja>({ ...configuracao });
  const [localTaxaEntrega, setLocalTaxaEntrega] = useState<string>(String(configuracao.taxaEntregaPadrao));
  const [localFreteGratis, setLocalFreteGratis] = useState<string>(configuracao.freteGratisMinimo !== undefined ? String(configuracao.freteGratisMinimo) : '');

  // Sincronizar formConfig quando as configurações globais mudarem
  React.useEffect(() => {
    setFormConfig({ ...configuracao });
    setLocalTaxaEntrega(String(configuracao.taxaEntregaPadrao));
    setLocalFreteGratis(configuracao.freteGratisMinimo !== undefined ? String(configuracao.freteGratisMinimo) : '');
  }, [configuracao]);

  const handleSalvarConfiguracao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConfig.nomeLoja.trim()) {
      alert('O nome da loja é obrigatório!');
      return;
    }

    atualizarConfiguracao({
      ...formConfig,
      taxaEntregaPadrao: parseFloat(localTaxaEntrega) || 0,
      freteGratisMinimo: localFreteGratis ? parseFloat(localFreteGratis) : undefined
    });
    showNotification('success', 'Configurações da loja salvas com sucesso!');
  };

  // Estados para Nota Fiscal (NF-e / NFS-e)
  const [pedidoParaNota, setPedidoParaNota] = useState<Pedido | null>(null);
  const [dadosEmitente, setDadosEmitente] = useState({
    razaoSocial: 'RAYZER GAMERS PC LTDA',
    cnpj: '45.123.456/0001-89',
    inscricaoEstadual: '111.222.333.444',
    endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    telefone: '(11) 99999-9999'
  });
  const [dadosDestinatario, setDadosDestinatario] = useState({
    razaoSocial: 'Prefeitura Municipal de São Paulo',
    cnpj: '46.395.000/0001-39',
    inscricaoMunicipal: '8.123.456-7',
    endereco: 'Viaduto do Chá, 15 - Centro, São Paulo - SP',
    email: 'compras@prefeitura.sp.gov.br'
  });
  const [dadosImpostos, setDadosImpostos] = useState({
    aliquotaIcms: 12,
    aliquotaIss: 5,
    aliquotaPis: 1.65,
    aliquotaCofins: 7.6,
    naturezaOperacao: 'Venda de mercadorias destinadas a Administração Pública'
  });

  // Atualizar destinatário quando abrir um pedido
  const abrirGeradorNotaFiscal = (pedido: Pedido) => {
    // Tenta encontrar o cliente para preencher a cidade/estado do destinatário se possível
    const cliente = clientes.find(c => c.id === pedido.clienteId);
    const cidadeDest = cliente?.cidade || 'São Paulo';
    const estadoDest = cliente?.estado || 'SP';
    
    setDadosDestinatario({
      razaoSocial: `Prefeitura Municipal de ${cidadeDest}`,
      cnpj: '46.395.000/0001-39',
      inscricaoMunicipal: '8.123.456-7',
      endereco: pedido.enderecoEntrega || `Viaduto do Chá, 15 - Centro, ${cidadeDest} - ${estadoDest}`,
      email: pedido.clienteEmail || 'compras@prefeitura.gov.br'
    });
    setPedidoParaNota(pedido);
  };

  // Função para baixar a nota fiscal como arquivo HTML completo e independente
  const handleBaixarHTML = () => {
    if (!pedidoParaNota) return;
    
    const numeroNota = String(pedidoParaNota.id).replace(/\D/g, '') || '1001';
    const filename = `nota_fiscal_rayzer_gamers_${numeroNota}.html`;
    
    const subtotal = pedidoParaNota.itens.reduce((acc, it) => acc + (it.preco * it.quantidade), 0);
    const desconto = pedidoParaNota.descontoValor || 0;
    const frete = pedidoParaNota.taxaEntrega || 0;
    const total = pedidoParaNota.valorTotal;
    const baseIcms = total * 0.8;
    const valorIcms = baseIcms * (dadosImpostos.aliquotaIcms / 100);
    const valorIss = total * (dadosImpostos.aliquotaIss / 100);
    const valorPis = total * (dadosImpostos.aliquotaPis / 100);
    const valorCofins = total * (dadosImpostos.aliquotaCofins / 100);
    const totalImpostos = valorIcms + valorIss + valorPis + valorCofins;
    
    const dataEmissaoStr = new Date(pedidoParaNota.dataPedido).toLocaleDateString('pt-BR') + ' ' + new Date(pedidoParaNota.dataPedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const itensHTML = pedidoParaNota.itens.map((it, idx) => `
      <tr style="border-bottom: 1px solid black; font-family: monospace; font-size: 10px;">
        <td style="padding: 4px; text-align: center; border-right: 1px solid black;">${idx + 1}</td>
        <td style="padding: 4px; border-right: 1px solid black; font-family: sans-serif; font-weight: bold; text-transform: uppercase;">${it.nome}</td>
        <td style="padding: 4px; text-align: center; border-right: 1px solid black;">8471.30.12</td>
        <td style="padding: 4px; text-align: center; border-right: 1px solid black;">0102</td>
        <td style="padding: 4px; text-align: center; border-right: 1px solid black;">5102</td>
        <td style="padding: 4px; text-align: center; border-right: 1px solid black; font-family: sans-serif;">UN</td>
        <td style="padding: 4px; text-align: right; border-right: 1px solid black;">${it.quantidade}</td>
        <td style="padding: 4px; text-align: right; border-right: 1px solid black;">R$ ${it.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 4px; text-align: right; border-right: 1px solid black;">R$ ${(it.preco * it.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 4px; text-align: center;">${dadosImpostos.aliquotaIcms}%</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Fiscal Eletrônica nº ${numeroNota} - RAYZER GAMERS PC</title>
  <style>
    body { font-family: sans-serif; background-color: #f1f5f9; padding: 24px; color: black; }
    .no-print-container { max-w-4xl mx-auto bg-white p-6 rounded-lg shadow border border-slate-300 mb-4 flex justify-between items-center; font-family: sans-serif; }
    .btn { px-4 py-2; background-color: #4f46e5; color: white; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; padding: 10px 16px; font-size: 13px; }
    .btn:hover { background-color: #4338ca; }
    .danfe-container { max-w-4xl mx-auto bg-white p-6 border-2 border-black; box-sizing: border-box; }
    .w-full { width: 100%; }
    .table-border { border-collapse: collapse; width: 100%; border: 1px solid black; }
    .table-border th, .table-border td { border: 1px solid black; padding: 4px; font-size: 10px; }
    .header-box { display: grid; grid-template-columns: repeat(12, 1fr); border: 1px solid black; margin-bottom: 8px; }
    .col-4 { grid-span: 4; grid-column: span 4; border-right: 1px solid black; padding: 8px; }
    .col-3 { grid-span: 3; grid-column: span 3; border-right: 1px solid black; padding: 8px; text-align: center; }
    .col-5 { grid-span: 5; grid-column: span 5; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
    .grid-row { display: grid; grid-template-columns: repeat(12, 1fr); border-x: 1px solid black; border-bottom: 1px solid black; font-size: 10px; }
    .grid-col { padding: 4px; }
    .border-r { border-right: 1px solid black; }
    .bg-gray { background-color: #f1f5f9; font-weight: bold; font-size: 8px; padding: 2px 4px; border-bottom: 1px solid black; text-transform: uppercase; }
    .label { font-size: 7px; color: #475569; display: block; font-weight: bold; text-transform: uppercase; }
    .value { font-size: 9px; font-weight: bold; }
    .value-mono { font-family: monospace; font-size: 9px; font-weight: bold; }
    .mono { font-family: monospace; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .uppercase { text-transform: uppercase; }
    .font-bold { font-weight: bold; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    @media print {
      .no-print { display: none !important; }
      body { background-color: white !important; padding: 0 !important; }
      .danfe-container { border: 2px solid black !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-container no-print">
    <div style="text-align: left;">
      <h1 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: bold;">Nota Fiscal Eletrônica nº ${numeroNota}</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Este é um arquivo HTML autônomo gerado por Rayzer Gamers PC. Você pode salvá-lo ou enviá-lo por e-mail.</p>
    </div>
    <button onclick="window.print()" class="btn">🖨️ Imprimir / Gerar PDF Oficial</button>
  </div>

  <div class="danfe-container">
    <!-- CANHOTO -->
    <div style="border-bottom: 2px dashed black; padding-bottom: 12px; margin-bottom: 12px;">
      <table class="w-full" style="border-collapse: collapse; border: 1px solid black;">
        <tr>
          <td style="padding: 8px; font-size: 8px; width: 75%; border-right: 1px solid black; text-transform: uppercase;">
            RECEBEMOS DE <span class="font-bold">${dadosEmitente.razaoSocial}</span> OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA AO LADO.<br>
            <span class="font-bold">DESTINATÁRIO:</span> ${dadosDestinatario.razaoSocial} &nbsp;|&nbsp; <span class="font-bold">ENDEREÇO:</span> ${dadosDestinatario.endereco} &nbsp;|&nbsp; <span class="font-bold">VALOR:</span> R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td style="padding: 8px; text-align: center; width: 25%; font-family: monospace;">
            <strong style="font-size: 11px;">NF-e</strong><br>
            <span style="font-size: 10px; font-weight: bold;">Nº ${numeroNota}</span><br>
            <span style="font-size: 8px;">SÉRIE 1</span>
          </td>
        </tr>
      </table>
      <table class="w-full" style="border-collapse: collapse; border-x: 1px solid black; border-bottom: 1px solid black;">
        <tr style="height: 35px;">
          <td style="width: 30%; border-right: 1px solid black; padding: 4px; font-size: 8px; vertical-align: top;"><span class="label">DATA DE RECEBIMENTO</span></td>
          <td style="width: 70%; padding: 4px; font-size: 8px; vertical-align: top;"><span class="label">ASSINATURA E IDENTIFICAÇÃO DO RECEBEDOR</span></td>
        </tr>
      </table>
      <div style="text-align: center; font-size: 8px; color: #64748b; font-family: monospace; margin-top: 6px; letter-spacing: 2px;" class="no-print">
        ----------------- CORTAR NA LINHA PONTILHADA PARA CONFIRMAÇÃO DE ENTREGA NO ALMOXARIFADO DA PREFEITURA -----------------
      </div>
    </div>

    <!-- CABEÇALHO EMITENTE -->
    <div class="header-box">
      <div class="col-4">
        <span style="font-size: 13px; font-weight: 900; text-transform: uppercase; display: block; line-height: 1.1;">${dadosEmitente.razaoSocial}</span>
        <span style="font-size: 8px; color: #334155; display: block; margin-top: 6px; text-transform: uppercase; line-height: 1.3;">
          ${dadosEmitente.endereco}<br>
          TELEFONE: ${dadosEmitente.telefone}
        </span>
      </div>
      <div class="col-3">
        <strong style="font-size: 12px; display: block; font-weight: 900; letter-spacing: 1px;">DANFE</strong>
        <span style="font-size: 8px; display: block; color: #64748b; margin-bottom: 4px;">Documento Auxiliar da<br>Nota Fiscal Eletrônica</span>
        <div style="display: flex; justify-content: center; gap: 10px; font-size: 8px; margin: 4px 0;">
          <span>0 - Entrada<br>1 - Saída</span>
          <span style="border: 1px solid black; padding: 2px 6px; font-weight: bold; font-family: monospace; font-size: 10px; background-color: #f8fafc;">1</span>
        </div>
        <span style="font-size: 9px; font-weight: bold; display: block;">Nº ${numeroNota}</span>
        <span style="font-size: 8px; display: block;">SÉRIE 1 - FOLHA 1/1</span>
      </div>
      <div class="col-5">
        <div>
          <span class="label">CHAVE DE ACESSO DE CONTROLE</span>
          <span class="value-mono" style="font-size: 9px; tracking: -0.5px;">3526 0745 1234 5600 0189 5500 1000 00${numeroNota} 1505 7404 2441</span>
        </div>
        <div style="border: 1px solid black; padding: 2px; text-align: center; margin: 4px 0; background-color: #f8fafc;">
          <span style="font-size: 7px; color: #94a3b8; display: block; font-weight: bold;">CÓDIGO DE BARRAS DA CHAVE</span>
          <div style="font-family: monospace; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; overflow: hidden; white-space: nowrap;" class="mono uppercase">
            ||||| | || |||| | ||||| | ||| | || |||| || ||| |||| | ||||| | ||| | || ||||
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8px;" class="uppercase">
          <span>Consulta no site da NF-e</span>
          <strong>PROT: 135260008472912</strong>
        </div>
      </div>
    </div>

    <!-- NATUREZA DA OPERAÇÃO -->
    <div class="grid-row" style="border-top: 1px solid black;">
      <div class="grid-col border-r" style="grid-column: span 6;">
        <span class="label">NATUREZA DA OPERAÇÃO</span>
        <span class="value uppercase">${dadosImpostos.naturezaOperacao}</span>
      </div>
      <div class="grid-col border-r" style="grid-column: span 3;">
        <span class="label">INSCRIÇÃO ESTADUAL</span>
        <span class="value-mono">${dadosEmitente.inscricaoEstadual}</span>
      </div>
      <div class="grid-col" style="grid-column: span 3;">
        <span class="label">CNPJ DO EMITENTE</span>
        <span class="value-mono">${dadosEmitente.cnpj}</span>
      </div>
    </div>

    <!-- DESTINATÁRIO -->
    <div style="border: 1px solid black; margin-top: 8px;">
      <div class="bg-gray">DESTINATÁRIO / TOMADOR DE SERVIÇOS</div>
      <div class="grid-row" style="border: none;">
        <div class="grid-col border-r" style="grid-column: span 8; padding: 4px;">
          <span class="label">NOME / RAZÃO SOCIAL</span>
          <span class="value uppercase" style="font-size: 10px;">${dadosDestinatario.razaoSocial}</span>
        </div>
        <div class="grid-col" style="grid-column: span 4; padding: 4px;">
          <span class="label">CNPJ / CPF</span>
          <span class="value-mono">${dadosDestinatario.cnpj}</span>
        </div>
      </div>
      <div class="grid-row" style="border-top: 1px solid black; border-x: none; border-bottom: none;">
        <div class="grid-col border-r" style="grid-column: span 8; padding: 4px;">
          <span class="label">ENDEREÇO DE ENTREGA / ENTREGA DO PC</span>
          <span class="value uppercase">${dadosDestinatario.endereco}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">UF</span>
          <span class="value text-center">SP</span>
        </div>
        <div class="grid-col" style="grid-column: span 2; padding: 4px;">
          <span class="label">INSCRIÇÃO MUNICIPAL</span>
          <span class="value-mono">${dadosDestinatario.inscricaoMunicipal}</span>
        </div>
      </div>
      <div class="grid-row" style="border-top: 1px solid black; border-x: none; border-bottom: none;">
        <div class="grid-col border-r" style="grid-column: span 6; padding: 4px;">
          <span class="label">CONTATO / E-MAIL DE COMPRAS</span>
          <span class="value">${dadosDestinatario.email}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 3; padding: 4px;">
          <span class="label">DATA EMISSÃO</span>
          <span class="value">${new Date(pedidoParaNota.dataPedido).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="grid-col" style="grid-column: span 3; padding: 4px;">
          <span class="label">HORA EMISSÃO</span>
          <span class="value">${new Date(pedidoParaNota.dataPedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>

    <!-- IMPOSTOS -->
    <div style="border: 1px solid black; margin-top: 8px;">
      <div class="bg-gray">CÁLCULO DO IMPOSTO</div>
      <div class="grid-row" style="border: none; text-align: right; background-color: #fbfbfb;">
        <div class="grid-col border-r text-center" style="grid-column: span 1; padding: 4px;">
          <span class="label" style="text-align: left;">BASE CÁLC. ICMS</span>
          <span class="value-mono">R$ ${baseIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">VALOR DO ICMS (${dadosImpostos.aliquotaIcms}%)</span>
          <span class="value-mono">R$ ${valorIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">BASE CÁLC. ICMS ST</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">VALOR DO ICMS ST</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col text-right" style="grid-column: span 5; padding: 4px;">
          <span class="label">VALOR TOTAL DOS PRODUTOS</span>
          <span class="value-mono">R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div class="grid-row" style="border-top: 1px solid black; border-x: none; border-bottom: none; text-align: right; background-color: #fbfbfb;">
        <div class="grid-col border-r text-center" style="grid-column: span 1; padding: 4px;">
          <span class="label" style="text-align: left;">VALOR DO FRETE</span>
          <span class="value-mono">R$ ${frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">VALOR DO SEGURO</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">DESCONTO</span>
          <span class="value-mono">R$ ${desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">OUTRAS DESPESAS</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col text-right" style="grid-column: span 5; padding: 4px; background-color: #f0fdf4;">
          <span class="label" style="color: #15803d; font-weight: bold;">VALOR TOTAL DA NOTA</span>
          <span class="value-mono" style="font-size: 11px; color: #15803d; font-weight: bold;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- TRANSPORTADORA -->
    <div style="border: 1px solid black; margin-top: 8px;">
      <div class="bg-gray">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
      <div class="grid-row" style="border: none;">
        <div class="grid-col border-r" style="grid-column: span 5; padding: 4px;">
          <span class="label">RAZÃO SOCIAL</span>
          <span class="value uppercase">Correios Sedex / Própria</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 3; padding: 4px;">
          <span class="label">FRETE POR CONTA</span>
          <span class="value uppercase">0 - Do Emitente</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 2; padding: 4px;">
          <span class="label">PLACA VEÍCULO</span>
          <span class="value uppercase">MOCK-999</span>
        </div>
        <div class="grid-col" style="grid-column: span 2; padding: 4px;">
          <span class="label">CNPJ / CPF</span>
          <span class="value-mono">${dadosEmitente.cnpj}</span>
        </div>
      </div>
    </div>

    <!-- PRODUTOS -->
    <div style="border: 1px solid black; margin-top: 8px; overflow-x: auto;">
      <div class="bg-gray">DADOS DOS PRODUTOS / SERVIÇOS</div>
      <table class="w-full text-left" style="border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid black; font-weight: bold; text-transform: uppercase; font-size: 8px;">
            <th style="padding: 4px; border-right: 1px solid black; text-align: center;">NUM</th>
            <th style="padding: 4px; border-right: 1px solid black; width: 45%;">DESCRIÇÃO DOS PRODUTOS / HARDWARE</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: center;">NCM</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: center;">CST</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: center;">CFOP</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: center;">UN</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: right;">QTD</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: right;">VALOR UNIT</th>
            <th style="padding: 4px; border-right: 1px solid black; text-align: right;">VALOR TOTAL</th>
            <th style="padding: 4px; text-align: center;">ICMS</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
    </div>

    <!-- ISSQN -->
    <div style="border: 1px solid black; margin-top: 8px;">
      <div class="bg-gray">CÁLCULO DO ISSQN (MUNICÍPIO)</div>
      <div class="grid-row" style="border: none; text-align: right; background-color: #fbfbfb;">
        <div class="grid-col border-r text-left" style="grid-column: span 3; padding: 4px;">
          <span class="label">INSCRIÇÃO MUNICIPAL</span>
          <span class="value-mono">123.456.78</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 3; padding: 4px;">
          <span class="label">VALOR TOTAL DOS SERVIÇOS</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col border-r" style="grid-column: span 3; padding: 4px;">
          <span class="label">BASE DE CÁLCULO ISSQN</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
        <div class="grid-col" style="grid-column: span 3; padding: 4px;">
          <span class="label">VALOR ISSQN (${dadosImpostos.aliquotaIss}%)</span>
          <span class="value-mono">R$ 0,00</span>
        </div>
      </div>
    </div>

    <!-- DADOS ADICIONAIS -->
    <div style="border: 1px solid black; margin-top: 8px; padding: 6px; font-size: 8px; line-height: 1.4;">
      <strong style="font-size: 9px; display: block; border-bottom: 1px solid black; padding-bottom: 2px; margin-bottom: 4px;">INFORMAÇÕES COMPLEMENTARES / OBSERVAÇÕES DE LICITAÇÃO</strong>
      <div class="uppercase">
        1. MERCADORIAS DESTINADAS A SUPRIR AS NECESSIDADES DO ÓRGÃO PÚBLICO MUNICIPAL (PREFEITURA) CONFORME PROCESSO LICITATÓRIO / CONTRATO.<br>
        2. DADOS BANCÁRIOS DE RAYZER GAMERS PC: BANCO DO BRASIL S.A. | AGÊNCIA: 1234-5 | CONTA CORRENTE: 98765-4.<br>
        3. LEI 12.741/2012 - IMPOSTOS FEDERAIS ESTIMADOS: PIS R$ ${(total * (dadosImpostos.aliquotaPis / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | COFINS R$ ${(total * (dadosImpostos.aliquotaCofins / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. TOTAL TRIBUTOS ESTIMADOS DA NOTA: R$ ${totalImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.<br>
        4. DOCUMENTO AUXILIAR DE EMISSÃO FISCAL PARA CONTROLE INTERNO DO CONTRATO ADMINISTRATIVO.
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', 'Nota Fiscal baixada com sucesso em HTML!');
  };

  // Faturamento total de pedidos entregues/enviados
  const faturamentoTotal = useMemo(() => {
    return pedidos
      .filter(p => p.status === 'Entregue' || p.status === 'Enviado')
      .reduce((acc, p) => acc + p.valorTotal, 0);
  }, [pedidos]);

  return (
    <div className="space-y-8">
      {/* Notificação Flutuante */}
      {notificacao && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-sm font-medium">{notificacao.mensagem}</span>
        </div>
      )}

      {/* Header do Painel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800">Painel de Administração</h1>
            <p className="text-slate-500 text-sm">Gerencie o portfólio de produtos, monitore estoques e visualize métricas.</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetarParaPadrao();
            showNotification('info', 'Catálogo e banco de dados restaurados para o padrão!');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 transition-colors text-sm font-medium cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          Restaurar Padrões
        </button>
      </div>

      {/* Abas Administrativas de Segundo Nível */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px scrollbar-none">
        <button
          onClick={() => setSecaoAtiva('produtos')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'produtos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-4.5 h-4.5" />
          Produtos e Estoque ({totalProdutos})
        </button>

        <button
          onClick={() => setSecaoAtiva('pedidos')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'pedidos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          Pedidos Recebidos ({pedidos.length})
        </button>

        <button
          onClick={() => setSecaoAtiva('clientes')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'clientes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Clientes Cadastrados ({clientes.length})
        </button>

        <button
          onClick={() => setSecaoAtiva('categorias')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'categorias'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FolderTree className="w-4.5 h-4.5" />
          Gerenciar Categorias ({categorias.length})
        </button>

        <button
          id="admin-tab-cupons"
          onClick={() => setSecaoAtiva('cupons')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'cupons'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Tag className="w-4.5 h-4.5" />
          Gerenciar Cupons ({cupons.length})
        </button>

        <button
          id="admin-tab-configuracoes"
          onClick={() => setSecaoAtiva('configuracoes')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${
            secaoAtiva === 'configuracoes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          Configurações da Loja
        </button>
      </div>

      {/* Grid Bento de Métricas por Seção */}
      {secaoAtiva === 'produtos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Card 1: Total Produtos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtos Cadastrados</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">{totalProdutos}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Estoque */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidades em Estoque</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">{totalEstoque}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Valor Total de Estoque */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor do Inventário</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {valorTotalPortfolo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Preço Médio */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço Médio</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {mediaPrecos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {secaoAtiva === 'pedidos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Card 1: Total Pedidos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Pedidos</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">{pedidos.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Pedidos Pendentes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedidos Pendentes</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">
                {pedidos.filter(p => p.status === 'Pendente').length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Faturamento Confirmado */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Confirmado</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Ticket Médio por Pedido */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Médio</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {(pedidos.length > 0 ? faturamentoTotal / pedidos.length : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {secaoAtiva === 'clientes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Card 1: Clientes Cadastrados */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clientes Cadastrados</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">{clientes.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Clientes Ativos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compradores Ativos</span>
              <h3 className="font-display font-extrabold text-3xl text-slate-800">
                {clientes.filter(c => c.totalPedidos > 0).length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Receita Acumulada */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gasto Total Acumulado</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {clientes.reduce((acc, c) => acc + c.totalGasto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Gasto Médio por Cliente */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Média por Cliente</span>
              <h3 className="font-display font-extrabold text-2xl text-slate-800">
                R$ {(clientes.length > 0 ? (clientes.reduce((acc, c) => acc + c.totalGasto, 0) / clientes.length) : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE PRODUTOS */}
      {secaoAtiva === 'produtos' && (
        <div className="space-y-8 animate-fade-in">
          {/* Painel de Ajuste Rápido de Frete */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-400" /> Ajuste de Frete Rápido
                </h3>
                <p className="text-slate-400 text-xs">Configure os parâmetros de frete do seu catálogo de forma instantânea sem precisar navegar.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                atualizarConfiguracao({
                  ...formConfig,
                  taxaEntregaPadrao: parseFloat(localTaxaEntrega) || 0,
                  freteGratisMinimo: localFreteGratis ? parseFloat(localFreteGratis) : undefined
                });
                showNotification('success', 'Valores de frete salvos com sucesso!');
              }} className="flex flex-wrap items-end gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                <div className="space-y-1.5 min-w-[140px]">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frete Fixo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={localTaxaEntrega}
                    onChange={(e) => setLocalTaxaEntrega(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white transition-all"
                  />
                </div>

                <div className="space-y-1.5 min-w-[160px]">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frete Grátis Acima de (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sem frete grátis"
                    value={localFreteGratis}
                    onChange={(e) => setLocalFreteGratis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Salvar Frete
                </button>
              </form>
            </div>
          </div>

          {/* Grid Principal: Formulário + Distribuição Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Adicionar Novo Produto */}
        <section className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-lg text-slate-800">Cadastrar Novo Produto</h2>
          </div>

          <form onSubmit={handleSubmeterAdicao} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado Mecânico RGB Wireless"
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>

              {/* Preço */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Ex: 349.90"
                  value={novoProduto.preco}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, preco: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</label>
                <select
                  value={novoProduto.categoria}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white"
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nome}>{cat.emoji} {cat.nome}</option>
                  ))}
                </select>
              </div>

              {/* Estoque */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantidade em Estoque</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 10"
                  value={novoProduto.estoque}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, estoque: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Seletor de Método de Imagem */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Imagem do Produto</label>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setMetodoImagem('upload')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      metodoImagem === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoImagem('url')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      metodoImagem === 'url' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Inserir Link/URL
                  </button>
                </div>
              </div>

              {metodoImagem === 'upload' ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center gap-3 relative cursor-pointer min-h-[150px] ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : previewImagem 
                      ? 'border-slate-300 bg-slate-50/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {uploading ? (
                    <div className="space-y-3 w-full max-w-xs">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">Enviando imagem para o Storage simulado...</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : previewImagem ? (
                    <div className="flex items-center gap-4 w-full">
                      <img src={previewImagem} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-white shadow-xs shrink-0" />
                      <div className="text-left space-y-1 flex-1">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Pronto para salvar</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">Buffer binário de imagem carregado localmente.</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImagem('');
                            setNovoProduto(prev => ({ ...prev, imagem: '' }));
                          }}
                          className="text-[11px] text-rose-500 hover:text-rose-600 font-bold"
                        >
                          Remover e selecionar outra
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center text-slate-400 mx-auto shadow-xs mb-1">
                        <Upload className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Arraste a imagem do produto aqui</p>
                      <p className="text-[11px] text-slate-400">ou clique para procurar no seu computador (PNG, JPG, WEBP)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="Cole aqui o link direto da imagem (Ex: https://images.unsplash.com/...)"
                    value={novoProduto.imagem}
                    onChange={(e) => {
                      setNovoProduto(prev => ({ ...prev, imagem: e.target.value }));
                      setPreviewImagem(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                  />
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição Detalhada</label>
              <textarea
                rows={3}
                placeholder="Insira as principais características técnicas e apelos do produto..."
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
              ></textarea>
            </div>

            {/* Destaque Checkbox */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={novoProduto.destaque}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, destaque: e.target.checked }))}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                    Marcar como Produto em Destaque ★
                  </span>
                  <p className="text-[10px] text-slate-400">Destaques ganham selo especial e destaque no topo do catálogo.</p>
                </div>
              </label>

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
              >
                Cadastrar Produto
              </button>
            </div>
          </form>
        </section>

        {/* Distribuição por Categoria - Gráfico Customizado */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-bold text-lg text-slate-800">Mix por Categoria</h2>
            </div>

            {distribuicaoCategorias.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12">Nenhum produto cadastrado para analisar.</p>
            ) : (
              <div className="space-y-4">
                {distribuicaoCategorias.map(item => (
                  <div key={item.nome} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">{item.nome}</span>
                      <span className="font-mono text-slate-400">
                        {item.total} {item.total === 1 ? 'produto' : 'produtos'} ({item.percentual.toFixed(0)}%)
                      </span>
                    </div>
                    {/* Barra de progresso visual */}
                    <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${item.percentual}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100/30 rounded-xl p-4 mt-6 text-indigo-950 flex items-start gap-3">
            <FolderTree className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold">Diversifique seu estoque</span>
              <p className="text-slate-500 leading-relaxed">
                Manter um mix diversificado de categorias atrai mais nichos de mercado e otimiza a conversão de vendas.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Tabela de Gestão de Produtos Existentes */}
      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          <h2 className="font-display font-bold text-lg text-slate-800">Inventário de Produtos</h2>
        </div>

        {produtos.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            Nenhum produto cadastrado no catálogo. Adicione um acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Imagem</th>
                  <th className="py-4 px-6">Nome do Produto</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Preço</th>
                  <th className="py-4 px-6">Estoque</th>
                  <th className="py-4 px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {produtos.map(p => {
                  const isEditingThis = produtoEditando?.id === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Imagem Miniatura */}
                      <td className="py-4 px-6">
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </td>

                      {/* Nome e Descrição ou Input se editando */}
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={produtoEditando.nome}
                            onChange={(e) => setProdutoEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <div>
                            <span className="font-semibold block">{p.nome}</span>
                            <span className="text-xs text-slate-400 line-clamp-1">{p.descricao}</span>
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-4 px-6">
                        {isEditingThis ? (
                          <select
                            value={produtoEditando.categoria}
                            onChange={(e) => setProdutoEditando(prev => prev ? { ...prev, categoria: e.target.value } : null)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            {categorias.map(cat => (
                              <option key={cat.id} value={cat.nome}>{cat.emoji} {cat.nome}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1.5">
                            <span>{categorias.find(c => c.nome.toLowerCase() === p.categoria.toLowerCase())?.emoji || '📦'}</span>
                            <span>{p.categoria}</span>
                          </span>
                        )}
                      </td>

                      {/* Preço */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {isEditingThis ? (
                          <input
                            type="number"
                            step="0.01"
                            value={produtoEditando.preco}
                            onChange={(e) => setProdutoEditando(prev => prev ? { ...prev, preco: parseFloat(e.target.value) || 0 } : null)}
                            className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          `R$ ${p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </td>

                      {/* Estoque */}
                      <td className="py-4 px-6">
                        {isEditingThis ? (
                          <input
                            type="number"
                            value={produtoEditando.estoque}
                            onChange={(e) => setProdutoEditando(prev => prev ? { ...prev, estoque: parseInt(e.target.value, 10) || 0 } : null)}
                            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className={`font-mono font-semibold ${p.estoque <= 3 ? 'text-rose-500' : 'text-slate-600'}`}>
                            {p.estoque} un
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6">
                        {isEditingThis ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSubmeterEdicao}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => setProdutoEditando(null)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setProdutoEditando({ ...p })}
                              className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </button>
                            {p.estoque > 0 ? (
                              <button
                                onClick={() => {
                                  atualizarProduto(p.id, { ...p, estoque: 0 });
                                  showNotification('info', `Estoque de "${p.nome}" zerado com sucesso.`);
                                }}
                                className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                title="Deixar sem estoque (Zerar)"
                              >
                                <PackageX className="w-4.5 h-4.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const qteStr = prompt(`Quantidade para repor o estoque do produto "${p.nome}":`, "10");
                                  if (qteStr !== null) {
                                    const qte = parseInt(qteStr, 10);
                                    if (!isNaN(qte) && qte > 0) {
                                      atualizarProduto(p.id, { ...p, estoque: qte });
                                      showNotification('success', `Estoque de "${p.nome}" reabastecido com ${qte} unidades.`);
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Repor Estoque"
                              >
                                <Package className="w-4.5 h-4.5 text-emerald-600" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo remover o produto "${p.nome}"?`)) {
                                  removerProduto(p.id);
                                  showNotification('info', `Produto "${p.nome}" removido do catálogo.`);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </div>
      )}

      {/* SEÇÃO DE PEDIDOS */}
      {secaoAtiva === 'pedidos' && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra de Filtros e Busca de Pedidos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-bold text-base text-slate-800">Filtros de Pedidos</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, Cliente ou E-mail..."
                  value={buscaPedido}
                  onChange={(e) => setBuscaPedido(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs animate-none"
                />
              </div>

              <select
                value={filtroStatusPedido}
                onChange={(e) => setFiltroStatusPedido(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-700 font-medium"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Pendente">⏳ Pendentes</option>
                <option value="Processando">⚙️ Processando</option>
                <option value="Enviado">🚚 Enviados</option>
                <option value="Entregue">✅ Entregues</option>
                <option value="Cancelado">❌ Cancelados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Pedidos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {pedidosFiltrados.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                Nenhum pedido encontrado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-4 px-6">ID Pedido</th>
                      <th className="py-4 px-6">Cliente</th>
                      <th className="py-4 px-6">Itens</th>
                      <th className="py-4 px-6">Total</th>
                      <th className="py-4 px-6">Data</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right pr-12">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pedidosFiltrados.map(ped => (
                      <tr key={ped.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-800">{ped.id}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{ped.clienteNome}</div>
                          <div className="text-xs text-slate-400">{ped.clienteEmail}</div>
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="space-y-0.5">
                            {ped.itens.map((it, idx) => (
                              <div key={idx} className="text-xs text-slate-600 flex justify-between gap-4">
                                <span className="truncate">{it.nome}</span>
                                <span className="font-bold shrink-0">x{it.quantidade}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">
                          <div className="font-bold text-slate-900">
                            R$ {ped.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {ped.cupomAplicado && (
                            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5 uppercase">
                              <Tag className="w-2.5 h-2.5" /> {ped.cupomAplicado}
                            </div>
                          )}
                          {ped.descontoValor !== undefined && ped.descontoValor > 0 && (
                            <div className="text-[10px] text-rose-500 font-medium">
                              Desconto: -R$ {ped.descontoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          {ped.taxaEntrega !== undefined && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Frete: {ped.taxaEntrega === 0 ? 'Grátis' : `R$ ${ped.taxaEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(ped.dataPedido).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(ped.dataPedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={ped.status}
                            onChange={(e) => {
                              atualizarStatusPedido(ped.id, e.target.value as any);
                              showNotification('success', `Status do pedido ${ped.id} alterado para ${e.target.value}.`);
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white ${
                              ped.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                              ped.status === 'Processando' ? 'bg-blue-50 text-blue-600 border-blue-200/50' :
                              ped.status === 'Enviado' ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50' :
                              ped.status === 'Entregue' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                              'bg-rose-50 text-rose-600 border-rose-200/50'
                            }`}
                          >
                            <option value="Pendente">⏳ Pendente</option>
                            <option value="Processando">⚙️ Processando</option>
                            <option value="Enviado">🚚 Enviado</option>
                            <option value="Entregue">✅ Entregue</option>
                            <option value="Cancelado">❌ Cancelado</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 pr-6">
                            <button
                              onClick={() => abrirGeradorNotaFiscal(ped)}
                              className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                              title="Gerar Nota Fiscal (Prefeitura)"
                            >
                              <FileText className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                alert(`📍 Endereço de Entrega para o Pedido ${ped.id}:\n\nDestinatário: ${ped.clienteNome}\nEndereço: ${ped.enderecoEntrega}`);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Ver Endereço de Entrega"
                            >
                              <MapPin className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja cancelar e remover o pedido ${ped.id}?`)) {
                                  removerPedido(ped.id);
                                  showNotification('info', `Pedido ${ped.id} removido.`);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover Pedido"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Relatório de Vendas (O que foi vendido) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-800">Relatório de Vendas (Produtos Vendidos)</h2>
                  <p className="text-slate-400 text-xs">Visão geral detalhada de quais produtos foram comprados e faturamento bruto total.</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Total: {vendasPorProduto.reduce((acc, curr) => acc + curr.quantidade, 0)} unidades vendidas
              </div>
            </div>

            {vendasPorProduto.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                Nenhum item vendido ainda. As vendas concluídas aparecerão aqui em tempo real.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-4 px-6">Produto</th>
                      <th className="py-4 px-6">Categoria</th>
                      <th className="py-4 px-6 text-center">Unidades Vendidas</th>
                      <th className="py-4 px-6 text-right">Faturamento Bruto</th>
                      <th className="py-4 px-6 text-right pr-8">Status de Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {vendasPorProduto.map(item => {
                      const prodOriginal = produtos.find(p => p.id === item.id);
                      const estoqueAtual = prodOriginal ? prodOriginal.estoque : 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {item.imagem ? (
                                <img
                                  src={item.imagem}
                                  alt={item.nome}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-slate-800 block">{item.nome}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                              {item.categoria || 'Sem Categoria'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-bold text-slate-800">
                            {item.quantidade} un
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-indigo-600">
                            R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-right pr-8">
                            {estoqueAtual > 0 ? (
                              <div className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-xs text-slate-500">{estoqueAtual} un em estoque</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg uppercase tracking-wide border border-rose-100/50">
                                <PackageX className="w-3 h-3 text-rose-500" /> Esgotado
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO DE CLIENTES */}
      {secaoAtiva === 'clientes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra superior de Clientes */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, e-mail ou telefone..."
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
              />
            </div>

            <button
              onClick={() => {
                setClienteEditando(null);
                setMostrarFormCliente(!mostrarFormCliente);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              <UserPlus className="w-4.5 h-4.5" />
              {mostrarFormCliente ? 'Fechar Formulário' : 'Novo Cliente'}
            </button>
          </div>

          {/* Formulário de Cadastro/Edição de Cliente */}
          {(mostrarFormCliente || clienteEditando) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-base text-slate-800">
                  {clienteEditando ? `Editar Cliente ID #${clienteEditando.id}` : 'Cadastrar Novo Cliente'}
                </h3>
              </div>

              <form onSubmit={clienteEditando ? handleSalvarEdicaoCliente : handleAdicionarCliente} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo"
                    value={clienteEditando ? clienteEditando.nome : novoCliente.nome}
                    onChange={(e) => {
                      if (clienteEditando) {
                        setClienteEditando({ ...clienteEditando, nome: e.target.value });
                      } else {
                        setNovoCliente({ ...novoCliente, nome: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: carlos@email.com"
                    value={clienteEditando ? clienteEditando.email : novoCliente.email}
                    onChange={(e) => {
                      if (clienteEditando) {
                        setClienteEditando({ ...clienteEditando, email: e.target.value });
                      } else {
                        setNovoCliente({ ...novoCliente, email: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={clienteEditando ? clienteEditando.telefone : novoCliente.telefone}
                    onChange={(e) => {
                      if (clienteEditando) {
                        setClienteEditando({ ...clienteEditando, telefone: e.target.value });
                      } else {
                        setNovoCliente({ ...novoCliente, telefone: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={clienteEditando ? clienteEditando.cidade : novoCliente.cidade}
                    onChange={(e) => {
                      if (clienteEditando) {
                        setClienteEditando({ ...clienteEditando, cidade: e.target.value });
                      } else {
                        setNovoCliente({ ...novoCliente, cidade: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Ex: SP"
                    value={clienteEditando ? clienteEditando.estado : novoCliente.estado}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      if (clienteEditando) {
                        setClienteEditando({ ...clienteEditando, estado: val });
                      } else {
                        setNovoCliente({ ...novoCliente, estado: val });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer h-[34px]"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteEditando(null);
                      setMostrarFormCliente(false);
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer h-[34px]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Clientes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                Nenhum cliente cadastrado ou encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Nome</th>
                      <th className="py-4 px-6">Localização</th>
                      <th className="py-4 px-6">Contato</th>
                      <th className="py-4 px-6 text-center">Pedidos</th>
                      <th className="py-4 px-6">Total Gasto</th>
                      <th className="py-4 px-6 text-right pr-12">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {clientesFiltrados.map(cli => (
                      <tr key={cli.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-slate-400">#{cli.id}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{cli.nome}</div>
                          <div className="text-xs text-slate-400">Cadastrado em {new Date(cli.dataCadastro + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                          {cli.cidade} - {cli.estado}
                        </td>
                        <td className="py-4 px-6 text-xs">
                          <div className="text-slate-700 font-medium">{cli.email}</div>
                          <div className="text-slate-400 mt-0.5">{cli.telefone}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-center">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-xs">
                            {cli.totalPedidos}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">
                          R$ {cli.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 pr-6">
                            <button
                              onClick={() => {
                                setClienteEditando(cli);
                                setMostrarFormCliente(false);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Editar Cadastro"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo remover o cliente "${cli.nome}"?`)) {
                                  removerCliente(cli.id);
                                  showNotification('info', `Cliente "${cli.nome}" removido.`);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover Cliente"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÁREA DE CATEGORIAS */}
      {secaoAtiva === 'categorias' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header & Ação de Cadastrar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={buscaCategoria}
                onChange={(e) => setBuscaCategoria(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            <button
              onClick={() => {
                setMostrarFormCategoria(!mostrarFormCategoria);
                setCategoriaEditando(null);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nova Categoria
            </button>
          </div>

          {/* Form de Nova Categoria */}
          <AnimatePresence>
            {mostrarFormCategoria && (
              <motion.section
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs overflow-hidden"
              >
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-display font-bold text-lg text-slate-800">Criar Nova Categoria</h2>
                </div>

                <form onSubmit={handleAdicionarCategoria} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Nome */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome da Categoria</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Headsets, Processadores, Teclados"
                        value={novaCategoria.nome}
                        onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>

                    {/* Emoji */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Emoji Representativo</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          maxLength={4}
                          placeholder="Ex: 🎧"
                          value={novaCategoria.emoji}
                          onChange={(e) => setNovaCategoria(prev => ({ ...prev, emoji: e.target.value }))}
                          className="w-16 text-center px-2 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg font-bold bg-slate-50"
                        />
                        {/* Seletor Rápido de Emojis */}
                        <div className="flex-1 flex flex-wrap gap-1 items-center bg-slate-50 border border-slate-100 rounded-xl p-1.5">
                          {['💻', '🎧', '🔥', '🎒', '👕', '🏠', '⚽', '🎮', '⚙️', '🖥️', '⌨️', '🖱️', '🔌', '🔋', '📦'].map(em => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setNovaCategoria(prev => ({ ...prev, emoji: em }))}
                              className={`w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-white hover:shadow-2xs transition-all cursor-pointer ${
                                novaCategoria.emoji === em ? 'bg-white shadow-2xs border border-indigo-200 text-base scale-110' : ''
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição (Opcional)</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva brevemente que tipo de produtos pertencem a esta categoria..."
                      value={novaCategoria.descricao}
                      onChange={(e) => setNovaCategoria(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
                    />
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMostrarFormCategoria(false)}
                      className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Salvar Categoria
                    </button>
                  </div>
                </form>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Grid de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriasFiltradas.map(cat => {
              const qtdProdutos = produtos.filter(p => p.categoria.toLowerCase() === cat.nome.toLowerCase()).length;
              const isEditing = categoriaEditando?.id === cat.id;

              if (isEditing && categoriaEditando) {
                return (
                  <motion.div
                    layout
                    key={cat.id}
                    className="bg-white border-2 border-indigo-500 rounded-2xl p-5 shadow-md space-y-4"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <span className="text-xl">{categoriaEditando.emoji}</span>
                      <h3 className="font-semibold text-slate-800 text-sm">Editar Categoria</h3>
                    </div>

                    <form onSubmit={handleSalvarEdicaoCategoria} className="space-y-3.5">
                      {/* Nome */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                        <input
                          type="text"
                          required
                          value={categoriaEditando.nome}
                          onChange={(e) => setCategoriaEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Emoji */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Emoji</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={categoriaEditando.emoji}
                            onChange={(e) => setCategoriaEditando(prev => prev ? { ...prev, emoji: e.target.value } : null)}
                            className="w-12 text-center py-1.5 border border-slate-200 rounded-lg text-base font-bold bg-slate-50"
                          />
                          <div className="flex-1 flex flex-wrap gap-1 items-center bg-slate-50 rounded-lg p-1 border border-slate-100 overflow-x-auto">
                            {['💻', '🎧', '🔥', '🎒', '👕', '🏠', '⚽', '🎮', '⚙️', '🖥️', '⌨️', '🖱️', '📦'].map(em => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => setCategoriaEditando(prev => prev ? { ...prev, emoji: em } : null)}
                                className="w-6 h-6 flex items-center justify-center text-xs rounded-md hover:bg-white hover:shadow-2xs transition-all cursor-pointer"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                        <textarea
                          rows={2}
                          value={categoriaEditando.descricao || ''}
                          onChange={(e) => setCategoriaEditando(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>

                      {/* Ações */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setCategoriaEditando(null)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Salvar
                        </button>
                      </div>
                    </form>
                  </motion.div>
                );
              }

              return (
                <motion.article
                  layout
                  key={cat.id}
                  className="bg-white border border-slate-200/80 hover:border-indigo-100 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Emoji Badge & Product Count */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-2xl shadow-2xs group-hover:bg-indigo-50 group-hover:scale-105 transition-all duration-300">
                        {cat.emoji}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        qtdProdutos > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        {qtdProdutos} {qtdProdutos === 1 ? 'produto' : 'produtos'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                        {cat.nome}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                        {cat.descricao || 'Sem descrição cadastrada.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setCategoriaEditando(cat);
                        setMostrarFormCategoria(false);
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (qtdProdutos > 0) {
                          alert(`Não é possível remover a categoria "${cat.nome}" pois ela contém ${qtdProdutos} produto(s) associado(s). Por favor, reatribua os produtos para outra categoria primeiro.`);
                          return;
                        }
                        if (confirm(`Deseja mesmo remover a categoria "${cat.nome}"?`)) {
                          removerCategoria(cat.id);
                          showNotification('info', `Categoria "${cat.nome}" removida.`);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Remover Categoria"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {categoriasFiltradas.length === 0 && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-2xs">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-xl text-slate-800 mb-1">Nenhuma categoria encontrada</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Experimente ajustar o termo de busca ou crie uma nova categoria utilizando o botão acima.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seção de Cupons Promocionais */}
      {secaoAtiva === 'cupons' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header da Seção */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cupom por código..."
                value={buscaCupom}
                onChange={(e) => setBuscaCupom(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>
            <button
              onClick={() => {
                setMostrarFormCupom(!mostrarFormCupom);
                setCupomEditando(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Cupom
            </button>
          </div>

          {/* Form para Adicionar Novo Cupom */}
          <AnimatePresence>
            {mostrarFormCupom && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
              >
                <form onSubmit={handleAdicionarCupom} className="p-6 space-y-5">
                  <h3 className="font-display font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">
                    Criar Novo Cupom Promocional
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Código */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Código do Cupom</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: PROMO10, NATAL30"
                        value={novoCupom.codigo}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all uppercase font-bold"
                      />
                    </div>

                    {/* Tipo */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo de Desconto</label>
                      <select
                        value={novoCupom.tipo}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, tipo: e.target.value as 'porcentagem' | 'fixo' }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white cursor-pointer"
                      >
                        <option value="porcentagem">Porcentagem (%)</option>
                        <option value="fixo">Valor Fixo (R$)</option>
                      </select>
                    </div>

                    {/* Valor */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Valor do Desconto {novoCupom.tipo === 'porcentagem' ? '(%)' : '(R$)'}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder={novoCupom.tipo === 'porcentagem' ? 'Ex: 15' : 'Ex: 50'}
                        value={novoCupom.valor}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, valor: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Valor Mínimo */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor Mínimo do Pedido (Opcional)</label>
                      <input
                        type="number"
                        placeholder="Ex: 100"
                        value={novoCupom.valorMinimoPedido}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, valorMinimoPedido: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>

                    {/* Limite de Usos */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Limite de Usos (Opcional)</label>
                      <input
                        type="number"
                        placeholder="Ex: 50"
                        value={novoCupom.limiteUso}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, limiteUso: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>

                    {/* Data Validade */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Data de Validade (Opcional)</label>
                      <input
                        type="date"
                        value={novoCupom.dataValidade}
                        onChange={(e) => setNovoCupom(prev => ({ ...prev, dataValidade: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ativo Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="novo-cupom-ativo"
                      checked={novoCupom.ativo}
                      onChange={(e) => setNovoCupom(prev => ({ ...prev, ativo: e.target.checked }))}
                      className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="novo-cupom-ativo" className="text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none">
                      Cupom Ativo (Pronto para Uso)
                    </label>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMostrarFormCupom(false)}
                      className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Criar Cupom
                    </button>
                  </div>
                </form>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Grid de Cupons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuponsFiltrados.map(cupom => {
              const isEditing = cupomEditando?.id === cupom.id;
              
              if (isEditing && cupomEditando) {
                return (
                  <motion.div
                    layout
                    key={cupom.id}
                    className="bg-white border-2 border-indigo-500 rounded-2xl p-5 shadow-md space-y-4"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Tag className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-slate-800 text-sm">Editar Cupom</h3>
                    </div>

                    <form onSubmit={handleSalvarEdicaoCupom} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Código</label>
                        <input
                          type="text"
                          required
                          value={cupomEditando.codigo}
                          onChange={(e) => setCupomEditando(prev => prev ? { ...prev, codigo: e.target.value.toUpperCase() } : null)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                          <select
                            value={cupomEditando.tipo}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, tipo: e.target.value as 'porcentagem' | 'fixo' } : null)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                          >
                            <option value="porcentagem">Porcentagem (%)</option>
                            <option value="fixo">Valor Fixo (R$)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor</label>
                          <input
                            type="number"
                            required
                            value={cupomEditando.valor}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, valor: e.target.value } : null)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Min Pedido</label>
                          <input
                            type="number"
                            placeholder="Nenhum"
                            value={cupomEditando.valorMinimoPedido || ''}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, valorMinimoPedido: e.target.value ? parseFloat(e.target.value) : undefined } : null)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Limite Usos</label>
                          <input
                            type="number"
                            placeholder="Sem limite"
                            value={cupomEditando.limiteUso || ''}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, limiteUso: e.target.value ? parseInt(e.target.value, 10) : undefined } : null)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Data Validade</label>
                          <input
                            type="date"
                            value={cupomEditando.dataValidade || ''}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, dataValidade: e.target.value } : null)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-4">
                          <input
                            type="checkbox"
                            id="edit-cupom-ativo"
                            checked={cupomEditando.ativo}
                            onChange={(e) => setCupomEditando(prev => prev ? { ...prev, ativo: e.target.checked } : null)}
                            className="cursor-pointer"
                          />
                          <label htmlFor="edit-cupom-ativo" className="text-[10px] font-bold text-slate-500 uppercase select-none cursor-pointer">
                            Ativo
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setCupomEditando(null)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Salvar
                        </button>
                      </div>
                    </form>
                  </motion.div>
                );
              }

              return (
                <motion.article
                  layout
                  key={cupom.id}
                  className="bg-white border border-slate-200/80 hover:border-indigo-100 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Código Cupom & Status */}
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-1.5 shadow-2xs">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-mono font-bold text-sm text-indigo-800 tracking-wider uppercase">
                          {cupom.codigo}
                        </span>
                      </div>
                      
                      {/* Active Status toggle row */}
                      <button
                        onClick={() => {
                          atualizarCupom(cupom.id, { ...cupom, ativo: !cupom.ativo });
                          showNotification('success', `Cupom ${cupom.codigo} ${cupom.ativo ? 'desativado' : 'ativado'}!`);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                          cupom.ativo 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-150'
                        }`}
                      >
                        {cupom.ativo ? '● Ativo' : '○ Inativo'}
                      </button>
                    </div>

                    {/* Informações de Desconto */}
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">
                        {cupom.tipo === 'porcentagem' ? `${cupom.valor}% OFF` : `R$ ${cupom.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} OFF`}
                      </h3>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-0.5">
                        {cupom.tipo === 'porcentagem' ? 'Desconto percentual' : 'Desconto em valor fixo'}
                      </p>
                    </div>

                    {/* Parâmetros do Cupom */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80 text-[11px] text-slate-500">
                      <div>
                        <span className="text-slate-400 block font-medium">Uso atual:</span>
                        <span className="font-semibold text-slate-700">
                          {cupom.vezesUsado} {cupom.limiteUso ? `de ${cupom.limiteUso}` : 'usos'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Mín. Pedido:</span>
                        <span className="font-semibold text-slate-700">
                          {cupom.valorMinimoPedido ? `R$ ${cupom.valorMinimoPedido.toLocaleString('pt-BR')}` : 'Sem mínimo'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-medium">Validade:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {cupom.dataValidade ? new Date(cupom.dataValidade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem expiração'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setCupomEditando(cupom);
                        setMostrarFormCupom(false);
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                      title="Editar Cupom"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja mesmo remover o cupom "${cupom.codigo}"?`)) {
                          removerCupom(cupom.id);
                          showNotification('info', `Cupom "${cupom.codigo}" removido.`);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Remover Cupom"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {cuponsFiltrados.length === 0 && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-2xs">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-xl text-slate-800 mb-1">Nenhum cupom encontrado</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Crie seu primeiro cupom promocional clicando no botão acima para atrair mais vendas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seção de Configurações da Loja */}
      {secaoAtiva === 'configuracoes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Status de Manutenção se ativo */}
          {formConfig.modoManutencao && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <h4 className="font-semibold text-sm">Aviso de Modo de Manutenção</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Os clientes poderão navegar e ver os itens no catálogo, mas o envio de pedidos e criação de ordens de pagamento estará desativado até você desmarcar esta opção.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
            <form onSubmit={handleSalvarConfiguracao} className="space-y-6">
              
              <div className="border-b border-slate-150 pb-4">
                <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> Configurações Gerais da Loja
                </h3>
                <p className="text-slate-400 text-xs mt-1">Gerencie a identidade, as taxas de frete e o comportamento do seu catálogo digital.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dados Principais */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Identidade Visual & Nome</h4>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Nome da Loja</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vanguard Digital"
                      value={formConfig.nomeLoja}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, nomeLoja: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Slogan / Descrição Curta</label>
                    <input
                      type="text"
                      placeholder="Ex: Seu catálogo eletrônico preferido"
                      value={formConfig.descricaoLoja}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, descricaoLoja: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">URL do Banner Principal</label>
                    <input
                      type="text"
                      placeholder="Ex: https://images.unsplash.com/photo-..."
                      value={formConfig.bannerUrl}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, bannerUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs transition-all font-mono"
                    />
                    {formConfig.bannerUrl && (
                      <div className="h-16 w-full rounded-lg overflow-hidden border border-slate-100 bg-slate-50 mt-1">
                        <img src={formConfig.bannerUrl} referrerPolicy="no-referrer" alt="Prévia" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Parâmetros de Entrega & Moeda */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Logística e Fretes</h4>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Símbolo Monetário</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="Ex: R$"
                      value={formConfig.moeda}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, moeda: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Frete Padrão (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Ex: 15.00"
                        value={localTaxaEntrega}
                        onChange={(e) => setLocalTaxaEntrega(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Frete Grátis acima de (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 150.00"
                        value={localFreteGratis}
                        onChange={(e) => setLocalFreteGratis(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 pt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Modo Operacional Especial</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="form-modo-manutencao"
                        checked={formConfig.modoManutencao}
                        onChange={(e) => setFormConfig(prev => ({ ...prev, modoManutencao: e.target.checked }))}
                        className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="form-modo-manutencao" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                        Ativar Modo de Manutenção
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Isso avisa os usuários na página principal de que a loja está inativa temporariamente, impedindo a submissão de novos pedidos.
                    </p>
                  </div>
                </div>

              </div>

              {/* Botão de Submeter Configuração */}
              <div className="flex justify-end pt-4 border-t border-slate-150">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Save className="w-4.5 h-4.5" />
                  Salvar Todas as Configurações
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL GERADOR DE NOTA FISCAL (DANFE / PREFEITURA) */}
      <AnimatePresence>
        {pedidoParaNota && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 overflow-y-auto no-print flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header do Modal */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-display font-bold text-base">Gerador de Nota Fiscal Eletrônica (NF-e / DANFE)</h3>
                    <p className="text-xs text-slate-400">Emissão de notas fiscais para licitações e vendas para a Prefeitura</p>
                  </div>
                </div>
                <button
                  onClick={() => setPedidoParaNota(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer animate-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Corpo do Modal - Grid Duplo */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
                {/* LADO ESQUERDO: CONFIGURADOR DA NOTA */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Bloco 1: Emitente */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Dados do Emitente (Sua Loja)</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">Razão Social</label>
                        <input
                          type="text"
                          value={dadosEmitente.razaoSocial}
                          onChange={(e) => setDadosEmitente(prev => ({ ...prev, razaoSocial: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">CNPJ</label>
                          <input
                            type="text"
                            value={dadosEmitente.cnpj}
                            onChange={(e) => setDadosEmitente(prev => ({ ...prev, cnpj: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Inc. Estadual</label>
                          <input
                            type="text"
                            value={dadosEmitente.inscricaoEstadual}
                            onChange={(e) => setDadosEmitente(prev => ({ ...prev, inscricaoEstadual: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">Endereço Comercial</label>
                        <input
                          type="text"
                          value={dadosEmitente.endereco}
                          onChange={(e) => setDadosEmitente(prev => ({ ...prev, endereco: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Destinatário */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Dados do Destinatário (Prefeitura)</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">Razão Social / Órgão Público</label>
                        <input
                          type="text"
                          value={dadosDestinatario.razaoSocial}
                          onChange={(e) => setDadosDestinatario(prev => ({ ...prev, razaoSocial: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">CNPJ do Tomador</label>
                          <input
                            type="text"
                            value={dadosDestinatario.cnpj}
                            onChange={(e) => setDadosDestinatario(prev => ({ ...prev, cnpj: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Inscr. Municipal</label>
                          <input
                            type="text"
                            value={dadosDestinatario.inscricaoMunicipal}
                            onChange={(e) => setDadosDestinatario(prev => ({ ...prev, inscricaoMunicipal: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">Endereço de Entrega / Órgão</label>
                        <input
                          type="text"
                          value={dadosDestinatario.endereco}
                          onChange={(e) => setDadosDestinatario(prev => ({ ...prev, endereco: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">E-mail para Envio do XML/Nota</label>
                        <input
                          type="email"
                          value={dadosDestinatario.email}
                          onChange={(e) => setDadosDestinatario(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Impostos e Natureza */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Alíquotas de Impostos & Natureza</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase">Natureza da Operação</label>
                        <input
                          type="text"
                          value={dadosImpostos.naturezaOperacao}
                          onChange={(e) => setDadosImpostos(prev => ({ ...prev, naturezaOperacao: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Alíquota ICMS (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={dadosImpostos.aliquotaIcms}
                            onChange={(e) => setDadosImpostos(prev => ({ ...prev, aliquotaIcms: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Alíquota ISS (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={dadosImpostos.aliquotaIss}
                            onChange={(e) => setDadosImpostos(prev => ({ ...prev, aliquotaIss: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Alíquota PIS (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={dadosImpostos.aliquotaPis}
                            onChange={(e) => setDadosImpostos(prev => ({ ...prev, aliquotaPis: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-semibold uppercase">Alíquota COFINS (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={dadosImpostos.aliquotaCofins}
                            onChange={(e) => setDadosImpostos(prev => ({ ...prev, aliquotaCofins: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LADO DIREITO: ESPELHO FISCAL DANFE */}
                <div className="lg:col-span-7 flex flex-col space-y-4">
                  <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold">
                    <span>Espelho da Nota Fiscal (Papel A4)</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBaixarHTML}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                        title="Baixar Arquivo HTML Independente para envio"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Baixar em HTML
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Imprimir ou Salvar como PDF Oficial"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir / PDF
                      </button>
                    </div>
                  </div>

                  {/* Espelho Fisico Impresso (DANFE) */}
                  <div
                    id="printable-danfe"
                    className="bg-white border border-slate-300 p-6 rounded-lg text-black font-sans text-[10px] leading-tight space-y-3 max-w-full shadow-md overflow-x-auto"
                  >
                    {/* Canhoto de Entrega */}
                    <div className="border border-black p-1.5 space-y-1.5">
                      <div className="flex border-b border-black divide-x divide-black">
                        <div className="w-3/4 p-1 text-[8px] uppercase">
                          RECEBEMOS DE <span className="font-bold">{dadosEmitente.razaoSocial}</span> OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA AO LADO. EMISSÃO: {new Date(pedidoParaNota.dataPedido).toLocaleDateString('pt-BR')} - DESTINATÁRIO: {dadosDestinatario.razaoSocial} - VALOR TOTAL: R$ {pedidoParaNota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="w-1/4 p-1 text-center flex flex-col justify-center">
                          <strong className="text-[10px]">NF-e</strong>
                          <span className="font-mono text-[9px] font-bold">Nº {String(pedidoParaNota.id).replace(/\D/g, '') || '1001'}</span>
                          <span className="text-[8px]">SÉRIE 1</span>
                        </div>
                      </div>
                      <div className="flex divide-x divide-black h-8 items-end">
                        <div className="w-1/3 p-1 text-[8px]"><span className="text-[6px] font-bold text-slate-500 block">DATA DE RECEBIMENTO</span></div>
                        <div className="w-2/3 p-1 text-[8px]"><span className="text-[6px] font-bold text-slate-500 block">ASSINATURA E IDENTIFICAÇÃO DO RECEBEDOR</span></div>
                      </div>
                      <div className="text-center text-[8px] text-slate-500 tracking-wider font-mono select-none border-t border-dashed border-slate-300 pt-1">
                        ----------------- CORTAR NA LINHA PONTILHADA PARA CONFIRMAÇÃO DE ENTREGA NO ALMOXARIFADO DA PREFEITURA -----------------
                      </div>
                    </div>

                    {/* Quadro Emitente / DANFE */}
                    <div className="grid grid-cols-12 border border-black divide-x divide-black">
                      <div className="col-span-4 p-2 flex flex-col justify-center">
                        <span className="font-extrabold text-[12px] uppercase tracking-tight block leading-tight">{dadosEmitente.razaoSocial}</span>
                        <span className="text-[8px] text-slate-600 mt-1 uppercase leading-tight">
                          {dadosEmitente.endereco}<br />
                          Telefone: {dadosEmitente.telefone}
                        </span>
                      </div>
                      <div className="col-span-3 p-2 text-center flex flex-col justify-center space-y-0.5">
                        <strong className="text-[11px] block tracking-wide font-extrabold">DANFE</strong>
                        <span className="text-[8px] block leading-normal text-slate-500 uppercase">Documento Auxiliar da<br />Nota Fiscal Eletrônica</span>
                        <div className="flex justify-center gap-3 text-[9px] font-bold py-0.5">
                          <span>0 - Entrada<br />1 - Saída</span>
                          <span className="border border-black px-1.5 py-0.5 font-mono text-[10px] bg-slate-50">1</span>
                        </div>
                        <span className="text-[9px] font-bold block">Nº {String(pedidoParaNota.id).replace(/\D/g, '') || '1001'}</span>
                        <span className="text-[8px] block font-mono">SÉRIE 1 - FOLHA 1/1</span>
                      </div>
                      <div className="col-span-5 p-2 flex flex-col justify-between space-y-1">
                        <div>
                          <span className="text-[7px] text-slate-500 font-bold block uppercase">CHAVE DE ACESSO DE CONTROLE</span>
                          <span className="font-mono text-[9px] font-bold tracking-tight block">3526 0745 1234 5600 0189 5500 1000 00{String(pedidoParaNota.id).replace(/\D/g, '') || '1001'} 1505 7404 2441</span>
                        </div>
                        <div className="border border-black p-1 text-center bg-slate-50/50">
                          <span className="text-[7px] text-slate-400 font-semibold block">CÓDIGO DE BARRAS DA CHAVE</span>
                          <div className="font-mono text-[11px] font-bold tracking-widest text-slate-700 py-0.5 select-none overflow-hidden whitespace-nowrap">
                            ||||| | || |||| | ||||| | ||| | || |||| || ||| |||| | ||||| | ||| | || ||||
                          </div>
                        </div>
                        <div className="text-[8px] border-t border-slate-100 pt-0.5 flex justify-between uppercase">
                          <span>Autenticação no site da NF-e</span>
                          <strong>PROT. AUTO.: 135260008472912</strong>
                        </div>
                      </div>
                    </div>

                    {/* Natureza e Cadastros */}
                    <div className="grid grid-cols-12 border-x border-b border-black divide-x divide-black text-[9px]">
                      <div className="col-span-6 p-1">
                        <strong className="block text-[7px] text-slate-500">NATUREZA DA OPERAÇÃO</strong>
                        <span className="font-semibold uppercase">{dadosImpostos.naturezaOperacao}</span>
                      </div>
                      <div className="col-span-3 p-1">
                        <strong className="block text-[7px] text-slate-500">INSCRIÇÃO ESTADUAL</strong>
                        <span className="font-mono font-semibold">{dadosEmitente.inscricaoEstadual}</span>
                      </div>
                      <div className="col-span-3 p-1">
                        <strong className="block text-[7px] text-slate-500">CNPJ</strong>
                        <span className="font-mono font-semibold">{dadosEmitente.cnpj}</span>
                      </div>
                    </div>

                    {/* Bloco Destinatário */}
                    <div className="border border-black">
                      <div className="bg-slate-100 p-0.5 border-b border-black font-extrabold text-[8px] uppercase tracking-wide">DESTINATÁRIO / TOMADOR DE SERVIÇOS</div>
                      <div className="grid grid-cols-12 divide-x divide-black text-[9px]">
                        <div className="col-span-8 p-1">
                          <strong className="block text-[7px] text-slate-500">NOME / RAZÃO SOCIAL (PREFEITURA OU ÓRGÃO)</strong>
                          <span className="font-bold uppercase">{dadosDestinatario.razaoSocial}</span>
                        </div>
                        <div className="col-span-4 p-1">
                          <strong className="block text-[7px] text-slate-500">CNPJ / CPF</strong>
                          <span className="font-mono font-semibold">{dadosDestinatario.cnpj}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 border-t border-black divide-x divide-black text-[9px]">
                        <div className="col-span-8 p-1">
                          <strong className="block text-[7px] text-slate-500">ENDEREÇO DE DESTINO (ENTREGA)</strong>
                          <span className="font-semibold">{dadosDestinatario.endereco}</span>
                        </div>
                        <div className="col-span-2 p-1">
                          <strong className="block text-[7px] text-slate-500">UF</strong>
                          <span className="font-semibold">SP</span>
                        </div>
                        <div className="col-span-2 p-1">
                          <strong className="block text-[7px] text-slate-500">INSCRIÇÃO MUNICIPAL</strong>
                          <span className="font-mono font-semibold">{dadosDestinatario.inscricaoMunicipal}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 border-t border-black divide-x divide-black text-[9px]">
                        <div className="col-span-6 p-1">
                          <strong className="block text-[7px] text-slate-500">CONTATO / E-MAIL DE COMPRAS</strong>
                          <span className="font-semibold">{dadosDestinatario.email}</span>
                        </div>
                        <div className="col-span-3 p-1">
                          <strong className="block text-[7px] text-slate-500">DATA EMISSÃO</strong>
                          <span>{new Date(pedidoParaNota.dataPedido).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="col-span-3 p-1">
                          <strong className="block text-[7px] text-slate-500">HORA EMISSÃO</strong>
                          <span>{new Date(pedidoParaNota.dataPedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco Totais de Impostos */}
                    <div className="border border-black">
                      <div className="bg-slate-100 p-0.5 border-b border-black font-extrabold text-[8px] uppercase tracking-wide">CÁLCULO DO IMPOSTO DE VENDA</div>
                      <div className="grid grid-cols-5 divide-x divide-black text-[9px] text-right font-mono border-b border-black bg-slate-50/20">
                        <div className="p-1 text-left">
                          <strong className="block text-[7px] text-slate-500 font-sans">BASE CÁLC. ICMS</strong>
                          R$ {(pedidoParaNota.valorTotal * 0.8).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR DO ICMS ({dadosImpostos.aliquotaIcms}%)</strong>
                          R$ {(pedidoParaNota.valorTotal * 0.8 * (dadosImpostos.aliquotaIcms / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">BASE CÁLC. ICMS ST</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR DO ICMS ST</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans font-bold">VALOR TOTAL PRODUTOS</strong>
                          R$ {pedidoParaNota.itens.reduce((acc, it) => acc + (it.preco * it.quantidade), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 divide-x divide-black text-[9px] text-right font-mono bg-slate-50/20">
                        <div className="p-1 text-left">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR DO FRETE</strong>
                          R$ {(pedidoParaNota.taxaEntrega || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR DO SEGURO</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">DESCONTO APLICADO</strong>
                          R$ {(pedidoParaNota.descontoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">OUTRAS DESPESAS</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1 font-bold text-[10px] text-slate-900 bg-emerald-50/35">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR TOTAL DA NOTA</strong>
                          R$ {pedidoParaNota.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Itens */}
                    <div className="border border-black overflow-hidden">
                      <div className="bg-slate-100 p-0.5 border-b border-black font-extrabold text-[8px] uppercase tracking-wide">PRODUTOS ADQUIRIDOS / FATURADOS (LICITAÇÃO)</div>
                      <table className="w-full text-left text-[8px] font-medium border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-black font-bold uppercase">
                            <th className="p-1 border-r border-black w-6 text-center">NUM</th>
                            <th className="p-1 border-r border-black">DESCRIÇÃO DOS PRODUTOS / HARDWARE</th>
                            <th className="p-1 border-r border-black w-12 text-center">NCM</th>
                            <th className="p-1 border-r border-black w-8 text-center">CST</th>
                            <th className="p-1 border-r border-black w-8 text-center">CFOP</th>
                            <th className="p-1 border-r border-black w-8 text-center">UNID</th>
                            <th className="p-1 border-r border-black w-10 text-right">QTD</th>
                            <th className="p-1 border-r border-black w-18 text-right">VALOR UNIT</th>
                            <th className="p-1 border-r border-black w-20 text-right">VALOR TOTAL</th>
                            <th className="p-1 w-8 text-center">ICMS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/40 font-mono">
                          {pedidoParaNota.itens.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-1 border-r border-black text-center">{idx + 1}</td>
                              <td className="p-1 border-r border-black font-sans font-semibold uppercase">{it.nome}</td>
                              <td className="p-1 border-r border-black text-center">8471.30.12</td>
                              <td className="p-1 border-r border-black text-center">0102</td>
                              <td className="p-1 border-r border-black text-center">5102</td>
                              <td className="p-1 border-r border-black text-center font-sans">UN</td>
                              <td className="p-1 border-r border-black text-right">{it.quantidade}</td>
                              <td className="p-1 border-r border-black text-right">R$ {it.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="p-1 border-r border-black text-right">R$ {(it.preco * it.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="p-1 text-center">{dadosImpostos.aliquotaIcms}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Dados ISSQN */}
                    <div className="border border-black">
                      <div className="bg-slate-100 p-0.5 border-b border-black font-extrabold text-[8px] uppercase tracking-wide">CÁLCULO DO ISSQN (IMPOSTO SOBRE SERVIÇOS DO MUNICÍPIO)</div>
                      <div className="grid grid-cols-4 divide-x divide-black text-[9px] text-right font-mono bg-slate-50/10">
                        <div className="p-1 text-left font-sans">
                          <strong className="block text-[7px] text-slate-500">INSCRIÇÃO MUNICIPAL</strong>
                          {dadosDestinatario.inscricaoMunicipal}
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">VALOR TOTAL SERVIÇOS</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans">BASE DE CÁLCULO ISSQN</strong>
                          R$ 0,00
                        </div>
                        <div className="p-1">
                          <strong className="block text-[7px] text-slate-500 font-sans font-bold">VALOR ISSQN ({dadosImpostos.aliquotaIss}%)</strong>
                          R$ 0,00
                        </div>
                      </div>
                    </div>

                    {/* Dados Adicionais */}
                    <div className="border border-black p-2 text-[8px] leading-relaxed space-y-1">
                      <strong className="text-[9px] block font-bold">INFORMAÇÕES COMPLEMENTARES / OBSERVAÇÕES DE LICITAÇÃO</strong>
                      <p className="uppercase">
                        1. Mercadorias destinadas a suprir as necessidades do Órgão Público Municipal (Prefeitura) de acordo com o edital de concorrência/compra direta.
                      </p>
                      <p className="uppercase">
                        2. DADOS BANCÁRIOS EXCLUSIVOS PARA PAGAMENTO DO EMPENHO: BANCO DO BRASIL S.A. | AGÊNCIA: 1234-5 | CONTA CORRENTE: 98765-4 - FAVORECIDO: RAYZER GAMERS PC LTDA.
                      </p>
                      <p className="uppercase">
                        3. LEI DA TRANSPARÊNCIA (LEI 12.741/2012) - IMPOSTOS FEDERAIS APROXIMADOS: PIS (R$ {(pedidoParaNota.valorTotal * (dadosImpostos.aliquotaPis / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) | COFINS (R$ {(pedidoParaNota.valorTotal * (dadosImpostos.aliquotaCofins / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). TRIBUTOS ESTIMADOS TOTAIS: R$ {(pedidoParaNota.valorTotal * ((dadosImpostos.aliquotaIcms + dadosImpostos.aliquotaPis + dadosImpostos.aliquotaCofins) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                      </p>
                      <p className="uppercase text-slate-500 font-semibold">
                        4. DOCUMENTO GERADO EM CONFORMIDADE COM A LEGISLAÇÃO FISCAL BRASILEIRA. CÓPIA AUXILIAR EMITIDA PARA CONTROLE INTERNO DO PROCESSO LICITATÓRIO.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
