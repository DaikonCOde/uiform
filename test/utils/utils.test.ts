import { describe, it, expect } from 'vitest'
import { formValuesToJsonValues, getDefaultValuesFromFields } from '../../src/utils/utils'
import type { Field } from '@laus/json-schema-form'

// Helper para construir fields mínimos (solo lo que consumen las utils).
const f = (name: string, inputType: string, extra: Record<string, any> = {}) =>
  ({ name, inputType, isVisible: true, ...extra }) as unknown as Field

describe('getDefaultValuesFromFields', () => {
  it('respeta valores falsy del default (0 y false)', () => {
    const fields = [f('qty', 'number', { default: 0 }), f('active', 'checkbox', { default: false })]
    expect(getDefaultValuesFromFields(fields, {})).toEqual({ qty: 0, active: false })
  })

  it('initialValues tiene prioridad y respeta 0', () => {
    const fields = [f('qty', 'number', { default: 5 })]
    expect(getDefaultValuesFromFields(fields, { qty: 0 })).toEqual({ qty: 0 })
  })

  it('cae a "" cuando no hay initialValue ni default', () => {
    expect(getDefaultValuesFromFields([f('name', 'text')], {})).toEqual({ name: '' })
  })

  it('arma defaults anidados para fieldset', () => {
    const fields = [
      f('address', 'fieldset', { fields: [f('street', 'text'), f('num', 'number', { default: 0 })] }),
    ]
    expect(getDefaultValuesFromFields(fields, {})).toEqual({ address: { street: '', num: 0 } })
  })

  it('group-array arranca vacío', () => {
    const fields = [f('items', 'group-array', { fields: [f('label', 'text')] })]
    expect(getDefaultValuesFromFields(fields, {})).toEqual({ items: [] })
  })
})

describe('formValuesToJsonValues', () => {
  it('convierte number a número y preserva el 0', () => {
    const fields = [f('qty', 'number')]
    expect(formValuesToJsonValues({ qty: '0' }, fields)).toEqual({ qty: 0 })
    expect(formValuesToJsonValues({ qty: '5' }, fields)).toEqual({ qty: 5 })
  })

  it('omite vacíos e invisibles, preserva false', () => {
    const fields = [
      f('name', 'text'),
      f('secret', 'text', { isVisible: false }),
      f('flag', 'checkbox'),
    ]
    expect(formValuesToJsonValues({ name: '', secret: 'x', flag: false }, fields)).toEqual({ flag: false })
  })

  it('recorre fieldset (objeto anidado)', () => {
    const fields = [f('address', 'fieldset', { fields: [f('street', 'text'), f('num', 'number')] })]
    expect(formValuesToJsonValues({ address: { street: 'Av', num: '10' } }, fields)).toEqual({
      address: { street: 'Av', num: 10 },
    })
  })

  it('recorre group-array (array de objetos) preservando 0', () => {
    const fields = [f('items', 'group-array', { fields: [f('label', 'text'), f('qty', 'number')] })]
    expect(
      formValuesToJsonValues({ items: [{ label: 'a', qty: '2' }, { label: 'b', qty: '0' }] }, fields)
    ).toEqual({ items: [{ label: 'a', qty: 2 }, { label: 'b', qty: 0 }] })
  })
})
