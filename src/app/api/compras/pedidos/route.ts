import { D1Database } from '@cloudflare/workers-types';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../middleware'; // Importar o middleware

// Tipo para os itens de pedido
export type PedidoItem = {
  produto_id: number;
  nome: string;
  quantidade: number;
  unidade: string;
};

// Tipo para o pedido
export type Pedido = {
  id?: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  data_criacao?: string;
  status: string;
  itens: PedidoItem[];
};

// Handler para GET /api/compras/pedidos (protegido por autenticação)
export const GET = (request: NextRequest) => withAuth(request, async (req, session) => {
  try {
    const db = (process.env.DB as unknown) as D1Database;
    
    const { results: pedidos } = await db.prepare(`
      SELECT 
        p.id, 
        p.fornecedor_id, 
        f.nome as fornecedor_nome, 
        p.created_at as data_criacao, 
        p.status
      FROM 
        pedidos p
      JOIN 
        fornecedores f ON p.fornecedor_id = f.id
      ORDER BY 
        p.created_at DESC
    `).all();
    
    const pedidosCompletos = await Promise.all(pedidos.map(async (pedido: any) => {
      const { results: itens } = await db.prepare(`
        SELECT 
          pi.produto_id,
          pr.nome,
          pi.quantidade,
          pr.unidade
        FROM 
          pedido_itens pi
        JOIN 
          produtos pr ON pi.produto_id = pr.id
        WHERE 
          pi.pedido_id = ?
      `).bind(pedido.id).all();
      
      return {
        ...pedido,
        itens
      };
    }));
    
    return NextResponse.json({ pedidos: pedidosCompletos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
});

// Handler para POST /api/compras/pedidos (gerar pedidos - protegido, admin only)
export const POST = (request: NextRequest) => withAuth(request, async (req, session) => {
  try {
    const body = await req.json();
    const { produto_ids } = body;
    
    if (!produto_ids || !Array.isArray(produto_ids) || produto_ids.length === 0) {
      return NextResponse.json(
        { error: 'Lista de produtos inválida' },
        { status: 400 }
      );
    }
    
    const db = (process.env.DB as unknown) as D1Database;
    const userId = session.user.id; // Obter ID do usuário da sessão
    
    await db.prepare('BEGIN TRANSACTION').run();
    
    try {
      const placeholders = produto_ids.map(() => '?').join(',');
      const { results: produtosNecessidades } = await db.prepare(`
        SELECT 
          p.id as produto_id,
          p.nome,
          p.unidade,
          p.estoque_minimo,
          COALESCE(e.quantidade, 0) as quantidade_atual,
          (p.estoque_minimo - COALESCE(e.quantidade, 0)) as quantidade_necessaria,
          pf.fornecedor_id,
          f.nome as fornecedor_nome
        FROM 
          produtos p
        LEFT JOIN 
          estoque e ON p.id = e.produto_id
        JOIN 
          produto_fornecedor pf ON p.id = pf.produto_id
        JOIN 
          fornecedores f ON pf.fornecedor_id = f.id
        WHERE 
          p.id IN (${placeholders})
          AND COALESCE(e.quantidade, 0) < p.estoque_minimo
      `).bind(...produto_ids).all();
      
      const produtosPorFornecedor: Record<number, any[]> = {};
      
      produtosNecessidades.forEach((produto: any) => {
        if (!produtosPorFornecedor[produto.fornecedor_id]) {
          produtosPorFornecedor[produto.fornecedor_id] = [];
        }
        produtosPorFornecedor[produto.fornecedor_id].push(produto);
      });
      
      const pedidosCriados = [];
      
      for (const [fornecedorId, produtos] of Object.entries(produtosPorFornecedor)) {
        const fornecedorNome = produtos[0].fornecedor_nome;
        const { meta: pedidoMeta } = await db.prepare(`
          INSERT INTO pedidos (fornecedor_id, created_by, created_at, status)
          VALUES (?, ?, CURRENT_TIMESTAMP, 'pendente')
        `).bind(Number(fornecedorId), userId).run();
        
        const pedidoId = pedidoMeta.last_row_id;
        
        for (const produto of produtos) {
          await db.prepare(`
            INSERT INTO pedido_itens (pedido_id, produto_id, quantidade)
            VALUES (?, ?, ?)
          `).bind(pedidoId, produto.produto_id, produto.quantidade_necessaria).run();
        }
        
        pedidosCriados.push({
          id: pedidoId,
          fornecedor_id: Number(fornecedorId),
          fornecedor_nome: fornecedorNome,
          status: 'pendente',
          itens: produtos.map((p: any) => ({
            produto_id: p.produto_id,
            nome: p.nome,
            quantidade: p.quantidade_necessaria,
            unidade: p.unidade
          }))
        });
      }
      
      await db.prepare('COMMIT').run();
      
      return NextResponse.json(
        { 
          message: 'Pedidos gerados com sucesso', 
          pedidos: pedidosCriados 
        },
        { status: 201 }
      );
    } catch (error) {
      await db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao gerar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar pedidos' },
      { status: 500 }
    );
  }
}, 'admin'); // Apenas admin pode gerar pedidos
