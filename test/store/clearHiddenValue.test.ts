// Al ocultarse, el valor del campo se limpia al vacío según su tipo (string→"", number→null, bool→false).
import { describe, it, expect } from "vitest";
import { createFormStore } from "../../src/store/createFormStore";
import type { JsfObjectSchema } from "@laus/json-schema-form"; import type { UiSchema } from "../../src/store/types";
const schema: JsfObjectSchema = { type:"object", additionalProperties:false, properties:{ A:{type:"boolean"}, txt:{type:"string"}, num:{type:"number"}, flag:{type:"boolean"} },
  allOf:[{ if:{properties:{A:{const:true}},required:["A"]}, then:{}, else:{properties:{txt:false,num:false,flag:false}} }] } as JsfObjectSchema;
const uiSchema: UiSchema = { txt:{"ui:widget":"text"}, num:{"ui:widget":"number"}, flag:{"ui:widget":"checkbox"} };
describe("limpiar valor al ocultar",()=>{ it("limpia según el tipo",()=>{
  const st = createFormStore(schema, uiSchema, {} as any); const s=()=>st.getState();
  s().setValue("A", true); s().setValue("txt","HOLA"); s().setValue("num", 42); s().setValue("flag", true);
  s().setValue("A", false); // oculta los 3
  expect(s().values.txt).toBe("");
  expect(s().values.num).toBe(null);
  expect(s().values.flag).toBe(false);
}); });
