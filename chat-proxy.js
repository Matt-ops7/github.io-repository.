// netlify/functions/chat-proxy.js
const fetch = require('node-fetch'); // Netlify ya tiene node-fetch disponible

exports.handler = async function(event, context) {
    // Asegúrate de que solo se acepten solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Obtén la clave API de las variables de entorno de Netlify
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
        const MODEL_NAME = "meta-llama/llama-3-8b-instruct"; // Asegúrate de que sea el mismo modelo

        // Parsear el cuerpo de la solicitud (viene del frontend)
        const { messages } = JSON.parse(event.body);

        // Hacer la solicitud a OpenRouter desde la función (servidor)
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Aquí se usa la clave API segura desde el entorno
                "Authorization": `Bearer ${AIzaSyC0Nv3zibJc6mASIYunAks_ihCQgdH7I8Y}`,
                // Opcional: Puedes enviar headers para OpenRouter desde aquí
                "HTTP-Referer": "https://matt-ia.netlify.app", // O tu dominio personalizado
                "X-Title": "Matt.ia Chatbot (via Netlify Function)"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages, // Pasa el historial de mensajes
                stream: true // Permite streaming de respuesta
            })
        });

        // Manejar la respuesta del stream de OpenRouter y reenviarla al cliente
        const reader = response.body.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        let accumulatedChunks = '';

        // Headers para la respuesta en streaming
        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*' // Permite CORS desde tu frontend
        };

        // Necesitamos un stream para el cliente, que Netlify Functions soporta
        return new Response(new ReadableStream({
            async start(controller) {
