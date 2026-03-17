// Edge Function: Handle booking token for cancellation or rescheduling
// Version: 1.2.0 - Handles cancellation reasons and secure token validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { token, action, reason } = body;

    console.log("Received request:", { token: token ? token.substring(0, 10) + "..." : "missing", action, reason });

    if (!token || !action) {
      console.error("Missing required fields:", { token: !!token, action: !!action });
      return new Response(
        JSON.stringify({ error: "Missing token or action" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar token válido y no utilizado
    console.log("Searching for token in database...");
    const { data: tokenData, error: tokenError } = await supabase
      .from("booking_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    console.log("Token search result:", { 
      found: !!tokenData, 
      error: tokenError?.message,
      tokenFound: tokenData ? {
        booking_id: tokenData.booking_id,
        action_type: tokenData.action_type,
        expires_at: tokenData.expires_at,
        used_at: tokenData.used_at
      } : null
    });

    if (tokenError || !tokenData) {
      console.error("Token validation failed:", { 
        error: tokenError?.message,
        hasData: !!tokenData
      });
      return new Response(
        JSON.stringify({ 
          error: "Invalid, expired, or already used token",
          details: tokenError?.message || "Token not found or already used",
          success: false 
        }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Verificar que el action_type coincida
    console.log("Checking action type match:", { 
      tokenAction: tokenData.action_type, 
      requestAction: action,
      match: tokenData.action_type === action
    });

    if (tokenData.action_type !== action) {
      console.error("Action type mismatch");
      return new Response(
        JSON.stringify({ 
          error: "Token action type does not match",
          expected: tokenData.action_type,
          received: action,
          success: false 
        }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Obtener la reserva
    console.log("Fetching booking:", { booking_id: tokenData.booking_id });
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", tokenData.booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", { 
        booking_id: tokenData.booking_id, 
        error: bookingError?.message 
      });
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { 
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log("Booking found:", { 
      id: booking.id, 
      attendee: booking.attendee_name,
      status: booking.status
    });

    // Procesar acción
    if (action === "cancel") {
      // Para cancel, solo validar el token y retornar datos
      // El frontend confirmará la cancelación con la razón
      console.log("Processing cancel action - returning booking data");
      
      return new Response(
        JSON.stringify({
          success: true,
          booking: booking,
          booking_id: booking.id,
          event_id: booking.event_id,
          old_slot: booking.slot_datetime,
          attendee_name: booking.attendee_name,
          attendee_email: booking.attendee_email,
          extra_guests: booking.extra_guests,
          token: token,
          message: "Booking ready to cancel - user must provide reason",
        }),
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (action === "reschedule") {
      // Para reschedule, NO marcar como usado aún - el usuario debe confirmar el cambio de hora
      // El token se marcará como usado cuando se confirme la rescheduling en el frontend
      console.log("Processing reschedule action - token will be marked as used on confirmation");

      // Retornar datos del booking para que el frontend maneje la selección de nueva fecha
      console.log("Returning booking data for reschedule");
      return new Response(
        JSON.stringify({
          success: true,
          booking: booking,
          booking_id: booking.id,
          event_id: booking.event_id,
          old_slot: booking.slot_datetime,
          token: token,
          attendee_name: booking.attendee_name,
          attendee_email: booking.attendee_email,
          extra_guests: booking.extra_guests,
          message: "Booking ready to reschedule",
        }),
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { 
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : ""
    });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
