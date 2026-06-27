// useStableId: id estable entre renders de una instancia y único entre instancias (compat React 17/18).
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React, { useState } from "react";
import { useStableId } from "../../src/hooks/useStableId";

function Probe({ onId }: { onId: (id: string) => void }) {
  const id = useStableId();
  const [, force] = useState(0);
  onId(id);
  // exponemos un botón para forzar re-render y comprobar estabilidad
  return <button onClick={() => force((n) => n + 1)}>{id}</button>;
}

describe("useStableId", () => {
  it("devuelve un id no vacío y string", () => {
    let id = "";
    render(<Probe onId={(v) => (id = v)} />);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("es ESTABLE entre re-renders de la misma instancia", () => {
    const ids: string[] = [];
    const { rerender } = render(<Probe onId={(v) => ids.push(v)} />);
    rerender(<Probe onId={(v) => ids.push(v)} />);
    rerender(<Probe onId={(v) => ids.push(v)} />);
    expect(new Set(ids).size).toBe(1); // siempre el mismo
  });

  it("es ÚNICO entre instancias distintas", () => {
    let a = "", b = "";
    render(
      <>
        <Probe onId={(v) => (a = v)} />
        <Probe onId={(v) => (b = v)} />
      </>,
    );
    expect(a).not.toBe(b);
  });
});
