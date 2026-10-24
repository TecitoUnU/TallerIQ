import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing, typography } from '@/theme';
import { string } from 'zod';

const serviciosBasicos = [
  { name: 'Cambio de aceite', price: '100', minutes: '30' },
  { name: 'Alineación', price: '150', minutes: '45' },
  { name: 'Balanceo de llantas', price: '120', minutes: '45' },
  { name: 'Cambio de frenos', price: '200', minutes: '60' },
  { name: 'Cambio de filtros', price: '50', minutes: '20' },
  { name: 'Rotación de llantas', price: '60', minutes: '20' },
  { name: 'Cambio de bujías', price: '100', minutes: '30' },
  { name: 'Cambio de batería', price: '50', minutes: '15' },
  { name: 'Revisión de suspensión', price: '150', minutes: '45' },
  {
    name: 'Revisión del sistema de refrigeración',
    price: '100',
    minutes: '30',
  },
];

const serviciosEspecificos = [
  { name: 'Reparación de caja de cambios', price: '1200', minutes: '480' },
  { name: 'Reparación de alternador', price: '350', minutes: '180' },
  {
    name: 'Reparación de dirección hidráulica',
    price: '500',
    minutes: '240',
  },
  {
    name: 'Diagnóstico electrónico avanzado',
    price: '250',
    minutes: '120',
  },
  {
    name: 'Reparación de aire acondicionado',
    price: '450',
    minutes: '180',
  },
  { name: 'Reparación de fugas de aceite', price: '600', minutes: '300' },
  { name: 'Cambio de bomba de combustible', price: '350', minutes: '180' },
  { name: 'Reparación del sistema ABS', price: '500', minutes: '240' },
  { name: 'Cambio de soportes del motor', price: '300', minutes: '120' },
  { name: 'Reparación del sistema de escape', price: '350', minutes: '180' },
];

const estados = [
  'Pendiente',
  'Aceptado',
  'Rechazado por el cliente',
  'Modificado',
];

type OrdenTrabajo = {
  id: string;
  order_number: string;
  reported_problem: string | null;
  status: string;
  priority: string;
  created_at: string;
};

type Repuesto = {
  nombre: string;
  cantidad: string;
  precio: string;
};

type ServicioGuardado = {
  id: number | string;
  name: string;
  description: string | null;
  base_labor_price: number;
  estimated_minutes: number;
  active: boolean;
  created_at?: string;
};

const repuestoVacio = (): Repuesto => ({
  nombre: '',
  cantidad: '1',
  precio: '',
});

export default function ServicesScreen() {
  const router = useRouter();

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] =
    useState<OrdenTrabajo | null>(null);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);

  const [servicios, setServicios] = useState<ServicioGuardado[]>([]);

  const [tipo, setTipo] = useState<'Básico' | 'Específico'>('Básico');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [repuestos, setRepuestos] = useState<Repuesto[]>([
    repuestoVacio(),
  ]);
  const [estado, setEstado] = useState('Pendiente');

  const [cargando, setCargando] = useState(false);

  // Edición de presupuestos.
  const [servicioEditando, setServicioEditando] =
    useState<ServicioGuardado | null>(null);

  // Agregar y editar servicios del catálogo.
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  const [servicioCatalogoEditando, setServicioCatalogoEditando] =
    useState<ServicioGuardado | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevosMinutos, setNuevosMinutos] = useState('30');

  const mostrarMensaje = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n${mensaje}`);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const cargarOrdenes = async () => {
    setCargandoOrdenes(true);

    const { data, error } = await supabase
      .from('work_orders')
      .select(
        'id, order_number, reported_problem, status, priority, created_at',
      )
      .order('created_at', { ascending: false });

    setCargandoOrdenes(false);

    if (error) {
      mostrarMensaje('Error', error.message);
      return;
    }

    setOrdenes(
      ((data ?? []) as OrdenTrabajo[]).filter(
        (orden) =>
          orden.status !== 'COMPLETED' &&
          orden.status !== 'CANCELLED',
      ),
    );
  };

  const cargarServicios = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      mostrarMensaje('Error', error.message);
      return;
    }

    setServicios((data ?? []) as ServicioGuardado[]);
  };

  useEffect(() => {
    void cargarOrdenes();
    void cargarServicios();
  }, []);

  const totalRepuestos = repuestos.reduce(
    (total, r) =>
      total +
      (Number(r.cantidad) || 0) * (Number(r.precio) || 0),
    0,
  );

  const total = (Number(price) || 0) + totalRepuestos;

  const seleccionarServicio = (servicio: {
    name: string;
    price: string;
    minutes: string;
  }) => {
    setName(servicio.name);
    setPrice(servicio.price);
    setMinutes(servicio.minutes);
    setDescription('');
    setRepuestos([repuestoVacio()]);
    setEstado('Pendiente');
  };

  const limpiarFormulario = () => {
    setServicioEditando(null);
    setOrdenSeleccionada(null);
    setName('');
    setDescription('');
    setPrice('');
    setMinutes('30');
    setRepuestos([repuestoVacio()]);
    setEstado('Pendiente');
  };

  const limpiarFormularioCatalogo = () => {
    setServicioCatalogoEditando(null);
    setAgregandoServicio(false);
    setNuevoNombre('');
    setNuevoPrecio('');
    setNuevosMinutos('30');
  };

  const actualizarRepuesto = (
    index: number,
    campo: keyof Repuesto,
    valor: string,
  ) => {
    setRepuestos((lista) =>
      lista.map((r, i) =>
        i === index ? { ...r, [campo]: valor } : r,
      ),
    );
  };

  // Agregar o actualizar un servicio del catálogo.
  const guardarServicioCatalogo = async () => {
    if (
      !nuevoNombre.trim() ||
      !nuevoPrecio.trim() ||
      !nuevosMinutos.trim()
    ) {
      mostrarMensaje('Campos requeridos', 'Completa todos los campos.');
      return;
    }

    const precioNuevo = Number(nuevoPrecio);
    const minutosNuevos = Number(nuevosMinutos);

    if (
      !Number.isFinite(precioNuevo) ||
      precioNuevo < 0 ||
      !Number.isFinite(minutosNuevos) ||
      minutosNuevos <= 0
    ) {
      mostrarMensaje(
        'Datos inválidos',
        'Revisa el precio y la duración.',
      );
      return;
    }

    setCargando(true);

    try {
      const datos = {
        name: nuevoNombre.trim(),
        description: `[CATALOGO]\nTipo de servicio: ${tipo}`,
        base_labor_price: precioNuevo,
        estimated_minutes: minutosNuevos,
        active: true,
      };

      const resultado = servicioCatalogoEditando
        ? await supabase
            .from('services')
            .update(datos)
            .eq('id', String(servicioCatalogoEditando.id))
        : await supabase.from('services').insert(datos);

      if (resultado.error) {
        mostrarMensaje('Error', resultado.error.message);
        return;
      }

      limpiarFormularioCatalogo();
      await cargarServicios();

      mostrarMensaje(
        'Correcto',
        servicioCatalogoEditando
          ? 'Servicio actualizado correctamente.'
          : 'Servicio agregado al catálogo.',
      );
    } catch {
      mostrarMensaje('Error', 'No se pudo guardar el servicio.');
    } finally {
      setCargando(false);
    }
  };

  // Abrir la edición del catálogo o de un presupuesto.
  const abrirEdicion = (servicio: ServicioGuardado) => {
    const texto = servicio.description || '';

    // Si es un servicio del catálogo, abre su formulario correspondiente.
    if (texto.toLowerCase().includes('[catalogo]')) {
      const tipoGuardado = texto.match(
        /Tipo de servicio: (Básico|Específico)/,
      )?.[1];

      setServicioCatalogoEditando(servicio);
      setTipo(tipoGuardado === 'Específico' ? 'Específico' : 'Básico');
      setNuevoNombre(servicio.name);
      setNuevoPrecio(String(servicio.base_labor_price ?? 0));
      setNuevosMinutos(String(servicio.estimated_minutes ?? 30));
      setAgregandoServicio(true);
      return;
    }

    // Si es un presupuesto, recupera sus datos.
    const leer = (regex: RegExp) =>
      texto.match(regex)?.[1] || '';

    const tipoGuardado = leer(
      /Tipo de servicio: (Básico|Específico)/,
    );

    const descripcionGuardada = leer(
      /Descripción: ([\s\S]*?)(?=\nRepuestos y materiales:|\nCosto total de repuestos:|\nTotal estimado:|\nEstado del presupuesto:|$)/,
    );

    const estadoGuardado = leer(
      /Estado del presupuesto: ([^\n]+)/,
    );

    const textoRepuestos = leer(
      /Repuestos y materiales:\n([\s\S]*?)(?=\nCosto total de repuestos:|\nTotal estimado:|\nEstado del presupuesto:|$)/,
    );

    const repuestosLeidos = textoRepuestos
      .split('\n')
      .map((linea) => {
        const datos = linea.match(
          /^(.+?)\s+\|\s+Cantidad: ([\d.]+)\s+\|\s+Precio unitario: Q([\d.]+)/,
        );

        if (!datos) {
          return null;
        }

        return {
          nombre: datos[1],
          cantidad: datos[2],
          precio: datos[3],
        };
      })
      .filter((r): r is Repuesto => r !== null);

    const ordenId = leer(/Orden de trabajo: ([^\n]+)/);
    const numeroOrden = leer(/Número de orden: ([^\n]+)/);

    const ordenEncontrada = ordenes.find(
      (orden) =>
        orden.id === ordenId ||
        orden.order_number === numeroOrden,
    );

    setServicioEditando(servicio);
    setOrdenSeleccionada(ordenEncontrada || null);
    setTipo(tipoGuardado === 'Específico' ? 'Específico' : 'Básico');
    setName(servicio.name);
    setPrice(String(servicio.base_labor_price ?? 0));
    setMinutes(String(servicio.estimated_minutes ?? 30));
    setDescription(descripcionGuardada.trim());
    setEstado(estadoGuardado || 'Pendiente');
    setRepuestos(
      repuestosLeidos.length
        ? repuestosLeidos
        : [repuestoVacio()],
    );
  };

  // Crear o actualizar un presupuesto.
  const guardarServicio = async () => {
    if (!name.trim() || !price.trim()) {
      mostrarMensaje(
        'Campos requeridos',
        'Selecciona un servicio e ingresa la mano de obra.',
      );
      return;
    }

    if (!ordenSeleccionada && !servicioEditando) {
      mostrarMensaje(
        'Selecciona una orden',
        'Selecciona una orden de trabajo antes de guardar el presupuesto.',
      );
      return;
    }

    const numPrice = Number(price);
    const numMinutes = Number(minutes);

    if (
      !Number.isFinite(numPrice) ||
      numPrice < 0 ||
      !Number.isFinite(numMinutes) ||
      numMinutes <= 0
    ) {
      mostrarMensaje(
        'Datos inválidos',
        'Revisa el precio y la duración.',
      );
      return;
    }

    for (const r of repuestos) {
      if (!r.nombre.trim()) continue;

      if (
        !r.cantidad.trim() ||
        !Number.isFinite(Number(r.cantidad)) ||
        Number(r.cantidad) <= 0 ||
        !r.precio.trim() ||
        !Number.isFinite(Number(r.precio)) ||
        Number(r.precio) < 0
      ) {
        mostrarMensaje(
          'Repuesto inválido',
          'Revisa la cantidad y el precio de los repuestos.',
        );
        return;
      }
    }

    setCargando(true);

    try {
      const detalleRepuestos = repuestos
        .filter((r) => r.nombre.trim())
        .map(
          (r) =>
            `${r.nombre.trim()} | Cantidad: ${r.cantidad} | Precio unitario: Q${Number(r.precio).toFixed(2)} | Subtotal: Q${(
              Number(r.cantidad) * Number(r.precio)
            ).toFixed(2)}`,
        );

      // Al editar, conserva la orden original si no se encuentra cargada.
      const descripcionAnterior = servicioEditando?.description || '';

      const ordenId =
        ordenSeleccionada?.id ||
        descripcionAnterior.match(/Orden de trabajo: ([^\n]+)/)?.[1] ||
        '';

      const numeroOrden =
        ordenSeleccionada?.order_number ||
        descripcionAnterior.match(/Número de orden: ([^\n]+)/)?.[1] ||
        '';

      const descripcionCompleta = [
        `Orden de trabajo: ${ordenId}`,
        `Número de orden: ${numeroOrden}`,
        `Tipo de servicio: ${tipo}`,
        description.trim()
          ? `Descripción: ${description.trim()}`
          : '',
        'Repuestos y materiales:',
        detalleRepuestos.length
          ? detalleRepuestos.join('\n')
          : 'No se agregaron repuestos.',
        `Costo total de repuestos: Q${totalRepuestos.toFixed(2)}`,
        `Total estimado: Q${total.toFixed(2)}`,
        `Estado del presupuesto: ${estado}`,
      ]
        .filter(Boolean)
        .join('\n');

      const datos = {
        name: name.trim(),
        description: descripcionCompleta,
        base_labor_price: numPrice,
        estimated_minutes: numMinutes,
        active: true,
      };

      const resultado = servicioEditando
        ? await supabase
            .from('services')
            .update(datos)
            .eq('id', String(servicioEditando.id))
        : await supabase.from('services').insert(datos);

      if (resultado.error) {
        mostrarMensaje('Error', resultado.error.message);
        return;
      }

      mostrarMensaje(
        'Guardado',
        servicioEditando
          ? 'Los cambios se guardaron correctamente.'
          : 'El presupuesto se guardó correctamente.',
      );

      limpiarFormulario();
      await cargarServicios();
    } catch {
      mostrarMensaje('Error', 'No se pudo guardar el registro.');
    } finally {
      setCargando(false);
    }
  };

  // Eliminar servicios o presupuestos.
  const eliminarServicio = async (id: number | string) => {
    const ejecutar = async () => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', String(id));

      if (error) {
        mostrarMensaje('Error', error.message);
        return;
      }

      if (servicioEditando?.id === id) {
        limpiarFormulario();
      }

      if (servicioCatalogoEditando?.id === id) {
        limpiarFormularioCatalogo();
      }

      await cargarServicios();
      mostrarMensaje('Eliminado', 'Registro eliminado correctamente.');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas eliminar este registro?')) {
        await ejecutar();
      }
    } else {
      Alert.alert(
        'Eliminar registro',
        '¿Deseas eliminar este registro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => void ejecutar(),
          },
        ],
      );
    }
  };

  const listaBase =
    tipo === 'Básico' ? serviciosBasicos : serviciosEspecificos;

  const serviciosNuevos = servicios
    .filter(
      (s) =>
        s.description?.toLowerCase().includes('[catalogo]') &&
        s.description.toLowerCase().includes(`tipo de servicio: ${tipo.toLowerCase()}`) &&
        s.active,
    )
    .map((s) => ({
      name: s.name,
      price: String(s.base_labor_price),
      minutes: String(s.estimated_minutes),
    }));

  const listaActual = [...listaBase, ...serviciosNuevos];

  return (
    <Screen scroll>
      <ScreenHeader
        title="Servicios y Presupuestos"
        subtitle="Órdenes de trabajo y costos del taller"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.push('/(app)/(tabs)')
        }
      />

      <Text style={styles.brand}>TallerIQ</Text>

      <Text style={styles.caption}>
        Selecciona una orden y prepara el presupuesto.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>1. Órdenes de trabajo</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void cargarOrdenes()}
          disabled={cargandoOrdenes}
        >
          <Text style={styles.refreshButtonText}>
            {cargandoOrdenes ? 'Cargando...' : 'Actualizar órdenes'}
          </Text>
        </TouchableOpacity>

        {ordenes.length === 0 ? (
          <Text style={styles.cardMuted}>
            No hay órdenes registradas.
          </Text>
        ) : (
          ordenes.map((orden) => (
            <TouchableOpacity
              key={orden.id}
              style={[
                styles.serviceOption,
                ordenSeleccionada?.id === orden.id &&
                  styles.serviceSelected,
              ]}
              onPress={() => setOrdenSeleccionada(orden)}
            >
              <Text style={styles.serviceName}>
                Orden: {orden.order_number}
              </Text>

              <Text style={styles.cardMuted}>
                Problema: {orden.reported_problem || 'Sin descripción'}
              </Text>

              <Text style={styles.cardMuted}>
                Estado: {orden.status}
              </Text>

              <Text style={styles.cardMuted}>
                Prioridad: {orden.priority}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {ordenSeleccionada && (
          <View style={styles.totalBox}>
            <Text style={styles.cardLine}>
              Orden seleccionada: {ordenSeleccionada.order_number}
            </Text>

            <TouchableOpacity
              onPress={() => setOrdenSeleccionada(null)}
            >
              <Text style={styles.deleteText}>Quitar selección</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>2. Tipo de servicio</Text>

        <View style={styles.options}>
          {(['Básico', 'Específico'] as const).map((opcion) => (
            <TouchableOpacity
              key={opcion}
              style={[
                styles.option,
                tipo === opcion && styles.optionSelected,
              ]}
              onPress={() => {
                setTipo(opcion);
                setName('');
                setPrice('');
                setMinutes('30');
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  tipo === opcion && styles.optionTextSelected,
                ]}
              >
                Servicio {opcion.toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>3. Selecciona un servicio</Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (agregandoServicio) {
              limpiarFormularioCatalogo();
            } else {
              setServicioCatalogoEditando(null);
              setNuevoNombre('');
              setNuevoPrecio('');
              setNuevosMinutos('30');
              setAgregandoServicio(true);
            }
          }}
        >
          <Text style={styles.addButtonText}>
            {agregandoServicio
              ? 'Cancelar'
              : '+ Agregar servicio'}
          </Text>
        </TouchableOpacity>

        {agregandoServicio && (
          <View style={styles.repuestoBox}>
            <Text style={styles.serviceName}>
              {servicioCatalogoEditando
                ? 'Editar servicio del catálogo'
                : `Nuevo servicio ${tipo.toLowerCase()}`}
            </Text>

            <TextField
              label="Nombre del servicio"
              placeholder="Ej. Cambio de embrague"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />

            <TextField
              label="Mano de obra (Q)"
              placeholder="200"
              value={nuevoPrecio}
              onChangeText={setNuevoPrecio}
              keyboardType="decimal-pad"
            />

            <TextField
              label="Duración en minutos"
              placeholder="60"
              value={nuevosMinutos}
              onChangeText={setNuevosMinutos}
              keyboardType="numeric"
            />

            <PrimaryButton
              label={cargando ? 'Guardando...' : 'Guardar servicio'}
              onPress={() => void guardarServicioCatalogo()}
              disabled={cargando}
            />
          </View>
        )}

        {listaActual.map((servicio, index) => (
          <TouchableOpacity
            key={`${servicio.name}-${index}`}
            style={[
              styles.serviceOption,
              name === servicio.name && styles.serviceSelected,
            ]}
            onPress={() => seleccionarServicio(servicio)}
          >
            <Text style={styles.serviceName}>{servicio.name}</Text>

            <Text style={styles.cardMuted}>
              Mano de obra estimada: Q{servicio.price}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          {servicioEditando
            ? '4. Editar presupuesto'
            : '4. Crear presupuesto'}
        </Text>

        {servicioEditando && (
          <TouchableOpacity onPress={limpiarFormulario}>
            <Text style={styles.deleteText}>Cancelar edición</Text>
          </TouchableOpacity>
        )}

        <View style={styles.form}>
          <TextField
            label="Nombre del servicio"
            placeholder="Selecciona un servicio"
            value={name}
            onChangeText={setName}
          />

          <TextField
            label="Descripción del trabajo"
            placeholder="Describe el trabajo"
            value={description}
            onChangeText={setDescription}
          />

          <TextField
            label="Mano de obra (Q)"
            placeholder="100"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Repuestos y materiales</Text>

          {repuestos.map((r, index) => (
            <View key={index} style={styles.repuestoBox}>
              <Text style={styles.serviceName}>
                Repuesto {index + 1}
              </Text>

              <TextField
                label="Nombre del repuesto"
                placeholder="Filtro de aceite"
                value={r.nombre}
                onChangeText={(v) =>
                  actualizarRepuesto(index, 'nombre', v)
                }
              />

              <TextField
                label="Cantidad"
                placeholder="1"
                value={r.cantidad}
                onChangeText={(v) =>
                  actualizarRepuesto(index, 'cantidad', v)
                }
                keyboardType="numeric"
              />

              <TextField
                label="Precio unitario (Q)"
                placeholder="0.00"
                value={r.precio}
                onChangeText={(v) =>
                  actualizarRepuesto(index, 'precio', v)
                }
                keyboardType="decimal-pad"
              />

              <Text style={styles.cardLine}>
                Subtotal: Q
                {(
                  (Number(r.cantidad) || 0) *
                  (Number(r.precio) || 0)
                ).toFixed(2)}
              </Text>

              {repuestos.length > 1 && (
                <TouchableOpacity
                  onPress={() =>
                    setRepuestos((lista) =>
                      lista.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Text style={styles.deleteText}>
                    Eliminar repuesto
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              setRepuestos((lista) => [
                ...lista,
                repuestoVacio(),
              ])
            }
          >
            <Text style={styles.addButtonText}>
              + Agregar repuesto
            </Text>
          </TouchableOpacity>

          <TextField
            label="Duración estimada en minutos"
            placeholder="30"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
          />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              Total de repuestos
            </Text>
            <Text style={styles.totalPrice}>
              Q{totalRepuestos.toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              Total del presupuesto
            </Text>
            <Text style={styles.totalPrice}>
              Q{total.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.label}>
            5. Estado del presupuesto
          </Text>

          <View style={styles.options}>
            {estados.map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[
                  styles.option,
                  estado === opcion && styles.optionSelected,
                ]}
                onPress={() => setEstado(opcion)}
              >
                <Text
                  style={[
                    styles.optionText,
                    estado === opcion && styles.optionTextSelected,
                  ]}
                >
                  {opcion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            label={
              cargando
                ? 'Guardando...'
                : servicioEditando
                  ? 'Guardar cambios'
                  : 'Guardar presupuesto'
            }
            onPress={() => void guardarServicio()}
            disabled={cargando}
            style={styles.button}
          />
        </View>
      </Card>

      <Text style={styles.listTitle}>Registros guardados</Text>

      {servicios.map((item) => {
        const esCatalogo =
          item.description?.toLowerCase().includes('[catalogo]') ?? false;

        const estadoGuardado =
          item.description?.match(
            /Estado del presupuesto: ([^\n]+)/,
          )?.[1] || 'Pendiente';

        return (
          <Card key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>

            <Text style={styles.cardMuted}>
              {esCatalogo
                ? `Tipo: ${
                    item.description?.match(
                      /Tipo de servicio: ([^\n]+)/,
                    )?.[1] || 'Sin tipo'
                  }`
                : item.description || 'Sin descripción'}
            </Text>

            <Text style={styles.cardLine}>
              Mano de obra: Q
              {Number(item.base_labor_price ?? 0).toFixed(2)}
            </Text>

            <Text style={styles.role}>
              Duración: {item.estimated_minutes ?? 0} minutos
            </Text>

            {!esCatalogo && (
              <Text style={styles.role}>
                Estado: {estadoGuardado}
              </Text>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => abrirEdicion(item)}
            >
              <Text style={styles.editButtonText}>
                Editar registro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteTouchable}
              onPress={() => void eliminarServicio(item.id)}
            >
              <Text style={styles.deleteText}>
                Eliminar registro
              </Text>
            </TouchableOpacity>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.navy,
    fontSize: typography.size.hero,
    fontWeight: '800',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    marginVertical: spacing.sm,
  },
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  cardLine: {
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  cardMuted: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  role: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  label: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  optionText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  serviceOption: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  serviceSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  serviceName: {
    color: colors.navy,
    fontWeight: '700',
  },
  totalBox: {
    backgroundColor: '#F2F5F9',
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
  },
  totalPrice: {
    color: colors.navy,
    fontSize: typography.size.hero,
    fontWeight: '800',
  },
  repuestoBox: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.md,
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  refreshButton: {
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  refreshButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  button: {
    marginTop: spacing.md,
  },
  editButton: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteTouchable: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  deleteText: {
    color: '#D9534F',
    fontWeight: '700',
  },
  listTitle: {
    color: colors.navy,
    fontSize: typography.size.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});