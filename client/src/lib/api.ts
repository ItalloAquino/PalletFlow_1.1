export async function apiRequest<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    });

    // Tratar respostas sem conteúdo
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return {} as T;
    }

    // Verificar tipo do conteúdo antes de parsear
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Resposta inválida: O servidor não retornou JSON");
    }

    // Parsear JSON com tratamento de erro
    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch (parseError) {
      throw new Error("Falha ao processar resposta JSON do servidor");
    }

    // Validação de resposta estruturada
    if (typeof responseData !== "object" || responseData === null) {
      throw new Error("Resposta inválida: Formato inesperado dos dados");
    }

    // Lógica especial para mensagens de log de atividade
    if (
      "message" in responseData &&
      typeof responseData.message === "string" &&
      responseData.message.includes("log de atividade")
    ) {
      console.warn("Resposta com mensagem de log:", responseData);
      return responseData as T;
    }

    // Tratamento final de erro HTTP
    if (!response.ok) {
      const errorMessage = 
        ("message" in responseData && typeof responseData.message === "string"
          ? responseData.message
          : `Erro HTTP ${response.status}: ${response.statusText}`);
      
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;

  } catch (networkError) {
    // Tratamento centralizado de erros de rede
    if (networkError instanceof ApiError) {
      throw networkError;
    }
    
    if (networkError instanceof Error) {
      throw new ApiError(
        `Erro de rede: ${networkError.message}`,
        0,
        { originalError: networkError }
      );
    }
    
    throw new ApiError("Erro desconhecido na requisição", 0, { rawError: networkError });
  }
}

// Classe personalizada para erros da API
class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 0,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}