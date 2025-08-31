// api.ts
import { API_URL } from "./config";

export interface Source {
  id: string;
  title: string;
  page?: number;
  confidence: number;
}

export interface BackendResponse {
  text: string;
  sources: Source[];
}

/**
 * Check if backend is alive
 */
export async function checkBackend(): Promise<boolean> {
  const healthUrl = `${API_URL}/health`;
  console.log("🌐 Checking backend at URL:", healthUrl);

  try {
    const response = await fetch(healthUrl, {
      headers: {
        "Accept": "application/json", 
        "ngrok-skip-browser-warning": "true", 
      },
    });

    console.log("📡 Raw response status:", response.status);

    // Ensure we got JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Expected JSON, got:", text);
      throw new Error("Non-JSON response from backend");
    }

    const data = await response.json();
    console.log("✅ Backend health check JSON:", data);

    return data.status === "OK";
  } catch (err) {
    console.error("❌ Backend not reachable. Error:", err);
    return false;
  }
}

/**
 * Send user query to backend /chat endpoint
 */
export async function sendMessage(query: string): Promise<BackendResponse> {
  const chatUrl = `${API_URL}/chat`;
  console.log("➡️ Sending query to backend URL:", chatUrl, "Query:", query);

  try {
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "ngrok-skip-browser-warning": "true", 
      },
      body: JSON.stringify({ query }),
    });

    console.log("📡 Raw response status:", response.status);

    // Ensure response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Expected JSON, got:", text);
      throw new Error("Non-JSON response from backend");
    }

    const data = await response.json();
    console.log("✅ Backend response JSON:", data);

    return {
      text: data.answer?.text || data.answer || "",
      sources: data.answer?.sources || [],
    };
  } catch (err) {
    console.error("❌ Error calling backend:", err);
    return { text: "⚠️ Unable to connect to backend.", sources: [] };
  }
}
