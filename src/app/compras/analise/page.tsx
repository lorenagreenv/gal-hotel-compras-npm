
'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'; // Importar useRouter
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast"; // Importar useToast

// Tipo para os itens de necessidade
type NecessidadeItem = {
  produto_id: number;
  nome: string;
  categoria: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
  quantidade_necessaria: number;
};

export default function ComprasAnalisePage() {
  const [necessidades, setNecessidades] = useState<NecessidadeItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPedidos, setGerandoPedidos] = useState(false); // Estado para geração de pedidos
  const [erro, setErro] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const router = useRouter(); // Hook para navegação
  const { toast } = useToast(); // Hook para notificações

  // Função para buscar necessidades
  const buscarNecessidades = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      let url = '/api/compras/necessidades';
      if (filtroCategoria) {
        url += `?categoria=${encodeURIComponent(filtroCategoria)}`;
      }
      
      const resposta = await fetch(url);
      
      if (!resposta.ok) {
        throw new Error('Falha ao buscar dados de necessidades');
      }
      
      const dados = await resposta.json();
      setNecessidades(dados.necessidades);
    } catch (error) {
      console.error('Erro ao buscar necessidades:', error);
      setErro('Não foi possível carregar as necessidades. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  // Buscar necessidades ao carregar a página ou quando o filtro mudar
  useEffect(() => {
    buscarNecessidades();
  }, [filtroCategoria]);

  // Função para gerar pedidos
  const gerarPedidos = async () => {
    try {
      setGerandoPedidos(true);
      setErro(null);
      
      const produtoIds = necessidades.map(item => item.produto_id);
      
      const resposta = await fetch('/api/compras/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ produto_ids: produtoIds }),
      });
      
      if (!resposta.ok) {
        const erroData = await resposta.json();
        throw new Error(erroData.error || 'Falha ao gerar pedidos');
      }
      
      const dados = await resposta.json();
      
      toast({
        title: "Sucesso!",
        description: `${dados.pedidos.length} pedido(s) gerado(s) com sucesso.`,
      });
      
      // Opcional: Redirecionar para a página de pedidos ou limpar a lista de necessidades
      // router.push('/compras/pedidos'); 
      buscarNecessidades(); // Recarrega a lista de necessidades (que deve estar vazia agora)
      
    } catch (error: any) {
      console.error('Erro ao gerar pedidos:', error);
      setErro(`Erro ao gerar pedidos: ${error.message}`);
      toast({
        title: "Erro!",
        description: `Não foi possível gerar os pedidos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setGerandoPedidos(false);
    }
  };

  // Calcular totais por categoria
  const totalPorCategoria = necessidades.reduce((acc, item) => {
    const categoria = item.categoria;
    if (!acc[categoria]) {
      acc[categoria] = 0;
    }
    acc[categoria] += 1;
    return acc;
  }, {} as Record<string, number>);

  // Obter categorias únicas para o filtro
  const categorias = [...new Set(necessidades.map(item => item.categoria))].sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras - Análise de Necessidades</h1>
          <p className="text-muted-foreground">Visualização de itens abaixo do estoque mínimo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{erro}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Itens com Estoque Baixo</CardTitle>
          <CardDescription>
            Lista de produtos que precisam ser repostos (estoque atual abaixo do mínimo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="text-center py-4">Carregando necessidades...</div>
          ) : necessidades.length === 0 ? (
            <div className="text-center py-4">
              {filtroCategoria 
                ? `Não há produtos com estoque baixo na categoria "${filtroCategoria}".` 
                : 'Não há produtos com estoque baixo.'}
            </div>
          ) : (
            <Table>
              <TableCaption>Lista de produtos que precisam ser comprados.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Quantidade Necessária</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {necessidades.map((item) => (
                  <TableRow key={item.produto_id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell>{item.unidade}</TableCell>
                    <TableCell>{item.estoque_minimo}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.quantidade_atual}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">
                        {item.quantidade_necessaria}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Total de itens: {necessidades.length}
          </div>
          <Button 
            onClick={gerarPedidos} 
            disabled={necessidades.length === 0 || carregando || gerandoPedidos}
          >
            {gerandoPedidos ? 'Gerando...' : 'Gerar Pedidos por Fornecedor'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

