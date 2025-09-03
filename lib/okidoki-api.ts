// OkiDoki API client for document signing
interface OkiDokiConfig {
	apiKey: string
	baseUrl: string
}

interface SigningRequest {
	documentId: string
	documentName: string
	documentUrl: string
	signerName: string
	signerPhone: string
	signerEmail?: string
	metadata?: Record<string, any>
}

interface SigningResponse {
	signingId: string
	status: "pending" | "sent" | "signed" | "expired" | "cancelled"
	signingUrl: string
	expiresAt: string
}

interface SMSVerificationRequest {
	signingId: string
	code: string
}

interface SMSVerificationResponse {
	success: boolean
	status: "verified" | "invalid_code" | "expired" | "max_attempts"
	signedDocumentUrl?: string
	signedAt?: string
}

class OkiDokiAPI {
	private config: OkiDokiConfig

	constructor(config: OkiDokiConfig) {
		this.config = config
	}

	// Send document for signing with Email notification
	async sendForSigning(request: SigningRequest): Promise<SigningResponse> {
		try {
			console.log("[OkiDoki] Sending document for signing via server API", request)

			const response = await fetch("/api/okidoki/send-for-signing", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					document_id: request.documentId,
					document_name: request.documentName,
					document_url: request.documentUrl,
					signer: {
						name: request.signerName,
						phone: request.signerPhone,
						email: request.signerEmail,
					},
					metadata: request.metadata,
					signature_type: "email", // Use email instead of SMS
					expires_in: 3600,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Server API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			console.log("[OkiDoki] Document sent successfully via server", data)

			return {
				signingId: data.signing_id || data.contract_id,
				status: data.status,
				signingUrl: data.signing_url || data.link || `/sign/${request.documentId}`,
				expiresAt: data.expires_at || new Date(Date.now() + 3600000).toISOString(),
			}
		} catch (error) {
			console.error("[OkiDoki] Error sending document via server", error)
			throw error
		}
	}

	// Request verification code (SMS/Email)
	async requestVerificationCode(phoneNumber: string, channel: string = 'sms'): Promise<{ success: boolean; message: string; phone_number?: string; channel?: string }> {
		try {
			console.log("[OkiDoki] Requesting verification code", phoneNumber, channel)

			const response = await fetch("/api/okidoki/request-verification-code", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					phone_number: phoneNumber,
					channel: channel,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Server API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			console.log("[OkiDoki] Verification code requested successfully", data)

			return {
				success: data.success,
				message: data.message,
				phone_number: data.phone_number,
				channel: data.channel,
			}
		} catch (error) {
			console.error("[OkiDoki] Error requesting verification code", error)
			return {
				success: false,
				message: `Ошибка запроса кода: ${error instanceof Error ? error.message : String(error)}`,
			}
		}
	}

	// Authenticate with verification code
	async authenticateWithCode(phoneNumber: string, verificationCode: string, role: string = 'customer'): Promise<{ success: boolean; user_id?: string; access_token?: string; realty_api_key?: string; message?: string }> {
		try {
			console.log("[OkiDoki] Authenticating with code", phoneNumber, verificationCode, role)

			const response = await fetch("/api/okidoki/auth", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					phone_number: phoneNumber,
					verification_code: verificationCode,
					role: role,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Server API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			console.log("[OkiDoki] Authentication successful", data)

			return {
				success: data.success,
				user_id: data.user_id,
				access_token: data.access_token,
				realty_api_key: data.realty_api_key,
			}
		} catch (error) {
			console.error("[OkiDoki] Error authenticating with code", error)
			return {
				success: false,
				message: `Ошибка авторизации: ${error instanceof Error ? error.message : String(error)}`,
			}
		}
	}

	// Get signing status
	async getSigningStatus(signingId: string): Promise<SigningResponse> {
		try {
			console.log("[OkiDoki] Getting signing status", signingId)

			const response = await fetch("/api/okidoki/status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					signing_id: signingId,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Server API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			console.log("[OkiDoki] Signing status", data)

			return {
				signingId: data.signing_id,
				status: data.status,
				signingUrl: data.signing_url,
				expiresAt: data.expires_at,
			}
		} catch (error) {
			console.error("[OkiDoki] Error getting status", error)
			throw error
		}
	}

	// Cancel signing
	async cancelSigning(signingId: string): Promise<{ success: boolean }> {
		try {
			console.log("[OkiDoki] Cancelling signing", signingId)

			const response = await fetch("/api/okidoki/cancel", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					signing_id: signingId,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Server API error: ${response.status} - ${errorText}`)
			}

			const data = await response.json()
			console.log("[OkiDoki] Signing cancelled", data)

			return { success: data.success }
		} catch (error) {
			console.error("[OkiDoki] Error cancelling signing", error)
			return { success: false }
		}
	}
}

// Initialize OkiDoki API client
const baseUrl = process.env.NEXT_PUBLIC_OKIDOKI_BASE_URL || "api.doki.online"
const okiDokiAPI = new OkiDokiAPI({
	apiKey: process.env.NEXT_PUBLIC_OKIDOKI_API_KEY || "67gZSOPuU6ahC5h3ZFTlICsjj1sBuMW-",
	baseUrl: baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`,
})

export {
	okiDokiAPI,
	type SigningRequest,
	type SigningResponse,
	type SMSVerificationRequest,
	type SMSVerificationResponse,
}
