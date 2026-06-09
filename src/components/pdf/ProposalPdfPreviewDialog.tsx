/**
 * ProposalPdfPreviewDialog — pré-visualização HTML da Proposta Completa.
 *
 * Renderiza o mesmo componente <PdfPropostaCompleta /> que o gerador de PDF usa,
 * mas direto na tela (sem download). Cada página A4 (210×297mm)
 * aparece como um card branco com sombra sobre fundo cinza, simulando um leitor
 * de PDF — ideal para QA de layout (overlaps, páginas vazias, espaçamento).
 *
 * Garantia: paridade visual 1:1 com o PDF, pois consome o mesmo React tree.
 */
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw, X } from 'lucide-react';
import {
  buildProposalPages,
  type PdfPropostaCompletaData,
} from './PdfPropostaCompleta';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PdfPropostaCompletaData | null;
}

const ZOOMS = [0.5, 0.65, 0.8, 1] as const;

export function ProposalPdfPreviewDialog({ open, onOpenChange, data }: Props) {
  const [zoom, setZoom] = useState<number>(0.65);
  const [refreshKey, setRefreshKey] = useState(0);

  const { pages, totalPages } = useMemo(() => {
    if (!data) return { pages: [], totalPages: 0 };
    const all = buildProposalPages(data).filter((p) => p.hasContent);
    return { pages: all, totalPages: all.length };
    // refreshKey força recálculo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, refreshKey]);

  const zoomIdx = ZOOMS.indexOf(zoom as typeof ZOOMS[number]);
  const canZoomIn = zoomIdx < ZOOMS.length - 1;
  const canZoomOut = zoomIdx > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-sm font-semibold">
              Pré-visualização da Proposta
            </DialogTitle>
            <span className="text-xs text-muted-foreground">
              {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(ZOOMS[Math.max(zoomIdx - 1, 0)])}
              disabled={!canZoomOut}
              className="h-8 w-8 p-0"
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono w-12 text-center text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(ZOOMS[Math.min(zoomIdx + 1, ZOOMS.length - 1)])}
              disabled={!canZoomIn}
              className="h-8 w-8 p-0"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="h-8 gap-1.5 text-xs ml-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 ml-1"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-muted/40">
          <div className="flex flex-col items-center gap-6 py-8 px-4">
            {!data && (
              <div className="text-sm text-muted-foreground py-12">
                Nenhum dado disponível para pré-visualização.
              </div>
            )}
            {data && pages.length === 0 && (
              <div className="text-sm text-muted-foreground py-12">
                Nenhuma página com conteúdo. Selecione blocos no formulário.
              </div>
            )}
            {pages.map((p, idx) => (
              <div key={`${refreshKey}-${p.id}`} className="flex flex-col items-center gap-2">
                <div className="text-caption font-mono text-muted-foreground uppercase tracking-wider">
                  Página {idx + 1} — {p.id}
                </div>
                {/*
                  Wrapper aplica zoom via transform: scale(). Origem 'top center'.
                  Largura/altura calculadas para reservar o espaço correto após o scale,
                  evitando que páginas se sobreponham no fluxo.
                */}
                <div
                  style={{
                    width: `calc(210mm * ${zoom})`,
                    height: `calc(297mm * ${zoom})`,
                    overflow: 'hidden',
                  }}
                  className="bg-card shadow-lg rounded-sm"
                >
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      width: '210mm',
                      height: '297mm',
                    }}
                  >
                    {p.render(totalPages)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
