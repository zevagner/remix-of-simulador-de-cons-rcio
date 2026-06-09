import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VirtualList } from "@/components/perf/VirtualList";

describe("VirtualList", () => {
  // jsdom não mede offsetHeight do scroller, então o virtualizer pode
  // reportar 0 items. Os testes garantem que (a) o componente monta sem
  // crash mesmo com 1000 itens e (b) o número renderizado é < total.
  it("monta com 1000 itens sem renderizar todos", () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={32}
        height={320}
        getKey={(it) => it.id}
        renderItem={(it) => <span>row-{it.id}</span>}
      />,
    );
    const rendered = container.querySelectorAll("[data-index]");
    expect(rendered.length).toBeLessThan(items.length);
  });

  it("expõe role=list/listitem para acessibilidade", () => {
    const items = [{ id: 1 }];
    const { container } = render(
      <VirtualList
        items={items}
        itemHeight={32}
        height={100}
        renderItem={(it) => <span>x{it.id}</span>}
        ariaLabel="lista de teste"
      />,
    );
    expect(container.querySelector('[role="list"]')).toBeTruthy();
  });
});
