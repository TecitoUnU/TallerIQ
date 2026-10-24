import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { colors, spacing, typography } from '@/theme';

export default function RentabilidadScreen() {
  const [montoCliente, setMontoCliente] = useState('');
  const [costoRepuestos, setCostoRepuestos] = useState('');
  const [costoAsociado, setCostoAsociado] = useState('');
  
  const [resultado, setResultado] = useState<{
    totalCliente: number;
    repuestos: number;
    asociado: number;
    ganancia: number;
  } | null>(null);

  const calcularRentabilidad = () => {
    const cliente = Number(montoCliente);
    const repuestos = Number(costoRepuestos);
    const asociado = Number(costoAsociado);

    if (
      !Number.isFinite(cliente) || cliente < 0 ||
      !Number.isFinite(repuestos) || repuestos < 0 ||
      !Number.isFinite(asociado) || asociado < 0
    ) {
      Alert.alert('Datos incorrectos', 'Por favor ingresa montos válidos.');
      return;
    }

    // Cálculo automático de la utilidad/ganancia
    const ganancia = cliente - (repuestos + asociado);

    setResultado({
      totalCliente: cliente,
      repuestos,
      asociado,
      ganancia,
    });
  };

  return (
    <Screen scroll>
      <ScreenHeader
        title="Rentabilidad"
        subtitle="Calcula la utilidad por orden o servicio"
        onBack={() => {}}
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Cálculo de Ganancia</Text>

        <View style={styles.form}>
          <TextField
            label="Cliente paga (Q)"
            placeholder="Ej. 900"
            value={montoCliente}
            onChangeText={setMontoCliente}
            keyboardType="decimal-pad"
          />

          <TextField
            label="Costo de repuestos (Q)"
            placeholder="Ej. 500"
            value={costoRepuestos}
            onChangeText={setCostoRepuestos}
            keyboardType="decimal-pad"
          />

          <TextField
            label="Costo asociado / interno (Q)"
            placeholder="Ej. 100"
            value={costoAsociado}
            onChangeText={setCostoAsociado}
            keyboardType="decimal-pad"
          />

          <PrimaryButton
            label="Calcular utilidad"
            onPress={calcularRentabilidad}
          />
        </View>
      </Card>

      {resultado && (
        <Card style={styles.resultCard}>
          <Text style={styles.resultTitle}>Resumen Financiero</Text>
          <Text style={styles.detail}>Cliente paga: Q{resultado.totalCliente.toFixed(2)}</Text>
          <Text style={styles.detail}>Costo de repuestos: Q{resultado.repuestos.toFixed(2)}</Text>
          <Text style={styles.detail}>Costo asociado: Q{resultado.asociado.toFixed(2)}</Text>
          
          <View style={styles.divider} />

          <Text style={styles.profitLabel}>Ganancia Estimada:</Text>
          <Text style={[
            styles.profitValue,
            { color: resultado.ganancia >= 0 ? colors.success : '#e74c3c' }
          ]}>
            Q{resultado.ganancia.toFixed(2)}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  resultCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#f8f9fa',
  },
  resultTitle: {
    color: colors.navy,
    fontSize: typography.size.md,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  detail: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: spacing.md,
  },
  profitLabel: {
    color: colors.navy,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});