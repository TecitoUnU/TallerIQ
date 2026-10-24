
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Permitir solicitudes CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return responder(
      { error: "Método no permitido." },
      405
    );
  }

  try {
    // Obtener y validar el token del usuario
    const authorization = req.headers.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return responder(
        { error: "Debes iniciar sesión para generar el diagnóstico." },
        401
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !openRouterKey) {
      console.error("Falta configurar una variable de entorno.");

      return responder(
        { error: "La función no está configurada correctamente." },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return responder(
        { error: "La sesión no es válida. Inicia sesión nuevamente." },
        401
      );
    }

    // Leer los datos enviados desde la aplicación
    let body: {
      workOrderId?: string;
      symptoms?: string;
    };

    try {
      body = await req.json();
    } catch {
      return responder(
        { error: "El cuerpo de la solicitud no es válido." },
        400
      );
    }

    const workOrderId = body.workOrderId?.trim();
    const symptoms = body.symptoms?.trim();

    if (!workOrderId || !symptoms) {
      return responder(
        { error: "Debes indicar la orden de trabajo y los síntomas." },
        400
      );
    }

    if (symptoms.length > 4000) {
      return responder(
        { error: "Los síntomas no pueden superar los 4000 caracteres." },
        400
      );
    }

    // Consultar la orden y los datos del vehículo
    const { data: order, error: orderError } = await supabase
      .from("work_orders")
      .select(`
        id,
        reported_problem,
        current_mileage,
        vehicles (
          brand,
          model,
          year,
          mileage
        )
      `)
      .eq("id", workOrderId)
      .maybeSingle();

    if (orderError) {
      console.error("Error al consultar la orden:", orderError.message);

      return responder(
        { error: "No se pudo consultar la orden de trabajo." },
        500
      );
    }

    if (!order) {
      return responder(
        { error: "No se encontró la orden de trabajo." },
        404
      );
    }

    // No permitir generar informes de órdenes ajenas.
    // Se comprueba el acceso mediante RLS y la sesión del usuario.
    // La consulta debe devolver únicamente órdenes autorizadas.

    const vehicle = Array.isArray(order.vehicles)
      ? order.vehicles[0]
      : order.vehicles;

    const vehicleInfo = vehicle
      ? [
          vehicle.brand ? `Marca: ${vehicle.brand}` : null,
          vehicle.model ? `Modelo: ${vehicle.model}` : null,
          vehicle.year ? `Año: ${vehicle.year}` : null,
          vehicle.mileage != null
            ? `Kilometraje de ficha: ${vehicle.mileage}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "No hay datos del vehículo disponibles.";

    const orderMileage =
      order.current_mileage != null
        ? String(order.current_mileage)
        : "No registrado";

    const reportedProblem =
      typeof order.reported_problem === "string"
        ? order.reported_problem.trim()
        : "";

    // Crear instrucciones para la IA
    const systemPrompt = `
Eres un asistente técnico de apoyo para TallerIQ, un taller automotriz.

Tu tarea es elaborar un informe preliminar de diagnóstico mecánico
en español claro, profesional y fácil de entender.

REGLAS OBLIGATORIAS:

1. Analiza los síntomas de la solicitud ACTUAL.
   No tienes permiso para agregar síntomas de otras solicitudes,
   conversaciones, órdenes de trabajo ni diagnósticos anteriores.

2. La sección "SÍNTOMAS DETECTADOS" debe reflejar únicamente
   los síntomas proporcionados para esta solicitud.
   Puedes resumirlos sin cambiar su significado.
   No agregues vibraciones, ruidos, luces de advertencia u otros
   síntomas que no hayan sido reportados.

3. Distingue entre información confirmada y posibilidades.
   No afirmes que una pieza está dañada sin pruebas que lo demuestren.
   Usa expresiones como "posible causa", "se recomienda comprobar"
   o "debe verificarse".

4. No inventes datos del vehículo:
   marca, modelo, año, tipo de motor, kilometraje, códigos DTC,
   historial de mantenimiento ni resultados de pruebas.

5. Usa la marca, modelo, año y motor solo cuando estén presentes
   en los datos recibidos. Si no se conoce el motor, no supongas
   cuál equipa el vehículo.

6. No declares que una falla es frecuente en un modelo específico
   sin información suficiente que respalde esa afirmación.

7. Prioriza las causas según su relación con los síntomas y la
   seguridad. No enumeres componentes sin explicar su relación.

8. Recomienda primero comprobaciones apropiadas para confirmar
   las causas posibles. No recomiendes cambiar piezas, desmontar
   componentes ni limpiar sistemas sin una razón diagnóstica.

9. Si se requiere un escáner, recomienda leer y documentar los
   códigos DTC y los datos disponibles antes de borrar códigos.
   No ordenes borrar códigos como paso rutinario.

10. No inventes valores de tolerancia, presiones, voltajes,
    espesores ni especificaciones del fabricante. Indica que se
    deben consultar los datos de servicio correspondientes.

11. Si hay indicios de fallas en frenos, dirección, suspensión
    o neumáticos que puedan comprometer la seguridad, recomienda
    inspeccionarlos antes de realizar pruebas de conducción.
    No recomiendes conducir si el vehículo puede ser inseguro.

12. Los sistemas de alta tensión de vehículos híbridos o eléctricos
    deben ser revisados por personal cualificado con el procedimiento
    y equipo de protección adecuados.

13. Si los datos son insuficientes, indica qué información falta.
    No rellenes los vacíos con suposiciones.

14. Si existen discrepancias entre datos del vehículo, menciónalas
    como datos por verificar. No decidas cuál es correcto sin evidencia.

15. La información del reporte es orientativa y no sustituye la
    inspección física ni el diagnóstico de un técnico cualificado.

FORMATO OBLIGATORIO DEL INFORME:

1. SÍNTOMAS DETECTADOS
Enumera exclusivamente los síntomas recibidos en la solicitud actual.

2. ÁREAS SUGERIDAS PARA REVISAR
Indica los sistemas y componentes relacionados con esos síntomas
y explica brevemente por qué deben comprobarse.

3. POSIBLES CAUSAS POR VERIFICAR
Enumera las causas posibles de mayor a menor prioridad.
No presentes hipótesis como fallas confirmadas.

4. PRUEBAS RECOMENDADAS
Propón comprobaciones concretas y seguras para diferenciar las causas.
Indica cuándo se necesita equipo especializado o datos del fabricante.

5. OBSERVACIONES Y PRECAUCIONES
Incluye discrepancias, datos faltantes, riesgos de seguridad
y precauciones pertinentes al caso.

No incluyas síntomas que no fueron reportados.
No agregues una sexta sección.
No inventes resultados de pruebas.
`;

    const userPrompt = `
DATOS DE LA ORDEN ACTUAL

Orden de trabajo: ${workOrderId}

SÍNTOMAS REPORTADOS EN ESTA SOLICITUD:
${symptoms}

PROBLEMA REGISTRADO EN LA ORDEN:
${reportedProblem || "No hay descripción adicional registrada."}

DATOS DEL VEHÍCULO:
${vehicleInfo}

KILOMETRAJE REGISTRADO EN LA ORDEN:
${orderMileage}

INSTRUCCIONES PARA ESTE CASO:

- Utiliza los síntomas de esta solicitud como fuente principal.
- El problema registrado en la orden puede aportar contexto,
  pero no debes convertir información no confirmada en un hecho.
- Si el problema registrado contradice los síntomas actuales,
  señala la discrepancia en observaciones.
- No combines síntomas de órdenes distintas.
- Si los datos no permiten establecer una causa probable,
  indícalo y recomienda qué comprobar primero.
- Genera el informe utilizando exactamente las cinco secciones
  indicadas en las instrucciones.
`;

    // Solicitar el informe a OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          temperature: 0.2,
          max_tokens: 2500,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      }
    );

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error(
        "Error de OpenRouter:",
        aiResponse.status,
        JSON.stringify(aiData).slice(0, 1000)
      );

      return responder(
        { error: "No se pudo generar el diagnóstico con la IA." },
        502
      );
    }

    const choice = aiData?.choices?.[0];
    const report = choice?.message?.content;
    const finishReason = choice?.finish_reason;

    if (typeof report !== "string" || !report.trim()) {
      console.error("OpenRouter no devolvió un informe válido.");

      return responder(
        { error: "La IA no devolvió un informe válido. Intenta nuevamente." },
        502
      );
    }

    if (finishReason === "length") {
      return responder(
        {
          error:
            "El informe quedó incompleto por límite de longitud. Intenta nuevamente.",
        },
        502
      );
    }

    // Devolver el informe a la aplicación
    return responder({
      report: report.trim(),
    });
  } catch (error) {
    console.error(
      "Error inesperado en generate-diagnostic:",
      error instanceof Error ? error.message : error
    );

    return responder(
      { error: "Ocurrió un error inesperado al generar el diagnóstico." },
      500
    );
  }
});

function responder(
  data: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
