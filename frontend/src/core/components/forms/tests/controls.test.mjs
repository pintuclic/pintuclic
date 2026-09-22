import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { useForm } from 'vee-validate';
import { createServer } from 'vite';

test('controles Core: v-model independiente, valores iniciales VeeValidate y atributos accesibles', async () => {
  const vite = await createServer({ server: { middlewareMode: true, watch: null, ws: false } });
  try {
    const load = async name => (await vite.ssrLoadModule(`/src/core/components/forms/${name}.vue`)).default;
    const Input = await load('Input');
    const Select = await load('Select');
    const Textarea = await load('Textarea');
    const Checkbox = await load('Checkbox');
    const named = await renderToString(createSSRApp({
      setup() {
        useForm({ initialValues: { correo: 'inicial@example.test' } });
        return () => h(Input, { name: 'correo', id: 'correo', label: 'Correo', type: 'email', required: true, maxlength: 150, autocomplete: 'email' });
      },
    }));
    assert.match(named, /value="inicial@example.test"/);
    assert.match(named, /<input[^>]*required/);
    assert.match(named, /<input[^>]*maxlength="150"/);
    assert.match(named, /<input[^>]*autocomplete="email"/);
    assert.match(named, /<label[^>]*for="correo"/);

    const standalone = await renderToString(createSSRApp({ render: () => h(Input, { modelValue: 7, id: 'numero', type: 'number', min: 1, max: 10 }) }));
    assert.match(standalone, /value="7"/);
    assert.match(standalone, /<input[^>]*min="1"[^>]*max="10"/);
    const password = await renderToString(createSSRApp({ render: () => h(Input, { id: 'clave', type: 'password', icon: 'lock', error: 'Revisa el campo' }) }));
    assert.match(password, /aria-label="Mostrar contraseña"/);
    assert.match(password, /aria-invalid="true"/);
    assert.match(password, /aria-describedby="clave-error"/);
    assert.match(password, /<svg/);
    assert.doesNotMatch(password, /text-red-|border-red-|bg-red-/);

    const select = await renderToString(createSSRApp({ render: () => h(Select, { id: 'empleado', modelValue: 2, label: 'Empleado', disabled: true }, () => h('option', { value: 2 }, 'Empleado seleccionado')) }));
    assert.match(select, /<select[^>]*disabled/);
    assert.match(select, /<option[^>]*value="2"/);
    const textarea = await renderToString(createSSRApp({ render: () => h(Textarea, { id: 'motivo', modelValue: 'Motivo válido', rows: 4, minlength: 10, maxlength: 500, required: true }) }));
    assert.match(textarea, /<textarea[^>]*rows="4"/);
    assert.match(textarea, /Motivo válido<\/textarea>/);
    const checkbox = await renderToString(createSSRApp({ render: () => h(Checkbox, { id: 'permiso', modelValue: true, disabled: true, label: 'Permiso' }) }));
    assert.match(checkbox, /<input[^>]*type="checkbox"[^>]*disabled[^>]*checked/);
    assert.match(checkbox, /<label[^>]*for="permiso"/);
  } finally {
    await vite.close();
  }
});
