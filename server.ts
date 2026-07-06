import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do .env
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Criar preferência de pagamento no Mercado Pago
app.post("/api/mercado-pago/preference", async (req, res) => {
  try {
    const { items, clientInfo, subtotal, discount, shipping, total } = req.body;

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor" });
    }

    // Constrói os nomes dos produtos para descrição
    const productNames = items.map((it: any) => `${it.quantidade}x ${it.produto.nome}`).join(", ");
    const description = `Rayzer Gamers PC - ${productNames}`.substring(0, 100);

    const response = await fetch("https://api.mercadopago.com/v1/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            id: "rayzer-gamers-order",
            title: "Rayzer Gamers PC - Pedido",
            description: description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(total)
          }
        ],
        payer: clientInfo ? {
          name: clientInfo.nome,
          email: clientInfo.email || "customer@rayzergamers.com",
          phone: {
            number: clientInfo.telefone || ""
          }
        } : undefined,
        back_urls: {
          success: `${process.env.APP_URL || "http://localhost:3000"}/?payment=success`,
          failure: `${process.env.APP_URL || "http://localhost:3000"}/?payment=failure`,
          pending: `${process.env.APP_URL || "http://localhost:3000"}/?payment=pending`
        },
        auto_return: "approved",
        statement_descriptor: "RAYZER GAMERS"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro na API do Mercado Pago:", errText);
      return res.status(response.status).json({ error: "Falha ao criar preferência no Mercado Pago", details: errText });
    }

    const data = await response.json();
    return res.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });
  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error);
    return res.status(500).json({ error: "Erro interno no servidor", details: error.message });
  }
});

// API: Health check simples
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Configuração do Vite middleware para desenvolvimento / estático para produção
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

setupVite();
