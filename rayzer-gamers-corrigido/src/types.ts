export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao: string;
  imagem: string;
  estoque: number;
  destaque: boolean;
  avaliacao: number;
}

export interface FiltrosProduto {
  busca: string;
  categoria: string;
  precoMin: number;
  precoMax: number;
  apenasDestaque: boolean;
  ordenarPor: 'nome' | 'preco-crescente' | 'preco-decrescente' | 'avaliacao';
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  totalPedidos: number;
  totalGasto: number;
  cidade: string;
  estado: string;
  dataCadastro: string;
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  itens: ItemPedido[];
  valorTotal: number;
  status: 'Pendente' | 'Processando' | 'Enviado' | 'Entregue' | 'Cancelado';
  dataPedido: string;
  enderecoEntrega: string;
  cupomAplicado?: string;
  descontoValor?: number;
  taxaEntrega?: number;
  subtotal?: number;
  metodoPagamento?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  descricao?: string;
}

export interface Cupom {
  id: string;
  codigo: string;
  tipo: 'porcentagem' | 'fixo';
  valor: number;
  valorMinimoPedido?: number;
  limiteUso?: number;
  vezesUsado: number;
  ativo: boolean;
  dataValidade?: string;
}

export interface ConfiguracaoLoja {
  nomeLoja: string;
  descricaoLoja: string;
  telefoneContato: string;
  emailContato: string;
  enderecoLoja?: string;
  moeda: string;
  taxaEntregaPadrao: number;
  freteGratisMinimo?: number;
  permitirEstoqueNegativo: boolean;
  modoManutencao: boolean;
  bannerUrl?: string;
}

