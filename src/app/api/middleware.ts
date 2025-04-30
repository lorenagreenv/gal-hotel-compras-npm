import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/auth-options";
import { NextRequest, NextResponse } from "next/server";

// Middleware para verificar autenticação
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  requiredRole?: string
) {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions);
    
    // Verificar se o usuário está autenticado
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário tem o papel (role) necessário
    if (requiredRole && session.user.role !== requiredRole && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Acesso negado. Você não tem permissão para esta operação." },
        { status: 403 }
      );
    }
    
    // Chamar o handler com a sessão
    return handler(request, session);
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro na autenticação" },
      { status: 500 }
    );
  }
}
