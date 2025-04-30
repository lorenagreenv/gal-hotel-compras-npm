import { D1Database } from '@cloudflare/workers-types';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../middleware'; // Importar o middleware

// Tipo para os itens de necessidade
export type NecessidadeItem = {
  produto_id: number;
  nome: string;
  categoria: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
  quantidade_necessaria: number;
};

// Handler para GET /api/compras/necessidades (protegido por autenticação)
export const GET = (request: NextRequest) => withAuth(request, async (req, session) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const categoria = searchParams.get('categoria');
    const db = (process.env.DB as unknown) as D1Database;

    let query = `
      SELECT 
        p.id as produto_id,
        p.nome,
        p.categoria,
        p.unidade,
        p.estoque_minimo,
        COALESCE(e.quantidade, 0) as quantidade_atual,
        (p.estoque_minimo - COALESCE(e.quantidade, 0)) as quantidade_necessaria
      FROM 
        produtos p
      LEFT JOIN 
        estoque e ON p.id = e.produto_id
      WHERE 
        COALESCE(e.quantidade, 0) < p.estoque_minimo
    `;
    const params: any[] = [];

    if (categoria) {
      query += ' AND p.categoria = ?';
      params.push(categoria);
    }

    query += ' ORDER BY p.categoria, p.nome';

    const { results } = await db.prepare(query).bind(...params).all();

    return NextResponse.json({ necessidades: results }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar necessidades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar necessidades' },
      { status: 500 }
    );
  }
});

