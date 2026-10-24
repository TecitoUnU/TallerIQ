import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responder(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return responder({ error: "Método no permitido" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !supabaseKey || !openRouterKey) {
      return responder(
        { error: "Faltan variables de entorno en Supabase" },
        500,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return responder({ error: "No autorizado" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return responder({ error: "Sesión inválida" }, 401);
    }

    const body = await req.json();
    const vehicleId = body.vehicleId;

    if (!vehicleId || typeof vehicleId !== "string") {
      return responder(
        { error: "Debes proporcionar el ID del vehículo" },
        400,
      );
    }

    // Obtener los datos del vehículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model, year, mileage")
      .eq("id", vehicleId)
      .maybeSingle();

    if (vehicleError) {
      console.error("Error del vehículo:", vehicleError.message);
      return responder({ error: "Error al consultar el vehículo" }, 500);
    }

    if (!vehicle) {
      return responder(
        { error: "Vehículo no encontrado o sin acceso" },
        404,
      );
    }

    // Consultar las órdenes del vehículo
    const { data: orders, error: ordersError } = await supabase
      .from("work_orders")
      .select(`
        id,
        order_number,
        reported_problem,
        status,
        current_mileage,
        received_at,
        completed_at,
        delivered_at,
        diagnostics (
          general_notes,
          ai_summary,
          created_at
        )
      `)
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (ordersError) {
      console.error("Error de historial:", ordersError.message);
      return responder({ error: "Error al consultar el historial" }, 500);
    }

    if (!orders || orders.length === 0) {
      return responder({
        summary:
          "Este vehículo todavía no tiene órdenes de trabajo registradas. No hay suficiente información para elaborar un historial.",
        vehicle,
        ordersCount: 0,
      });
    }

    // Preparar la información para la IA
    const history = orders.map((order) => ({
      numero_orden: order.order_number,
      problema_reportado: order.reported_problem,
      estado: order.status,
      kilometraje: order.current_mileage,
      fecha_recepcion: order.received_at,
      fecha_finalizacion: order.completed_at,
      fecha_entrega: order.delivered_at,
      diagnosticos: order.diagnostics,
    }));

    const prompt = `
Eres un asistente de inteligencia artificial para un taller mecánico.
Escribe en español claro y profesional usando solamente los datos recibidos.

Reglas:
- No inventes reparaciones, fechas, kilometrajes ni diagnósticos.
- Un problema reportado no significa que ya fue reparado.
- No afirmes que una pieza fue cambiada si no existe evidencia.
- Señala posibles problemas recurrentes solo si los registros los respaldan.
- Si faltan datos o hay contradicciones, indícalo claramente.

DATOS DEL VEHÍCULO:
${JSON.stringify(vehicle, null, 2)}

HISTORIAL DE ÓRDENES:
${JSON.stringify(history, null, 2)}

Organiza el resumen en estas cinco secciones:

1. IDENTIFICACIÓN DEL VEHÍCULO
2. HISTORIAL DE ATENCIONES
3. DIAGNÓSTICOS Y OBSERVACIONES
4. POSIBLES PROBLEMAS RECURRENTES
5. CONCLUSIÓN Y RECOMENDACIONES

Distingue los hechos registrados de las posibles causas y recomendaciones.
`;

    // Solicitar el resumen a OpenRouter
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
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente de historial automotriz. Sé preciso y no inventes información.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 2200,
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Error de OpenRouter:", errorText);

      return responder(
        { error: "No se pudo generar el resumen con inteligencia artificial" },
        502,
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content;

    if (!summary || typeof summary !== "string") {
      return responder(
        { error: "La IA no devolvió un resumen válido" },
        502,
      );
    }

    return responder({
      summary,
      vehicle,
      ordersCount: orders.length,
    });
  } catch (error) {
    console.error("Error inesperado:", error);

    return responder(
      { error: "Ocurrió un error al generar el historial" },
      500,
    );
  }
});
