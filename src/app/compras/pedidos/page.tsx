
'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Tipo para os itens de pedido
type PedidoItem = {
  produto_id: number;
  nome: string;
  quantidade: number;
  unidade: string;
};

// Tipo para o pedido
type Pedido = {
  id: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  data_criacao: string;
  status: string;
  itens: PedidoItem[];
};

export default function ComprasPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar pedidos ao carregar a página
  useEffect(() => {
    const buscarPedidos = async () => {
      try {
        setCarregando(true);
        setErro(null);
        
        const resposta = await fetch('/api/compras/pedidos');
        
        if (!resposta.ok) {
          throw new Error('Falha ao buscar dados dos pedidos');
        }
        
        const dados = await resposta.json();
        setPedidos(dados.pedidos);
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        setErro('Não foi possível carregar os pedidos. Tente novamente mais tarde.');
      } finally {
        setCarregando(false);
      }
    };
    
    buscarPedidos();
  }, []);

  // Função para simular envio por WhatsApp (a ser implementada)
  const enviarPedidoWhatsApp = (pedido: Pedido) => {
    // Lógica de formatação da mensagem
    let mensagem = `*Pedido de Compra - Gal Hotel Bar*

*Fornecedor:* ${pedido.fornecedor_nome}
*Data:* ${new Date(pedido.data_criacao).toLocaleDateString()}

*Itens:*
`;
    pedido.itens.forEach(item => {
      mensagem += `- ${item.nome}: ${item.quantidade} ${item.unidade}
`;
    });
    
    // Simulação de envio (substituir pela integração real)
    console.log("Mensagem WhatsApp:", mensagem);
    toast({
      title: "Simulação de Envio",
      description: `Pedido ${pedido.id} para ${pedido.fornecedor_nome} pronto para envio via WhatsApp (ver console).`,
    });
    // TODO: Implementar integração real com API do WhatsApp
    // TODO: Atualizar status do pedido no banco de dados para 'enviado'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras - Pedidos Gerados</h1>
          <p className="text-muted-foreground">Lista de pedidos de compra gerados e pendentes de envio.</p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{erro}</span>
        </div>
      )}

      {carregando ? (
        <div className="text-center py-4">Carregando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nenhum pedido gerado encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {pedidos.map((pedido) => (
            <AccordionItem value={`pedido-${pedido.id}`} key={pedido.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  <div className="text-left">
                    <span className="font-medium text-primary">Pedido #{pedido.id} - {pedido.fornecedor_nome}</span>
                    <span className="text-sm text-muted-foreground block">Gerado em: {new Date(pedido.data_criacao).toLocaleDateString()}</span>
                  </div>
                  <Badge variant={pedido.status === 'pendente' ? 'destructive' : 'secondary'}>{pedido.status}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedido.itens.map((item) => (
                      <TableRow key={item.produto_id}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{item.unidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={() => enviarPedidoWhatsApp(pedido)}
                    disabled={pedido.status !== 'pendente'} // Desabilitar se não estiver pendente
                  >
                    Enviar via WhatsApp
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

