import { getShaderAssembler } from "@deck.gl/core";

let hooksEnsured = false;

/**
 * Deck layers call DECKGL_FILTER_* hook functions in their shader source.
 * On some browser/device startup paths those hooks are not attached to the GLSL assembler,
 * which causes shader compile failures. We defensively register the hooks before rendering.
 */
export function ensureDeckGlShaderHooks() {
  if (hooksEnsured) {
    return;
  }

  const assembler = getShaderAssembler("glsl") as unknown as {
    addShaderHook: (hook: string) => void;
    _hookFunctions?: Array<{ hook: string }>;
  };

  const existing = new Set((assembler._hookFunctions ?? []).map((entry) => entry.hook));
  const requiredHooks = [
    "vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)",
    "vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)",
    "vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)",
    "fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)"
  ];

  for (const hook of requiredHooks) {
    const hookName = hook.slice(0, hook.indexOf("("));
    if (!existing.has(hookName)) {
      assembler.addShaderHook(hook);
    }
  }

  hooksEnsured = true;
}
