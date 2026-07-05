import { createClient } from "@supabase/supabase-js";

// Obtém as chaves do Supabase das variáveis de ambiente (Vite prefixa com VITE_ para expor ao frontend)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// Inicializa o cliente do Supabase apenas se as credenciais existirem
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Verifica se a conexão com o Supabase está ativa e configurada
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

/* ==========================================================================
   SERVIÇOS DE SINCRONIZAÇÃO COM O SUPABASE (PRODUTOS, CLIENTES, PEDIDOS, CATEGORIAS, CUPONS)
   ========================================================================== */

// 1. PRODUTOS
export async function dbObterProdutos() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar produtos do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarProduto(produto: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("produtos")
    .upsert({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      categoria: produto.categoria,
      descricao: produto.descricao,
      imagem: produto.imagem,
      estoque: Number(produto.estoque),
      destaque: !!produto.destaque,
      especificacoes: produto.especificacoes || {},
      ativo: produto.ativo !== false,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar produto no Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbRemoverProduto(id: string) {
  if (!supabase) return null;
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar produto no Supabase:", error);
    throw error;
  }
  return true;
}

// 2. CATEGORIAS
export async function dbObterCategorias() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarCategoria(categoria: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("categorias")
    .upsert({
      id: categoria.id,
      nome: categoria.nome,
      emoji: categoria.emoji,
      descricao: categoria.descricao,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar categoria no Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbRemoverCategoria(id: string) {
  if (!supabase) return null;
  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar categoria no Supabase:", error);
    throw error;
  }
  return true;
}

// 3. CUPONS
export async function dbObterCupons() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cupons")
    .select("*")
    .order("codigo", { ascending: true });

  if (error) {
    console.error("Erro ao carregar cupons do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarCupom(cupom: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("cupons")
    .upsert({
      id: cupom.id,
      codigo: cupom.codigo,
      tipoDesconto: cupom.tipoDesconto,
      valor: Number(cupom.valor),
      valorMinimoPedido: Number(cupom.valorMinimoPedido || 0),
      limiteUso: cupom.limiteUso ? Number(cupom.limiteUso) : null,
      usosAtuais: Number(cupom.usosAtuais || 0),
      dataExpiracao: cupom.dataExpiracao || null,
      ativo: cupom.ativo !== false,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar cupom no Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbRemoverCupom(id: string) {
  if (!supabase) return null;
  const { error } = await supabase
    .from("cupons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cupom no Supabase:", error);
    throw error;
  }
  return true;
}

// 4. CLIENTES
export async function dbObterClientes() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar clientes do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarCliente(cliente: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("clientes")
    .upsert({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cpf: cliente.cpf || null,
      endereco: cliente.endereco || {},
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar cliente no Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbRemoverCliente(id: string) {
  if (!supabase) return null;
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cliente no Supabase:", error);
    throw error;
  }
  return true;
}

// 5. PEDIDOS
export async function dbObterPedidos() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("data", { ascending: false });

  if (error) {
    console.error("Erro ao carregar pedidos do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarPedido(pedido: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pedidos")
    .upsert({
      id: pedido.id,
      cliente_id: pedido.clienteId,
      cliente_nome: pedido.clienteNome,
      itens: pedido.itens || [],
      subtotal: Number(pedido.subtotal),
      desconto: Number(pedido.desconto || 0),
      shipping: Number(pedido.shipping || 0),
      total: Number(pedido.total),
      metodo_pagamento: pedido.metodoPagamento,
      status: pedido.status,
      data: pedido.data || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar pedido no Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbRemoverPedido(id: string) {
  if (!supabase) return null;
  const { error } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar pedido no Supabase:", error);
    throw error;
  }
  return true;
}

// 6. CONFIGURAÇÕES DA LOJA
export async function dbObterConfiguracao() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("configuracao")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 é erro de nenhum registro encontrado
    console.error("Erro ao carregar configuração do Supabase:", error);
    throw error;
  }
  return data;
}

export async function dbSalvarConfiguracao(config: any) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("configuracao")
    .upsert({
      id: 1, // Registro único de configuração
      nome_loja: config.nomeLoja,
      descricao_loja: config.descricaoLoja,
      telefone_contato: config.telefoneContato,
      email_contato: config.emailContato,
      endereco_loja: config.enderecoLoja,
      moeda: config.moeda || "R$",
      taxa_entrega_padrao: Number(config.taxaEntregaPadrao),
      frete_gratis_minimo: Number(config.freteGratisMinimo),
      permitir_estoque_negativo: !!config.permitirEstoqueNegativo,
      modo_manutencao: !!config.modoManutencao,
      banner_url: config.bannerUrl,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("Erro ao salvar configuração no Supabase:", error);
    throw error;
  }
  return data;
}
